import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  HospitalCutaway,
  type CutawayAnchor,
  type HospitalCalloutVisualState,
  type HospitalPainPoint,
} from "@/components/HospitalCutaway";
import {
  LEVER_META,
  LEVER_SEQUENCE,
  SIMULATION_EPISODES,
  SIMULATION_HORIZON_DAYS,
  scenarioSignature,
  simulateHospital,
  type LeverId,
  type SimulationResult,
  type StageId,
} from "@/lib/hospital-sim";
import {
  HOSPITAL_STORYBOARD,
  hospitalPressureLabel,
  type HospitalPressureId,
  type HospitalStoryCycle,
  type HospitalStoryPressure,
} from "@/lib/hospital-storyboard";
import { humanPressureValue, humanReceipt } from "@/lib/metric-language";
import {
  HOSPITAL_STORY_DWELL_MS,
  HOSPITAL_STORY_STATES,
  INITIAL_HOSPITAL_STORY,
  advanceHospitalStory,
  currentHospitalStoryCycle,
  currentHospitalStoryPressure,
  hospitalStoryStateIndex,
  isHospitalStoryComplete,
  materializingHospitalStoryLever,
  retreatHospitalStory,
  type HospitalStoryBeat,
  type HospitalStoryState,
} from "@/lib/hospital-story";

const STAGE_ANCHORS: Record<StageId, CutawayAnchor> = {
  access: { x: 42, y: 65 },
  diagnosis: { x: 36, y: 20 },
  precision: { x: 56, y: 22 },
  readiness: { x: 32, y: 40 },
  robotics: { x: 55, y: 41 },
  care: { x: 75, y: 43 },
  longitudinal: { x: 88, y: 70 },
};

const STAGE_CALLOUTS: Record<StageId, CutawayAnchor> = {
  access: { x: 5, y: 40 },
  diagnosis: { x: 4, y: 5 },
  precision: { x: 62, y: 4 },
  readiness: { x: 3, y: 30 },
  robotics: { x: 58, y: 39 },
  care: { x: 66, y: 26 },
  longitudinal: { x: 61, y: 38 },
};

const PRESSURE_VISUALS: Record<HospitalPressureId, { anchor: CutawayAnchor; callout: CutawayAnchor }> = {
  "access-friction": { anchor: STAGE_ANCHORS.access, callout: STAGE_CALLOUTS.access },
  "diagnosis-constraint": { anchor: STAGE_ANCHORS.diagnosis, callout: STAGE_CALLOUTS.diagnosis },
  "readiness-constraint": { anchor: STAGE_ANCHORS.readiness, callout: STAGE_CALLOUTS.readiness },
  "or-capacity-constraint": { anchor: STAGE_ANCHORS.robotics, callout: STAGE_CALLOUTS.robotics },
  "discharge-continuity-constraint": {
    anchor: STAGE_ANCHORS.longitudinal,
    callout: STAGE_CALLOUTS.longitudinal,
  },
  "administrative-handoffs": { anchor: { x: 77, y: 18 }, callout: { x: 62, y: 3 } },
  "recovery-capacity-constraint": { anchor: STAGE_ANCHORS.care, callout: STAGE_CALLOUTS.care },
};

type HospitalSceneModel = {
  pressure: HospitalStoryPressure;
  simulation: SimulationResult;
  callout: HospitalPainPoint;
  focusStage: StageId;
  focusAnchor: CutawayAnchor;
  dashboardLabel: string;
  materializingLever?: LeverId;
};

function pressureVisualState(pressure: HospitalStoryPressure): HospitalCalloutVisualState {
  return pressure.kind === "system-constraint" || pressure.kind === "investment-constraint"
    ? "constraint"
    : "pressure";
}

