import { WORLD_HELIPAD, WORLD_ANCHORS, WORLD_SURFACES, type Vec3 } from "./hospital-world.ts";

/**
 * Shared campus-prop layout and deterministic schedules — the single source of
 * truth for the lake, parked cars, the quad-stretcher run, and the motorboat.
 * Both the 3D components and the master interaction QA import from here so the
 * check always reflects what actually renders.
 */

/**
 * A small lake on the east side, between the helipad (north) and the highway
 * (south). It's an ellipse (curved, organic shoreline) whose east lobe pushes
 * past the map edge, implying a broader body of water the viewer can't see.
 * The renderer masks a plane to this ellipse; the QA uses the same test.
 */
export const WORLD_LAKE = {
  center: [52, 0.12, -7] as Vec3,
  /** Ellipse radii on x and z. */
  radius: [18, 13] as const,
  y: 0.12,
};

/** Inside the lake ellipse? `margin` shrinks (negative) or grows the boundary. */
export function inLake(x: number, z: number, margin = 0): boolean {
  const rx = WORLD_LAKE.radius[0] + margin;
  const rz = WORLD_LAKE.radius[1] + margin;
  const nx = (x - WORLD_LAKE.center[0]) / rx;
  const nz = (z - WORLD_LAKE.center[2]) / rz;
  return nx * nx + nz * nz <= 1;
}

// ── Parked cars ──────────────────────────────────────────────────────────────
export const PARKED_CAR_COLORS = [
  "#8fa2b3", "#c7cfd6", "#4f6f8f", "#b5493f", "#5e768a",
  "#e6e9ec", "#3a4b57", "#c9b283", "#6d8a7d", "#7f6f9a",
];

/** Rows sit clear of the two moving aisles (z 23.75 / 29.25); the lot's x-ends
 * stay empty so the circulation loop can turn without hitting a parked car. */
export const PARKING_ROWS = [21, 26.5, 32] as const;
export const PARKING_AISLES = [23.75, 29.25] as const;

export interface ParkedSlot { x: number; z: number; color: string }

export function parkedCarSlots(): ParkedSlot[] {
  const p = WORLD_SURFACES.parking;
  const stride = 3.1;
  const xStart = p.min[0] + 4; // leave the west end clear for the loop turn
  const xEnd = p.max[0] - 6; // leave the east end clear for the loop turn
  const slots: ParkedSlot[] = [];
  let paint = 0;
  PARKING_ROWS.forEach((z, row) => {
    for (let x = xStart; x <= xEnd; x += stride) {
      if ((Math.round((x - xStart) / stride) + row) % 4 === 3) continue; // gaps
      slots.push({ x, z, color: PARKED_CAR_COLORS[paint % PARKED_CAR_COLORS.length] });
      paint += 1;
    }
  });
  return slots;
}

// ── Quad-stretcher run (rerouted around the lake) ────────────────────────────
/**
 * Pad → west along the pad's south edge (north of the lake) → south down the
 * lake's west side to the front apron → west along the apron → north into the
 * ED's open south face. Never touches the lake or the highway.
 */
export const STRETCHER_PATH: Vec3[] = [
  [WORLD_HELIPAD.center[0], 0.45, WORLD_HELIPAD.center[2] + 2],
  [28, 0.45, WORLD_HELIPAD.center[2] + 2],
  [28, 0.45, 8],
  [WORLD_ANCHORS.ems[0], 0.45, 8],
  [WORLD_ANCHORS.ems[0], 0.45, -2],
];

// ── Motorboat ────────────────────────────────────────────────────────────────
/** Every BOAT_PERIOD seconds the boat noses in from the east edge, U-turns on
 * the visible lake, runs a maneuver that varies each cycle, and heads back
 * off the east edge. */
export const BOAT_PERIOD = 9;

export interface BoatState {
  x: number;
  z: number;
  /** Yaw around +y (continuous within a cycle so the QA can measure the turn). */
  heading: number;
  visible: boolean;
}

function ease(v: number): number {
  return v * v * (3 - 2 * v);
}

/** Deterministic per-cycle hash in [0,1). */
function boatHash(n: number): number {
  const s = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return s - Math.floor(s);
}

