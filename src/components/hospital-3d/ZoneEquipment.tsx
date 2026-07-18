import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EdgesGeometry, BoxGeometry, type Group, type Mesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  WORLD_ELEVATOR,
  WORLD_ELEVATOR_STOPS,
  WORLD_HELIPAD,
  WORLD_SURFACES,
  WORLD_ZONES,
} from "@/lib/hospital-world";
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

/** All OR bays merged into two draw calls: structure + emissive lights. */
function ORRow({ positions }: { positions: [number, number, number][] }) {
  const { structure, lights } = useMemo(() => {
    const structureParts = [];
    const lightParts = [];
    for (const [x, y, z] of positions) {
      const pedestal = new BoxGeometry(0.55, 0.9, 0.5);
      pedestal.translate(x, y + 0.45, z);
      const table = new BoxGeometry(2.1, 0.14, 0.75);
      table.translate(x, y + 0.98, z);
      const column = new BoxGeometry(0.3, 2.1, 0.3);
      column.translate(x + 1.15, y + 1.05, z - 0.85);
      const boomA = new BoxGeometry(1.35, 0.14, 0.16);
      boomA.rotateZ(-0.35);
      boomA.rotateY(0.7);
      boomA.translate(x + 0.7, y + 1.95, z - 0.5);
      const boomB = new BoxGeometry(1.05, 0.12, 0.14);
      boomB.rotateZ(0.5);
      boomB.rotateY(0.4);
      boomB.translate(x + 0.25, y + 1.55, z - 0.15);
      structureParts.push(pedestal, table, column, boomA, boomB);
      const light = new BoxGeometry(0.8, 0.14, 0.8);
      light.translate(x - 0.7, y + 2.3, z + 0.35);
      lightParts.push(light);
    }
    return { structure: mergeGeometries(structureParts), lights: mergeGeometries(lightParts) };
  }, [positions]);

  return (
    <group>
      <mesh geometry={structure}>
        <meshLambertMaterial color="#dbe2e7" />
      </mesh>
      <mesh geometry={lights}>
        <meshLambertMaterial color="#f2f6f8" emissive="#8fb9c9" emissiveIntensity={0.35} />
      </mesh>
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

function House({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[3, 2, 2.6]} />
        <meshLambertMaterial color="#8a8378" />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.35, 1.4, 4]} />
        <meshLambertMaterial color="#6d675e" />
      </mesh>
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

/** Static parked cars filling stalls while animated traffic comes and goes. */
function ParkedCars() {
  const geometry = useMemo(() => {
    const parking = WORLD_SURFACES.parking;
    const parts = [];
    const stallCount = Math.floor((parking.max[0] - parking.min[0] - 4) / 3.2);
    for (let i = 0; i < stallCount; i += 1) {
      if (i % 3 === 1) continue; // leave some stalls open for the animated cars
      const x = parking.min[0] + 3.6 + i * 3.2;
      const z = (parking.min[2] + parking.max[2]) / 2 + (i % 2 === 0 ? -1.6 : 1.6);
      parts.push(
        translatedBox([2.2, 0.55, 1.05], [x, 0.45, z]),
        translatedBox([1.15, 0.42, 0.9], [x - 0.12, 0.93, z]),
      );
    }
    return mergeGeometries(parts);
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color="#6c8296" />
    </mesh>
  );
}

/**
 * The animated elevator cab: rides the shaft stop-to-stop and slides its
 * doors open at every floor. Deterministic time loop, doors face east so the
 * camera sees them open and close as patients flow.
 */
function ElevatorCab() {
  const cabRef = useRef<Group>(null);
  const doorNorthRef = useRef<Mesh>(null);
  const doorSouthRef = useRef<Mesh>(null);
  const clock = useRef(0);

  const TRAVEL = 2.2;
  const DWELL = 3.2;
  const legs = WORLD_ELEVATOR_STOPS.length * 2 - 2;
  const period = legs * (TRAVEL + DWELL);
  const centerX = (WORLD_ELEVATOR.min[0] + WORLD_ELEVATOR.max[0]) / 2;
  const centerZ = (WORLD_ELEVATOR.min[2] + WORLD_ELEVATOR.max[2]) / 2;
  const doorX = WORLD_ELEVATOR.max[0] - 0.12;

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current % period;
    const leg = Math.floor(t / (TRAVEL + DWELL));
    const within = t - leg * (TRAVEL + DWELL);
    // Bounce sequence 0..N-1..0 across the stops.
    const upLegs = WORLD_ELEVATOR_STOPS.length - 1;
    const fromIndex = leg < upLegs ? leg : legs - leg;
    const toIndex = leg < upLegs ? leg + 1 : legs - leg - 1;
    const fromY = WORLD_ELEVATOR_STOPS[fromIndex];
    const toY = WORLD_ELEVATOR_STOPS[toIndex];

    let cabY: number;
    let doorOpen = 0;
    if (within < TRAVEL) {
      const progress = within / TRAVEL;
      cabY = fromY + (toY - fromY) * (progress * progress * (3 - 2 * progress));
    } else {
      cabY = toY;
      const dwellT = (within - TRAVEL) / DWELL;
      // Open, hold, close.
      doorOpen = dwellT < 0.25 ? dwellT / 0.25 : dwellT > 0.75 ? (1 - dwellT) / 0.25 : 1;
    }

    if (cabRef.current) cabRef.current.position.y = cabY;
    const slide = 0.12 + doorOpen * 0.78;
    if (doorNorthRef.current) doorNorthRef.current.position.z = centerZ - slide;
    if (doorSouthRef.current) doorSouthRef.current.position.z = centerZ + slide;
  });

  return (
    <group>
      <group ref={cabRef}>
        {/* Cab body */}
        <mesh position={[centerX, 1.5, centerZ]}>
          <boxGeometry args={[3.2, 2.9, 3.2]} />
          <meshLambertMaterial color="#b9cdd4" />
        </mesh>
        {/* Sliding doors on the east face */}
        <mesh ref={doorNorthRef} position={[doorX, 1.45, centerZ - 0.12]}>
          <boxGeometry args={[0.1, 2.7, 1.5]} />
          <meshLambertMaterial color="#7fd4c0" />
        </mesh>
        <mesh ref={doorSouthRef} position={[doorX, 1.45, centerZ + 0.12]}>
          <boxGeometry args={[0.1, 2.7, 1.5]} />
          <meshLambertMaterial color="#7fd4c0" />
        </mesh>
      </group>
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

/**
 * Medical delivery quadcopter: white X-frame drone with a red cross and an
 * underslung med-payload pod. Recurring cycle — approach, vertical descent,
 * idle on the pad, climb out, depart. The clock starts mid-cycle so the
 * first arrival lands shortly after the scene loads.
 */
function MedicalQuadcopter() {
  const groupRef = useRef<Group>(null);
  const rotorsRef = useRef<Group>(null);
  const clock = useRef(20);
  const PERIOD = 55;
  const [px, , pz] = WORLD_HELIPAD.center;

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current % PERIOD;
    const group = groupRef.current;
    if (!group) return;

    let x = px + 34;
    let y = 26;
    let z = pz - 22;
    let visible = false;
    let rotorSpeed = 30;

    const ease = (v: number) => v * v * (3 - 2 * v);
    if (t >= 25 && t < 33) {
      const p = ease((t - 25) / 8);
      x = px + 34 - 34 * p;
      y = 26 - 16 * p;
      z = pz - 22 + 22 * p;
      visible = true;
    } else if (t >= 33 && t < 37) {
      const p = ease((t - 33) / 4);
      x = px;
      y = 10 - 9.5 * p;
      z = pz;
      visible = true;
    } else if (t >= 37 && t < 45) {
      x = px;
      y = 0.5;
      z = pz;
      visible = true;
      rotorSpeed = 8;
    } else if (t >= 45 && t < 49) {
      const p = ease((t - 45) / 4);
      x = px;
      y = 0.5 + 12 * p;
      z = pz;
      visible = true;
    } else if (t >= 49 && t < 55) {
      const p = ease((t - 49) / 6);
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
  });

  const armLength = 1.55;
  const rotorPositions: [number, number][] = [
    [armLength, armLength],
    [armLength, -armLength],
    [-armLength, armLength],
    [-armLength, -armLength],
  ];

  return (
    <group ref={groupRef} visible={false}>
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
      {/* Motors + spinning rotors */}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`motor-${index}`} position={[ax, 0.95, az]}>
          <cylinderGeometry args={[0.12, 0.14, 0.22, 8]} />
          <meshLambertMaterial color="#22343d" />
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
  );
}

