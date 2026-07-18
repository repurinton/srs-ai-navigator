import type { CSSProperties, ReactNode } from "react";
import type { LeverId } from "@/lib/hospital-sim";

type SceneStyle = CSSProperties & Record<`--${string}`, string | number>;

/**
 * The raster-based 2D hospital scene: background image, depth light,
 * constraint halo, network lines, and every CSS-keyframe motion actor.
 * This is the fallback renderer; the world-facing DOM overlays (zone labels,
 * lever beacons, callouts) stay in HospitalCutaway and are shared with the
 * 3D renderer.
 */
export function CutawayScene2D({ visualSet }: { visualSet: ReadonlySet<LeverId> }) {
  return (
    <>
      <div className="cutaway-raster" aria-hidden="true" />
      <div className="cutaway-depth-light" aria-hidden="true" />
      <div className="cutaway-constraint-zone" aria-hidden="true"><i /></div>

      <div className="cutaway-network" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
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
        <span className={`cutaway-or-status cutaway-or-one ${visualSet.has("robotics") ? "is-live" : ""}`}><i />OR 01</span>
        <span className={`cutaway-or-status cutaway-or-two ${visualSet.has("robotics") ? "is-live" : ""}`}><i />OR 02</span>
        <span className={`cutaway-imaging-scan ${visualSet.has("diagnosis") ? "is-live" : ""}`}><i /></span>
        <span className={`cutaway-bed cutaway-bed-one ${visualSet.has("longitudinal") ? "is-clearing" : ""}`}><i /></span>
        <span className="cutaway-bed cutaway-bed-two"><i /></span>
        <span className="cutaway-bed cutaway-bed-three"><i /></span>
      </div>
    </>
  );
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
