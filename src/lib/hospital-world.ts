import type { StageId } from "./hospital-sim.ts";

/**
 * The world manifest for the 3D hospital diorama. Every position lives here
 * as data (meters, right-handed: +x east, +y up, +z south) — components never
 * hard-code coordinates. Zones map one-to-one onto simulation stages plus the
 * motion-only EMS bay and the off-campus home node.
 */

export type Vec3 = readonly [number, number, number];

export type WorldZoneId =
  | StageId
  | "ems"
  | "home";

export type WorldAnchorId = StageId | "automation" | "ems" | "home";

export type WorldPoseId = StageId | "automation" | "overview";

export interface WorldZone {
  id: WorldZoneId;
  name: string;
  /** Axis-aligned bounds: [minX, minY, minZ], [maxX, maxY, maxZ]. */
  min: Vec3;
  max: Vec3;
  /** Base architecture color for the graybox/fidelity pass. */
  color: string;
}

export interface WorldCameraPose {
  target: Vec3;
  /** Orthographic zoom at the reference viewport width (1200px). */
  zoom: number;
  /** Portrait/mobile variant; falls back to desktop values when omitted. */
  portrait?: { target: Vec3; zoom: number };
}

/** Fixed architectural camera direction (from target toward the camera). */
export const CAMERA_DIRECTION: Vec3 = [0.72, 0.78, 1];

/** Reference viewport width the pose zoom values were authored against. */
export const CAMERA_REFERENCE_WIDTH = 1200;

/** Camera move duration for reveal transitions (contract: 1.2–1.6s). */
export const CAMERA_TWEEN_SECONDS = 1.4;

export const WORLD_GROUND = { min: [-60, -1, -35] as Vec3, max: [60, 0, 35] as Vec3 };

/**
 * Three stepped clinical floor plates on an open-sided campus:
 *   ground — EMS bay, arrival/access lobby, discharge lounge
 *   floor 2 — pre-op readiness, robotic ORs, recovery ward
 *   floor 3 — diagnostics (CT + MRI), precision planning
 */
export const WORLD_ZONES: Record<WorldZoneId, WorldZone> = {
  ems: {
    id: "ems",
    name: "EMS bay",
    min: [-30, 0, -16],
    max: [-18, 4, 4],
    color: "#8e8a84",
  },
  access: {
    id: "access",
    name: "Arrival and access center",
    min: [-14, 0, -16],
    max: [2, 4, 4],
    color: "#98948d",
  },
  longitudinal: {
    id: "longitudinal",
    name: "Discharge lounge",
    min: [10, 0, -16],
    max: [26, 4, 4],
    color: "#8f8b85",
  },
  readiness: {
    id: "readiness",
    name: "Pre-op readiness",
    min: [-26, 4.5, -18],
    max: [-10, 8.5, -2],
    color: "#9a968f",
  },
  robotics: {
    id: "robotics",
    name: "Robotic operating rooms",
    min: [-6, 4.5, -18],
    max: [8, 8.5, -2],
    color: "#a19d96",
  },
  care: {
    id: "care",
    name: "Recovery ward",
    min: [12, 4.5, -18],
    max: [26, 8.5, -2],
    color: "#96928b",
  },
  // Floor three steps back (shallower z) so the camera can see into the
  // floor-two interiors below it.
  diagnosis: {
    id: "diagnosis",
    name: "Diagnostics (CT + MRI)",
    min: [-20, 9, -18],
    max: [-6, 13, -9],
    color: "#a5a19a",
  },
  precision: {
    id: "precision",
    name: "Precision planning",
    min: [-2, 9, -18],
    max: [8, 13, -9],
    color: "#9d9992",
  },
  home: {
    id: "home",
    name: "Home and longitudinal care",
    min: [40, 0, 8],
    max: [52, 3, 20],
    color: "#7f7d78",
  },
};

/** Flat campus surfaces (roads, parking, plazas) drawn on the ground plane. */
export const WORLD_SURFACES = {
  mainRoad: { min: [-60, 0, 12] as Vec3, max: [60, 0.1, 18] as Vec3 },
  arrivalLoop: { min: [-12, 0, 4] as Vec3, max: [4, 0.1, 12] as Vec3 },
  emsSpur: { min: [-46, 0, -8] as Vec3, max: [-30, 0.1, -2] as Vec3 },
  parking: { min: [-52, 0, 2] as Vec3, max: [-34, 0.1, 11] as Vec3 },
  dischargePlaza: { min: [10, 0, 4] as Vec3, max: [28, 0.1, 12] as Vec3 },
} as const;

