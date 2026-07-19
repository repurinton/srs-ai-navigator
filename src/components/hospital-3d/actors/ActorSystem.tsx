import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { WorldPersonRole, WorldRouteKind } from "@/lib/hospital-world";
import {
  buildRouteActors,
  poseOnRoute,
  REDUCED_MOTION_SCENE_TIME,
  type ActorPose,
  type RouteActor,
} from "./RouteRunner";
import { Vector3 } from "three";

// The journey population owns the pale-patient look; decorative walkers on
// the contract routes read as visitors/staff support.
const PERSON_COLORS: Record<WorldPersonRole, string> = {
  caregiver: "#6fd9bd",
  patient: "#93a8bd",
  valet: "#ffb454",
};

// A lively but tasteful lot: silvers, blues, a red, a white, a dark, a tan.
const CAR_COLORS = [
  "#8fa2b3", "#c7cfd6", "#4f6f8f", "#b5493f",
  "#5e768a", "#e6e9ec", "#3a4b57", "#c9b283",
  "#6d8a7d", "#7f6f9a",
];

/** BoxGeometry carrying a uniform per-vertex color so several colored parts
 * merge into one vertex-colored mesh (one draw call, multi-color shape). */
function coloredBox(size: [number, number, number], pos: [number, number, number], hex: string) {
  const geo = new BoxGeometry(size[0], size[1], size[2]);
  geo.translate(pos[0], pos[1], pos[2]);
  const c = new Color(hex);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  return geo;
}

function personGeometry() {
  const body = new CapsuleGeometry(0.32, 0.72, 3, 8);
  body.translate(0, 0.7, 0);
  const head = new SphereGeometry(0.24, 8, 6);
  head.translate(0, 1.42, 0);
  return mergeGeometries([body, head]);
}

function carGeometry() {
  const hull = new BoxGeometry(2.3, 0.55, 1.1);
  hull.translate(0, 0.45, 0);
  const cabin = new BoxGeometry(1.2, 0.45, 0.95);
  cabin.translate(-0.15, 0.95, 0);
  return mergeGeometries([hull, cabin]);
}

/**
 * A box-body ambulance that reads unmistakably as one: tall white patient
 * box, stepped-down cab with a dark windshield, a red horizontal stripe and
 * side cross, and a red/blue roof light bar. Vertex-colored so the whole
 * multi-color shape is a single instanced draw call. Modeled along +x (cab
 * forward at +x).
 */
function ambulanceGeometry() {
  const white = "#eef2f5";
  const red = "#d1362c";
  const parts = [
    coloredBox([2.5, 1.55, 1.5], [-0.35, 1.05, 0], white), // patient box
    coloredBox([1.2, 1.0, 1.42], [1.45, 0.75, 0], white), // cab
    coloredBox([0.5, 0.55, 1.3], [2.0, 1.05, 0], "#243542"), // windshield
    coloredBox([2.6, 0.28, 1.53], [-0.3, 0.72, 0], red), // belt stripe
    coloredBox([0.12, 0.7, 0.7], [-0.3, 1.15, 0.76], red), // side cross — vertical
    coloredBox([0.12, 0.28, 1.1], [-0.3, 1.15, 0.76], red), // side cross — horizontal
    coloredBox([0.9, 0.22, 1.2], [-0.35, 1.94, 0], "#c23a5a"), // roof light bar
  ];
  return mergeGeometries(parts);
}

/** A boxy delivery truck: colored cab + tall pale cargo box. Vertex-colored,
 * modeled along +x (cab forward). */
function truckGeometry() {
  const parts = [
    coloredBox([1.3, 1.2, 1.5], [1.7, 0.85, 0], "#3f6f9a"), // cab
    coloredBox([0.45, 0.5, 1.35], [2.25, 1.1, 0], "#1f2e39"), // windshield
    coloredBox([2.9, 1.9, 1.6], [-0.6, 1.2, 0], "#d9dde1"), // cargo box
    coloredBox([2.9, 0.16, 1.62], [-0.6, 2.12, 0], "#aeb6bd"), // box roof trim
  ];
  return mergeGeometries(parts);
}

function gurneyGeometry() {
  const bed = new BoxGeometry(1.7, 0.16, 0.7);
  bed.translate(0, 0.85, 0);
  const frame = new BoxGeometry(1.3, 0.7, 0.5);
  frame.translate(0, 0.4, 0);
  return mergeGeometries([bed, frame]);
}

/** Pools whose color lives in baked vertex colors, not per-instance color. */
const VERTEX_COLORED_KINDS = new Set<WorldRouteKind>(["ambulance", "truck"]);

type Pool = {
  kind: WorldRouteKind;
  actors: RouteActor[];
};