function buildSceneModel(
  story: HospitalStoryState,
  cycle: HospitalStoryCycle,
  before: SimulationResult,
  after: SimulationResult,
): HospitalSceneModel {
  const beat = story.beat;
  const pressure = currentHospitalStoryPressure(story) ?? cycle.pressure;
  const visual = PRESSURE_VISUALS[pressure.id];
  const simulation = beat === "surface" || beat === "materialize" ? before : after;
  const focusStage = pressure.stage ?? simulation.constraint;

  if (beat === "materialize") {
    return {
      pressure,
      simulation,
      focusStage,
      focusAnchor: visual.anchor,
      dashboardLabel: hospitalPressureLabel(pressure),
      materializingLever: cycle.lever,
      callout: {
        id: `${cycle.lever}:solution`,
        title: cycle.intervention.title,
        detail: cycle.intervention.detail,
        kicker: `AI response · ${LEVER_META[cycle.lever].name}`,
        value: `Responding to: ${cycle.pressure.title}`,
        stage: pressure.stage,
        severity: "watch",
        anchor: visual.anchor,
        callout: visual.callout,
        resolvedBy: cycle.lever,
        visualState: "solution",
      },
    };
  }

  if (beat === "resolve") {
    return {
      pressure,
      simulation,
      focusStage,
      focusAnchor: visual.anchor,
      dashboardLabel: cycle.resolution.receipt,
      callout: {
        id: `${cycle.lever}:resolved`,
        title: cycle.resolution.title,
        detail: cycle.resolution.detail,
        kicker: cycle.resolution.kicker,
        resolvedLabel: cycle.resolution.receipt,
        value: humanReceipt(cycle.resolution.metric, before, after),
        stage: pressure.stage,
        severity: "watch",
        anchor: visual.anchor,
        callout: visual.callout,
        resolvedBy: cycle.lever,
        visualState: "resolved",
      },
    };
  }

  const state = pressureVisualState(pressure);
  return {
    pressure,
    simulation,
    focusStage,
    focusAnchor: visual.anchor,
    dashboardLabel: hospitalPressureLabel(pressure),
    callout: {
      id: `${pressure.id}:${beat}`,
      title: pressure.title,
      detail: pressure.detail,
      kicker: pressure.label,
      value: humanPressureValue(pressure, simulation),
      stage: pressure.stage,
      severity: state === "constraint" ? "critical" : "pressure",
      anchor: visual.anchor,
      callout: visual.callout,
      visualState: state,
    },
  };
}

function cloneCanonicalState(index: number): HospitalStoryState {
  const state = HOSPITAL_STORY_STATES[index] ?? HOSPITAL_STORY_STATES[0];
  return { ...state, activeLevers: [...state.activeLevers] };
}

