import assert from "node:assert/strict";
import { CatmullRomCurve3, Vector3 } from "three";
import { WORLD_ROUTES, WORLD_ACTORS_PER_ROUTE, WORLD_SURFACES } from "../src/lib/hospital-world.ts";
import {
  routeTimeRemap,
  parkingStalls,
  parkingAisleForRow,
  PARKING_TARGET_EMPTY,
  PARKING_ROWS,
  PARKING_AISLES,
} from "../src/lib/campus-props.ts";

/**
 * Master simulation QA: samples every deterministic movable prop over a long
 * time window and asserts the interactions read correctly — no vehicle-vehicle
 * overlaps and no moving car clipping a parked car.
 */

// ── Vehicle routes ────────────────────────────────────────────────────────────
const VEHICLE_KINDS = new Set(["car", "truck", "ambulance"]);
const curves = new Map();
function curveFor(route) {
  if (!curves.has(route.id)) {
    curves.set(route.id, new CatmullRomCurve3(route.points.map((p) => new Vector3(...p)), route.closed, "centripetal"));
  }
  return curves.get(route.id);
}
const scratch = new Vector3();
function poseOnRoute(route, phase, t) {
  const base = (((t / route.duration + phase + (route.phaseOffset ?? 0)) % 1) + 1) % 1;
  const u = routeTimeRemap(route.id, base);
  curveFor(route).getPointAt(u, scratch);
  let presence = 1;
  if (!route.closed) {
    const edge = 0.06;
    presence = Math.min(1, Math.min(u, 1 - u) / edge);
  }
  return { x: scratch.x, z: scratch.z, presence };
}

// car-parking stays in the world data for the motion/world contracts, but it
// is no longer rendered as circulating actors (the ParkingLot stall system
// replaced it), so it is excluded from the moving-vehicle spacing check.
const vehicleActors = WORLD_ROUTES
  .filter((r) => VEHICLE_KINDS.has(r.kind) && r.id !== "car-parking")
  .flatMap((route) =>
    Array.from({ length: WORLD_ACTORS_PER_ROUTE }, (_, i) => ({ route, phase: i / WORLD_ACTORS_PER_ROUTE })),
  );

const SAMPLES = [];
for (let t = 0; t < 120; t += 0.25) SAMPLES.push(t);

// 1) No two visible vehicles overlap. Combined half-widths of the widest pair
// (~1.6m); require a comfortable center gap above that.
const MIN_VEHICLE_GAP = 1.6;
let minVeh = Infinity;
let minVehWhere = "";
for (const t of SAMPLES) {
  const ps = vehicleActors
    .map((a) => ({ id: a.route.id, ...poseOnRoute(a.route, a.phase, t) }))
    .filter((p) => p.presence > 0.55);
  for (let i = 0; i < ps.length; i += 1) {
    for (let j = i + 1; j < ps.length; j += 1) {
      const d = Math.hypot(ps[i].x - ps[j].x, ps[i].z - ps[j].z);
      if (d < minVeh) {
        minVeh = d;
        minVehWhere = `${ps[i].id} vs ${ps[j].id} @t=${t.toFixed(1)}`;
      }
    }
  }
}
assert.ok(minVeh >= MIN_VEHICLE_GAP, `Vehicles overlap: min gap ${minVeh.toFixed(2)}m (${minVehWhere})`);

// 2) The live parking lot is collision-free BY CONSTRUCTION rather than by
// sampled positions (arrivals/departures are random, so exact poses vary run to
// run). We assert the invariants the ParkingLot animation relies on:
//   a) every stall centre sits inside the parking surface;
//   b) no two stalls are closer than a car footprint;
//   c) each service aisle is clear of every stall row, so a car turning in or
//      out (which only ever sits in its own stall column plus the aisle cell)
//      can never clip a parked neighbour;
//   d) the empty-stall target is a sane fraction of the lot.
const stalls = parkingStalls();
const lot = WORLD_SURFACES.parking;
for (const stall of stalls) {
  assert.ok(
    stall.x >= lot.min[0] && stall.x <= lot.max[0] && stall.z >= lot.min[2] && stall.z <= lot.max[2],
    `Parking stall @(${stall.x},${stall.z}) sits outside the parking surface`,
  );
}
const MIN_STALL_GAP = 3.0;
let minStall = Infinity;
for (let i = 0; i < stalls.length; i += 1) {
  for (let j = i + 1; j < stalls.length; j += 1) {
    minStall = Math.min(minStall, Math.hypot(stalls[i].x - stalls[j].x, stalls[i].z - stalls[j].z));
  }
}
assert.ok(minStall >= MIN_STALL_GAP, `Parking stalls too close: min centre gap ${minStall.toFixed(2)}m`);

// Combined half-extents of a moving car (width) and a parked car (length) is
// ~1.63m; require every aisle to clear every row by more than that.
const AISLE_ROW_CLEAR = 2.0;
for (const aisle of PARKING_AISLES) {
  for (const row of PARKING_ROWS) {
    assert.ok(
      Math.abs(row - aisle) >= AISLE_ROW_CLEAR,
      `Aisle z=${aisle} runs too close to stall row z=${row} (${Math.abs(row - aisle).toFixed(2)}m)`,
    );
  }
}
// Every row must be served by a defined aisle.
for (let row = 0; row < PARKING_ROWS.length; row += 1) {
  assert.ok(PARKING_AISLES.includes(parkingAisleForRow(row)), `Row ${row} has no valid service aisle`);
}
assert.ok(
  PARKING_TARGET_EMPTY >= 1 && PARKING_TARGET_EMPTY < stalls.length,
  `Parking empty-target ${PARKING_TARGET_EMPTY} out of range for ${stalls.length} stalls`,
);

console.log(
  `Hospital interaction QA passed: ${vehicleActors.length} vehicles (min gap ${minVeh.toFixed(2)}m), `
  + `${stalls.length}-stall live lot (min stall gap ${minStall.toFixed(2)}m, ${PARKING_TARGET_EMPTY} empty target).`,
);