function actorColor(actor: RouteActor, index: number): string {
  // Vertex-colored kinds keep instanceColor white so the baked colors show.
  if (VERTEX_COLORED_KINDS.has(actor.route.kind)) return "#ffffff";
  if (actor.route.kind === "person") return PERSON_COLORS[actor.route.role ?? "patient"];
  if (actor.route.kind === "car") {
    // Vary by route + instance so the two actors on a route differ too.
    const seed = (actor.route.id.length * 7 + index * 3) % CAR_COLORS.length;
    return CAR_COLORS[seed];
  }
  return "#b9c4cd";
}

const matrix = new Matrix4();
const dummy = new Object3D();
const pose: ActorPose = { position: new Vector3(), heading: 0, presence: 1 };

function PoolMesh({ pool, timeRef, ceilingRef }: { pool: Pool; timeRef: { current: number }; ceilingRef: { current: number } }) {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    if (pool.kind === "person") return personGeometry();
    if (pool.kind === "car") return carGeometry();
    if (pool.kind === "ambulance") return ambulanceGeometry();
    if (pool.kind === "truck") return truckGeometry();
    return gurneyGeometry();
  }, [pool.kind]);
  const useVertexColors = VERTEX_COLORED_KINDS.has(pool.kind);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let index = 0; index < pool.actors.length; index += 1) {
      const actor = pool.actors[index];
      poseOnRoute(actor, timeRef.current, pose);
      dummy.position.copy(pose.position);
      if (pool.kind === "person") {
        // Walk in offset lanes so crossing staff don't merge into one body.
        const lane = actor.phase === 0 ? 0.45 : -0.45;
        dummy.position.x += Math.cos(pose.heading) * lane;
        dummy.position.z -= Math.sin(pose.heading) * lane;
        dummy.rotation.set(0, pose.heading, 0);
      } else {
        // Vehicle and gurney hulls are modeled along +x; align that axis
        // with the direction of travel.
        dummy.rotation.set(0, pose.heading - Math.PI / 2, 0);
      }
      const hidden = pose.position.y >= ceilingRef.current - 0.01;
      const scale = hidden ? 0.0001 : Math.max(0.0001, pose.presence);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={(mesh) => {
        meshRef.current = mesh;
        if (!mesh) return;
        for (let index = 0; index < pool.actors.length; index += 1) {
          mesh.setMatrixAt(index, matrix.identity());
          mesh.setColorAt(index, new Color(actorColor(pool.actors[index], index)));
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }}
      args={[geometry, undefined, pool.actors.length]}
    >
      <meshLambertMaterial vertexColors={useVertexColors} />
    </instancedMesh>
  );
}

/** Soft grounding discs under every actor — one instanced draw call. */
function BlobShadows({ actors, timeRef, ceilingRef }: { actors: RouteActor[]; timeRef: { current: number }; ceilingRef: { current: number } }) {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const circle = new CircleGeometry(0.85, 12);
    circle.rotateX(-Math.PI / 2);
    return circle;
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let index = 0; index < actors.length; index += 1) {
      poseOnRoute(actors[index], timeRef.current, pose);
      dummy.position.set(pose.position.x, pose.position.y + 0.02, pose.position.z);
      dummy.rotation.set(0, 0, 0);
      const hidden = pose.position.y >= ceilingRef.current - 0.01;
      const wide = actors[index].route.kind === "person" ? 0.7 : 1.5;
      const scale = hidden ? 0.0001 : Math.max(0.0001, pose.presence) * wide;
      dummy.scale.set(scale, 1, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, actors.length]}>
      <meshBasicMaterial color="#02090d" transparent opacity={0.32} depthWrite={false} />
    </instancedMesh>
  );
}

/**
 * All 28 route actors as four instanced pools (person/car/ambulance/gurney —
 * one draw call each). A single sceneTime accumulator drives every pose:
 * pausing freezes the world exactly; reduced motion pins it to a canonical
 * populated moment.
 */
export function ActorSystem({
  playing,
  reducedMotion,
  ceilingY,
}: {
  playing: boolean;
  reducedMotion: boolean;
  ceilingY: number;
}) {
  const timeRef = useRef(REDUCED_MOTION_SCENE_TIME);
  const ceilingRef = useRef(ceilingY);
  ceilingRef.current = ceilingY;

  const pools = useMemo<Pool[]>(() => {
    const actors = buildRouteActors();
    return (["person", "car", "truck", "ambulance", "gurney"] as const).map((kind) => ({
      kind,
      actors: actors.filter((actor) => actor.route.kind === kind),
    }));
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion) {
      timeRef.current = REDUCED_MOTION_SCENE_TIME;
    } else if (playing) {
      timeRef.current += delta;
    }
  });

  const allActors = useMemo(() => pools.flatMap((pool) => pool.actors), [pools]);

  return (
    <group name="actors">
      {pools.map((pool) => (
        <PoolMesh key={pool.kind} pool={pool} timeRef={timeRef} ceilingRef={ceilingRef} />
      ))}
      <BlobShadows actors={allActors} timeRef={timeRef} ceilingRef={ceilingRef} />
    </group>
  );
}
