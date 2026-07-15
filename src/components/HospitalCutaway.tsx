import { useId, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  LEVER_META,
  LEVER_SEQUENCE,
  type LeverId,
  type SimulationResult,
  type StageId,
} from "@/lib/hospital-sim";
import "./HospitalCutaway.css";

export type CutawayAnchor = {
  /** Horizontal position as a percentage of the scene width. */
  x: number;
  /** Vertical position as a percentage of the scene height. */
  y: number;
};

export type HospitalPainPoint = {
  id: string;
  title: string;
  detail: string;
  stage?: StageId;
  value?: string;
  severity?: "watch" | "pressure" | "critical";
  anchor: CutawayAnchor;
  /** Optional card position. Defaults to a nearby, edge-safe position. */
  callout?: CutawayAnchor;
  /** The lever expected to relieve this pain point. */
  resolvedBy?: LeverId;
  /** Set false to retain a pain point in data without presenting it in this scene. */
  visible?: boolean;
};

export type HospitalCutawayProps = {
  simulation: SimulationResult;
  activeLevers: readonly LeverId[];
  painPoints?: readonly HospitalPainPoint[];
  baseline?: SimulationResult;
  isPlaying?: boolean;
  activePainPointId?: string;
  onPainPointSelect?: (painPoint: HospitalPainPoint) => void;
  className?: string;
  title?: string;
  showHeader?: boolean;
};

type SceneStyle = CSSProperties & Record<`--${string}`, string | number>;

const STAGE_ANCHORS: Record<StageId, { anchor: CutawayAnchor; callout: CutawayAnchor }> = {
  access: { anchor: { x: 42, y: 65 }, callout: { x: 5, y: 69 } },
  diagnosis: { anchor: { x: 36, y: 20 }, callout: { x: 4, y: 5 } },
  precision: { anchor: { x: 56, y: 22 }, callout: { x: 62, y: 4 } },
  readiness: { anchor: { x: 32, y: 40 }, callout: { x: 3, y: 30 } },
  robotics: { anchor: { x: 55, y: 41 }, callout: { x: 58, y: 47 } },
  care: { anchor: { x: 75, y: 43 }, callout: { x: 76, y: 26 } },
  longitudinal: { anchor: { x: 88, y: 70 }, callout: { x: 70, y: 69 } },
};

const LEVER_BEACONS: Record<LeverId, CutawayAnchor> = {
  "front-door": { x: 42, y: 65 },
  diagnosis: { x: 36, y: 20 },
  precision: { x: 56, y: 22 },
  robotics: { x: 55, y: 41 },
  longitudinal: { x: 88, y: 70 },
  automation: { x: 77, y: 18 },
};

const ZONE_LABELS = [
  { label: "CT + MRI", x: 36, y: 13 },
  { label: "Robotic ORs", x: 55, y: 34 },
  { label: "Recovery + beds", x: 76, y: 36 },
  { label: "EMS", x: 13, y: 38 },
  { label: "Valet + arrivals", x: 41, y: 73 },
] as const;

function clampPosition(value: number) {
  return Math.max(3, Math.min(89, value));
}

function defaultCallout(anchor: CutawayAnchor): CutawayAnchor {
  return {
    x: clampPosition(anchor.x + (anchor.x > 58 ? -22 : 7)),
    y: Math.max(4, Math.min(82, anchor.y + (anchor.y > 56 ? -24 : 10))),
  };
}

function buildAutomaticPainPoints(simulation: SimulationResult): HospitalPainPoint[] {
  return Object.values(simulation.stageResults)
    .sort((left, right) => right.peakQueue - left.peakQueue)
    .slice(0, 3)
    .map((stage, index) => {
      const placement = STAGE_ANCHORS[stage.id];
      const isConstraint = stage.id === simulation.constraint;
      return {
        id: `queue-${stage.id}`,
        title: isConstraint ? `${stage.shortName} is the constraint` : `${stage.shortName} queue is building`,
        detail: `${stage.peakQueue} cases at peak; ${Math.round(stage.averageWaitHours)} average wait hours.`,
        stage: stage.id,
        value: `${stage.peakQueue} queued`,
        severity: isConstraint ? "critical" : index === 1 ? "pressure" : "watch",
        anchor: placement.anchor,
        callout: placement.callout,
        resolvedBy: stage.leverId,
      };
    });
}

function MotionActor({ className, children, delay }: { className: string; children?: ReactNode; delay: string }) {
  return (
    <span className={`cutaway-actor ${className}`} style={{ "--actor-delay": delay } as SceneStyle} aria-hidden="true">
      {children}
    </span>
  );
}

function Person({ role, delay }: { role: "caregiver" | "patient" | "valet"; delay: string }) {
  return (
    <MotionActor className={`cutaway-person cutaway-person-${role}`} delay={delay}>
      <i className="cutaway-person-head" />
      <i className="cutaway-person-body" />
    </MotionActor>
  );
}

