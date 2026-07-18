import { Component, lazy, Suspense, useCallback, useId, useMemo, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  LEVER_META,
  LEVER_SEQUENCE,
  type LeverId,
  type SimulationResult,
  type StageId,
} from "@/lib/hospital-sim";
import type { HospitalStoryBeat } from "@/lib/hospital-story";
import { CutawayScene2D } from "@/components/CutawayScene2D";
import {
  latchRendererFallback,
  rendererFallbackReason,
  resolveHospitalRendererMode,
  type HospitalRendererMode,
} from "@/lib/renderer-mode";
import {
  projectedAnchor,
  projectedAnchorsVersion,
  subscribeProjectedAnchors,
} from "@/lib/anchor-projection";
import type { WorldPoseId } from "@/lib/hospital-world";
import "./HospitalCutaway.css";

const CutawayScene3D = lazy(() => import("@/components/hospital-3d/CutawayScene3D"));

export type CutawayAnchor = {
  /** Horizontal position as a percentage of the scene width. */
  x: number;
  /** Vertical position as a percentage of the scene height. */
  y: number;
};

export type HospitalCalloutVisualState = "pressure" | "solution" | "resolved" | "constraint";

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
  /**
   * Authored presentation state. Prefer this over inferring visual meaning from
   * severity or lever membership so a callout can never be both resolving and
   * materializing.
   */
  visualState?: HospitalCalloutVisualState;
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
  materializingLever?: LeverId;
  storyBeat?: HospitalStoryBeat;
  /** Explicitly aligns the scene halo and semantic focus with the story model. */
  focusStage?: StageId;
  /** Overrides the focus location when the story target is not a modeled stage. */
  focusAnchor?: CutawayAnchor;
  /** Independent mobile camera target; falls back to the focus anchor. */
  cameraTarget?: CutawayAnchor;
  /** Keeps dashboard language synchronized with the authored story state. */
  dashboardStage?: StageId;
  /** Optional compact label for the mobile camera focus pill. */
  focusLabel?: string;
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

/** World-anchor key each lever beacon projects from in 3D mode. */
const LEVER_WORLD_ANCHORS: Record<LeverId, string> = {
  "front-door": "access",
  diagnosis: "diagnosis",
  precision: "precision",
  robotics: "robotics",
  longitudinal: "longitudinal",
  automation: "automation",
};

function isAutomationFocused(painPoint: HospitalPainPoint | undefined, materializingLever: LeverId | undefined) {
  if (materializingLever === "automation") return true;
  if (!painPoint) return false;
  return painPoint.id.includes("automation") || painPoint.id.includes("administrative-handoffs");
}

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
  if (delta === undefined) return "Arrival to home";
  if (delta === 0) return "At baseline";
  const days = Math.abs(delta);
  return delta < 0 ? `${days} ${days === 1 ? "day" : "days"} faster` : `${days} ${days === 1 ? "day" : "days"} slower`;
}

function describeTouchesDelta(delta: number | undefined) {
  if (delta === undefined) return "Per patient";
  if (delta === 0) return "At baseline";
  const touches = Math.abs(delta);
  return delta < 0 ? `${touches} fewer ${touches === 1 ? "handoff" : "handoffs"}` : `${touches} more ${touches === 1 ? "handoff" : "handoffs"}`;
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
        title: isConstraint ? `${stage.shortName} is the bottleneck` : `${stage.shortName} queue is building`,
        detail: `${stage.peakQueue} patients waiting at peak · ${Math.round(stage.averageWaitHours)} hr average wait.`,
        stage: stage.id,
        value: `${stage.peakQueue} waiting`,
        severity: isConstraint ? "critical" : index === 1 ? "pressure" : "watch",
        anchor: placement.anchor,
        callout: placement.callout,
        resolvedBy: stage.leverId,
        visualState: isConstraint ? "constraint" : "pressure",
      };
    });
}

