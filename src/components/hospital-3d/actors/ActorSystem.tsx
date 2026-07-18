import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
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

const PERSON_COLORS: Record<WorldPersonRole, string> = {
  caregiver: "#6fd9bd",
  patient: "#c7d3e4",
  valet: "#ffb454",
};

const CAR_COLORS = ["#7f95a8", "#a8b4be", "#5e768a", "#93a6b5"];

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

function ambulanceGeometry() {
  const hull = new BoxGeometry(2.9, 1.15, 1.35);
  hull.translate(0, 0.85, 0);
  const cab = new BoxGeometry(0.85, 0.8, 1.25);
  cab.translate(1.55, 0.6, 0);
  return mergeGeometries([hull, cab]);
}

function gurneyGeometry() {
  const bed = new BoxGeometry(1.7, 0.16, 0.7);
  bed.translate(0, 0.85, 0);
  const frame = new BoxGeometry(1.3, 0.7, 0.5);
  frame.translate(0, 0.4, 0);
  return mergeGeometries([bed, frame]);
}

type Pool = {
  kind: WorldRouteKind;
  actors: RouteActor[];
};

function actorColor(actor: RouteActor, index: number): string {
  if (actor.route.kind === "person") return PERSON_COLORS[actor.route.role ?? "patient"];
  if (actor.route.kind === "car") return CAR_COLORS[index % CAR_COLORS.length];
  if (actor.route.kind === "ambulance") return "#e9edf0";
  return "#b9c4cd";
}

const matrix = new Matrix4();
const dummy = new Object3D();
const pose: ActorPose = { position: new Vector3(), heading: 0, presence: 1 };

function PoolMesh({ pool, timeRef }: { pool: Pool; timeRef: { current: number } }) {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    if (pool.kind === "person") return personGeometry();
    if (pool.kind === "car") return carGeometry();
    if (pool.kind === "ambulance") return ambulanceGeometry();
    return gurneyGeometry();
  }, [pool.kind]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let index = 0; index < pool.actors.length; index += 1) {
      poseOnRoute(pool.actors[index], timeRef.current, pose);
      dummy.position.copy(pose.position);
      dummy.rotation.set(0, pose.heading, 0);
      const scale = Math.max(0.0001, pose.presence);
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
      <meshLambertMaterial vertexColors={false} />
    </instancedMesh>
  );
}

/** Soft grounding discs under every actor — one instanced draw call. */
function BlobShadows({ actors, timeRef }: { actors: RouteActor[]; timeRef: { current: number } }) {
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
      const wide = actors[index].route.kind === "person" ? 0.7 : 1.5;
      const scale = Math.max(0.0001, pose.presence) * wide;
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
export function ActorSystem({ playing, reducedMotion }: { playing: boolean; reducedMotion: boolean }) {
  const timeRef = useRef(REDUCED_MOTION_SCENE_TIME);

  const pools = useMemo<Pool[]>(() => {
    const actors = buildRouteActors();
    return (["person", "car", "ambulance", "gurney"] as const).map((kind) => ({
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
        <PoolMesh key={pool.kind} pool={pool} timeRef={timeRef} />
      ))}
      <BlobShadows actors={allActors} timeRef={timeRef} />
    </group>
  );
}
