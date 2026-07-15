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
  /** Optional state label shown above the card title. */
  kicker?: string;
  /** Optional state label used once the relieving lever is active. */
  resolvedLabel?: string;
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
  constraintLabel?: string;
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
  { id: "imaging", label: "CT + MRI", x: 36, y: 13 },
  { id: "robotics", label: "Robotic ORs", x: 55, y: 29.5 },
  { id: "recovery", label: "Recovery + beds", x: 76, y: 36 },
  { id: "emergency", label: "EMS", x: 13, y: 38 },
  { id: "arrivals", label: "Valet + arrivals", x: 41, y: 73 },
] as const;

function clampPosition(value: number) {
  return Math.max(3, Math.min(89, value));
}

function deltaClass(delta: number | undefined, positiveIsBetter: boolean) {
  if (delta === undefined || delta === 0) return "is-neutral";
  const improving = positiveIsBetter ? delta > 0 : delta < 0;
  return improving ? "is-improving" : "is-worsening";
}

function describeYieldDelta(delta: number | undefined) {
  if (delta === undefined) return "Current horizon";
  if (delta === 0) return "Baseline";
  return `${delta > 0 ? "+" : ""}${delta} pts vs baseline`;
}

function describeJourneyDelta(delta: number | undefined) {
  if (delta === undefined) return "Arrival to completion";
  if (delta === 0) return "At baseline";
  return delta < 0 ? `${Math.abs(delta)}d faster` : `${delta}d slower`;
}

