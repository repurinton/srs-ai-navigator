import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORLD_ACTORS_PER_ROUTE, WORLD_ROUTES } from "../src/lib/hospital-world.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "evals/hospital-motion-routes-3d.json"), "utf8"));

assert.equal(manifest.schemaVersion, "1.0.0");
assert.equal(manifest.actorsPerRoute, WORLD_ACTORS_PER_ROUTE, "Actor phasing must match the eval contract");
assert.equal(
  WORLD_ROUTES.length * WORLD_ACTORS_PER_ROUTE,
  manifest.requiredActorCount,
  "The route families must produce the contracted actor count",
);

const contractById = new Map(manifest.routes.map((route) => [route.id, route]));
assert.equal(contractById.size, manifest.routes.length, "Contract route ids must be unique");
assert.equal(WORLD_ROUTES.length, manifest.routes.length, "World routes and contract must agree on family count");

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay, az] = points[i - 1];
    const [bx, by, bz] = points[i];
    total += Math.hypot(bx - ax, by - ay, bz - az);
  }
  return total;
}

for (const route of WORLD_ROUTES) {
  const contract = contractById.get(route.id);
  assert.ok(contract, `Route ${route.id} must be declared in the 3D motion contract`);
  assert.equal(route.kind, contract.kind, `Route ${route.id} kind must match the contract`);

  const { min, max } = contract.corridor;
  for (const [index, point] of route.points.entries()) {
    assert.ok(
      point[0] >= min[0] && point[0] <= max[0]
      && point[1] >= min[1] && point[1] <= max[1]
      && point[2] >= min[2] && point[2] <= max[2],
      `Route ${route.id} waypoint ${index} must stay inside its authored corridor`,
    );
  }

  const travel = polylineLength(route.closed ? [...route.points, route.points[0]] : route.points);
  assert.ok(
    travel >= contract.minimumTravelMeters,
    `Route ${route.id} must travel at least ${contract.minimumTravelMeters}m (got ${travel.toFixed(1)}m)`,
  );
}

console.log(
  `Hospital 3D motion contract passed: ${WORLD_ROUTES.length} world-space routes / `
  + `${WORLD_ROUTES.length * WORLD_ACTORS_PER_ROUTE} independently phased entities.`,
);
