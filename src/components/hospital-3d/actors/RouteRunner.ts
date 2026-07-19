import { CatmullRomCurve3, Vector3 } from "three";
import { WORLD_ACTORS_PER_ROUTE, WORLD_ROUTES, type WorldRoute } from "@/lib/hospital-world";
import { routeTimeRemap } from "@/lib/campus-props";

export interface RouteActor {
  route: WorldRoute;
  /** Fraction of the route duration this actor is offset by. */
  phase: number;
}

export interface ActorPose {
  position: Vector3;
  /** Heading angle around +y, derived from the curve tangent. */
  heading: number;
  /** 0..1 visibility scale; open routes fade at their ends. */
  presence: number;
}

const curves = new Map<string, CatmullRomCurve3>();

function curveFor(route: WorldRoute): CatmullRomCurve3 {
  let curve = curves.get(route.id);
  if (!curve) {
    curve = new CatmullRomCurve3(
      route.points.map((p) => new Vector3(p[0], p[1], p[2])),
      route.closed,
      "centripetal",
    );
    curves.set(route.id, curve);
  }
  return curve;
}

/** All 28 route actors: two per family, phased half a cycle apart. */
export function buildRouteActors(): RouteActor[] {
  return WORLD_ROUTES.flatMap((route) =>
    Array.from({ length: WORLD_ACTORS_PER_ROUTE }, (_, index) => ({
      route,
      phase: index / WORLD_ACTORS_PER_ROUTE,
    })),
  );
}

const scratchTangent = new Vector3();

/** Pure pose-from-time: identical input always yields the identical pose. */
export function poseOnRoute(actor: RouteActor, sceneTime: number, out: ActorPose): ActorPose {
  const { route } = actor;
  const base = ((sceneTime / route.duration + actor.phase + (route.phaseOffset ?? 0)) % 1 + 1) % 1;
  const t = routeTimeRemap(route.id, base);
  const curve = curveFor(route);
  curve.getPointAt(t, out.position);
  curve.getTangentAt(t, scratchTangent);
  out.heading = Math.atan2(scratchTangent.x, scratchTangent.z);

  if (route.closed) {
    out.presence = 1;
  } else {
    // Fade in/out across the first and last 6% so open routes respawn quietly.
    const edge = 0.06;
    out.presence = Math.min(1, Math.min(t, 1 - t) / edge);
  }
  return out;
}

/** Canonical rest time for the reduced-motion static diorama. */
export const REDUCED_MOTION_SCENE_TIME = 3.2;

/** Total polyline length in meters (used by the motion contract check). */
export function routeTravelMeters(route: WorldRoute): number {
  return curveFor(route).getLength();
}