/** Semantic world points the DOM overlay projects into screen space. */
export const WORLD_ANCHORS: Record<WorldAnchorId, Vec3> = {
  access: [-6, 3, -6],
  diagnosis: [-13, 11.5, -13],
  precision: [3, 11.5, -13],
  readiness: [-18, 7, -10],
  robotics: [1, 7, -10],
  care: [19, 7, -10],
  longitudinal: [18, 3, -6],
  automation: [10, 16, -10],
  ems: [-24, 3, -6],
  home: [46, 2, 14],
};

/** Zone-label world points (ids match the DOM `.cutaway-zone-*` labels). */
export const WORLD_ZONE_LABEL_ANCHORS: Record<string, Vec3> = {
  imaging: [-13, 13.5, -13],
  robotics: [1, 9, -10],
  recovery: [19, 9, -10],
  emergency: [-24, 4.5, -6],
  arrivals: [-6, 0.4, 8],
};

export type WorldRouteKind = "car" | "ambulance" | "person" | "gurney";
export type WorldPersonRole = "caregiver" | "patient" | "valet";

export interface WorldRoute {
  id: string;
  kind: WorldRouteKind;
  role?: WorldPersonRole;
  /** Seconds for one full traversal. */
  duration: number;
  /** Closed routes loop smoothly; open routes fade out and respawn. */
  closed: boolean;
  points: readonly Vec3[];
}

/** Two independently phased actors per route family (28 total). */
export const WORLD_ACTORS_PER_ROUTE = 2;

/**
 * The same 14 route families as the 2D cutaway, authored as world-space
 * waypoint polylines. Ground traffic moves at y≈0.2; clinical floor-two
 * actors at y≈4.95 (above the floor slab).
 */
export const WORLD_ROUTES: readonly WorldRoute[] = [
  {
    id: "car-arrival",
    kind: "car",
    duration: 13,
    closed: false,
    points: [[-58, 0.2, 15], [-14, 0.2, 15], [-9, 0.2, 10], [-4, 0.2, 7]],
  },
  {
    id: "car-departure",
    kind: "car",
    duration: 13,
    closed: false,
    points: [[-1, 0.2, 7], [3, 0.2, 10], [10, 0.2, 15], [58, 0.2, 15]],
  },
  {
    id: "car-parking",
    kind: "car",
    duration: 12,
    closed: false,
    points: [[-58, 0.2, 16], [-40, 0.2, 15], [-42, 0.2, 9], [-46, 0.2, 5]],
  },
  {
    id: "ambulance",
    kind: "ambulance",
    duration: 15,
    closed: false,
    points: [[-58, 0.2, 14], [-45, 0.2, 12], [-42, 0.2, -4], [-33, 0.2, -5]],
  },
  {
    id: "valet-curb",
    kind: "person",
    role: "valet",
    duration: 9,
    closed: true,
    points: [[-6, 0.2, 3.5], [-4.5, 0.2, 6.5], [-2, 0.2, 7.5], [-3.5, 0.2, 4.5]],
  },
  {
    id: "valet-entry",
    kind: "person",
    role: "valet",
    duration: 10,
    closed: false,
    points: [[-2.5, 0.2, 7], [-6, 0.2, 3], [-6, 0.2, -3]],
  },
  {
    id: "patient-arrival",
    kind: "person",
    role: "patient",
    duration: 15,
    closed: false,
    points: [[-4, 0.2, 6], [-6, 0.2, 0.5], [-8, 0.2, -7]],
  },
  {
    id: "patient-ward",
    kind: "person",
    role: "patient",
    duration: 18,
    closed: false,
    points: [[18, 0.2, -3], [18, 0.2, 6], [30, 0.2, 9], [43, 0.2, 12]],
  },
  {
    id: "caregiver-prep",
    kind: "person",
    role: "caregiver",
    duration: 12,
    closed: true,
    points: [[-23, 4.95, -10], [-15, 4.95, -11], [-11, 4.95, -6], [-19, 4.95, -5.5]],
  },
  {
    id: "caregiver-or",
    kind: "person",
    role: "caregiver",
    duration: 13,
    closed: true,
    points: [[-9, 4.95, -10], [-3, 4.95, -11], [3, 4.95, -8], [-4, 4.95, -6]],
  },
  {
    id: "caregiver-recovery",
    kind: "person",
    role: "caregiver",
    duration: 14,
    closed: true,
    points: [[7, 4.95, -10], [13, 4.95, -11], [19, 4.95, -8], [12, 4.95, -6]],
  },
  {
    id: "caregiver-ward",
    kind: "person",
    role: "caregiver",
    duration: 17,
    closed: true,
    points: [[13.5, 4.95, -6], [21, 4.95, -5.5], [24.5, 4.95, -12], [15, 4.95, -13]],
  },
  {
    id: "gurney-prep",
    kind: "gurney",
    duration: 14,
    closed: false,
    points: [[-17, 4.95, -7.5], [-8, 4.95, -7], [-0.5, 4.95, -7.5]],
  },
  {
    id: "gurney-recovery",
    kind: "gurney",
    duration: 14,
    closed: false,
    points: [[4, 4.95, -13.5], [11, 4.95, -13], [17.5, 4.95, -10.5]],
  },
];

