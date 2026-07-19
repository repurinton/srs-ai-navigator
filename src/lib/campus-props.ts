import { WORLD_HELIPAD, WORLD_ANCHORS, WORLD_SURFACES, type Vec3 } from "./hospital-world.ts";

/**
 * Shared campus-prop layout and deterministic schedules — the single source of
 * truth for the lake, parked cars, the quad-stretcher run, and the motorboat.
 * Both the 3D components and the master interaction QA import from here so the
 * check always reflects what actually renders.
 */

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