function describeTouchesDelta(delta: number | undefined) {
  if (delta === undefined) return "Per episode";
  if (delta === 0) return "At baseline";
  return delta < 0 ? `${Math.abs(delta)} fewer vs baseline` : `${delta} more vs baseline`;
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

function MotionActor({
  visualClassName,
  routeClassName,
  children,
  delay,
  secondary = false,
}: {
  visualClassName: string;
  routeClassName: string;
  children?: ReactNode;
  delay: string;
  secondary?: boolean;
}) {
  return (
    <span
      className={`cutaway-motion-track ${routeClassName}`}
      style={{ "--actor-delay": delay } as SceneStyle}
      aria-hidden="true"
    >
      <span className={`cutaway-motion-glyph ${visualClassName}${secondary ? " cutaway-actor-secondary" : ""}`}>{children}</span>
    </span>
  );
}

function Person({
  role,
  route,
  delay,
  secondary = false,
}: {
  role: "caregiver" | "patient" | "valet";
  route: string;
  delay: string;
  secondary?: boolean;
}) {
  return (
    <MotionActor
      visualClassName={`cutaway-person cutaway-person-${role}`}
      routeClassName={`cutaway-route-${route}`}
      delay={delay}
      secondary={secondary}
    >
      <i className="cutaway-person-head" />
      <i className="cutaway-person-body" />
    </MotionActor>
  );
}

function Vehicle({
  kind,
  route,
  delay,
  secondary = false,
}: {
  kind: "car" | "ambulance";
  route: string;
  delay: string;
  secondary?: boolean;
}) {
  return (
    <MotionActor
      visualClassName={`cutaway-vehicle cutaway-${kind}`}
      routeClassName={`cutaway-route-${route}`}
      delay={delay}
      secondary={secondary}
    >
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
        {resolved
          ? painPoint.resolvedLabel ?? "Pressure relieved"
          : painPoint.kicker ?? (painPoint.severity === "critical" ? "Constraint" : "Pain point")}
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
  constraintLabel = "Current constraint",
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
  const flowYield = Math.round((simulation.completed / simulation.episodes) * 1_000) / 10;
  const baselineFlowYield = baseline ? Math.round((baseline.completed / baseline.episodes) * 1_000) / 10 : undefined;
  const flowYieldDelta = baselineFlowYield === undefined ? undefined : Math.round((flowYield - baselineFlowYield) * 10) / 10;
  const journeyDelta = baseline ? simulation.medianJourneyDays - baseline.medianJourneyDays : undefined;
  const touchesDelta = baseline ? simulation.administrativeTouches - baseline.administrativeTouches : undefined;
  const resolvedPainPoint = presentedPainPoints.find(
    (painPoint) => painPoint.resolvedBy && activeSet.has(painPoint.resolvedBy),
  );
  const averagePainPointX = presentedPainPoints.length
    ? presentedPainPoints.reduce((sum, painPoint) => sum + painPoint.anchor.x, 0) / presentedPainPoints.length
    : constraintAnchor.x;
  const mobileFocusX = resolvedPainPoint
    ? constraintAnchor.x * 0.64 + resolvedPainPoint.anchor.x * 0.36
    : constraintAnchor.x * 0.72 + averagePainPointX * 0.28;
  const mobileVisibleWorld = (1.15 / (16 / 9)) * 100;
  const mobileCameraShift = Math.max(
    0,
    Math.min(100 - mobileVisibleWorld, mobileFocusX - mobileVisibleWorld / 2),
  );
  const mobilePainPoints = [...presentedPainPoints].sort((left, right) => {
    const severityRank = { critical: 0, pressure: 1, watch: 2 } as const;
    return severityRank[left.severity ?? "pressure"] - severityRank[right.severity ?? "pressure"];
  });

  return (
    <section
      className={`hospital-cutaway ${isPlaying ? "is-playing" : "is-paused"} ${className}`.trim()}
      data-connected={activeSet.has("automation") ? "true" : "false"}
      data-robotics={activeSet.has("robotics") ? "true" : "false"}
      data-diagnosis={activeSet.has("diagnosis") ? "true" : "false"}
      data-longitudinal={activeSet.has("longitudinal") ? "true" : "false"}
      data-focus={simulation.constraint}
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
          "--mobile-camera-shift": `-${mobileCameraShift.toFixed(2)}%`,
        } as SceneStyle}
      >
        <div className="cutaway-world">
          <div className="cutaway-raster" aria-hidden="true" />
          <div className="cutaway-depth-light" aria-hidden="true" />
          <div className="cutaway-constraint-zone" aria-hidden="true"><i /></div>

          <div className="cutaway-network" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
          </div>

          <div className="cutaway-zone-labels" aria-hidden="true">
            {ZONE_LABELS.map((zone) => (
              <span
                key={zone.label}
                className={`cutaway-zone-${zone.id}`}
                style={{ "--x": `${zone.x}%`, "--y": `${zone.y}%` } as SceneStyle}
              >
                {zone.label}
              </span>
            ))}
          </div>

          <div className="cutaway-motion-layer" aria-hidden="true">
            <Vehicle kind="car" route="car-arrival" delay="-1.1s" />
            <Vehicle kind="car" route="car-arrival" delay="-9.6s" secondary />
            <Vehicle kind="car" route="car-departure" delay="-6.6s" />
            <Vehicle kind="car" route="car-departure" delay="-16.1s" secondary />
            <Vehicle kind="car" route="car-parking" delay="-11.8s" />
            <Vehicle kind="car" route="car-parking" delay="-1.3s" secondary />
            <Vehicle kind="ambulance" route="ambulance" delay="-3.8s" />
            <Vehicle kind="ambulance" route="ambulance" delay="-10.8s" secondary />
            <Person role="valet" route="valet-curb" delay="-1.4s" />
            <Person role="valet" route="valet-curb" delay="-4.65s" secondary />
            <Person role="valet" route="valet-entry" delay="-7.1s" />
            <Person role="valet" route="valet-entry" delay="-15.1s" secondary />
            <Person role="patient" route="patient-arrival" delay="-2.3s" />
            <Person role="patient" route="patient-arrival" delay="-8.8s" secondary />
            <Person role="patient" route="patient-ward" delay="-9.7s" />
            <Person role="patient" route="patient-ward" delay="-21.7s" secondary />
            <Person role="caregiver" route="caregiver-prep" delay="-0.8s" />
            <Person role="caregiver" route="caregiver-prep" delay="-9.8s" secondary />
            <Person role="caregiver" route="caregiver-or" delay="-4.2s" />
            <Person role="caregiver" route="caregiver-or" delay="-14.2s" secondary />
            <Person role="caregiver" route="caregiver-recovery" delay="-8.9s" />
            <Person role="caregiver" route="caregiver-recovery" delay="-19.9s" secondary />
            <Person role="caregiver" route="caregiver-ward" delay="-12.6s" />
            <Person role="caregiver" route="caregiver-ward" delay="-24.6s" secondary />
            <MotionActor visualClassName="cutaway-gurney" routeClassName="cutaway-route-gurney-prep" delay="-1.8s"><i /><b /></MotionActor>
            <MotionActor visualClassName="cutaway-gurney" routeClassName="cutaway-route-gurney-prep" delay="-12.8s" secondary><i /><b /></MotionActor>
            <MotionActor visualClassName="cutaway-gurney" routeClassName="cutaway-route-gurney-recovery" delay="-6.1s"><i /><b /></MotionActor>
            <MotionActor visualClassName="cutaway-gurney" routeClassName="cutaway-route-gurney-recovery" delay="-18.1s" secondary><i /><b /></MotionActor>
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
                  className={`cutaway-lever-beacon cutaway-lever-${lever} ${active ? "is-live" : ""}`}
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
        </div>

        <div className="cutaway-mobile-focus" aria-hidden="true"><span>{constraintLabel}</span><strong>{constraint.shortName}</strong></div>
      </div>

      <section className="cutaway-flow-dashboard" aria-label="Patient flow dashboard">
        <header className="cutaway-flow-dashboard-header">
          <div>
            <span className="cutaway-flow-kicker"><i aria-hidden="true" /> Patient flow</span>
            <strong>{simulation.completed} of {simulation.episodes} episodes completed</strong>
            {throughputDelta !== undefined ? (
              <small className={deltaClass(throughputDelta, true)}>
                {throughputDelta === 0 ? "Baseline" : `${throughputDelta > 0 ? "+" : ""}${throughputDelta} vs baseline`}
              </small>
            ) : null}
          </div>
          <div className="cutaway-flow-constraint">
            <span>{constraintLabel}</span>
            <strong>{constraint.shortName}</strong>
          </div>
        </header>

        <div
          className="cutaway-flow-progress"
          role="progressbar"
          aria-label="Episodes completed during the simulation horizon"
          aria-valuemin={0}
          aria-valuemax={simulation.episodes}
          aria-valuenow={simulation.completed}
        >
          <i style={{ "--flow-progress": `${flowYield}%` } as SceneStyle} />
        </div>

        <dl className="cutaway-flow-metrics">
          <div>
            <dt>Flow yield</dt>
            <dd>{flowYield}%</dd>
            <small className={deltaClass(flowYieldDelta, true)}>{describeYieldDelta(flowYieldDelta)}</small>
          </div>
          <div>
            <dt>Median journey</dt>
            <dd>{simulation.medianJourneyDays}d</dd>
            <small className={deltaClass(journeyDelta, false)}>{describeJourneyDelta(journeyDelta)}</small>
          </div>
          <div>
            <dt>Peak queue</dt>
            <dd>{constraint.peakQueue}</dd>
            <small>{constraint.shortName} stage</small>
          </div>
          <div>
            <dt>Admin touches</dt>
            <dd>{simulation.administrativeTouches}</dd>
            <small className={deltaClass(touchesDelta, false)}>{describeTouchesDelta(touchesDelta)}</small>
          </div>
        </dl>
      </section>

      <div className="cutaway-mobile-callouts" aria-label="Current hospital pain points">
        {mobilePainPoints.map((painPoint) => (
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