function Vehicle({ kind, delay }: { kind: "car" | "ambulance"; delay: string }) {
  return (
    <MotionActor className={`cutaway-vehicle cutaway-${kind}`} delay={delay}>
      <i className="cutaway-vehicle-cabin" />
      <i className="cutaway-wheel cutaway-wheel-front" />
      <i className="cutaway-wheel cutaway-wheel-back" />
      {kind === "ambulance" ? <i className="cutaway-ambulance-mark">+</i> : null}
    </MotionActor>
  );
}

function PainPointCard({
  painPoint,
  active,
  resolved,
  onSelect,
}: {
  painPoint: HospitalPainPoint;
  active: boolean;
  resolved: boolean;
  onSelect?: (painPoint: HospitalPainPoint) => void;
}) {
  const content = (
    <>
      <span className="cutaway-callout-kicker">
        <i aria-hidden="true" />
        {resolved ? "Pressure relieved" : painPoint.severity === "critical" ? "Constraint" : "Pain point"}
      </span>
      <strong>{painPoint.title}</strong>
      <span className="cutaway-callout-detail">{painPoint.detail}</span>
      {painPoint.value ? <b>{painPoint.value}</b> : null}
    </>
  );

  const className = `cutaway-callout-card cutaway-severity-${painPoint.severity ?? "pressure"}${active ? " is-active" : ""}${resolved ? " is-resolved" : ""}`;
  return onSelect ? (
    <button type="button" className={className} onClick={() => onSelect(painPoint)} aria-pressed={active}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function HospitalCutaway({
  simulation,
  activeLevers,
  painPoints,
  baseline,
  isPlaying = true,
  activePainPointId,
  onPainPointSelect,
  className = "",
  title = "Hospital operating twin",
  showHeader = true,
}: HospitalCutawayProps) {
  const descriptionId = useId();
  const activeSet = useMemo(() => new Set(activeLevers), [activeLevers]);
  const presentedPainPoints = useMemo(
    () => (painPoints ?? buildAutomaticPainPoints(simulation)).filter((painPoint) => painPoint.visible !== false).slice(0, 2),
    [painPoints, simulation],
  );
  const activeNames = activeLevers.map((lever) => LEVER_META[lever].name);
  const constraint = simulation.stageResults[simulation.constraint];
  const constraintAnchor = STAGE_ANCHORS[simulation.constraint].anchor;
  const throughputDelta = baseline ? simulation.completed - baseline.completed : undefined;

  return (
    <section
      className={`hospital-cutaway ${isPlaying ? "is-playing" : "is-paused"} ${className}`.trim()}
      data-connected={activeSet.has("automation") ? "true" : "false"}
      data-robotics={activeSet.has("robotics") ? "true" : "false"}
      data-diagnosis={activeSet.has("diagnosis") ? "true" : "false"}
      data-longitudinal={activeSet.has("longitudinal") ? "true" : "false"}
      aria-labelledby={`${descriptionId}-title`}
    >
      {showHeader ? <header className="cutaway-header">
        <div>
          <span className="cutaway-eyebrow">Live operating view</span>
          <h2 id={`${descriptionId}-title`}>{title}</h2>
        </div>
        <div className="cutaway-status" aria-label={`${activeLevers.length} of 6 AI levers active`}>
          <span className="cutaway-status-pulse" aria-hidden="true" />
          <strong>{activeLevers.length}/6</strong>
          <span>levers live</span>
        </div>
      </header> : <h2 id={`${descriptionId}-title`} className="cutaway-sr-only">{title}</h2>}

      <div
        className="cutaway-scene"
        role="img"
        aria-describedby={descriptionId}
        style={{
          "--queue-intensity": Math.min(1, constraint.peakQueue / 40).toFixed(2),
          "--constraint-x": `${constraintAnchor.x}%`,
          "--constraint-y": `${constraintAnchor.y}%`,
        } as SceneStyle}
      >
        <div className="cutaway-raster" aria-hidden="true" />
        <div className="cutaway-depth-light" aria-hidden="true" />
        <div className="cutaway-constraint-zone" aria-hidden="true"><i /></div>

        <div className="cutaway-network" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
        </div>

        <div className="cutaway-zone-labels" aria-hidden="true">
          {ZONE_LABELS.map((zone) => (
            <span key={zone.label} style={{ "--x": `${zone.x}%`, "--y": `${zone.y}%` } as SceneStyle}>
              {zone.label}
            </span>
          ))}
        </div>

        <div className="cutaway-motion-layer" aria-hidden="true">
          <Vehicle kind="car" delay="-1.1s" />
          <Vehicle kind="car" delay="-6.6s" />
          <Vehicle kind="car" delay="-11.8s" />
          <Vehicle kind="ambulance" delay="-3.8s" />
          <Person role="valet" delay="-1.4s" />
          <Person role="valet" delay="-7.1s" />
          <Person role="patient" delay="-2.3s" />
          <Person role="patient" delay="-9.7s" />
          <Person role="caregiver" delay="-0.8s" />
          <Person role="caregiver" delay="-4.2s" />
          <Person role="caregiver" delay="-8.9s" />
          <Person role="caregiver" delay="-12.6s" />
          <span className="cutaway-gurney cutaway-gurney-one"><i /><b /></span>
          <span className="cutaway-gurney cutaway-gurney-two"><i /><b /></span>
          <span className={`cutaway-or-status cutaway-or-one ${activeSet.has("robotics") ? "is-live" : ""}`}><i />OR 01</span>
          <span className={`cutaway-or-status cutaway-or-two ${activeSet.has("robotics") ? "is-live" : ""}`}><i />OR 02</span>
          <span className={`cutaway-imaging-scan ${activeSet.has("diagnosis") ? "is-live" : ""}`}><i /></span>
          <span className={`cutaway-bed cutaway-bed-one ${activeSet.has("longitudinal") ? "is-clearing" : ""}`}><i /></span>
          <span className="cutaway-bed cutaway-bed-two"><i /></span>
          <span className="cutaway-bed cutaway-bed-three"><i /></span>
        </div>

        <div className="cutaway-lever-layer" aria-label="AI lever locations">
          {LEVER_SEQUENCE.map((lever) => {
            const beacon = LEVER_BEACONS[lever];
            const active = activeSet.has(lever);
            return (
              <span
                key={lever}
                className={`cutaway-lever-beacon ${active ? "is-live" : ""}`}
                style={{
                  "--x": `${beacon.x}%`,
                  "--y": `${beacon.y}%`,
                  "--lever-color": LEVER_META[lever].color,
                } as SceneStyle}
                aria-label={`${LEVER_META[lever].name}: ${active ? "active" : "waiting"}`}
              >
                <i aria-hidden="true" />
                <b>{LEVER_META[lever].monogram}</b>
              </span>
            );
          })}
        </div>

        <div className="cutaway-callout-layer">
          {presentedPainPoints.map((painPoint) => {
            const card = painPoint.callout ?? defaultCallout(painPoint.anchor);
            const resolved = Boolean(painPoint.resolvedBy && activeSet.has(painPoint.resolvedBy));
            return (
              <div
                key={painPoint.id}
                className="cutaway-callout"
                style={{
                  "--anchor-x": `${painPoint.anchor.x}%`,
                  "--anchor-y": `${painPoint.anchor.y}%`,
                  "--card-x": `${card.x}%`,
                  "--card-y": `${card.y}%`,
                } as SceneStyle}
              >
                <span className={`cutaway-anchor ${resolved ? "is-resolved" : ""}`} aria-hidden="true"><i /></span>
                <PainPointCard
                  painPoint={painPoint}
                  active={painPoint.id === activePainPointId}
                  resolved={resolved}
                  onSelect={onPainPointSelect}
                />
              </div>
            );
          })}
        </div>

        <div className="cutaway-metric-strip" aria-hidden="true">
          <span><small>Completed</small><strong>{simulation.completed}</strong>{throughputDelta !== undefined ? <b>{throughputDelta >= 0 ? "+" : ""}{throughputDelta}</b> : null}</span>
          <span><small>Median journey</small><strong>{simulation.medianJourneyDays}d</strong></span>
          <span><small>Admin touches</small><strong>{simulation.administrativeTouches}</strong></span>
          <span className="cutaway-constraint-metric"><small>Constraint now</small><strong>{constraint.shortName}</strong></span>
        </div>
      </div>

      <div className="cutaway-mobile-callouts" aria-label="Current hospital pain points">
        {presentedPainPoints.map((painPoint) => (
          <PainPointCard
            key={painPoint.id}
            painPoint={painPoint}
            active={painPoint.id === activePainPointId}
            resolved={Boolean(painPoint.resolvedBy && activeSet.has(painPoint.resolvedBy))}
            onSelect={onPainPointSelect}
          />
        ))}
      </div>

      <p id={descriptionId} className="cutaway-sr-only">
        A moving cutaway view of a regional medical center shows the parking and valet approach, patient arrivals,
        an ambulance entering emergency care, diagnostic imaging, robotic operating rooms, inpatient beds,
        caregivers, patients, and discharge flow. The current simulation has {simulation.completed} completed
        episodes, a median journey of {simulation.medianJourneyDays} days, and {simulation.administrativeTouches}
        administrative touches per episode. The current constraint is {constraint.name}. Active AI levers are
        {activeNames.length ? ` ${activeNames.join(", ")}.` : " none."} Motion is illustrative; performance is
        communicated by the simulation metrics and queue callouts, not animation speed.
      </p>
    </section>
  );
}
