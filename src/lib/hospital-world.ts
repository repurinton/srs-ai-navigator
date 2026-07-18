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
  | "home"
  | "care-upper";

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
 * A six-story dollhouse tower on a wide podium, open on the south face so the
 * camera reads every interior through the cutaway:
 *   floor 1 (podium) — ED + EMS west, intake lobby center, discharge east
 *   floor 2 — radiology (2× CT, 2× MRI, 2× X-ray) west, precision east
 *   floor 3 — pre-op readiness
 *   floor 4 — eight robotic ORs
 *   floors 5–6 — recovery wards
 * An elevator core on the south-east face carries patient flow between floors.
 */
export const WORLD_ZONES: Record<WorldZoneId, WorldZone> = {
  ems: {
    id: "ems",
    name: "ED and EMS",
    min: [-24, 0, -18],
    max: [-8, 4.5, 4],
    color: "#8e8a84",
  },
  access: {
    id: "access",
    name: "Intake lobby",
    min: [-6, 0, -18],
    max: [10, 4.5, 8],
    color: "#98948d",
  },
  longitudinal: {
    id: "longitudinal",
    name: "Discharge lounge",
    min: [12, 0, -18],
    max: [24, 4.5, 4],
    color: "#8f8b85",
  },
  diagnosis: {
    id: "diagnosis",
    name: "Radiology (CT · MRI · X-ray)",
    min: [-24, 4.5, -18],
    max: [2, 9, -6],
    color: "#a5a19a",
  },
  precision: {
    id: "precision",
    name: "Precision planning",
    min: [6, 4.5, -18],
    max: [24, 9, -6],
    color: "#9d9992",
  },
  readiness: {
    id: "readiness",
    name: "Pre-op readiness",
    min: [-24, 9, -18],
    max: [24, 13.5, -6],
    color: "#9a968f",
  },
  robotics: {
    id: "robotics",
    name: "Robotic operating rooms",
    min: [-24, 13.5, -18],
    max: [24, 18, -6],
    color: "#a19d96",
  },
  care: {
    id: "care",
    name: "Recovery ward — floor five",
    min: [-24, 18, -18],
    max: [24, 22.5, -6],
    color: "#96928b",
  },
  "care-upper": {
    id: "care-upper",
    name: "Recovery ward — floor six",
    min: [-24, 22.5, -18],
    max: [24, 27, -6],
    color: "#938f88",
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
  arrivalLoop: { min: [-6, 0, 8] as Vec3, max: [10, 0.1, 12] as Vec3 },
  emsSpur: { min: [-46, 0, -8] as Vec3, max: [-24, 0.1, -2] as Vec3 },
  parking: { min: [-56, 0, 2] as Vec3, max: [-32, 0.1, 11] as Vec3 },
  dischargePlaza: { min: [12, 0, 4] as Vec3, max: [28, 0.1, 12] as Vec3 },
} as const;

/** The glass elevator core on the tower's west end, doors facing east. */
export const WORLD_ELEVATOR = { min: [-28.5, 0, -10] as Vec3, max: [-24.5, 27, -6] as Vec3 };

/** Floor stop heights (walking surface) the elevator cab serves. */
export const WORLD_ELEVATOR_STOPS = [0.45, 4.95, 9.45, 13.95, 18.45, 22.95] as const;

/** Helipad on the north-east corner of the grounds. */
export const WORLD_HELIPAD = { center: [44, 0.16, -26] as Vec3, radius: 5 };

/** Semantic world points the DOM overlay projects into screen space. */
export const WORLD_ANCHORS: Record<WorldAnchorId, Vec3> = {
  access: [2, 3, -2],
  diagnosis: [-8, 7, -8],
  precision: [14, 7, -8],
  readiness: [-4, 11.5, -8],
  robotics: [-2, 16, -8],
  care: [-2, 20.5, -8],
  longitudinal: [18, 3, -3],
  automation: [-10, 29, -10],
  ems: [-16, 3, -4],
  home: [46, 2, 14],
};

/** Zone-label world points (ids match the DOM `.cutaway-zone-*` labels). */
export const WORLD_ZONE_LABEL_ANCHORS: Record<string, Vec3> = {
  imaging: [-10, 8, -7],
  robotics: [-8, 17, -7],
  recovery: [-8, 25.8, -7],
  emergency: [-17, 3.6, -5],
  arrivals: [2, 0.4, 9],
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
 * waypoint polylines. Ground traffic moves at y≈0.2; clinical floors follow
 * the tower levels (F3 pre-op y≈9.4, F4 ORs y≈13.9, F5–F6 recovery
 * y≈18.4/22.9).
 */
export const WORLD_ROUTES: readonly WorldRoute[] = [
  {
    id: "car-arrival",
    kind: "car",
    duration: 13,
    closed: false,
    points: [[-58, 0.2, 15], [-10, 0.2, 15], [-4, 0.2, 11], [1, 0.2, 9]],
  },
  {
    id: "car-departure",
    kind: "car",
    duration: 13,
    closed: false,
    points: [[3, 0.2, 9], [7, 0.2, 11], [13, 0.2, 15], [58, 0.2, 15]],
  },
  {
    id: "car-parking",
    kind: "car",
    duration: 12,
    closed: false,
    points: [[-58, 0.2, 16], [-38, 0.2, 15], [-40, 0.2, 9], [-44, 0.2, 5]],
  },
  {
    id: "ambulance",
    kind: "ambulance",
    duration: 15,
    closed: false,
    points: [[-58, 0.2, 14], [-45, 0.2, 12], [-40, 0.2, -4], [-27, 0.2, -4]],
  },
  {
    id: "valet-curb",
    kind: "person",
    role: "valet",
    duration: 9,
    closed: true,
    points: [[0, 0.45, 4], [1.5, 0.45, 7], [4, 0.45, 8], [2.5, 0.45, 5]],
  },
  {
    id: "valet-entry",
    kind: "person",
    role: "valet",
    duration: 10,
    closed: false,
    points: [[4, 0.45, 8], [1, 0.45, 3], [0, 0.45, -2]],
  },
  {
    id: "patient-arrival",
    kind: "person",
    role: "patient",
    duration: 15,
    closed: false,
    points: [[1, 0.45, 7], [-2, 0.45, 0.5], [-4, 0.45, -6]],
  },
  {
    id: "patient-ward",
    kind: "person",
    role: "patient",
    duration: 18,
    closed: false,
    points: [[18, 0.45, -3], [18, 0.45, 6], [30, 0.45, 9], [43, 0.45, 12]],
  },
  {
    id: "caregiver-prep",
    kind: "person",
    role: "caregiver",
    duration: 12,
    closed: true,
    points: [[-18, 9.4, -10], [-10, 9.4, -11], [-6, 9.4, -7], [-14, 9.4, -6.8]],
  },
  {
    id: "caregiver-or",
    kind: "person",
    role: "caregiver",
    duration: 13,
    closed: true,
    points: [[-10, 13.9, -10], [-4, 13.9, -11], [2, 13.9, -8], [-5, 13.9, -7]],
  },
  {
    id: "caregiver-recovery",
    kind: "person",
    role: "caregiver",
    duration: 14,
    closed: true,
    points: [[2, 18.4, -10], [8, 18.4, -11], [14, 18.4, -8], [7, 18.4, -7]],
  },
  {
    id: "caregiver-ward",
    kind: "person",
    role: "caregiver",
    duration: 17,
    closed: true,
    points: [[-14, 22.9, -7], [-6, 22.9, -6.8], [-2, 22.9, -11], [-12, 22.9, -12]],
  },
  {
    id: "gurney-prep",
    kind: "gurney",
    duration: 14,
    closed: false,
    points: [[-16, 9.4, -9], [-8, 9.4, -8.6], [0, 9.4, -9]],
  },
  {
    id: "gurney-recovery",
    kind: "gurney",
    duration: 14,
    closed: false,
    points: [[-14, 18.4, -9], [-6, 18.4, -8.6], [2, 18.4, -9]],
  },
];

/**
 * The patient journey: one polyline through every care stage, walked by a
 * continuous population of patients. Waypoints tagged with a `queueStage`
 * are gate checkpoints — when the story's active pressure sits on that
 * stage, arriving patients stop there and accumulate.
 * Vertical segments read as elevators at the building edges.
 */
export type PatientTravelMode = "walk" | "stretcher";

export interface PatientJourneyWaypoint {
  point: Vec3;
  queueStage?: StageId;
  /** Travel mode from this waypoint onward (inherits when omitted). */
  travel?: PatientTravelMode;
}

export const PATIENT_FLOW_COUNT = 26;

/** Walking speed in meters/second; stretchers roll faster. */
export const PATIENT_FLOW_SPEED = 1.7;
export const PATIENT_STRETCHER_SPEED = 2.9;

/** Seconds of waiting after which a queued patient reads fully red. */
export const PATIENT_WAIT_RED_SECONDS = 12;

/**
 * Patients walk in from the curb, queue at intake, transfer onto a
 * stretcher, ride the west-end elevator core up through radiology,
 * pre-op, the ORs, and recovery, then return to ground, come off the
 * stretcher at discharge, and walk out toward home.
 * Walking surfaces sit 0.45m above each floor's base (clear of the slab).
 */
export const WORLD_PATIENT_JOURNEY: readonly PatientJourneyWaypoint[] = [
  { point: [1, 0.45, 9], travel: "walk" },
  { point: [2, 0.45, -1], queueStage: "access" },
  { point: [6, 0.45, -5], travel: "stretcher" },
  { point: [-8, 0.45, -8] },
  { point: [-26.5, 0.45, -8] },
  { point: [-26.5, 4.95, -8] },
  { point: [-4, 4.95, -7.5], queueStage: "diagnosis" },
  { point: [-26.5, 4.95, -8] },
  { point: [-26.5, 9.45, -8] },
  { point: [-2, 9.45, -7.5], queueStage: "readiness" },
  { point: [-26.5, 9.45, -8] },
  { point: [-26.5, 13.95, -8] },
  { point: [0, 13.95, -7.5], queueStage: "robotics" },
  { point: [-26.5, 13.95, -8] },
  { point: [-26.5, 18.45, -8] },
  { point: [0, 18.45, -7.5], queueStage: "care" },
  { point: [-26.5, 18.45, -8] },
  { point: [-26.5, 0.45, -8] },
  { point: [16, 0.45, -2], queueStage: "longitudinal", travel: "walk" },
  { point: [18, 0.45, 8] },
  { point: [34, 0.45, 10] },
  { point: [43, 0.45, 12] },
];

/** Queue slot grids per gate stage: slot = origin + right·column + back·row. */
export const WORLD_PATIENT_QUEUES: Record<StageId, { origin: Vec3; right: Vec3; back: Vec3; perRow: number }> = {
  access: { origin: [2, 0.45, -1], right: [-1.2, 0, 0], back: [0, 0, 1.2], perRow: 5 },
  diagnosis: { origin: [-4, 4.95, -7.5], right: [-2.2, 0, 0], back: [0, 0, -1.9], perRow: 5 },
  precision: { origin: [12, 4.95, -7.5], right: [2.2, 0, 0], back: [0, 0, -1.9], perRow: 5 },
  readiness: { origin: [-2, 9.45, -7.5], right: [-2.2, 0, 0], back: [0, 0, -1.9], perRow: 5 },
  robotics: { origin: [0, 13.95, -7.5], right: [-2.2, 0, 0], back: [0, 0, -1.9], perRow: 5 },
  care: { origin: [0, 18.45, -7.5], right: [-2.2, 0, 0], back: [0, 0, -1.9], perRow: 5 },
  longitudinal: { origin: [16, 0.45, -2], right: [1.2, 0, 0], back: [0, 0, 1.2], perRow: 5 },
};

/**
 * Real equipment berths per clinical stage: queued patients float off their
 * stretcher into these (scanner beds, OR tables, ward beds) in slot order;
 * overflow waits on stretchers in the queue grid. Entries are
 * [x, lyingSurfaceY, z, bodyYaw] — yaw aligns the body with the berth.
 */
export type PatientStation = readonly [number, number, number, number];

const HALF_PI = Math.PI / 2;

export const WORLD_PATIENT_STATIONS: Partial<Record<StageId, readonly PatientStation[]>> = {
  diagnosis: [
    [-22, 5.7, -7.4, HALF_PI],
    [-17, 5.7, -7.4, HALF_PI],
    [-11, 5.65, -7.8, HALF_PI],
    [-6, 5.65, -7.8, HALF_PI],
    [-1, 5.75, -9, 0],
    [-19, 5.75, -13, 0],
  ],
  readiness: Array.from({ length: 8 }, (_, i) => [-21 + i * 2.4, 10.2, -9.15, HALF_PI] as const),
  robotics: Array.from({ length: 8 }, (_, i) => [-21 + i * 5.6, 14.88, -9.5, 0] as const),
  care: Array.from({ length: 8 }, (_, i) => [-21 + i * 2.4, 19.2, -9.15, HALF_PI] as const),
};

/**
 * Zoom values are authored against the reference width and scale linearly
 * with viewport width, so the same value frames the same world width on any
 * device. The choreography zooms INTO each successive problem floor and back
 * OUT (overview/automation) to show the whole system.
 */
export const WORLD_CAMERA_POSES: Record<WorldPoseId, WorldCameraPose> = {
  overview: { target: [2, 11, -6], zoom: 7.6 },
  access: { target: [2, 3, -1], zoom: 17 },
  diagnosis: { target: [-6, 7.5, -8], zoom: 17 },
  precision: { target: [13, 7.5, -8], zoom: 17 },
  readiness: { target: [-2, 12, -8], zoom: 16.5 },
  robotics: { target: [0, 16.5, -8], zoom: 16.5 },
  care: { target: [0, 21, -8], zoom: 16.5 },
  longitudinal: { target: [20, 3, 1], zoom: 15 },
  automation: { target: [2, 13, -8], zoom: 7.2 },
};

/**
 * When the camera zooms into a floor, everything at or above this height
 * fades out so the interior reads unobstructed; zoomed-out poses show the
 * whole tower. Values are the ceiling (floor-slab base) of the focused level.
 */
export const WORLD_POSE_CEILING: Record<WorldPoseId, number> = {
  overview: Number.POSITIVE_INFINITY,
  automation: Number.POSITIVE_INFINITY,
  access: 4.5,
  longitudinal: 4.5,
  diagnosis: 9,
  precision: 9,
  readiness: 13.5,
  robotics: 18,
  care: 22.5,
};
