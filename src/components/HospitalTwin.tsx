import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { HospitalCutaway, type HospitalPainPoint } from "@/components/HospitalCutaway";
import {
  LEVER_META,
  LEVER_SEQUENCE,
  SIMULATION_EPISODES,
  SIMULATION_HORIZON_DAYS,
  simulateHospital,
  type LeverId,
  type SimulationResult,
  type StageId,
} from "@/lib/hospital-sim";
import {
  HOSPITAL_STORY_DWELL_MS,
  INITIAL_HOSPITAL_STORY,
  advanceHospitalStory,
  isHospitalStoryComplete,
  nextHospitalStoryLever,
  type HospitalStoryBeat,
} from "@/lib/hospital-story";

const MOMENTS = [
  {
    title: "Queues are not isolated. They are coupled.",
    copy: "The baseline hospital has enough technology. It loses time where demand, readiness, capacity, and follow-up change hands.",
  },
  {
    title: "Access clears. Diagnosis inherits the pressure.",
    copy: "The digital front door resolves intake exceptions sooner. More demand reaches the next constrained service instead of disappearing.",
  },
  {
    title: "Routing improves. Readiness becomes visible.",
    copy: "Clinical pathway intelligence reduces misrouting. The constraint moves into pre-op coordination and continuity.",
  },
  {
    title: "Precision adds work upstream—and prevents revision downstream.",
    copy: "This lever is not a pure speed play. Eligible patients receive more targeted planning so fewer plans have to be rebuilt later.",
  },
  {
    title: "The robot accelerates. The hospital does not—yet.",
    copy: "Turnover capacity is released locally, but recovery and longitudinal queues absorb the gain. Capital alone cannot close the loop.",
  },
  {
    title: "Discharge clears. Handoffs remain the system tax.",
    copy: "Longitudinal ownership releases flow beyond the procedure. Duplicate coordination still limits how fast the whole network can move.",
  },
  {
    title: "The constraint did not disappear. It became investable.",
    copy: "AI removed coordination friction. Staffed recovery capacity—not fragmented work—is now the explicit investment decision.",
  },
] as const;

function isSequencePrefix(active: LeverId[]) {
  return active.every((lever, index) => LEVER_SEQUENCE[index] === lever);
}

const SCENE_ANCHORS: Record<StageId, HospitalPainPoint["anchor"]> = {
  access: { x: 42, y: 65 },
  diagnosis: { x: 36, y: 20 },
  precision: { x: 56, y: 22 },
  readiness: { x: 32, y: 40 },
  robotics: { x: 55, y: 41 },
  care: { x: 75, y: 43 },
  longitudinal: { x: 88, y: 70 },
};

const SCENE_CALLOUTS: Record<StageId, HospitalPainPoint["anchor"]> = {
  access: { x: 5, y: 69 },
  diagnosis: { x: 4, y: 5 },
  precision: { x: 62, y: 4 },
  readiness: { x: 3, y: 30 },
  robotics: { x: 58, y: 47 },
  care: { x: 76, y: 26 },
  longitudinal: { x: 70, y: 69 },
};

const LEVER_RESOLUTIONS: Record<LeverId, Omit<HospitalPainPoint, "id" | "value">> = {
  "front-door": {
    title: "Context arrives before the patient",
    detail: "Identity, intent, and prerequisites move with the arrival instead of being entered again.",
    resolvedLabel: "Access friction cleared",
    stage: "access",
    severity: "pressure",
    anchor: SCENE_ANCHORS.access,
    callout: SCENE_CALLOUTS.access,
    resolvedBy: "front-door",
  },
  diagnosis: {
    title: "Right pathway, first time",
    detail: "Clinical pathway intelligence removes avoidable routing resets around imaging and work-up.",
    resolvedLabel: "Diagnosis cleared",
    stage: "diagnosis",
    severity: "pressure",
    anchor: SCENE_ANCHORS.diagnosis,
    callout: SCENE_CALLOUTS.diagnosis,
    resolvedBy: "diagnosis",
  },
  precision: {
    title: "Target earlier. Revise less.",
    detail: "Eligible patients spend more time planning upstream so fewer treatment plans are rebuilt later.",
    resolvedLabel: "Planning stabilized",
    stage: "precision",
    severity: "watch",
    anchor: SCENE_ANCHORS.precision,
    callout: SCENE_CALLOUTS.precision,
    resolvedBy: "precision",
  },
  robotics: {
    title: "Local OR capacity released",
    detail: "Turnover and readiness improve, but the gain transfers pressure into recovery and beds.",
    resolvedLabel: "OR capacity released",
    stage: "robotics",
    severity: "watch",
    anchor: SCENE_ANCHORS.robotics,
    callout: SCENE_CALLOUTS.robotics,
    resolvedBy: "robotics",
  },
  longitudinal: {
    title: "The next care step is already owned",
    detail: "Discharge and follow-up begin before the bed decision instead of after the patient leaves.",
    resolvedLabel: "Discharge path cleared",
    stage: "longitudinal",
    severity: "pressure",
    anchor: SCENE_ANCHORS.longitudinal,
    callout: SCENE_CALLOUTS.longitudinal,
    resolvedBy: "longitudinal",
  },
  automation: {
    title: "Agents execute. Humans govern.",
    detail: "Routine handoffs move across the campus while consequential decisions stop at named approvals.",
    resolvedLabel: "Handoffs cleared",
    severity: "watch",
    anchor: { x: 77, y: 18 },
    callout: { x: 62, y: 3 },
    resolvedBy: "automation",
  },
};