export function HospitalTwin({ onOpenCase }: { onOpenCase: () => void }) {
  const [story, setStory] = useState<HospitalStoryState>(INITIAL_HOSPITAL_STORY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStageMode, setIsStageMode] = useState(false);
  const interactionLockUntil = useRef(0);
  const baseline = useMemo(() => simulateHospital([]), []);
  const cycle = currentHospitalStoryCycle(story) ?? HOSPITAL_STORYBOARD[0];
  const cycleIndex = HOSPITAL_STORYBOARD.indexOf(cycle);
  const before = useMemo(
    () => simulateHospital(LEVER_SEQUENCE.slice(0, Math.max(0, cycleIndex))),
    [cycleIndex],
  );
  const after = useMemo(
    () => simulateHospital(LEVER_SEQUENCE.slice(0, Math.max(0, cycleIndex) + 1)),
    [cycleIndex],
  );
  const scene = useMemo(() => buildSceneModel(story, cycle, before, after), [after, before, cycle, story]);
  const stateIndex = hospitalStoryStateIndex(story);
  const storyComplete = isHospitalStoryComplete(story);
  const activeLevers = story.activeLevers;
  const activeSet = useMemo(() => new Set(activeLevers), [activeLevers]);
  const materializingLever = materializingHospitalStoryLever(story);
  const nextCycle = story.beat === "reveal" ? HOSPITAL_STORYBOARD[cycleIndex + 1] : undefined;
  const railFocusLever = nextCycle?.lever ?? cycle.lever;
  const evidenceAligned = story.beat === "resolve"
    || scene.pressure.evidenceBasis !== "simulation-constraint"
    || scene.pressure.stage === scene.simulation.constraint;

  useEffect(() => {
    if (!isPlaying) return;

    const handle = window.setTimeout(() => {
      if (storyComplete) {
        setIsPlaying(false);
      } else {
        setStory((current) => advanceHospitalStory(current));
      }
    }, HOSPITAL_STORY_DWELL_MS[story.beat]);
    return () => window.clearTimeout(handle);
  }, [isPlaying, story.beat, storyComplete]);

  useEffect(() => {
    document.body.classList.toggle("hospital-stage-mode", isStageMode);
    if (isStageMode) window.scrollTo({ top: 0, behavior: "instant" });
    return () => document.body.classList.remove("hospital-stage-mode");
  }, [isStageMode]);

  function guardInteraction(action: () => void) {
    const now = performance.now();
    if (now < interactionLockUntil.current) return;
    interactionLockUntil.current = now + 420;
    action();
  }

  function toggleGuidedRun() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (storyComplete) setStory(cloneCanonicalState(0));
    setIsPlaying(true);
  }

  function stepForward() {
    guardInteraction(() => {
      setIsPlaying(false);
      setStory((current) => advanceHospitalStory(current));
    });
  }

  function stepBack() {
    guardInteraction(() => {
      setIsPlaying(false);
      setStory((current) => retreatHospitalStory(current));
    });
  }

  function replayCycle() {
    setIsPlaying(false);
    const replayIndex = cycleIndex <= 0 ? 0 : cycleIndex * 3;
    setStory(cloneCanonicalState(replayIndex));
  }

  function jumpToLever(lever: LeverId) {
    setIsPlaying(false);
    const targetCycle = HOSPITAL_STORYBOARD.findIndex((candidate) => candidate.lever === lever);
    const targetIndex = targetCycle <= 0 ? 0 : targetCycle * 3;
    setStory(cloneCanonicalState(targetIndex));
  }

  function reset() {
    setIsPlaying(false);
    setStory(cloneCanonicalState(0));
  }

  const beatLabel: Record<HospitalStoryBeat, string> = {
    surface: "01 · The problem",
    materialize: "02 · The AI response",
    resolve: "03 · The result",
    reveal: "04 · What it uncovers next",
  };

  const moment = story.beat === "materialize"
    ? { title: cycle.intervention.title, copy: cycle.intervention.detail }
    : story.beat === "resolve"
      ? { title: cycle.resolution.title, copy: cycle.resolution.detail }
      : { title: scene.pressure.title, copy: scene.pressure.detail };

  const stepButtonLabel = story.beat === "surface"
    ? `Deploy ${LEVER_META[cycle.lever].name} →`
    : story.beat === "materialize"
      ? "Apply operating change →"
      : story.beat === "resolve"
        ? "Reveal next constraint →"
        : storyComplete
          ? "Story complete"
          : `Deploy ${LEVER_META[nextCycle?.lever ?? cycle.lever].name} →`;

  return (
    <section
      className="twin-shell bg-[var(--color-night)] text-white"
      data-story-beat={story.beat}
      data-story-index={stateIndex}
      data-story-state-id={story.stateId}
      data-story-cycle={cycle.id}
      data-story-pressure={scene.pressure.id}
      data-story-evidence-aligned={evidenceAligned ? "true" : "false"}
      data-story-simulation={scenarioSignature(scene.simulation)}
      data-story-lever={materializingLever ?? railFocusLever}
    >
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-2 sm:px-8 lg:px-12 lg:pb-24 lg:pt-2">
        <div className="twin-command-deck mx-auto max-w-[1240px]">
          <div className="twin-command-heading">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-[var(--color-mint)]">Hospital operating twin</p>
              <span className="twin-disclosure">Illustrative · no patient data</span>
            </div>
            <h1 className="mt-2 text-[clamp(1.8rem,3vw,3rem)] font-semibold leading-none tracking-[-0.05em] text-white">
              Watch the constraint move.
            </h1>
          </div>

          <div className="twin-command-actions">
            <div className="flex flex-wrap items-center gap-2" aria-label="Simulation controls">
              <button type="button" className="button-primary" data-testid="story-play" onClick={toggleGuidedRun}>
                {isPlaying ? "Pause guided demo" : storyComplete ? "Replay guided demo" : "Run guided demo"}
              </button>
              <button
                type="button"
                className="button-small-ghost"
                data-testid="story-back"
                onClick={stepBack}
                disabled={stateIndex <= 0}
                aria-label="Go back one story beat"
              >
                ← Back
              </button>
              <button
                type="button"
                className="button-small-ghost"
                data-testid="story-next"
                onClick={stepForward}
                disabled={storyComplete}
                aria-label={stepButtonLabel.replace(/→/u, "").trim()}
              >
                <span className="story-next-label-wide">{stepButtonLabel}</span>
                <span className="story-next-label-compact" aria-hidden="true">Next beat →</span>
              </button>
              <button type="button" className="button-small-ghost" data-testid="story-replay" onClick={replayCycle}>
                Replay cycle
              </button>
              <button
                type="button"
                className="button-small-ghost"
                data-testid="story-stage-mode"
                onClick={() => setIsStageMode((current) => !current)}
                aria-pressed={isStageMode}
              >
                {isStageMode ? "Exit stage" : "Stage view"}
              </button>
              <button type="button" className="button-small-ghost" data-testid="story-reset" onClick={reset} disabled={stateIndex <= 0}>
                Reset
              </button>
            </div>

            <div className="twin-step-count" aria-label={`Story state ${stateIndex + 1} of 19. ${beatLabel[story.beat]}.`}>
              <strong>{String(stateIndex + 1).padStart(2, "0")}</strong>
              <span>/ 19 states</span>
              <em>{beatLabel[story.beat].replace(/^\d+ · /, "")}</em>
            </div>
          </div>
        </div>

        <HospitalCutaway
          simulation={scene.simulation}
          baseline={baseline}
          activeLevers={activeLevers}
          isPlaying={isPlaying}
          painPoints={[scene.callout]}
          activePainPointId={scene.callout.id}
          constraintLabel={scene.dashboardLabel}
          materializingLever={scene.materializingLever}
          storyBeat={story.beat}
          focusStage={scene.focusStage}
          focusAnchor={scene.focusAnchor}
          cameraTarget={scene.focusAnchor}
          dashboardStage={scene.focusStage}
          focusLabel={story.beat === "materialize" ? "AI response" : story.beat === "resolve" ? "Operating impact" : scene.dashboardLabel}
          className="cutaway-embedded mt-2"
          title="Animated hospital and medical-center cutaway"
          showHeader={false}
        />

        <div className="twin-stage-caption mx-auto max-w-[1240px]">
          <div>
            <span>{beatLabel[story.beat]}</span>
            <strong>{moment.title}</strong>
            <p>{moment.copy}</p>
          </div>
          <div className="twin-trust-line">
            <span className="status-dot status-dot-ready" aria-hidden="true" />
            Same demand trace · metrics change only when the operating rule changes
          </div>
        </div>

        <div className="twin-lever-rail twin-lever-rail-immersive mx-auto mt-4 max-w-[1240px]" aria-label="Jump to a transformation lever">
          {LEVER_SEQUENCE.map((lever) => {
            const item = LEVER_META[lever];
            const active = activeSet.has(lever);
            const materializing = materializingLever === lever;
            const focused = railFocusLever === lever;
            return (
              <button
                key={lever}
                type="button"
                onClick={() => jumpToLever(lever)}
                className={`twin-lever ${active ? "twin-lever-active" : ""}${materializing ? " twin-lever-materializing" : ""}${focused ? " twin-lever-current" : ""}`}
                style={{ "--lever-color": item.color } as CSSProperties}
                aria-current={focused ? "step" : undefined}
                aria-label={`Jump to ${item.name}. ${active ? "Materialized" : materializing ? "Materializing" : "Waiting"}.`}
              >
                <span className="twin-lever-monogram">{item.monogram}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{active ? "Materialized" : materializing ? "Materializing" : focused ? "Next decision" : "Waiting"}</small>
                </span>
                <b aria-hidden="true">{active ? "✓" : materializing ? "•••" : item.number}</b>
              </button>
            );
          })}
        </div>

        <div className="twin-meta-row mx-auto mt-5 flex max-w-[1240px] flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <details className="twin-assumptions">
            <summary>Model basis and assumptions</summary>
            <div>
              <p>
                {SIMULATION_EPISODES} synthetic episodes across {SIMULATION_HORIZON_DAYS} days: 40% routine surgical,
                25% precision-eligible surgical oncology, and 35% medical or chronic. Every state replays the identical seeded demand trace.
              </p>
              <p>
                Constraint migration uses transparent demonstration assumptions: four staffed robotic rooms at 5.5 modeled service hours,
                coordinated robotic flow at 3.2 hours, and fewer readiness exceptions when precision context arrives upstream.
              </p>
              <p>
                These are illustrative operating coefficients—not observed AdventHealth results, clinical outcome claims, or financial forecasts.
              </p>
            </div>
          </details>
          <button type="button" className="button-ghost whitespace-nowrap" onClick={onOpenCase}>
            Inspect Case 7B →
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {beatLabel[story.beat]}. {moment.title} {scene.callout.value ? `${scene.callout.value}.` : ""} {activeLevers.length} levers active.
          Current focus: {scene.pressure.title} Modeled system constraint: {scene.simulation.stageResults[scene.simulation.constraint].name}.
        </p>
      </div>
    </section>
  );
}
