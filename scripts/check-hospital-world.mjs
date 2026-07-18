import assert from "node:assert/strict";
import {
  WORLD_ANCHORS,
  WORLD_CAMERA_POSES,
  WORLD_GROUND,
  WORLD_ROUTES,
  WORLD_ZONE_LABEL_ANCHORS,
  WORLD_ZONES,
} from "../src/lib/hospital-world.ts";

const STAGE_IDS = ["access", "diagnosis", "precision", "readiness", "robotics", "care", "longitudinal"];
const REQUIRED_ZONES = [...STAGE_IDS, "ems", "home"];
const REQUIRED_ANCHORS = [...STAGE_IDS, "automation", "ems", "home"];
const REQUIRED_POSES = [...STAGE_IDS, "automation", "overview"];
const ZONE_LABEL_IDS = ["imaging", "robotics", "recovery", "emergency", "arrivals"];

function inside(point, min, max, slack = 0) {
  return (
    point[0] >= min[0] - slack && point[0] <= max[0] + slack
    && point[2] >= min[2] - slack && point[2] <= max[2] + slack
  );
}

// Every required zone exists with non-degenerate bounds inside the ground.
for (const id of REQUIRED_ZONES) {
  const zone = WORLD_ZONES[id];
  assert.ok(zone, `Zone ${id} must exist in the world manifest`);
  for (const axis of [0, 1, 2]) {
    assert.ok(zone.max[axis] - zone.min[axis] > 1, `Zone ${id} must have non-degenerate bounds on axis ${axis}`);
  }
  assert.ok(
    inside(zone.min, WORLD_GROUND.min, WORLD_GROUND.max) && inside(zone.max, WORLD_GROUND.min, WORLD_GROUND.max),
    `Zone ${id} must sit on the campus ground plane`,
  );
}

// Every semantic anchor exists; stage anchors sit over their zone footprint.
for (const id of REQUIRED_ANCHORS) {
  const anchor = WORLD_ANCHORS[id];
  assert.ok(anchor, `Anchor ${id} must exist`);
  const zone = WORLD_ZONES[id];
  if (zone) {
    assert.ok(
      inside(anchor, zone.min, zone.max, 1),
      `Anchor ${id} must project over its zone footprint`,
    );
  }
}

// Camera poses cover every story focus, plus the overview and automation.
for (const id of REQUIRED_POSES) {
  const pose = WORLD_CAMERA_POSES[id];
  assert.ok(pose, `Camera pose ${id} must exist`);
  assert.ok(pose.zoom > 0, `Camera pose ${id} must have positive zoom`);
  assert.ok(
    inside(pose.target, WORLD_GROUND.min, WORLD_GROUND.max, 10),
    `Camera pose ${id} target must be on or near the campus`,
  );
}

// Zone labels the DOM overlay projects all have world points.
for (const id of ZONE_LABEL_IDS) {
  assert.ok(WORLD_ZONE_LABEL_ANCHORS[id], `Zone label anchor ${id} must exist`);
}

// Route endpoints on open routes must start or end at the campus edge or a
// zone/portal, and every route must have at least two waypoints.
assert.ok(WORLD_ROUTES.length >= 14, "The world must declare at least the 14 canonical route families");
for (const route of WORLD_ROUTES) {
  assert.ok(route.points.length >= 2, `Route ${route.id} needs at least two waypoints`);
  assert.ok(route.duration >= 6 && route.duration <= 24, `Route ${route.id} duration must stay in the executive pacing band`);
}

console.log(
  `Hospital world manifest passed: ${Object.keys(WORLD_ZONES).length} zones, `
  + `${Object.keys(WORLD_ANCHORS).length} anchors, ${Object.keys(WORLD_CAMERA_POSES).length} camera poses, `
  + `${WORLD_ROUTES.length} routes.`,
);