type LeverStory = {
  painTitle: string;
  painDetail: string;
  materializeTitle: string;
  materializeDetail: string;
  stage?: StageId;
  anchor: HospitalPainPoint["anchor"];
  callout: HospitalPainPoint["anchor"];
};

const LEVER_STORIES: Record<LeverId, LeverStory> = {
  "front-door": {
    painTitle: "Every arrival starts over.",
    painDetail: "Parking, valet, registration, and clinical intake each ask for context the system already has.",
    materializeTitle: "Capture context once. Carry it forward.",
    materializeDetail: "Voice, chat, text, scheduling, identity, and prerequisites become one persistent access thread.",
    stage: "access",
    anchor: SCENE_ANCHORS.access,
    callout: SCENE_CALLOUTS.access,
  },
  diagnosis: {
    painTitle: "Diagnosis absorbs the released demand.",
    painDetail: "More eligible patients now reach imaging and work-up, making routing errors and incomplete prerequisites impossible to hide.",
    materializeTitle: "Route correctly the first time.",
    materializeDetail: "Pathway intelligence combines history, imaging, and readiness signals before the next handoff.",
    stage: "diagnosis",
    anchor: SCENE_ANCHORS.diagnosis,
    callout: SCENE_CALLOUTS.diagnosis,
  },
  precision: {
    painTitle: "The plan changes late.",
    painDetail: "Targeted clinical context arrives after major decisions, forcing avoidable revisions downstream.",
    materializeTitle: "Match the work-up before the procedure.",
    materializeDetail: "Genomic and clinical context shifts targeted planning upstream, before the treatment plan hardens.",
    stage: "precision",
    anchor: SCENE_ANCHORS.precision,
    callout: SCENE_CALLOUTS.precision,
  },
  robotics: {
    painTitle: "Turnover consumes OR capacity.",
    painDetail: "The robot can move faster than room readiness, instrument flow, recovery, and the surrounding operating model.",
    materializeTitle: "Shorten cycle time. Preserve surgical judgment.",
    materializeDetail: "Robotic workflows coordinate room readiness and turnover while clinical control stays with the team.",
    stage: "robotics",
    anchor: SCENE_ANCHORS.robotics,
    callout: SCENE_CALLOUTS.robotics,
  },
  longitudinal: {
    painTitle: "A discharge is nobody's workflow.",
    painDetail: "Follow-up, navigation, and escalation begin after the bed decision—without one owner across the journey.",
    materializeTitle: "Assign the next care step before discharge.",
    materializeDetail: "Follow-up, navigation, and escalation receive named ownership before the patient leaves.",
    stage: "longitudinal",
    anchor: SCENE_ANCHORS.longitudinal,
    callout: SCENE_CALLOUTS.longitudinal,
  },
  automation: {
    painTitle: "Every handoff creates another task.",
    painDetail: "Even after clinical flow improves, duplicate coordination keeps humans carrying routine work between systems.",
    materializeTitle: "Agents execute. Humans govern.",
    materializeDetail: "Agents move routine work across the campus while consequential decisions stop at named approvals.",
    anchor: { x: 77, y: 18 },
    callout: { x: 62, y: 3 },
  },
};