/** Glass elevator core riding the tower's open west end. */
function ElevatorCore() {
  const size: [number, number, number] = [
    WORLD_ELEVATOR.max[0] - WORLD_ELEVATOR.min[0],
    WORLD_ELEVATOR.max[1] - WORLD_ELEVATOR.min[1],
    WORLD_ELEVATOR.max[2] - WORLD_ELEVATOR.min[2],
  ];
  const center: [number, number, number] = [
    (WORLD_ELEVATOR.min[0] + WORLD_ELEVATOR.max[0]) / 2,
    (WORLD_ELEVATOR.min[1] + WORLD_ELEVATOR.max[1]) / 2,
    (WORLD_ELEVATOR.min[2] + WORLD_ELEVATOR.max[2]) / 2,
  ];
  const edges = useMemo(() => new EdgesGeometry(new BoxGeometry(...size)), []);
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

/** Dashed centerline plus parking stall dividers — one merged draw call. */
function RoadMarkings() {
  const geometry = useMemo(() => {
    const road = WORLD_SURFACES.mainRoad;
    const parking = WORLD_SURFACES.parking;
    const parts = [];
    for (let x = road.min[0] + 4; x < road.max[0] - 4; x += 6) {
      parts.push(translatedBox([2.4, 0.03, 0.22], [x, 0.16, (road.min[2] + road.max[2]) / 2]));
    }
    for (let x = parking.min[0] + 2; x <= parking.max[0] - 2; x += 3.2) {
      parts.push(
        translatedBox(
          [0.18, 0.03, parking.max[2] - parking.min[2] - 1.5],
          [x, 0.16, (parking.min[2] + parking.max[2]) / 2],
        ),
      );
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

export function ZoneEquipment({ ceilingY }: { ceilingY: number }) {
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
        <CTScanner position={[-22, Z.diagnosis.min[1] + 0.4, -9]} />
        <CTScanner position={[-17, Z.diagnosis.min[1] + 0.4, -9]} />
        <MRIScanner position={[-11, Z.diagnosis.min[1] + 0.4, -9.5]} />
        <MRIScanner position={[-6, Z.diagnosis.min[1] + 0.4, -9.5]} />
        <XRayMachine position={[-1, Z.diagnosis.min[1] + 0.4, -9]} />
        <XRayMachine position={[-19, Z.diagnosis.min[1] + 0.4, -13]} />
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

      {/* Home node — the longitudinal-care destination */}
      <House position={[43, Z.home.min[1], 11]} />
      <House position={[48.5, Z.home.min[1], 15]} scale={0.85} />
      <House position={[43.5, Z.home.min[1], 17.5]} scale={0.7} />

      <ElevatorCore />
      <ElevatorCab />
      <Helipad />
      <MedicalQuadcopter />
      <ParkedCars />
      <RoadMarkings />
      <ZoneOutlines ceilingY={ceilingY} />
    </group>
  );
}
