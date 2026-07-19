import assert from "node:assert/strict";
import { CatmullRomCurve3, Vector3 } from "three";
import { WORLD_ROUTES, WORLD_ACTORS_PER_ROUTE } from "../src/lib/hospital-world.ts";
import {
  WORLD_LAKE,
  STRETCHER_PATH,
  boatState,
  BOAT_PERIOD,
  parkedCarSlots,
  inLake,
  routeTimeRemap,
} from "../src/lib/campus-props.ts";

/**
 * Master simulation QA: samples every deterministic movable prop over a long
 * time window and asserts the interactions read correctly — no vehicle-vehicle
 * overlaps, no moving car clipping a parked car, the quad stretcher never
 * crosses the lake, and the motorboat stays on the lake and completes a U-turn.
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

const vehicleActors = WORLD_ROUTES.filter((r) => VEHICLE_KINDS.has(r.kind)).flatMap((route) =>
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

// 2) The moving parking car never clips a parked car. Parked cars sit long-axis
// along z (half-length 1.1); the aisle car is long-axis along x. Require the
// center distance to clear their combined footprint.
const parked = parkedCarSlots();
const parkingRoute = WORLD_ROUTES.find((r) => r.id === "car-parking");
assert.ok(parkingRoute, "car-parking route must exist");
const MIN_PARK_GAP = 1.6;
let minPark = Infinity;
let minParkWhere = "";
for (const t of SAMPLES) {
  for (let i = 0; i < WORLD_ACTORS_PER_ROUTE; i += 1) {
    const p = poseOnRoute(parkingRoute, i / WORLD_ACTORS_PER_ROUTE, t);
    for (const slot of parked) {
      const d = Math.hypot(p.x - slot.x, p.z - slot.z);
      if (d < minPark) {
        minPark = d;
        minParkWhere = `moving car @(${p.x.toFixed(1)},${p.z.toFixed(1)}) vs slot @(${slot.x.toFixed(1)},${slot.z.toFixed(1)}) t=${t.toFixed(1)}`;
      }
    }
  }
}
assert.ok(minPark >= MIN_PARK_GAP, `Parking-lot car clips a parked car: min gap ${minPark.toFixed(2)}m (${minParkWhere})`);

// 3) The quad stretcher run never crosses the lake. Sample densely along every
// leg (with a small margin for the stretcher's footprint).
let stretcherInLake = false;
for (let i = 1; i < STRETCHER_PATH.length; i += 1) {
  const [ax, , az] = STRETCHER_PATH[i - 1];
  const [bx, , bz] = STRETCHER_PATH[i];
  for (let s = 0; s <= 1; s += 0.02) {
    const x = ax + (bx - ax) * s;
    const z = az + (bz - az) * s;
    if (inLake(x, z, 0.8)) stretcherInLake = true;
  }
}
assert.ok(!stretcherInLake, "Quad stretcher path crosses the lake");

// 4) The motorboat stays on the lake (ellipse) whenever visible, and each
// cycle it enters, turns (heading changes ≥90°), and exits. Maneuvers vary
// per cycle (U-turn / J-turn / double-loop), so we check many cycles and
// confirm at least two distinct turn magnitudes appear.
let boatOffLake = false;
const turnMagnitudes = [];
for (let cycle = 0; cycle < 12; cycle += 1) {
  let minH = Infinity;
  let maxH = -Infinity;
  let sawVisible = false;
  let enteredDeep = false;
  for (let s = 0; s < BOAT_PERIOD; s += 0.05) {
    const b = boatState(cycle * BOAT_PERIOD + s);
    if (b.visible) {
      sawVisible = true;
      if (!inLake(b.x, b.z, 1.2)) boatOffLake = true;
      minH = Math.min(minH, b.heading);
      maxH = Math.max(maxH, b.heading);
      if (b.x < 50) enteredDeep = true; // came in from the edge
    }
  }
  assert.ok(sawVisible, `Motorboat cycle ${cycle} is never visible`);
  assert.ok(enteredDeep, `Motorboat cycle ${cycle} never enters the visible lake`);
  const turn = maxH - minH;
  assert.ok(turn >= Math.PI / 2 - 0.1, `Motorboat cycle ${cycle} barely turns (${turn.toFixed(2)} rad)`);
  turnMagnitudes.push(turn);
}
assert.ok(!boatOffLake, "Motorboat leaves the lake footprint while visible");
const distinctTurns = new Set(turnMagnitudes.map((t) => Math.round(t))).size;
assert.ok(distinctTurns >= 2, "Motorboat maneuvers must vary across cycles");

console.log(
  `Hospital interaction QA passed: ${vehicleActors.length} vehicles (min gap ${minVeh.toFixed(2)}m), `
  + `${parked.length} parked cars (moving-car min gap ${minPark.toFixed(2)}m), `
  + `stretcher clear of lake, motorboat varies its maneuver and stays on the lake.`,
);
