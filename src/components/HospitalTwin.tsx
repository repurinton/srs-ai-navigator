import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

const NODES: Array<{ id: StageId; area: string; monogram: string }> = [
  { id: "access", area: "access", monogram: "FD" },
  { id: "diagnosis", area: "diagnosis", monogram: "DX" },
  { id: "precision", area: "precision", monogram: "PM" },
  { id: "readiness", area: "readiness", monogram: "RD" },
  { id: "robotics", area: "robotics", monogram: "RX" },
  { id: "care", area: "care", monogram: "IP" },
  { id: "longitudinal", area: "longitudinal", monogram: "LC" },
];

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

  useEffect(() => {
    if (!isPlaying) return;
    const nextLever = LEVER_SEQUENCE.find((lever) => !activeSet.has(lever));
    if (!nextLever) {
      setIsPlaying(false);
      return;
    }

    const handle = window.setTimeout(
      () => setActiveLevers((levers) => (levers.includes(nextLever) ? levers : [...levers, nextLever])),
      activeLevers.length === 0 ? 700 : 1550,
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
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-[var(--color-mint)]">Hospital operating twin</p>
              <span className="twin-disclosure">Synthetic · deterministic · not a forecast</span>
            </div>
            <h1 className="display-title mt-4 text-white">Watch the constraint move.</h1>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-lg leading-relaxed text-white/60">
              Same 600 episodes. Same 30-day demand trace. Same clinical priority. Activate each lever and watch
              queues, journey time, and administrative work respond.
            </p>
            <p className="mt-4 text-sm font-bold text-[var(--color-mint)]">
              Buying six technologies creates local gains. Connecting them creates an operating system.
            </p>
          </div>
        </div>

        <div className="twin-control-bar mt-10">
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

        <div className="twin-lever-rail mt-4" aria-label="Transformation levers">
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

        <div className="twin-metrics mt-4" aria-label="Current simulation results">
          <TwinMetric
            label="Episodes completed / 30 days"
            value={String(current.completed)}
            baseline={String(baseline.completed)}
            delta={`${current.completed - baseline.completed >= 0 ? "+" : ""}${current.completed - baseline.completed}`}
            improved={current.completed > baseline.completed}
          />
          <TwinMetric
            label="Median end-to-end time"
            value={`${current.medianJourneyDays} d`}
            baseline={`${baseline.medianJourneyDays} d`}
            delta={`${Math.round((current.medianJourneyDays - baseline.medianJourneyDays) * 2) / 2} d`}
            improved={current.medianJourneyDays < baseline.medianJourneyDays}
          />
          <TwinMetric
            label="Administrative touches / episode"
            value={String(current.administrativeTouches)}
            baseline={String(baseline.administrativeTouches)}
            delta={`${current.administrativeTouches - baseline.administrativeTouches}`}
            improved={current.administrativeTouches < baseline.administrativeTouches}
          />
        </div>

        <div className="twin-canvas mt-4">
          <div className="twin-canvas-header">
            <div>
              <span>Regional complex-care flow</span>
              <strong>{moment.title}</strong>
            </div>
            <div className="twin-constraint">
              <span>Current constraint</span>
              <strong>{current.stageResults[current.constraint].name}</strong>
            </div>
          </div>

          <div
            className={`twin-campus ${activeSet.has("automation") ? "twin-campus-connected" : ""}`}
            role="group"
            aria-label="Synthetic hospital flow from access through longitudinal care"
          >
            <div className="twin-route-line twin-route-line-top" aria-hidden="true" />
            <div className="twin-route-line twin-route-line-turn" aria-hidden="true" />
            <div className="twin-route-line twin-route-line-bottom" aria-hidden="true" />
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className="twin-case-token"
                style={{ "--token-delay": `${index * -1.25}s` } as CSSProperties}
                aria-hidden="true"
              />
            ))}

            {NODES.map((node) => (
              <TwinNode
                key={node.id}
                node={node}
                current={current}
                baseline={baseline}
                activeLevers={activeSet}
              />
            ))}

            <div className={`twin-command-layer ${activeSet.has("automation") ? "twin-command-layer-live" : ""}`}>
              <span className="twin-command-monogram">TA</span>
              <div>
                <strong>Coordination layer</strong>
                <p>{activeSet.has("automation") ? "Context shared · reversible work executed · exceptions escalated" : "Six departments · separate queues · manual verification"}</p>
              </div>
              <b>{activeSet.has("automation") ? "Connected" : "Fragmented"}</b>
            </div>
          </div>

          <div className="twin-narrative">
            <div>
              <span>What changed</span>
              <p>{moment.copy}</p>
            </div>
            <div className="twin-trust-line">
              <span className="status-dot status-dot-ready" aria-hidden="true" />
              Clinical priority fixed · consequential actions remain human-approved
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
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

function TwinMetric({
  label,
  value,
  baseline,
  delta,
  improved,
}: {
  label: string;
  value: string;
  baseline: string;
  delta: string;
  improved: boolean;
}) {
  const neutral = delta === "0" || delta === "0%" || delta === "0 d";
  return (
    <div className="twin-metric">
      <span>{label}</span>
      <div>
        <strong>{value}</strong>
        <b className={neutral || !improved ? "" : "twin-delta-good"}>{delta}</b>
      </div>
      <small>Baseline {baseline}</small>
    </div>
  );
}

function TwinNode({
  node,
  current,
  baseline,
  activeLevers,
}: {
  node: (typeof NODES)[number];
  current: SimulationResult;
  baseline: SimulationResult;
  activeLevers: Set<LeverId>;
}) {
  const result = current.stageResults[node.id];
  const base = baseline.stageResults[node.id];
  const lever = result.leverId;
  const active = lever ? activeLevers.has(lever) : activeLevers.has("precision") || activeLevers.has("automation");
  const bottleneck = current.constraint === node.id;
  const color = lever ? LEVER_META[lever].color : activeLevers.has("automation") ? LEVER_META.automation.color : "#5bf0c3";
  const maxQueue = Math.max(base.peakQueue, result.peakQueue, 1);
  const queueRatio = Math.max(3, Math.round((result.peakQueue / maxQueue) * 100));
  const baselineRatio = Math.round((base.peakQueue / maxQueue) * 100);

  return (
    <article
      className={`twin-facility ${active ? "twin-facility-live" : ""} ${bottleneck ? "twin-facility-constraint" : ""}`}
      style={
        {
          gridArea: node.area,
          "--node-color": color,
          "--queue-ratio": `${queueRatio}%`,
          "--baseline-ratio": `${baselineRatio}%`,
        } as CSSProperties
      }
    >
      <div className="twin-facility-topline">
        <span className="twin-facility-monogram">{node.monogram}</span>
        <span>{bottleneck ? "Constraint" : active ? "Lever live" : "Baseline"}</span>
      </div>
      <h3>{result.name}</h3>
      <div className="twin-queue-label">
        <span>Peak queue</span>
        <strong>{result.peakQueue}</strong>
      </div>
      <div className="twin-queue-track" aria-label={`Peak queue ${result.peakQueue}; baseline ${base.peakQueue}`}>
        <span className="twin-queue-fill" />
        <i aria-hidden="true" />
      </div>
      <p>Baseline {base.peakQueue} · avg wait {Math.round(result.averageWaitHours)}h</p>
    </article>
  );
}
