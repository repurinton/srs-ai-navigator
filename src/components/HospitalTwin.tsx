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
    title: "Coordination is no longer the constraint. Physical capacity is.",
    copy: "With all six levers connected, the same demand trace completes more episodes. Staffed recovery capacity—not fragmented work—is now the investment decision.",
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
    stage: "access",
    severity: "pressure",
    anchor: SCENE_ANCHORS.access,
    callout: SCENE_CALLOUTS.access,
    resolvedBy: "front-door",
  },
  diagnosis: {
    title: "Right pathway, first time",
    detail: "Clinical pathway intelligence removes avoidable routing resets around imaging and work-up.",
    stage: "diagnosis",
    severity: "pressure",
    anchor: SCENE_ANCHORS.diagnosis,
    callout: SCENE_CALLOUTS.diagnosis,
    resolvedBy: "diagnosis",
  },
  precision: {
    title: "Target earlier. Revise less.",
    detail: "Eligible patients spend more time planning upstream so fewer treatment plans are rebuilt later.",
    stage: "precision",
    severity: "watch",
    anchor: SCENE_ANCHORS.precision,
    callout: SCENE_CALLOUTS.precision,
    resolvedBy: "precision",
  },
  robotics: {
    title: "Local OR capacity released",
    detail: "Turnover and readiness improve, but the gain transfers pressure into recovery and beds.",
    stage: "robotics",
    severity: "watch",
    anchor: SCENE_ANCHORS.robotics,
    callout: SCENE_CALLOUTS.robotics,
    resolvedBy: "robotics",
  },
  longitudinal: {
    title: "The next care step is already owned",
    detail: "Discharge and follow-up begin before the bed decision instead of after the patient leaves.",
    stage: "longitudinal",
    severity: "pressure",
    anchor: SCENE_ANCHORS.longitudinal,
    callout: SCENE_CALLOUTS.longitudinal,
    resolvedBy: "longitudinal",
  },
  automation: {
    title: "Agents execute. Humans govern.",
    detail: "Routine handoffs move across the campus while consequential decisions stop at named approvals.",
    severity: "watch",
    anchor: { x: 77, y: 18 },
    callout: { x: 62, y: 3 },
    resolvedBy: "automation",
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

function buildScenePainPoints(
  activeLevers: LeverId[],
  current: SimulationResult,
): HospitalPainPoint[] {
  const constraint = current.stageResults[current.constraint];
  const currentConstraint: HospitalPainPoint = {
    id: `constraint-${activeLevers.length}-${current.constraint}`,
    title: CONSTRAINT_TITLES[current.constraint],
    detail:
      current.constraint === "care"
        ? "Coordination is no longer limiting flow. Staffed recovery capacity is now the investment decision."
        : `${constraint.name} now absorbs the demand released upstream. The constraint moved; it did not disappear.`,
    stage: current.constraint,
    value: `${constraint.peakQueue} peak queue · ${Math.round(constraint.averageWaitHours)}h average wait`,
    severity: "critical",
    anchor: SCENE_ANCHORS[current.constraint],
    callout: SCENE_CALLOUTS[current.constraint],
  };

  const latestLever = activeLevers.at(-1);
  if (!latestLever) {
    const baselineConstraint = {
      ...currentConstraint,
      detail: "Misrouting, incomplete readiness, and repeated coordination make imaging look constrained even when the equipment is not the limiting asset.",
    };
    return [
      {
        id: "baseline-arrival-friction",
        title: "Arrival repeats itself",
        detail: "Parking, valet, registration, and clinical intake each ask for context the system already has.",
        stage: "access",
        value: `${current.stageResults.access.peakQueue} peak queue`,
        severity: "pressure",
        anchor: SCENE_ANCHORS.access,
        callout: SCENE_CALLOUTS.access,
        resolvedBy: "front-door",
      },
      baselineConstraint,
    ];
  }

  const resolution = LEVER_RESOLUTIONS[latestLever];
  const stage = resolution.stage ? current.stageResults[resolution.stage] : undefined;
  return [
    {
      ...resolution,
      id: `resolved-${activeLevers.length}-${latestLever}`,
      value: stage ? `${stage.peakQueue} peak queue now` : `${current.administrativeTouches} touches now`,
    },
    currentConstraint,
  ];
}

export function HospitalTwin({ onOpenCase }: { onOpenCase: () => void }) {
  const [activeLevers, setActiveLevers] = useState<LeverId[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const baseline = useMemo(() => simulateHospital([]), []);
  const current = useMemo(() => simulateHospital(activeLevers), [activeLevers]);
  const activeSet = useMemo(() => new Set(activeLevers), [activeLevers]);
  const guidedState = isSequencePrefix(activeLevers);
  const moment = guidedState
    ? MOMENTS[activeLevers.length] ?? MOMENTS[0]
    : {
        title: `${activeLevers.length} levers are active. The constraint is ${current.stageResults[current.constraint].name.toLowerCase()}.`,
        copy: "Manual combinations use the same deterministic demand trace. Reset or run the guided sequence to see the intended transformation story.",
      };
  const scenePainPoints = useMemo(
    () => buildScenePainPoints(activeLevers, current),
    [activeLevers, current],
  );
  const activePainPointId = scenePainPoints.find((painPoint) => !painPoint.resolvedBy)?.id;

  useEffect(() => {
    if (!isPlaying) return;
    const nextLever = LEVER_SEQUENCE.find((lever) => !activeSet.has(lever));
    if (!nextLever) {
      setIsPlaying(false);
      return;
    }

    const handle = window.setTimeout(
      () => setActiveLevers((levers) => (levers.includes(nextLever) ? levers : [...levers, nextLever])),
      activeLevers.length === 0 ? 3200 : 4700,
    );
    return () => window.clearTimeout(handle);
  }, [activeLevers.length, activeSet, isPlaying]);

  function toggleGuidedRun() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!guidedState || activeLevers.length === LEVER_SEQUENCE.length) setActiveLevers([]);
    setIsPlaying(true);
  }

  function stepForward() {
    setIsPlaying(false);
    const nextLever = LEVER_SEQUENCE.find((lever) => !activeSet.has(lever));
    if (nextLever) {
      setActiveLevers((levers) => LEVER_SEQUENCE.filter((lever) => lever === nextLever || levers.includes(lever)));
    }
  }

  function toggleLever(lever: LeverId) {
    setIsPlaying(false);
    const next = new Set(activeLevers);
    if (next.has(lever)) next.delete(lever);
    else next.add(lever);
    setActiveLevers(LEVER_SEQUENCE.filter((candidate) => next.has(candidate)));
  }

  function reset() {
    setIsPlaying(false);
    setActiveLevers([]);
  }

  return (
    <section className="twin-shell bg-[var(--color-night)] text-white">
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
                    : guidedState && activeLevers.length > 0
                      ? "Continue guided demo"
                      : "Run guided demo"}
              </button>
              <button
                type="button"
                className="button-small-ghost"
                onClick={stepForward}
                disabled={activeLevers.length === LEVER_SEQUENCE.length}
              >
                Materialize next →
              </button>
              <button type="button" className="button-small-ghost" onClick={reset} disabled={activeLevers.length === 0}>
                Reset baseline
              </button>
            </div>
            <div className="twin-step-count" aria-label={`${activeLevers.length} of 6 levers active`}>
              <strong>{String(activeLevers.length).padStart(2, "0")}</strong>
              <span>/ 06 levers live</span>
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
          className="cutaway-embedded mt-2"
          title="Animated hospital and medical-center cutaway"
          showHeader={false}
        />

        <div className="twin-stage-caption mx-auto max-w-[1240px]">
          <div>
            <span>What the campus is showing</span>
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
            return (
              <button
                key={lever}
                type="button"
                onClick={() => toggleLever(lever)}
                className={`twin-lever ${active ? "twin-lever-active" : ""}`}
                style={{ "--lever-color": item.color } as CSSProperties}
                aria-pressed={active}
              >
                <span className="twin-lever-monogram">{item.monogram}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{active ? "Materialized" : "Waiting"}</small>
                </span>
                <b aria-hidden="true">{active ? "✓" : item.number}</b>
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
          {activeLevers.length} levers active. {current.completed} episodes complete. Median journey{" "}
          {current.medianJourneyDays} days. Current constraint {current.stageResults[current.constraint].name}.
        </p>
      </div>
    </section>
  );
}
