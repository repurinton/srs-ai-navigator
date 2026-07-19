import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  EdgesGeometry,
  BoxGeometry,
  Object3D,
  Vector3,
  Quaternion,
  type Group,
  type InstancedMesh,
  type Mesh,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  WORLD_ELEVATOR,
  WORLD_HELIPAD,
  WORLD_SURFACES,
  WORLD_ZONES,
} from "@/lib/hospital-world";
import { ELEVATOR_CABS, elevatorCabState, elevatorClock, type ElevatorCabSpec } from "./elevators";
import {
  STRETCHER_PATH,
  PARKING_ROWS,
  PARKED_CAR_COLORS,
  PARKING_TARGET_EMPTY,
  parkingStalls,
  parkingAisleForRow,
} from "@/lib/campus-props";
import { FadeGroup } from "./FadeGroup";

function translatedBox(size: [number, number, number], position: [number, number, number]) {
  const geometry = new BoxGeometry(...size);
  geometry.translate(...position);
  return geometry;
}

const Z = WORLD_ZONES;

function CTScanner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[1.35, 0.42, 10, 20]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh position={[0, 0.8, 1.6]}>
        <boxGeometry args={[0.75, 0.18, 3.6]} />
        <meshLambertMaterial color="#cfd8dd" />
      </mesh>
      <mesh position={[0, 0.35, 2.6]}>
        <boxGeometry args={[0.6, 0.7, 1.1]} />
        <meshLambertMaterial color="#b9c4cb" />
      </mesh>
    </group>
  );
}

function MRIScanner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.25, -0.4]}>
        <boxGeometry args={[2.6, 2.5, 2.2]} />
        <meshLambertMaterial color="#dde4e8" />
      </mesh>
      <mesh position={[0, 1.1, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 14]} />
        <meshLambertMaterial color="#25333c" />
      </mesh>
      <mesh position={[0, 0.75, 1.7]}>
        <boxGeometry args={[0.75, 0.16, 2.4]} />
        <meshLambertMaterial color="#cfd8dd" />
      </mesh>
    </group>
  );
}

function XRayMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.2, 0.14, 0.85]} />
        <meshLambertMaterial color="#dfe6ea" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.6, 0.85, 0.6]} />
        <meshLambertMaterial color="#9aa7ae" />
      </mesh>
      {/* Overhead tube on a column */}
      <mesh position={[1.15, 1.5, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 3, 8]} />
        <meshLambertMaterial color="#c3ccd2" />
      </mesh>
      <mesh position={[0.35, 2.7, 0]}>
        <boxGeometry args={[1.7, 0.14, 0.16]} />
        <meshLambertMaterial color="#c3ccd2" />
      </mesh>
      <mesh position={[-0.35, 2.35, 0]}>
        <boxGeometry args={[0.5, 0.55, 0.5]} />
        <meshLambertMaterial color="#e8ecef" emissive="#8fb9c9" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** All OR bays merged into three draw calls: structure, dividers, lights. */
function ORRow({ positions, animate }: { positions: [number, number, number][]; animate: boolean }) {
  const { structure, dividers, lights } = useMemo(() => {
    const structureParts = [];
    const dividerParts = [];
    const lightParts = [];
    // Partition walls between adjacent bays so each OR reads as its own
    // room. They stop short of the docking lane so stretchers pulling up
    // alongside the tables never pass through them.
    for (let i = 0; i < positions.length - 1; i += 1) {
      const [ax, ay, az] = positions[i];
      const [bx] = positions[i + 1];
      const wall = new BoxGeometry(0.25, 3.4, 3.0);
      wall.translate((ax + bx) / 2, ay + 1.7, az - 0.9);
      dividerParts.push(wall);
    }
    for (const [x, y, z] of positions) {
      const pedestal = new BoxGeometry(0.55, 0.9, 0.5);
      pedestal.translate(x, y + 0.45, z);
      const table = new BoxGeometry(2.1, 0.14, 0.75);
      table.translate(x, y + 0.98, z);
      const column = new BoxGeometry(0.3, 2.1, 0.3);
      column.translate(x + 1.15, y + 1.05, z - 0.85);
      // Ceiling mount the animated robot arms hang from (the moving arms
      // themselves are rendered by ORRobotArms below).
      const mount = new BoxGeometry(2.0, 0.2, 0.4);
      mount.translate(x, y + 2.35, z - 0.2);
      structureParts.push(pedestal, table, column, mount);
      const light = new BoxGeometry(0.8, 0.14, 0.8);
      light.translate(x - 0.7, y + 2.3, z + 0.35);
      lightParts.push(light);
    }
    return {
      structure: mergeGeometries(structureParts),
      dividers: mergeGeometries(dividerParts),
      lights: mergeGeometries(lightParts),
    };
  }, [positions]);

  return (
    <group>
      <mesh geometry={structure}>
        <meshLambertMaterial color="#dbe2e7" />
      </mesh>
      <mesh geometry={dividers}>
        <meshLambertMaterial color="#aab4bb" />
      </mesh>
      <mesh geometry={lights}>
        <meshLambertMaterial color="#f2f6f8" emissive="#8fb9c9" emissiveIntensity={0.35} />
      </mesh>
      <ORRobotArms positions={positions} animate={animate} />
    </group>
  );
}

