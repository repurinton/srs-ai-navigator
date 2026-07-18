import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "evals/hospital-motion-routes.json"), "utf8"));
const css = fs.readFileSync(path.join(root, "src/components/HospitalCutaway.css"), "utf8");
const component = fs.readFileSync(path.join(root, "src/components/CutawayScene2D.tsx"), "utf8");

assert.equal(manifest.schemaVersion, "1.0.0");
assert.ok(css.includes("container-type: size;"), "The cutaway world must establish scene-relative container units");
assert.equal(manifest.routes.length, 14, "Every entity pathway must have an explicit route contract");

let actorCount = 0;
for (const route of manifest.routes) {
  const start = css.indexOf(`@keyframes cutaway-${route.id}-route`);
  assert.ok(start >= 0, `${route.id} must have a CSS keyframe route`);
  const next = css.indexOf("@keyframes", start + 12);
  const block = css.slice(start, next >= 0 ? next : undefined);
  assert.ok(!/translate3d\([^)]*%/u.test(block), `${route.id} cannot use actor-relative transform percentages`);

  const points = [...block.matchAll(/translate3d\((-?[\d.]+)cqi,\s*(-?[\d.]+)cqb,\s*0\)/gu)]
    .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
  assert.ok(points.length >= 2, `${route.id} must expose at least two scene-relative waypoints`);

  for (const point of points) {
    assert.ok(point.x >= route.xRange[0] && point.x <= route.xRange[1], `${route.id} x=${point.x} left its approved ${route.surface} corridor`);
    assert.ok(point.y >= route.yRange[0] && point.y <= route.yRange[1], `${route.id} y=${point.y} left its approved ${route.surface} corridor`);
  }

  let maximumTravel = 0;
  for (const left of points) {
    for (const right of points) maximumTravel = Math.max(maximumTravel, Math.hypot(right.x - left.x, right.y - left.y));
  }
  assert.ok(maximumTravel >= route.minimumTravel, `${route.id} must visibly travel at least ${route.minimumTravel}% of the scene`);

  const escapedId = route.id.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const actorPattern = new RegExp(`(?:route="${escapedId}"|routeClassName="cutaway-route-${escapedId}")`, "gu");
  const renderedActors = [...component.matchAll(actorPattern)].length;
  assert.equal(renderedActors, route.actors, `${route.id} must render ${route.actors} independently phased actors`);
  actorCount += renderedActors;
}

assert.equal(actorCount, manifest.requiredActorCount, `Expected ${manifest.requiredActorCount} moving entities, found ${actorCount}`);
console.log(`Hospital motion contract passed: ${manifest.routes.length} background-relative routes / ${actorCount} independently phased entities.`);