/**
 * The patient journey: one polyline through every care stage, walked by a
 * continuous population of patients. Waypoints tagged with a `queueStage`
 * are gate checkpoints — when the story's active pressure sits on that
 * stage, arriving patients stop there and accumulate.
 * Vertical segments read as elevators at the building edges.
 */
export interface PatientJourneyWaypoint {
  point: Vec3;
  queueStage?: StageId;
}

export const PATIENT_FLOW_COUNT = 26;

/** Walking speed in meters/second. */
export const PATIENT_FLOW_SPEED = 1.7;

/** Seconds of waiting after which a queued patient reads fully red. */
export const PATIENT_WAIT_RED_SECONDS = 12;

export const WORLD_PATIENT_JOURNEY: readonly PatientJourneyWaypoint[] = [
  { point: [-3, 0.2, 7] },
  { point: [-5, 0.2, -3], queueStage: "access" },
  { point: [-13, 0.2, -8] },
  { point: [-19, 0.2, -15] },
  { point: [-19, 9.4, -15] },
  { point: [-11, 9.4, -12], queueStage: "diagnosis" },
  { point: [-8, 9.4, -15] },
  { point: [-8, 4.95, -15] },
  { point: [-13, 4.95, -9], queueStage: "readiness" },
  { point: [-2, 4.95, -7], queueStage: "robotics" },
  { point: [15, 4.95, -8], queueStage: "care" },
  { point: [24, 4.95, -4] },
  { point: [24, 0.2, -4] },
  { point: [16, 0.2, -6], queueStage: "longitudinal" },
  { point: [17, 0.2, 8] },
  { point: [34, 0.2, 10] },
  { point: [43, 0.2, 12] },
];

/** Queue slot grids per gate stage: slot = origin + right·column + back·row. */
export const WORLD_PATIENT_QUEUES: Record<StageId, { origin: Vec3; right: Vec3; back: Vec3; perRow: number }> = {
  access: { origin: [-5, 0.2, -3], right: [-1.1, 0, 0], back: [0, 0, 1.15], perRow: 5 },
  diagnosis: { origin: [-11, 9.4, -12], right: [-1.1, 0, 0], back: [0, 0, 1.05], perRow: 6 },
  precision: { origin: [2, 9.4, -12], right: [1.1, 0, 0], back: [0, 0, 1.05], perRow: 5 },
  readiness: { origin: [-13, 4.95, -9], right: [-1.1, 0, 0], back: [0, 0, 1.1], perRow: 5 },
  robotics: { origin: [-2, 4.95, -7], right: [1.1, 0, 0], back: [0, 0, 1.1], perRow: 5 },
  care: { origin: [15, 4.95, -8], right: [1.1, 0, 0], back: [0, 0, 1.1], perRow: 5 },
  longitudinal: { origin: [16, 0.2, -6], right: [1.1, 0, 0], back: [0, 0, 1.15], perRow: 5 },
};

/**
 * Zoom values are authored against the reference width and scale linearly
 * with viewport width, so the same value frames the same world width on any
 * device — portrait variants exist only for poses whose *target* needs to
 * shift on tall screens.
 */
export const WORLD_CAMERA_POSES: Record<WorldPoseId, WorldCameraPose> = {
  overview: { target: [0, 4, -4], zoom: 11 },
  access: { target: [-6, 2, -3], zoom: 17 },
  diagnosis: { target: [-9, 10, -12], zoom: 17 },
  precision: { target: [2, 10, -12], zoom: 18 },
  readiness: { target: [-17, 6, -9], zoom: 18 },
  robotics: { target: [1, 6, -9], zoom: 18 },
  care: { target: [18, 6, -9], zoom: 18 },
  longitudinal: { target: [24, 2, 1], zoom: 14.5 },
  automation: { target: [4, 8, -7], zoom: 12 },
};
