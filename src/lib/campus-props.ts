import { WORLD_HELIPAD, WORLD_ANCHORS, WORLD_SURFACES, type Vec3 } from "./hospital-world.ts";

/**
 * Shared campus-prop layout and deterministic schedules — the single source of
 * truth for the lake, parked cars, the quad-stretcher run, and the motorboat.
 * Both the 3D components and the master interaction QA import from here so the
 * check always reflects what actually renders.
 */

/**
 * A small lake on the east side, between the helipad (north) and the highway
 * (south). Its east edge runs off the map, implying a broader body of water
 * the viewer can't see. Nothing else occupies this footprint.
 */
export const WORLD_LAKE = { min: [32, 0, -20] as Vec3, max: [60, 0.12, 6] as Vec3 };

export function inLake(x: number, z: number, margin = 0): boolean {
  return (
    x >= WORLD_LAKE.min[0] - margin && x <= WORLD_LAKE.max[0] + margin
    && z >= WORLD_LAKE.min[2] - margin && z <= WORLD_LAKE.max[2] + margin
  );
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
 * the visible lake, and heads back off the east edge. */
export const BOAT_PERIOD = 7;

export interface BoatState {
  x: number;
  z: number;
  /** Yaw around +y from the travel direction. */
  heading: number;
  visible: boolean;
}

function ease(v: number): number {
  return v * v * (3 - 2 * v);
}

export function boatState(elapsed: number): BoatState {
  const t = ((elapsed % BOAT_PERIOD) + BOAT_PERIOD) % BOAT_PERIOD;
  // heading is the yaw applied directly to a hull modeled along +x:
  // PI faces -x (inbound), 0 faces +x (outbound).
  const enterX = 60;
  const innerX = 41;
  let x = enterX;
  let z = -3;
  let heading = Math.PI;
  if (t < 3) {
    const p = ease(t / 3);
    x = enterX - (enterX - innerX) * p;
    z = -3 - 2 * p;
    heading = Math.PI;
  } else if (t < 4) {
    const p = ease(t - 3);
    x = innerX + 1.5 * Math.sin(p * Math.PI);
    z = -5 + 5 * p;
    heading = Math.PI * (1 - p); // swing 180° through the U-turn
  } else {
    const p = ease((t - 4) / 3);
    x = innerX + (enterX - innerX) * p;
    z = 0 + 2 * p;
    heading = 0;
  }
  return { x, z, heading, visible: x < enterX - 1 };
}
