import { useMemo } from "react";
import { EdgesGeometry, BoxGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { WORLD_SURFACES, WORLD_ZONES } from "@/lib/hospital-world";

function translatedBox(size: [number, number, number], position: [number, number, number]) {
  const geometry = new BoxGeometry(...size);
  geometry.translate(...position);
  return geometry;
}

/**
 * Procedural low-poly equipment that makes each zone read as itself within
 * seconds: CT/MRI gantries, robotic OR tables, bed rows, canopies, houses.
 * All positions derive from the zone bounds in the world manifest.
 */

const Z = WORLD_ZONES;

function CTScanner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Gantry ring */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.35, 0.42, 10, 20]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      {/* Patient bed through the bore */}
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
      {/* Bore */}
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

function ORBay({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.55, 0.9, 0.5]} />
        <meshLambertMaterial color="#9aa7ae" />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[2.1, 0.14, 0.75]} />
        <meshLambertMaterial color="#dfe6ea" />
      </mesh>
      {/* Robot column + boom arms */}
      <mesh position={[1.15, 1.05, -0.85]}>
        <cylinderGeometry args={[0.16, 0.22, 2.1, 8]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh position={[0.7, 1.95, -0.5]} rotation={[0, 0.7, -0.35]}>
        <boxGeometry args={[1.35, 0.14, 0.16]} />
        <meshLambertMaterial color="#dde4e8" />
      </mesh>
      <mesh position={[0.25, 1.55, -0.15]} rotation={[0, 0.4, 0.5]}>
        <boxGeometry args={[1.05, 0.12, 0.14]} />
        <meshLambertMaterial color="#cfd8dd" />
      </mesh>
      {/* Overhead light */}
      <mesh position={[-0.7, 2.3, 0.35]}>
        <cylinderGeometry args={[0.4, 0.46, 0.14, 10]} />
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
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 2.6, 0, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.8, 0.1, 0.9]} />
            <meshLambertMaterial color="#b3bfc7" />
          </mesh>
          <mesh position={[0, 1.35, -0.3]}>
            <boxGeometry args={[1.3, 0.75, 0.08]} />
            <meshLambertMaterial color="#1d3d4d" emissive="#3b8ca8" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
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
function ZoneOutlines() {
  const outlines = useMemo(
    () =>
      Object.values(Z).map((zone) => {
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
        return { id: zone.id, geometry: new EdgesGeometry(new BoxGeometry(...size)), center };
      }),
    [],
  );
  return (
    <group>
      {outlines.map(({ id, geometry, center }) => (
        <lineSegments key={id} geometry={geometry} position={center}>
          <lineBasicMaterial color="#04141c" transparent opacity={0.55} />
        </lineSegments>
      ))}
    </group>
  );
}

export function ZoneEquipment() {
  return (
    <group name="equipment">
      {/* Diagnostics — CT + MRI */}
      <CTScanner position={[(Z.diagnosis.min[0] + Z.diagnosis.max[0]) / 2 - 3.5, Z.diagnosis.min[1] + 0.4, -13.5]} />
      <MRIScanner position={[(Z.diagnosis.min[0] + Z.diagnosis.max[0]) / 2 + 3.5, Z.diagnosis.min[1] + 0.4, -14]} />

      {/* Precision planning — workstation row */}
      <Workstations position={[Z.precision.min[0] + 1.6, Z.precision.min[1] + 0.4, -13.5]} />

      {/* Pre-op readiness — six prep bays along the open south edge, in view
          below the stepped-back third floor */}
      <BedRow start={[Z.readiness.min[0] + 2, Z.readiness.min[1] + 0.4, -5.2]} count={6} gap={2.3} />

      {/* Robotic ORs — two bays with tables, arms, lights on the open edge */}
      <ORBay position={[-3, Z.robotics.min[1] + 0.4, -5.5]} />
      <ORBay position={[3.5, Z.robotics.min[1] + 0.4, -5.5]} />

      {/* Recovery ward — two bed rows */}
      <BedRow start={[Z.care.min[0] + 1.6, Z.care.min[1] + 0.4, -14.5]} count={6} gap={2.3} />
      <BedRow start={[Z.care.min[0] + 1.6, Z.care.min[1] + 0.4, -6.5]} count={6} gap={2.3} />

      {/* Arrival — registration counter + valet canopy at the front doors */}
      <Counter position={[-6, Z.access.min[1] + 0.9, -10]} width={5} />
      <Canopy position={[-6, Z.access.min[1], 5.6]} width={9} depth={3.4} accent="#7fd4c0" />

      {/* EMS — dock canopy with a coral accent */}
      <Canopy position={[Z.ems.min[0] - 2.2, Z.ems.min[1], -5]} width={4.5} depth={7} accent="#ff716d" />

      {/* Discharge lounge — seat rows facing the plaza */}
      <SeatRows position={[(Z.longitudinal.min[0] + Z.longitudinal.max[0]) / 2, Z.longitudinal.min[1] + 0.4, -12]} />

      {/* Home node — the longitudinal-care destination */}
      <House position={[43, Z.home.min[1], 11]} />
      <House position={[48.5, Z.home.min[1], 15]} scale={0.85} />
      <House position={[43.5, Z.home.min[1], 17.5]} scale={0.7} />

      <RoadMarkings />
      <ZoneOutlines />
    </group>
  );
}