// ── Route speed easing ───────────────────────────────────────────────────────
/**
 * Campus loops shouldn't glide at constant speed — vehicles should slow into
 * turns/drop-offs and pick up on the straights. This monotonic time remap adds
 * a slow-fast pulse to those loops (keeps derivative > 0 so motion never
 * reverses). Shared by RouteRunner and the interaction QA so the check always
 * matches what renders. Through-lanes/truck are left constant so the tuned
 * far-west ambulance crossing stays predictable.
 */
const LOOP_EASE: Record<string, { n: number; amp: number }> = {
  "car-dropoff": { n: 2, amp: 0.38 },
  "car-parking": { n: 2, amp: 0.3 },
  ambulance: { n: 1, amp: 0.22 },
};

export function routeTimeRemap(routeId: string, u: number): number {
  const e = LOOP_EASE[routeId];
  if (!e) return u;
  const r = u - (e.amp * Math.sin(2 * Math.PI * e.n * u)) / (2 * Math.PI * e.n);
  return ((r % 1) + 1) % 1;
}

// heading is the yaw applied to a hull modeled along +x: PI faces -x
// (inbound), 0 faces +x (outbound). All maneuvers stay inside the ellipse.
const BOAT_EDGE_X = 62; // off-map entry/exit
const BOAT_ENTER_S = 2;
const BOAT_EXIT_S = 2;

export function boatState(elapsed: number): BoatState {
  const cycle = Math.floor(elapsed / BOAT_PERIOD);
  const t = elapsed - cycle * BOAT_PERIOD;
  const maneuver = Math.floor(boatHash(cycle) * 3); // 0 U-turn, 1 J-turn, 2 double loop
  const innerX = 42 + boatHash(cycle + 7) * 5; // vary how far it comes in
  const laneZ = -8 + boatHash(cycle + 3) * 7; // vary the approach lane (-8..-1)
  const mdur = maneuver === 2 ? 4.6 : maneuver === 0 ? 1.6 : 1.3;

  const enterEnd = BOAT_ENTER_S;
  const manEnd = enterEnd + mdur;
  const exitEnd = manEnd + BOAT_EXIT_S;

  let x = BOAT_EDGE_X;
  let z = laneZ;
  let heading = Math.PI;

  if (t < enterEnd) {
    const p = ease(t / enterEnd);
    x = BOAT_EDGE_X - (BOAT_EDGE_X - innerX) * p;
    z = laneZ - 2 * p;
    heading = Math.PI;
  } else if (t < manEnd) {
    const p = (t - enterEnd) / mdur;
    if (maneuver === 0) {
      // U-turn: 180° swing on a tight arc.
      x = innerX + 2.0 * Math.sin(p * Math.PI);
      z = laneZ - 2 + 5 * ease(p);
      heading = Math.PI * (1 - ease(p));
    } else if (maneuver === 1) {
      // J-turn: hook ~135° with a lateral kick.
      x = innerX + 3.0 * Math.sin(p * Math.PI) * (1 - 0.4 * p);
      z = laneZ - 2 + 6 * ease(p);
      heading = Math.PI - (Math.PI * 0.78) * ease(p);
    } else {
      // Double loop: two full circles before exiting.
      const cx = innerX + 3.5;
      const cz = laneZ + 1;
      const ang = -Math.PI / 2 + p * (4 * Math.PI); // two revolutions
      x = cx + 3.6 * Math.cos(ang);
      z = cz + 3.2 * Math.sin(ang);
      heading = ang + Math.PI / 2;
    }
  } else if (t < exitEnd) {
    const p = ease((t - manEnd) / BOAT_EXIT_S);
    const startX = maneuver === 2 ? innerX + 3.5 : innerX + 1.5;
    x = startX + (BOAT_EDGE_X - startX) * p;
    z = (laneZ + 3) - 1 * (1 - p);
    heading = 0;
  } else {
    x = BOAT_EDGE_X;
    z = laneZ + 3;
    heading = 0;
  }

  return { x, z, heading, visible: x < BOAT_EDGE_X - 3 };
}