const CONSTRAINT_TITLES: Record<StageId, string> = {
  access: "Arrival repeats itself",
  diagnosis: "The scanner is not the bottleneck",
  precision: "The plan changes late",
  readiness: "Readiness is the invisible queue",
  robotics: "The robot waits for the hospital",
  care: "Recovery has become the limiting capacity",
  longitudinal: "A discharge is nobody's workflow",
};

function describeConstraintTransition(
  activeLevers: LeverId[],
  current: SimulationResult,
  previous?: SimulationResult,
) {
  if (activeLevers.length === 0 || !previous) return "Starting constraint";
  if (previous.constraint !== current.constraint) return "New constraint";

  const previousPeak = previous.stageResults[previous.constraint].peakQueue;
  const currentPeak = current.stageResults[current.constraint].peakQueue;
  return currentPeak > previousPeak ? "Constraint intensifies" : "Constraint persists";
}

function buildCurrentConstraint(
  activeLevers: LeverId[],
  current: SimulationResult,
  constraintLabel: string,
): HospitalPainPoint {
  const constraint = current.stageResults[current.constraint];
  const diagnosisIntensified = current.constraint === "diagnosis" && constraintLabel === "Constraint intensifies";
  return {
    id: `constraint-${activeLevers.length}-${current.constraint}`,
    title: diagnosisIntensified ? "Diagnosis absorbs the released demand" : CONSTRAINT_TITLES[current.constraint],
    detail:
      diagnosisIntensified
        ? "The digital front door clears access, releasing more eligible demand into diagnosis. The bottleneck is now explicit—and larger."
        : current.constraint === "care"
        ? "Coordination is no longer limiting flow. Staffed recovery capacity is now the investment decision."
        : `${constraint.name} now absorbs the demand released upstream. The constraint moved; it did not disappear.`,
    kicker: constraintLabel,
    stage: current.constraint,
    value: `${constraint.peakQueue} peak queue · ${Math.round(constraint.averageWaitHours)}h average wait`,
    severity: "critical",
    anchor: SCENE_ANCHORS[current.constraint],
    callout: SCENE_CALLOUTS[current.constraint],
  };
}

function buildLeverStoryPoint(
  lever: LeverId,
  current: SimulationResult,
  beat: Extract<HospitalStoryBeat, "surface" | "materialize">,
): HospitalPainPoint {
  const story = LEVER_STORIES[lever];
  const stage = story.stage ? current.stageResults[story.stage] : undefined;
  const isConstraint = story.stage === current.constraint;
  const materializing = beat === "materialize";

  return {
    id: `story-${lever}`,
    title: materializing ? story.materializeTitle : story.painTitle,
    detail: materializing ? story.materializeDetail : story.painDetail,
    kicker: materializing
      ? "AI response materializing"
      : isConstraint
        ? "Constraint surfaces"
        : "Pain point surfaces",
    stage: story.stage,
    value: materializing
      ? "Connecting into the operating model"
      : stage
        ? `${stage.peakQueue} peak queue · ${Math.round(stage.averageWaitHours)}h average wait`
        : `${current.administrativeTouches} administrative touches`,
    severity: materializing ? "watch" : isConstraint ? "critical" : "pressure",
    anchor: story.anchor,
    callout: story.callout,
    resolvedBy: lever,
  };
}

function buildScenePainPoints(
  activeLevers: LeverId[],
  current: SimulationResult,
  constraintLabel: string,
  beat: HospitalStoryBeat,
  nextLever: LeverId | undefined,
  guidedState: boolean,
): HospitalPainPoint[] {
  const currentConstraint = buildCurrentConstraint(activeLevers, current, constraintLabel);

  if (!guidedState) return [currentConstraint];
  if (beat === "surface" && nextLever) return [buildLeverStoryPoint(nextLever, current, "surface")];
  if (beat === "materialize" && nextLever) return [buildLeverStoryPoint(nextLever, current, "materialize")];

  const latestLever = activeLevers.at(-1);
  if (!latestLever) return [currentConstraint];

  const resolution = LEVER_RESOLUTIONS[latestLever];
  const stage = resolution.stage ? current.stageResults[resolution.stage] : undefined;
  return [
    {
      ...resolution,
      id: `story-${latestLever}`,
      value:
        latestLever === "diagnosis"
          ? "No longer the system constraint"
          : stage
            ? `${stage.peakQueue} peak queue after intervention`
            : `${current.administrativeTouches} touches per episode`,
    },
    currentConstraint,
  ];
}