/**
 * Articulated surgical robot arms — two per OR table — driven every frame in a
 * single InstancedMesh (two box segments per arm). Each arm's tool tip hovers
 * and works over the patient on the table with an independent phase so no two
 * arms move in lockstep. Freezes when animation is disabled (reduced motion).
 */
function ORRobotArms({ positions, animate }: { positions: [number, number, number][]; animate: boolean }) {
  const armRef = useRef<InstancedMesh>(null);
  const tipRef = useRef<InstancedMesh>(null);
  const clock = useRef(0);
  const segCount = positions.length * 2 * 2; // 2 arms × 2 segments
  const tipCount = positions.length * 2;

  const kit = useMemo(
    () => ({
      dummy: new Object3D(),
      shoulder: new Vector3(),
      elbow: new Vector3(),
      tool: new Vector3(),
      dir: new Vector3(),
      mid: new Vector3(),
      quat: new Quaternion(),
      zAxis: new Vector3(0, 0, 1),
    }),
    [],
  );

  useFrame((_, delta) => {
    const arm = armRef.current;
    if (!arm) return;
    if (animate) clock.current += delta;
    const t = clock.current;
    const { dummy, shoulder, elbow, tool, dir, mid, quat, zAxis } = kit;
    const tip = tipRef.current;

    const setSegment = (index: number, a: Vector3, b: Vector3, thick: number) => {
      dir.subVectors(b, a);
      const len = dir.length();
      if (len < 1e-4) return;
      mid.addVectors(a, b).multiplyScalar(0.5);
      dir.normalize();
      quat.setFromUnitVectors(zAxis, dir);
      dummy.position.copy(mid);
      dummy.quaternion.copy(quat);
      dummy.scale.set(thick, thick, len);
      dummy.updateMatrix();
      arm.setMatrixAt(index, dummy.matrix);
    };

    let seg = 0;
    let ti = 0;
    for (let i = 0; i < positions.length; i += 1) {
      const [x, y, z] = positions[i];
      for (let a = 0; a < 2; a += 1) {
        const side = a === 0 ? 1 : -1;
        const phase = i * 1.27 + a * 2.4;
        // Shoulder is bolted to the ceiling mount, offset to each side.
        shoulder.set(x + side * 0.72, y + 2.28, z - 0.2);
        // Tool tip works over the patient's torso with a small orbit.
        tool.set(
          x + Math.sin(t * 1.05 + phase) * 0.3,
          y + 1.16 + Math.sin(t * 1.9 + phase) * 0.07,
          z + 0.18 + Math.cos(t * 0.85 + phase) * 0.24,
        );
        // Elbow bends outward and up so the joint reads as a real linkage.
        elbow.set(
          (shoulder.x + tool.x) / 2 + side * 0.32,
          Math.max(shoulder.y, tool.y) + 0.12 + Math.sin(t * 1.35 + phase) * 0.09,
          (shoulder.z + tool.z) / 2 - 0.12,
        );
        setSegment(seg++, shoulder, elbow, 0.14);
        setSegment(seg++, elbow, tool, 0.1);
        if (tip) {
          dummy.position.copy(tool);
          dummy.quaternion.identity();
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          tip.setMatrixAt(ti++, dummy.matrix);
        }
      }
    }
    arm.instanceMatrix.needsUpdate = true;
    if (tip) tip.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={armRef} args={[undefined, undefined, segCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#c9d2d8" />
      </instancedMesh>
      <instancedMesh ref={tipRef} args={[undefined, undefined, tipCount]}>
        <boxGeometry args={[0.17, 0.17, 0.17]} />
        <meshLambertMaterial color="#eaf4f7" emissive="#5fd0c4" emissiveIntensity={0.7} />
      </instancedMesh>
    </group>
  );
}

/** A row of beds merged into one geometry — one draw call per row. */
function BedRow({
  start,
  count,
  gap,
}: {
  start: [number, number, number];
  count: number;
  gap: number;
}) {
  const geometry = useMemo(() => {
    const parts = [];
    for (let i = 0; i < count; i += 1) {
      const x = i * gap;
      parts.push(
        translatedBox([0.95, 0.5, 2.1], [x, 0.45, 0]),
        translatedBox([0.95, 0.7, 0.14], [x, 0.75, -0.95]),
        translatedBox([0.85, 0.14, 1.1], [x, 0.74, 0.35]),
      );
    }
    return mergeGeometries(parts);
  }, [count, gap]);

  return (
    <mesh geometry={geometry} position={start}>
      <meshLambertMaterial color="#ccd6dc" />
    </mesh>
  );
}

function Canopy({
  position,
  width,
  depth,
  accent,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  accent?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[width, 0.28, depth]} />
        <meshLambertMaterial color={accent ?? "#aab4ba"} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}-${sz}`} position={[sx * (width / 2 - 0.4), 1.5, sz * (depth / 2 - 0.4)]}>
            <cylinderGeometry args={[0.12, 0.12, 3, 6]} />
            <meshLambertMaterial color="#8c979e" />
          </mesh>
        )),
      )}
    </group>
  );
}

function SeatRows({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((row) => (
        <mesh key={row} position={[0, 0.35, row * 1.7]}>
          <boxGeometry args={[6.5, 0.7, 0.7]} />
          <meshLambertMaterial color="#7d94a2" />
        </mesh>
      ))}
    </group>
  );
}

function Counter({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 1.05, 0.7]} />
      <meshLambertMaterial color="#b3bfc7" />
    </mesh>
  );
}

function Workstations({ position }: { position: [number, number, number] }) {
  const { desks, screens } = useMemo(() => {
    const deskParts = [];
    const screenParts = [];
    for (let i = 0; i < 3; i += 1) {
      const desk = new BoxGeometry(1.8, 0.1, 0.9);
      desk.translate(i * 2.6, 0.75, 0);
      deskParts.push(desk);
      const screen = new BoxGeometry(1.3, 0.75, 0.08);
      screen.translate(i * 2.6, 1.35, -0.3);
      screenParts.push(screen);
    }
    return { desks: mergeGeometries(deskParts), screens: mergeGeometries(screenParts) };
  }, []);
  return (
    <group position={position}>
      <mesh geometry={desks}>
        <meshLambertMaterial color="#b3bfc7" />
      </mesh>
      <mesh geometry={screens}>
        <meshLambertMaterial color="#1d3d4d" emissive="#3b8ca8" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** Static parked cars filling stalls while animated traffic comes and goes.
 * Layout comes from campus-props so the interaction QA checks the same slots. */
/**
 * A living parking lot. Every stall is tracked; the lot holds ~7 empty stalls
 * and cars arrive and depart one at a time at a matched rate, so the empty
 * spots wander around the lot. A moving car only ever occupies its own stall
 * plus the adjacent aisle cell, so it can never clip a parked car. Random stall
 * choice + random timing make the churn non-deterministic. One instanced mesh
 * (per-instance colour) → one draw call.
 */
const PARK_TRANSITION_SECONDS = 3.4;

function ParkingLot({ animate }: { animate: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const stalls = useMemo(() => parkingStalls(), []);

  // Baked car body (hull + cabin), long-axis along z, origin at the stall centre.
  const carGeometry = useMemo(
    () =>
      mergeGeometries([
        translatedBox([1.05, 0.55, 2.2], [0, 0.45, 0]),
        translatedBox([0.9, 0.42, 1.15], [0, 0.93, 0.12]),
      ]),
    [],
  );

  const state = useMemo(() => {
    const occupied = stalls.map(() => true);
    // Open PARKING_TARGET_EMPTY random stalls to start.
    let opened = 0;
    let guard = 0;
    while (opened < PARKING_TARGET_EMPTY && guard < 500) {
      const s = Math.floor(Math.random() * stalls.length);
      if (occupied[s]) {
        occupied[s] = false;
        opened += 1;
      }
      guard += 1;
    }
    const colorIndex = stalls.map((_, i) => (i * 7 + 3) % PARKED_CAR_COLORS.length);
    return {
      occupied,
      colorIndex,
      clock: 0,
      nextAt: 1.5,
      lastKind: "in" as "in" | "out",
      trans: null as null | { kind: "in" | "out"; stall: number; progress: number },
    };
  }, [stalls]);

  const kit = useMemo(
    () => ({
      dummy: new Object3D(),
      color: new Color(),
      p0: new Vector3(),
      p1: new Vector3(),
      p2: new Vector3(),
      pos: new Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = state;
    const { dummy, color, p0, p1, p2, pos } = kit;

    if (animate) {
      s.clock += delta;
      // Kick off a new arrival/departure when the lot is idle.
      if (!s.trans && s.clock >= s.nextAt) {
        const emptyCount = s.occupied.reduce((n, o) => n + (o ? 0 : 1), 0);
        let kind: "in" | "out";
        if (emptyCount > PARKING_TARGET_EMPTY) kind = "in";
        else if (emptyCount < PARKING_TARGET_EMPTY) kind = "out";
        else kind = s.lastKind === "in" ? "out" : "in";
        // Pick a random stall of the needed occupancy.
        const pool: number[] = [];
        for (let i = 0; i < s.occupied.length; i += 1) {
          if (kind === "in" ? !s.occupied[i] : s.occupied[i]) pool.push(i);
        }
        if (pool.length > 0) {
          const stall = pool[Math.floor(Math.random() * pool.length)];
          if (kind === "in") s.colorIndex[stall] = Math.floor(Math.random() * PARKED_CAR_COLORS.length);
          s.trans = { kind, stall, progress: 0 };
          s.lastKind = kind;
        } else {
          s.nextAt = s.clock + 0.5;
        }
      }
      if (s.trans) {
        s.trans.progress += delta / PARK_TRANSITION_SECONDS;
        if (s.trans.progress >= 1) {
          s.occupied[s.trans.stall] = s.trans.kind === "in";
          s.trans = null;
          s.nextAt = s.clock + 1.4 + Math.random() * 1.9;
        }
      }
    }

    for (let i = 0; i < stalls.length; i += 1) {
      const stall = stalls[i];
      let visible = s.occupied[i];
      let x = stall.x;
      let z = stall.z;
      let heading = 0;
      let scale = 1;

      if (s.trans && s.trans.stall === i) {
        // Two-segment approach: along the aisle, then turn into the stall.
        const aisle = parkingAisleForRow(stall.row);
        p0.set(Math.max(stall.x - 4, -57), aisle, 0); // (x, aisleZ) packed as (x, z)
        p1.set(stall.x, aisle, 0);
        p2.set(stall.x, stall.z, 0);
        const progress = s.trans.kind === "in" ? s.trans.progress : 1 - s.trans.progress;
        // Walk P0→P1→P2 by arc fraction (P0..P1 is the long leg).
        const l1 = Math.abs(p1.x - p0.x);
        const l2 = Math.abs(p2.y - p1.y);
        const total = l1 + l2;
        const dist = progress * total;
        if (dist <= l1) {
          const u = l1 > 1e-4 ? dist / l1 : 1;
          x = p0.x + (p1.x - p0.x) * u;
          z = aisle;
          heading = Math.PI / 2; // driving along +x
        } else {
          const u = l2 > 1e-4 ? (dist - l1) / l2 : 1;
          x = stall.x;
          z = aisle + (stall.z - aisle) * u;
          heading = stall.z >= aisle ? 0 : Math.PI; // turning into the stall along z
        }
        // Fade the car in as it arrives / out as it leaves.
        const fadeEdge = 0.14;
        const fp = s.trans.kind === "in" ? s.trans.progress : 1 - s.trans.progress;
        scale = Math.min(1, fp / fadeEdge);
        visible = true;
      }

      if (!visible) {
        dummy.position.set(stall.x, -50, stall.z); // park it far below (scale 0 too)
        dummy.scale.setScalar(0);
        dummy.rotation.set(0, 0, 0);
      } else {
        pos.set(x, 0, z);
        dummy.position.copy(pos);
        dummy.scale.setScalar(scale);
        dummy.rotation.set(0, heading, 0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(PARKED_CAR_COLORS[s.colorIndex[i]]);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (typeof window !== "undefined") {
      const empty = s.occupied.reduce((n, o) => n + (o ? 0 : 1), 0);
      (window as unknown as { __parkingDebug?: unknown }).__parkingDebug = {
        stalls: stalls.length,
        empty,
        occupied: stalls.length - empty,
        transition: s.trans ? { kind: s.trans.kind, stall: s.trans.stall, progress: Number(s.trans.progress.toFixed(2)) } : null,
        clock: Number(s.clock.toFixed(1)),
      };
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[carGeometry, undefined, stalls.length]}>
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/**
 * The two independent elevator cabs. Both render from the same pure
 * schedule function that drives patient boarding, so a cab's position and
 * door state always match the riders. Doors face east and slide open at
 * every dwell so patients visibly enter and exit.
 */
function ElevatorCabs({ ceilingY }: { ceilingY: number }) {
  return (
    <group>
      {ELEVATOR_CABS.map((cab, index) => (
        <ElevatorCabUnit key={index} cab={cab} ceilingY={ceilingY} />
      ))}
    </group>
  );
}

function ElevatorCabUnit({ cab, ceilingY }: { cab: ElevatorCabSpec; ceilingY: number }) {
  const cabRef = useRef<Group>(null);
  const doorNorthRef = useRef<Mesh>(null);
  const doorSouthRef = useRef<Mesh>(null);
  // Fade toward whatever the floors are doing: a cab riding above the focused
  // floor must not hang in the air as a solid box (matches FadeGroup behavior,
  // but tracked per-frame because the cab moves).
  const fade = useRef(1);
  const doorX = WORLD_ELEVATOR.max[0] - 0.12;

  useFrame((_, delta) => {
    // Read the shared elevator time PatientFlow publishes, so the cab and its
    // riders are always sampled at the identical moment.
    const state = elevatorCabState(elevatorClock.current, cab);
    const group = cabRef.current;
    if (!group) return;
    group.position.y = state.y;
    const slide = 0.12 + state.doorsOpen * 0.72;
    if (doorNorthRef.current) doorNorthRef.current.position.z = cab.z - slide;
    if (doorSouthRef.current) doorSouthRef.current.position.z = cab.z + slide;

    // The cab body spans [state.y, state.y + ~3]; hide once its floor reaches
    // the focus ceiling, matching the zone floors above it.
    const target = state.y >= ceilingY - 0.01 ? 0 : 1;
    fade.current += (target - fade.current) * Math.min(1, delta * 6);
    const opacity = fade.current;
    group.visible = opacity > 0.02;
    group.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.material) return;
      const material = mesh.material as unknown as { transparent: boolean; opacity: number; needsUpdate: boolean };
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }
      material.opacity = opacity;
    });
  });

  return (
    <group ref={cabRef}>
      <mesh position={[cab.x, 1.5, cab.z]}>
        <boxGeometry args={[3.2, 2.9, 2.3]} />
        <meshLambertMaterial color="#b9cdd4" transparent />
      </mesh>
      {/* Sliding doors on the east face */}
      <mesh ref={doorNorthRef} position={[doorX, 1.45, cab.z - 0.12]}>
        <boxGeometry args={[0.1, 2.7, 1.1]} />
        <meshLambertMaterial color="#7fd4c0" transparent />
      </mesh>
      <mesh ref={doorSouthRef} position={[doorX, 1.45, cab.z + 0.12]}>
        <boxGeometry args={[0.1, 2.7, 1.1]} />
        <meshLambertMaterial color="#7fd4c0" transparent />
      </mesh>
    </group>
  );
}

/** Helipad on the grounds plus an occasional helicopter arrival. */
function Helipad() {
  const marking = useMemo(() => {
    const bar = (w: number, h: number, x: number, z: number) => {
      const geo = new BoxGeometry(w, 0.05, h);
      geo.translate(x, 0, z);
      return geo;
    };
    return mergeGeometries([
      bar(0.5, 3.2, -1, 0),
      bar(0.5, 3.2, 1, 0),
      bar(1.6, 0.5, 0, 0),
    ]);
  }, []);
  const [cx, cy, cz] = WORLD_HELIPAD.center;
  return (
    <group position={[cx, cy, cz]}>
      <mesh>
        <cylinderGeometry args={[WORLD_HELIPAD.radius, WORLD_HELIPAD.radius, 0.12, 24]} />
        <meshLambertMaterial color="#22343d" />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[WORLD_HELIPAD.radius - 0.7, WORLD_HELIPAD.radius - 0.25, 24]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh geometry={marking} position={[0, 0.1, 0]}>
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
    </group>
  );
}

// One quadcopter arrival every PERIOD seconds; the pad-to-ED stretcher run
// lasts longer than a period, so two runner instances alternate landings.
const QUAD_PERIOD = 27.5;
const QUAD_TOUCHDOWN = 14;
const STRETCHER_RUN_START = 16; // two beats after touchdown = the handoff
const STRETCHER_RUN_DURATION = 26; // must stay under 2×PERIOD − RUN_START

/**
 * Medical delivery quadcopter: white X-frame drone with a red cross and an
 * underslung med-payload pod. Recurring cycle — approach, vertical descent,
 * idle on the pad, climb out, depart. Each landing hands a patient to a
 * stretcher crew that rolls them around the front plaza into the ED. The
 * clock starts mid-cycle so the first arrival lands shortly after load.
 */
function MedicalQuadcopter() {
  const groupRef = useRef<Group>(null);
  const rotorsRef = useRef<Group>(null);
  const stretcherRefs = [useRef<Group>(null), useRef<Group>(null)];
  const clock = useRef(2);
  const [px, , pz] = WORLD_HELIPAD.center;

  // Rerouted (campus-props): skirts north/west of the lake and enters the ED
  // from the south apron — never crossing the lake or the highway.
  const path = useMemo(() => {
    const points = STRETCHER_PATH;
    const lengths: number[] = [0];
    for (let i = 1; i < points.length; i += 1) {
      lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][2] - points[i - 1][2]));
    }
    return { points, lengths, total: lengths[lengths.length - 1] };
  }, []);

  useFrame((_, delta) => {
    // Verification hook mirroring __patientFlowFF: consume a one-shot
    // fast-forward so headless checks can reach any point in the cycle.
    const globals = window as unknown as { __quadFF?: number; __quadDebug?: unknown };
    if (typeof globals.__quadFF === "number") {
      clock.current += globals.__quadFF;
      delete globals.__quadFF;
    }
    clock.current += delta;
    const t = clock.current % QUAD_PERIOD;
    const group = groupRef.current;
    if (!group) return;

    let x = px + 34;
    let y = 26;
    let z = pz - 22;
    let visible = false;
    let rotorSpeed = 30;

    const ease = (v: number) => v * v * (3 - 2 * v);
    if (t >= 5 && t < 11) {
      const p = ease((t - 5) / 6);
      x = px + 34 - 34 * p;
      y = 26 - 16 * p;
      z = pz - 22 + 22 * p;
      visible = true;
    } else if (t >= 11 && t < QUAD_TOUCHDOWN) {
      const p = ease((t - 11) / 3);
      x = px;
      y = 10 - 9.72 * p;
      z = pz;
      visible = true;
    } else if (t >= QUAD_TOUCHDOWN && t < 20) {
      x = px;
      y = 0.28;
      z = pz;
      visible = true;
      rotorSpeed = 8;
    } else if (t >= 20 && t < 23) {
      const p = ease((t - 20) / 3);
      x = px;
      y = 0.28 + 12 * p;
      z = pz;
      visible = true;
    } else if (t >= 23 && t < QUAD_PERIOD) {
      const p = ease((t - 23) / 4.5);
      x = px + 40 * p;
      y = 12.5 + 14 * p;
      z = pz - 26 * p;
      visible = true;
    }

    group.position.set(x, y, z);
    group.visible = visible;
    if (rotorsRef.current) {
      rotorsRef.current.children.forEach((rotor, index) => {
        rotor.rotation.y += delta * rotorSpeed * (index % 2 === 0 ? 1 : -1);
      });
    }

    // Stretcher runs: landing n belongs to instance n % 2, departing the pad
    // STRETCHER_RUN_START into its cycle and rolling the patient into the ED.
    for (let k = 0; k < 2; k += 1) {
      const runner = stretcherRefs[k].current;
      if (!runner) continue;
      const doublePeriods = Math.floor((clock.current - STRETCHER_RUN_START - k * QUAD_PERIOD) / (2 * QUAD_PERIOD));
      const startTime = k * QUAD_PERIOD + doublePeriods * 2 * QUAD_PERIOD + STRETCHER_RUN_START;
      const u = (clock.current - startTime) / STRETCHER_RUN_DURATION;
      if (u < 0 || u > 1) {
        runner.visible = false;
        continue;
      }
      const distance = u * path.total;
      let segment = 1;
      while (segment < path.lengths.length - 1 && path.lengths[segment] < distance) segment += 1;
      const a = path.points[segment - 1];
      const b = path.points[segment];
      const span = path.lengths[segment] - path.lengths[segment - 1];
      const p = span > 0 ? (distance - path.lengths[segment - 1]) / span : 0;
      runner.position.set(a[0] + (b[0] - a[0]) * p, a[1], a[2] + (b[2] - a[2]) * p);
      runner.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]) - Math.PI / 2;
      // Shrink out over the last stretch — the crew wheels into the bay.
      const shrink = u > 0.94 ? Math.max((1 - u) / 0.06, 0.001) : 1;
      runner.scale.setScalar(shrink);
      runner.visible = true;
    }

    globals.__quadDebug = {
      t: Number(t.toFixed(2)),
      copterVisible: group.visible,
      copterY: Number(group.position.y.toFixed(2)),
      runners: stretcherRefs.map((ref) => ({
        visible: ref.current?.visible ?? false,
        x: Number((ref.current?.position.x ?? 0).toFixed(1)),
        z: Number((ref.current?.position.z ?? 0).toFixed(1)),
      })),
    };
  });

  const armLength = 1.55;
  const rotorPositions: [number, number][] = [
    [armLength, armLength],
    [armLength, -armLength],
    [-armLength, armLength],
    [-armLength, -armLength],
  ];

  return (
    <>
    <group ref={groupRef} visible={false}>
    <group scale={2}>
      {/* Body with red cross */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.5, 0.55, 1.5]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.0, 0.06, 0.34]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[0.34, 0.06, 1.0]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      {/* Underslung medical payload pod */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.9, 0.45, 0.9]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      {/* X-frame arms */}
      <mesh position={[0, 0.86, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[4.4, 0.1, 0.16]} />
        <meshLambertMaterial color="#5b6d74" />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[4.4, 0.1, 0.16]} />
        <meshLambertMaterial color="#5b6d74" />
      </mesh>
      {/* Landing feet */}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`foot-${index}`} position={[ax * 0.62, 0.18, az * 0.62]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshLambertMaterial color="#5b6d74" />
        </mesh>
      ))}
      {/* Motors + spinning rotors inside white prop-guard rings */}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`motor-${index}`} position={[ax, 0.95, az]}>
          <cylinderGeometry args={[0.12, 0.14, 0.22, 8]} />
          <meshLambertMaterial color="#22343d" />
        </mesh>
      ))}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`guard-${index}`} position={[ax, 1.1, az]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.88, 0.055, 8, 24]} />
          <meshLambertMaterial color="#f2f6f8" />
        </mesh>
      ))}
      <group ref={rotorsRef}>
        {rotorPositions.map(([ax, az], index) => (
          <group key={`rotor-${index}`} position={[ax, 1.1, az]}>
            <mesh>
              <boxGeometry args={[1.5, 0.04, 0.16]} />
              <meshLambertMaterial color="#22343d" />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[1.5, 0.04, 0.16]} />
              <meshLambertMaterial color="#22343d" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
    </group>
      {stretcherRefs.map((ref, index) => (
        <group key={`helipad-stretcher-${index}`} ref={ref} visible={false}>
          {/* Frame + wheels hint, long axis along +x to match vehicle yaw */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.9, 0.1, 0.6]} />
            <meshLambertMaterial color="#8fa3ad" />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[1.9, 0.16, 0.62]} />
            <meshLambertMaterial color="#e8ecef" />
          </mesh>
          {/* Patient lying on the stretcher */}
          <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.21, 1.05, 4, 8]} />
            <meshLambertMaterial color="#cfd9e6" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Glass elevator core riding the tower's open west end. */
function ElevatorCore({ ceilingY }: { ceilingY: number }) {
  // Cap the glass shaft at the focused floor so it doesn't rise past the
  // cutaway as a wireframe box (matches the floors fading above the focus).
  const topY = Math.min(WORLD_ELEVATOR.max[1], Number.isFinite(ceilingY) ? ceilingY : WORLD_ELEVATOR.max[1]);
  const { size, center, edges } = useMemo(() => {
    const s: [number, number, number] = [
      WORLD_ELEVATOR.max[0] - WORLD_ELEVATOR.min[0],
      topY - WORLD_ELEVATOR.min[1],
      WORLD_ELEVATOR.max[2] - WORLD_ELEVATOR.min[2],
    ];
    const c: [number, number, number] = [
      (WORLD_ELEVATOR.min[0] + WORLD_ELEVATOR.max[0]) / 2,
      (WORLD_ELEVATOR.min[1] + topY) / 2,
      (WORLD_ELEVATOR.min[2] + WORLD_ELEVATOR.max[2]) / 2,
    ];
    return { size: s, center: c, edges: new EdgesGeometry(new BoxGeometry(...s)) };
  }, [topY]);
  return (
    <group>
      <mesh position={center}>
        <boxGeometry args={size} />
        <meshLambertMaterial color="#7fd4c0" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} position={center}>
        <lineBasicMaterial color="#7fd4c0" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

/** Dashed lane divider plus parking stall lines — one merged draw call. */
function RoadMarkings() {
  const geometry = useMemo(() => {
    const road = WORLD_SURFACES.mainRoad;
    const parking = WORLD_SURFACES.parking;
    const parts = [];
    // Dashed centerline between the two highway lanes (z=15).
    for (let x = road.min[0] + 4; x < road.max[0] - 4; x += 6) {
      parts.push(translatedBox([2.4, 0.03, 0.22], [x, 0.16, 15]));
    }
    // Stall lines for the parking rows (matching campus-props PARKING_ROWS).
    for (const z of PARKING_ROWS) {
      for (let x = parking.min[0] + 2.5; x <= parking.max[0] - 4.5; x += 3.1) {
        parts.push(translatedBox([0.16, 0.03, 2.4], [x, 0.16, z]));
      }
    }
    // Zebra crosswalk on the front apron between the drop-off and the entrance,
    // where valet/patient walk paths cross the circulating cars.
    for (let z = 5.4; z <= 8.4; z += 0.7) {
      parts.push(translatedBox([1.8, 0.03, 0.24], [1, 0.17, z]));
    }
    return mergeGeometries(parts);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color="#4b5f6b" />
    </mesh>
  );
}

/** One silhouette outline per zone volume — the "architectural drawing" read. */
function ZoneOutlines({ ceilingY }: { ceilingY: number }) {
  const outlines = useMemo(
    () =>
      Object.values(Z).filter((zone) => zone.id !== "home").map((zone) => {
        const size: [number, number, number] = [
          zone.max[0] - zone.min[0],
          zone.max[1] - zone.min[1],
          zone.max[2] - zone.min[2],
        ];
        const center: [number, number, number] = [
          (zone.min[0] + zone.max[0]) / 2,
          (zone.min[1] + zone.max[1]) / 2,
          (zone.min[2] + zone.max[2]) / 2,
        ];
        return { id: zone.id, minY: zone.min[1], geometry: new EdgesGeometry(new BoxGeometry(...size)), center };
      }),
    [],
  );
  return (
    <group>
      {outlines.map(({ id, minY, geometry, center }) => (
        <FadeGroup key={id} hidden={minY >= ceilingY - 0.01}>
          <lineSegments geometry={geometry} position={center}>
            <lineBasicMaterial color="#04141c" transparent opacity={0.55} />
          </lineSegments>
        </FadeGroup>
      ))}
    </group>
  );
}

export function ZoneEquipment({ ceilingY, reducedMotion = false }: { ceilingY: number; reducedMotion?: boolean }) {
  const hiddenAbove = (floorMinY: number) => floorMinY >= ceilingY - 0.01;

  return (
    <group name="equipment">
      {/* Floor 1 — intake lobby, ED + EMS, discharge (never above the focus) */}
      <Counter position={[0, Z.access.min[1] + 0.9, -3]} width={5} />
      <Counter position={[6, Z.access.min[1] + 0.9, -3]} width={3} />
      <Canopy position={[2, Z.access.min[1], 9]} width={9} depth={3.2} accent="#7fd4c0" />
      <BedRow start={[-22, Z.ems.min[1] + 0.4, -3]} count={6} gap={2.3} />
      <Canopy position={[-26.5, Z.ems.min[1], -4]} width={4.5} depth={7} accent="#ff716d" />
      <SeatRows position={[18, Z.longitudinal.min[1] + 0.4, -2]} />

      {/* Floor 2 — radiology (two CT, two MRI, two X-ray) + precision */}
      <FadeGroup hidden={hiddenAbove(Z.diagnosis.min[1])}>
        {/* Scanners lined along the back wall (z-15) so the front half of the
            floor stays clear for stretchers to traverse and dock. */}
        <CTScanner position={[-22, Z.diagnosis.min[1] + 0.4, -15]} />
        <CTScanner position={[-18, Z.diagnosis.min[1] + 0.4, -15]} />
        <MRIScanner position={[-13.5, Z.diagnosis.min[1] + 0.4, -15.2]} />
        <MRIScanner position={[-9, Z.diagnosis.min[1] + 0.4, -15.2]} />
        <XRayMachine position={[-4.5, Z.diagnosis.min[1] + 0.4, -15]} />
        <XRayMachine position={[-0.5, Z.diagnosis.min[1] + 0.4, -15]} />
        <Workstations position={[9, Z.precision.min[1] + 0.4, -9]} />
        <Workstations position={[9, Z.precision.min[1] + 0.4, -13]} />
      </FadeGroup>

      {/* Floor 3 — pre-op readiness bays */}
      <FadeGroup hidden={hiddenAbove(Z.readiness.min[1])}>
        <BedRow start={[-21, Z.readiness.min[1] + 0.4, -9.5]} count={8} gap={2.4} />
      </FadeGroup>

      {/* Floor 4 — eight robotic ORs */}
      <FadeGroup hidden={hiddenAbove(Z.robotics.min[1])}>
        <ORRow
          positions={Array.from({ length: 8 }, (_, i) => [-21 + i * 5.6, Z.robotics.min[1] + 0.4, -9.5])}
          animate={!reducedMotion}
        />
      </FadeGroup>

      {/* Floors 5–6 — recovery wards */}
      <FadeGroup hidden={hiddenAbove(Z.care.min[1])}>
        <BedRow start={[-21, Z.care.min[1] + 0.4, -9.5]} count={8} gap={2.4} />
        <BedRow start={[2, Z.care.min[1] + 0.4, -12.5]} count={6} gap={2.4} />
      </FadeGroup>
      <FadeGroup hidden={hiddenAbove(Z["care-upper"].min[1])}>
        <BedRow start={[-21, Z["care-upper"].min[1] + 0.4, -9.5]} count={8} gap={2.4} />
        <BedRow start={[2, Z["care-upper"].min[1] + 0.4, -12.5]} count={6} gap={2.4} />
      </FadeGroup>

      <ElevatorCore ceilingY={ceilingY} />
      <ElevatorCabs ceilingY={ceilingY} />
      <Helipad />
      <MedicalQuadcopter />
      <ParkingLot animate={!reducedMotion} />
      <RoadMarkings />
      <ZoneOutlines ceilingY={ceilingY} />
    </group>
  );
}