function inferVisualState(
  painPoint: HospitalPainPoint,
  activeLevers: ReadonlySet<LeverId>,
  materializingLever: LeverId | undefined,
  constraintStage: StageId,
): HospitalCalloutVisualState {
  if (painPoint.visualState) return painPoint.visualState;

  // Order matters: an already-active lever is a resolved receipt, never a
  // materializing solution. The truthy guard prevents undefined === undefined.
  if (painPoint.resolvedBy && activeLevers.has(painPoint.resolvedBy)) return "resolved";
  if (materializingLever && painPoint.resolvedBy === materializingLever) return "solution";
  if (painPoint.stage === constraintStage || painPoint.severity === "critical") return "constraint";
  return "pressure";
}

/**
 * Catches 3D chunk-load or render failures and demotes the scene to the 2D
 * renderer for the rest of the session without touching story state.
 */
class SceneErrorBoundary extends Component<
  { onError: (reason: string) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    const stackHint = (error.stack ?? "").split("\n").slice(0, 3).join(" | ");
    this.props.onError(`${error.name}: ${error.message || "3d renderer error"} — ${stackHint}`);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function PainPointCard({
  painPoint,
  active,
  visualState,
  onSelect,
}: {
  painPoint: HospitalPainPoint;
  active: boolean;
  visualState: HospitalCalloutVisualState;
  onSelect?: (painPoint: HospitalPainPoint) => void;
}) {
  const resolved = visualState === "resolved";
  const materializing = visualState === "solution";
  const stateLabel = resolved
    ? painPoint.resolvedLabel ?? "Pressure relieved"
    : painPoint.kicker ?? (visualState === "constraint"
      ? "Constraint"
      : materializing
        ? "AI response"
        : "Pressure surfaces");
  const content = (
    <>
      <span className="cutaway-callout-kicker">
        <i aria-hidden="true" />
        {stateLabel}
      </span>
      <strong>{painPoint.title}</strong>
      <span className="cutaway-callout-detail">{painPoint.detail}</span>
      {painPoint.value ? <b>{painPoint.value}</b> : null}
    </>
  );

  const className = `cutaway-callout-card cutaway-severity-${painPoint.severity ?? "pressure"}${active ? " is-active" : ""}${resolved ? " is-resolved" : ""}${materializing ? " is-materializing" : ""}`;
  return onSelect ? (
    <button
      type="button"
      className={className}
      data-state={visualState}
      onClick={() => onSelect(painPoint)}
      aria-label={`${stateLabel}: ${painPoint.title}`}
      aria-pressed={active}
    >
      {content}
    </button>
  ) : (
    <div className={className} data-state={visualState}>{content}</div>
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
  materializingLever,
  storyBeat = "reveal",
  focusStage: explicitFocusStage,
  focusAnchor: explicitFocusAnchor,
  cameraTarget,
  dashboardStage,
  focusLabel,
}: HospitalCutawayProps) {
  const descriptionId = useId();
  const [rendererMode, setRendererMode] = useState<HospitalRendererMode>(resolveHospitalRendererMode);
  const fallbackTo2D = useCallback((reason: string) => {
    latchRendererFallback(reason);
    setRendererMode("2d");
  }, []);
  const is3D = rendererMode !== "2d";
  // Re-render the overlay whenever the 3D camera publishes new projections so
  // zone labels, beacons, and callout leaders stay attached through tweens.
  useSyncExternalStore(subscribeProjectedAnchors, projectedAnchorsVersion);
  const projected = useCallback(
    (key: string, fallback: CutawayAnchor): CutawayAnchor => {
      if (!is3D) return fallback;
      return projectedAnchor(key) ?? fallback;
    },
    [is3D],
  );
  const activeSet = useMemo(() => new Set(activeLevers), [activeLevers]);
  const visualSet = useMemo(() => {
    const next = new Set(activeLevers);
    if (materializingLever) next.add(materializingLever);
    return next;
  }, [activeLevers, materializingLever]);
  const presentedPainPoints = useMemo(
    () => (painPoints ?? buildAutomaticPainPoints(simulation)).filter((painPoint) => painPoint.visible !== false).slice(0, 3),
    [painPoints, simulation],
  );
  const activeNames = activeLevers.map((lever) => LEVER_META[lever].name);
  const constraintStage = dashboardStage ?? simulation.constraint;
  const constraint = simulation.stageResults[constraintStage];
  const systemConstraintAnchor = STAGE_ANCHORS[constraintStage].anchor;
  const visualStateById = useMemo(
    () => new Map(presentedPainPoints.map((painPoint) => [
      painPoint.id,
      inferVisualState(painPoint, activeSet, materializingLever, constraintStage),
    ])),
    [activeSet, constraintStage, materializingLever, presentedPainPoints],
  );
  const activePainPoint = presentedPainPoints.find((painPoint) => painPoint.id === activePainPointId);
  const primaryPainPoint = activePainPoint
    ?? presentedPainPoints.find((painPoint) => visualStateById.get(painPoint.id) === "solution")
    ?? presentedPainPoints.find((painPoint) => visualStateById.get(painPoint.id) === "constraint")
    ?? presentedPainPoints[0];
  const outgoingResolvedPainPoint = storyBeat === "reveal"
    ? presentedPainPoints.find((painPoint) => (
      painPoint.id !== primaryPainPoint?.id && visualStateById.get(painPoint.id) === "resolved"
    ))
    : undefined;
  // Two cards exist only for the backwards-compatible reveal handoff. CSS makes
  // them temporally exclusive: resolved exits, the scene exhales, then the new
  // constraint enters. Every other beat renders one foreground proposition.
  const foregroundPainPoints = [outgoingResolvedPainPoint, primaryPainPoint]
    .filter((painPoint): painPoint is HospitalPainPoint => Boolean(painPoint));
  const storyFocus = primaryPainPoint;
  const constraintAnchor = explicitFocusAnchor ?? storyFocus?.anchor ?? systemConstraintAnchor;
  const focusStage = explicitFocusStage ?? storyFocus?.stage ?? constraintStage;
  const focusVisualState = (storyFocus ? visualStateById.get(storyFocus.id) : undefined) ?? "constraint";
  const cameraPoseId: WorldPoseId = storyBeat === "surface"
    ? "overview"
    : isAutomationFocused(primaryPainPoint, materializingLever)
      ? "automation"
      : focusStage;
  const throughputDelta = baseline ? simulation.completed - baseline.completed : undefined;
  const flowYield = Math.round((simulation.completed / simulation.episodes) * 1_000) / 10;
  const baselineFlowYield = baseline ? Math.round((baseline.completed / baseline.episodes) * 1_000) / 10 : undefined;
  const flowYieldDelta = baselineFlowYield === undefined ? undefined : Math.round((flowYield - baselineFlowYield) * 10) / 10;
  const journeyDelta = baseline ? simulation.medianJourneyDays - baseline.medianJourneyDays : undefined;
  const touchesDelta = baseline ? simulation.administrativeTouches - baseline.administrativeTouches : undefined;
  const cameraAnchor = cameraTarget ?? constraintAnchor;
  const mobileFocusX = cameraAnchor.x;
  const mobileVisibleWorld = (1.15 / (16 / 9)) * 100;
  const mobileCameraShift = Math.max(
    0,
    Math.min(100 - mobileVisibleWorld, mobileFocusX - mobileVisibleWorld / 2),
  );
  const desktopCameraPanX = (50 - cameraAnchor.x) * 0.04;
  const desktopCameraPanY = (50 - cameraAnchor.y) * 0.04;
  const mobilePainPoints = foregroundPainPoints;

  return (
    <section
      className={`hospital-cutaway ${isPlaying ? "is-playing" : "is-paused"} ${className}`.trim()}
      data-connected={visualSet.has("automation") ? "true" : "false"}
      data-robotics={visualSet.has("robotics") ? "true" : "false"}
      data-diagnosis={visualSet.has("diagnosis") ? "true" : "false"}
      data-longitudinal={visualSet.has("longitudinal") ? "true" : "false"}
      data-focus={focusStage}
      data-focus-kind={focusVisualState === "pressure" ? "pain" : focusVisualState}
      data-story-beat={storyBeat}
      data-resolved-handoff={outgoingResolvedPainPoint ? "true" : "false"}
      data-materializing-lever={materializingLever ?? "none"}
      data-renderer={rendererMode}
      style={{
        "--story-color": materializingLever ? LEVER_META[materializingLever].color : "#5bf0c3",
      } as SceneStyle}
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
          "--mobile-camera-shift": is3D ? "0%" : `-${mobileCameraShift.toFixed(2)}%`,
          "--camera-pan-x": is3D ? "0%" : `${desktopCameraPanX.toFixed(2)}%`,
          "--camera-pan-y": is3D ? "0%" : `${desktopCameraPanY.toFixed(2)}%`,
        } as SceneStyle}
      >
        <div className="cutaway-world">
          {rendererMode === "2d" ? (
            <CutawayScene2D visualSet={visualSet} />
          ) : (
            <SceneErrorBoundary onError={fallbackTo2D}>
              <Suspense fallback={<CutawayScene2D visualSet={visualSet} />}>
                <CutawayScene3D
                  tier={rendererMode}
                  poseId={cameraPoseId}
                  onFallback={fallbackTo2D}
                  scene={{
                    simulation,
                    activeLevers,
                    painPoints,
                    isPlaying,
                    materializingLever,
                    storyBeat,
                    focusStage,
                    focusAnchor: constraintAnchor,
                    cameraTarget: cameraAnchor,
                    dashboardStage: constraintStage,
                  }}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}

          <div className="cutaway-zone-labels" aria-hidden="true">
            {ZONE_LABELS.map((zone) => {
              const position = projected(`zone-${zone.id}`, { x: zone.x, y: zone.y });
              return (
                <span
                  key={zone.label}
                  className={`cutaway-zone-${zone.id}`}
                  style={{ "--x": `${position.x.toFixed(2)}%`, "--y": `${position.y.toFixed(2)}%` } as SceneStyle}
                >
                  {zone.label}
                </span>
              );
            })}
          </div>

          <div className="cutaway-lever-layer" aria-label="AI lever locations">
            {LEVER_SEQUENCE.map((lever) => {
              const beacon = projected(LEVER_WORLD_ANCHORS[lever], LEVER_BEACONS[lever]);
              const active = activeSet.has(lever);
              const materializing = materializingLever === lever;
              return (
                <span
                  key={lever}
                  className={`cutaway-lever-beacon cutaway-lever-${lever} ${active ? "is-live" : ""}${materializing ? " is-materializing" : ""}`}
                  style={{
                    "--x": `${beacon.x.toFixed(2)}%`,
                    "--y": `${beacon.y.toFixed(2)}%`,
                    "--lever-color": LEVER_META[lever].color,
                  } as SceneStyle}
                  aria-label={`${LEVER_META[lever].name}: ${active ? "active" : materializing ? "materializing" : "waiting"}`}
                >
                  <i aria-hidden="true" />
                  <b>{LEVER_META[lever].monogram}</b>
                </span>
              );
            })}
          </div>

          <div className="cutaway-callout-layer">
            {foregroundPainPoints.map((painPoint) => {
              const card = painPoint.callout ?? defaultCallout(painPoint.anchor);
              const visualState = visualStateById.get(painPoint.id) ?? "pressure";
              const resolved = visualState === "resolved";
              const anchorKey = isAutomationFocused(painPoint, materializingLever)
                ? "automation"
                : painPoint.stage ?? "access";
              const anchorPosition = projected(anchorKey, painPoint.anchor);
              return (
                <div
                  key={painPoint.id}
                  className={`cutaway-callout${painPoint.id === activePainPointId ? " is-active-callout" : ""}`}
                  data-state={visualState}
                  style={{
                    "--anchor-x": `${anchorPosition.x.toFixed(2)}%`,
                    "--anchor-y": `${anchorPosition.y.toFixed(2)}%`,
                    "--card-x": `${card.x}%`,
                    "--card-y": `${card.y}%`,
                    "--story-color": painPoint.resolvedBy ? LEVER_META[painPoint.resolvedBy].color : "#ff716d",
                  } as SceneStyle}
                >
                  <span className={`cutaway-anchor ${resolved ? "is-resolved" : ""}`} data-state={visualState} aria-hidden="true"><i /></span>
                  <PainPointCard
                    painPoint={painPoint}
                    active={painPoint.id === activePainPointId}
                    visualState={visualState}
                    onSelect={onPainPointSelect}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="cutaway-mobile-focus" data-state={focusVisualState} aria-hidden="true"><span>{focusLabel ?? constraintLabel}</span><strong>{constraint.shortName}</strong></div>

        {rendererMode === "2d" && rendererFallbackReason() ? (
          <div
            className="cutaway-renderer-notice"
            data-fallback-reason={rendererFallbackReason()}
            title={rendererFallbackReason()}
          >
            3D view unavailable — showing the 2D cutaway
          </div>
        ) : null}
      </div>

      <section className="cutaway-flow-dashboard" aria-label="Patient flow dashboard">
        <header className="cutaway-flow-dashboard-header">
          <div>
            <span className="cutaway-flow-kicker"><i aria-hidden="true" /> Patient flow</span>
            <strong aria-label={`${simulation.completed} of ${simulation.episodes} episodes completed`}>
              {simulation.completed} / {simulation.episodes}
            </strong>
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
            <dt>Patients fully served</dt>
            <dd>{flowYield}%</dd>
            <small className={deltaClass(flowYieldDelta, true)}>{describeYieldDelta(flowYieldDelta)}</small>
          </div>
          <div>
            <dt>Arrival to home</dt>
            <dd>{simulation.medianJourneyDays} {simulation.medianJourneyDays === 1 ? "day" : "days"}</dd>
            <small className={deltaClass(journeyDelta, false)}>{describeJourneyDelta(journeyDelta)}</small>
          </div>
          <div>
            <dt>Waiting at once</dt>
            <dd>{constraint.peakQueue}</dd>
            <small>{constraint.shortName} stage</small>
          </div>
          <div>
            <dt>Handoffs per patient</dt>
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
            visualState={visualStateById.get(painPoint.id) ?? "pressure"}
            onSelect={onPainPointSelect}
          />
        ))}
      </div>

      <p id={descriptionId} className="cutaway-sr-only">
        A moving cutaway view of a regional medical center shows the parking and valet approach, patient arrivals,
        an ambulance entering emergency care, diagnostic imaging, robotic operating rooms, inpatient beds,
        caregivers, patients, and discharge flow. The current simulation has {simulation.completed} completed
        episodes, a median journey of {simulation.medianJourneyDays} days from arrival to home, and {simulation.administrativeTouches}{" "}
        staff handoffs per patient. The dashboard focus is {constraint.name}; the modeled system constraint is{" "}
        {simulation.stageResults[simulation.constraint].name}.
        {primaryPainPoint ? ` The foreground ${focusVisualState} is: ${primaryPainPoint.title} ${primaryPainPoint.detail}` : ""}{" "}
        Active AI levers are
        {activeNames.length ? ` ${activeNames.join(", ")}.` : " none."} Motion is illustrative; performance is
        communicated by the simulation metrics and queue callouts, not animation speed.
      </p>
    </section>
  );
}