export function HospitalTwin({ onOpenCase }: { onOpenCase: () => void }) {
  const [story, setStory] = useState(INITIAL_HOSPITAL_STORY);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeLevers = story.activeLevers;
  const storyBeat = story.beat;
  const baseline = useMemo(() => simulateHospital([]), []);
  const current = useMemo(() => simulateHospital(activeLevers), [activeLevers]);
  const previous = useMemo(
    () => (activeLevers.length ? simulateHospital(activeLevers.slice(0, -1)) : undefined),
    [activeLevers],
  );
  const activeSet = useMemo(() => new Set(activeLevers), [activeLevers]);
  const transitionLabel = useMemo(
    () => describeConstraintTransition(activeLevers, current, previous),
    [activeLevers, current, previous],
  );
  const guidedState = isSequencePrefix(activeLevers);
  const nextLever = guidedState ? nextHospitalStoryLever(story) : undefined;
  const materializingLever = storyBeat === "materialize" ? nextLever : undefined;
  const storyComplete = isHospitalStoryComplete(story);
  const constraintLabel = storyBeat === "reveal"
    ? transitionLabel
    : activeLevers.length === 0
      ? "Starting constraint"
      : "System constraint";
  const nextLeverStory = nextLever ? LEVER_STORIES[nextLever] : undefined;
  const beatLabel = !guidedState
    ? "Manual scenario"
    : storyBeat === "surface"
      ? nextLeverStory?.stage === current.constraint
        ? "01 · Constraint surfaces"
        : "01 · Pain point surfaces"
      : storyBeat === "materialize"
        ? "02 · AI materializes"
        : "03 · Operating impact";
  const moment = !guidedState
    ? {
        title: `${activeLevers.length} levers are active. The constraint is ${current.stageResults[current.constraint].name.toLowerCase()}.`,
        copy: "Manual combinations use the same deterministic demand trace. Reset or run the guided sequence to see the intended transformation story.",
      }
    : storyBeat === "surface" && nextLeverStory
      ? { title: nextLeverStory.painTitle, copy: nextLeverStory.painDetail }
      : storyBeat === "materialize" && nextLeverStory
        ? { title: nextLeverStory.materializeTitle, copy: nextLeverStory.materializeDetail }
        : MOMENTS[activeLevers.length] ?? MOMENTS[0];
  const scenePainPoints = useMemo(
    () => buildScenePainPoints(activeLevers, current, constraintLabel, storyBeat, nextLever, guidedState),
    [activeLevers, constraintLabel, current, guidedState, nextLever, storyBeat],
  );
  const activePainPointId = storyBeat === "reveal"
    ? scenePainPoints.find((painPoint) => !painPoint.resolvedBy)?.id
    : scenePainPoints[0]?.id;

  useEffect(() => {
    if (!isPlaying) return;
    if (!guidedState || storyComplete) {
      setIsPlaying(false);
      return;
    }

    const handle = window.setTimeout(() => {
      setStory((currentStory) => advanceHospitalStory(currentStory));
    }, HOSPITAL_STORY_DWELL_MS[storyBeat]);
    return () => window.clearTimeout(handle);
  }, [guidedState, isPlaying, storyBeat, storyComplete]);

  function toggleGuidedRun() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!guidedState || activeLevers.length === LEVER_SEQUENCE.length) {
      setStory({ ...INITIAL_HOSPITAL_STORY, activeLevers: [] });
    }
    setIsPlaying(true);
  }

  function stepForward() {
    setIsPlaying(false);
    if (!guidedState) {
      setStory({ ...INITIAL_HOSPITAL_STORY, activeLevers: [] });
      return;
    }
    setStory((currentStory) => advanceHospitalStory(currentStory));
  }

  function toggleLever(lever: LeverId) {
    setIsPlaying(false);
    const next = new Set(activeLevers);
    if (next.has(lever)) next.delete(lever);
    else next.add(lever);
    setStory({
      activeLevers: LEVER_SEQUENCE.filter((candidate) => next.has(candidate)),
      beat: "surface",
    });
  }

  function reset() {
    setIsPlaying(false);
    setStory({ ...INITIAL_HOSPITAL_STORY, activeLevers: [] });
  }

  const stepButtonLabel = !guidedState
    ? "Restart guided story →"
    : storyBeat === "surface"
      ? "Materialize AI response →"
      : storyBeat === "materialize"
        ? "Show operating impact →"
        : storyComplete
          ? "Story complete"
          : "Surface next pressure →";

  return (
    <section
      className="twin-shell bg-[var(--color-night)] text-white"
      data-story-beat={storyBeat}
      data-story-index={activeLevers.length}
      data-story-lever={materializingLever ?? (storyBeat === "reveal" ? activeLevers.at(-1) : nextLever) ?? "complete"}
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
              <button type="button" className="button-primary" onClick={toggleGuidedRun}>
                {isPlaying
                  ? "Pause guided demo"
                  : activeLevers.length === LEVER_SEQUENCE.length
                    ? "Replay guided demo"
                    : guidedState && (activeLevers.length > 0 || storyBeat !== "surface")
                      ? "Continue guided demo"
                      : "Run guided demo"}
              </button>
              <button
                type="button"
                className="button-small-ghost"
                onClick={stepForward}
                disabled={storyComplete}
              >
                {stepButtonLabel}
              </button>
              <button
                type="button"
                className="button-small-ghost"
                onClick={reset}
                disabled={activeLevers.length === 0 && storyBeat === "surface"}
              >
                Reset baseline
              </button>
            </div>
            <div className="twin-step-count" aria-label={`${activeLevers.length} of 6 levers materialized. ${beatLabel}.`}>
              <strong>{String(activeLevers.length).padStart(2, "0")}</strong>
              <span>/ 06 levers live</span>
              <em>{beatLabel.replace(/^\d+ · /, "")}</em>
            </div>
          </div>
        </div>

        <HospitalCutaway
          simulation={current}
          baseline={baseline}
          activeLevers={activeLevers}
          isPlaying={isPlaying}
          painPoints={scenePainPoints}
          activePainPointId={activePainPointId}
          constraintLabel={constraintLabel}
          materializingLever={materializingLever}
          storyBeat={storyBeat}
          className="cutaway-embedded mt-2"
          title="Animated hospital and medical-center cutaway"
          showHeader={false}
        />

        <div className="twin-stage-caption mx-auto max-w-[1240px]">
          <div>
            <span>{beatLabel}</span>
            <strong>{moment.title}</strong>
            <p>{moment.copy}</p>
          </div>
          <div className="twin-trust-line">
            <span className="status-dot status-dot-ready" aria-hidden="true" />
            Clinical priority fixed · consequential actions remain human-approved
          </div>
        </div>

        <div className="twin-lever-rail twin-lever-rail-immersive mx-auto mt-4 max-w-[1240px]" aria-label="Transformation levers">
          {LEVER_SEQUENCE.map((lever) => {
            const item = LEVER_META[lever];
            const active = activeSet.has(lever);
            const materializing = materializingLever === lever;
            return (
              <button
                key={lever}
                type="button"
                onClick={() => toggleLever(lever)}
                className={`twin-lever ${active ? "twin-lever-active" : ""}${materializing ? " twin-lever-materializing" : ""}`}
                style={{ "--lever-color": item.color } as CSSProperties}
                aria-pressed={active}
                aria-label={`${item.name}: ${active ? "materialized" : materializing ? "materializing" : "waiting"}`}
              >
                <span className="twin-lever-monogram">{item.monogram}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{active ? "Materialized" : materializing ? "Materializing" : "Waiting"}</small>
                </span>
                <b aria-hidden="true">{active ? "✓" : materializing ? "•••" : item.number}</b>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-5 flex max-w-[1240px] flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <details className="twin-assumptions">
            <summary>Model basis and assumptions</summary>
            <div>
              <p>
                {SIMULATION_EPISODES} synthetic episodes across {SIMULATION_HORIZON_DAYS} days: 40% routine surgical,
                25% precision-eligible surgical oncology, and 35% medical or chronic. Every scenario replays the
                identical seeded demand trace.
              </p>
              <p>
                Stage capacity, service calendars, handoff delays, exception rates, and lever coefficients are
                transparent demonstration assumptions—not observed AdventHealth results. No patient data, clinical
                outcome claim, or financial forecast is used.
              </p>
            </div>
          </details>
          <button type="button" className="button-ghost whitespace-nowrap" onClick={onOpenCase}>
            Inspect Case 7B →
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {beatLabel}. {materializingLever ? `${LEVER_META[materializingLever].name} is materializing. ` : ""}
          {activeLevers.length} levers active. {current.completed} episodes complete. Median journey{" "}
          {current.medianJourneyDays} days. Current system constraint {current.stageResults[current.constraint].name}.
        </p>
      </div>
    </section>
  );
}
