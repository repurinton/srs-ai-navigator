import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  EdgesGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import type { LeverId, SimulationResult, StageId } from "@/lib/hospital-sim";
import { LEVER_META } from "@/lib/hospital-sim";
import type { HospitalStoryBeat } from "@/lib/hospital-story";
import { WORLD_ZONES, type WorldZone } from "@/lib/hospital-world";

const AMBER = "#ffb454";
const CORAL = "#ff716d";
const MINT = "#5bf0c3";

export type ZoneVisualState = "pressure" | "constraint" | "solution" | "resolved";

const STATE_COLOR: Record<ZoneVisualState, string> = {
  pressure: AMBER,
  constraint: CORAL,
  solution: MINT,
  resolved: MINT,
};

const MAX_QUEUE_FIGURES = 14;
const QUEUE_SCALE = 8;

function zoneFor(stage: StageId | undefined): WorldZone | undefined {
  return stage ? WORLD_ZONES[stage] : undefined;
}

/** Compact waiting crowd at the zone's open (south) edge, sized by the sim. */
function QueueFigures({
  zone,
  count,
  color,
}: {
  zone: WorldZone;
  count: number;
  color: string;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const capsule = new CapsuleGeometry(0.3, 0.65, 3, 8);
    capsule.translate(0, 0.65, 0);
    return capsule;
  }, []);

  const positions = useMemo(() => {
    const dummy = new Object3D();
    const list: Object3D[] = [];
    const perRow = 7;
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / perRow);
      const column = index % perRow;
      dummy.position.set(
        zone.min[0] + 1.6 + column * 1.15 + (row % 2) * 0.5,
        zone.min[1] + 0.4,
        zone.max[2] - 1.4 - row * 1.15,
      );
      dummy.updateMatrix();
      list.push(dummy.clone());
    }
    return list;
  }, [zone, count]);

  return (
    <instancedMesh
      key={`${zone.id}-${count}-${color}`}
      ref={(mesh) => {
        meshRef.current = mesh;
        if (!mesh) return;
        positions.forEach((entry, index) => mesh.setMatrixAt(index, entry.matrix));
        mesh.instanceMatrix.needsUpdate = true;
        for (let index = 0; index < positions.length; index += 1) {
          mesh.setColorAt(index, new Color(color));
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }}
      args={[geometry, undefined, Math.max(1, positions.length)]}
      count={positions.length}
    >
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/**
 * The story's visual grammar, in world space: amber floor decal for surfaced
 * pressure, coral outline + fuller queue for the modeled constraint, a
 * lever-colored pulse while the AI response materializes, and a mint receipt
 * pulse on resolve. Everything derives from the same props the DOM reads.
 */
export function ZoneStateEffects({
  focusStage,
  visualState,
  storyBeat,
  materializingLever,
  simulation,
}: {
  focusStage?: StageId;
  visualState?: ZoneVisualState;
  storyBeat: HospitalStoryBeat;
  materializingLever?: LeverId;
  simulation: SimulationResult;
}) {
  const decalRef = useRef<Mesh>(null);
  const pulseRef = useRef<Mesh>(null);
  const clock = useRef(0);

  const zone = zoneFor(focusStage);
  const state: ZoneVisualState = visualState
    ?? (storyBeat === "materialize" ? "solution" : storyBeat === "resolve" ? "resolved" : "pressure");
  const color = materializingLever && state === "solution"
    ? LEVER_META[materializingLever].color
    : STATE_COLOR[state];

  const queueCount = useMemo(() => {
    if (!focusStage) return 0;
    const stage = simulation.stageResults[focusStage];
    return Math.min(MAX_QUEUE_FIGURES, Math.round(stage.peakQueue / QUEUE_SCALE));
  }, [focusStage, simulation]);

  const outlineGeometry = useMemo(() => {
    if (!zone) return null;
    const size = [zone.max[0] - zone.min[0], zone.max[1] - zone.min[1], zone.max[2] - zone.min[2]] as const;
    return new EdgesGeometry(new BoxGeometry(size[0] + 0.4, size[1] + 0.4, size[2] + 0.4));
  }, [zone]);

  useFrame((_, delta) => {
    clock.current += delta;
    const breathe = 0.5 + 0.5 * Math.sin(clock.current * 2.2);
    if (decalRef.current) {
      const material = decalRef.current.material as MeshBasicMaterial;
      material.opacity = state === "resolved" ? 0.12 + 0.06 * breathe : 0.16 + 0.14 * breathe;
    }
    if (pulseRef.current) {
      const material = pulseRef.current.material as MeshBasicMaterial;
      const phase = (clock.current % 1.8) / 1.8;
      pulseRef.current.scale.setScalar(0.6 + phase * 1.1);
      material.opacity = 0.5 * (1 - phase);
    }
  });

  if (!zone) return null;

  const center: [number, number, number] = [
    (zone.min[0] + zone.max[0]) / 2,
    zone.min[1] + 0.46,
    (zone.min[2] + zone.max[2]) / 2,
  ];

  return (
    <group name="zone-state">
      {/* Breathing floor decal in the state color */}
      <mesh
        ref={decalRef}
        position={center}
        rotation={[-Math.PI / 2, 0, 0]}
        key={`decal-${zone.id}-${state}`}
      >
        <planeGeometry args={[zone.max[0] - zone.min[0] - 1.2, zone.max[2] - zone.min[2] - 1.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Constraint gets a hard coral architectural outline */}
      {state === "constraint" && outlineGeometry && (
        <lineSegments
          geometry={outlineGeometry}
          position={[
            (zone.min[0] + zone.max[0]) / 2,
            (zone.min[1] + zone.max[1]) / 2,
            (zone.min[2] + zone.max[2]) / 2,
          ]}
        >
          <lineBasicMaterial color={CORAL} transparent opacity={0.9} />
        </lineSegments>
      )}

      {/* Materialize/resolve pulse ring above the zone */}
      {(state === "solution" || state === "resolved") && (
        <mesh
          ref={pulseRef}
          position={[center[0], zone.min[1] + 0.5, center[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          key={`pulse-${zone.id}-${state}`}
        >
          <ringGeometry args={[2.6, 3.1, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}

      {/* The waiting crowd — the queue made physical */}
      {(state === "pressure" || state === "constraint") && queueCount > 0 && (
        <QueueFigures zone={zone} count={queueCount} color={state === "constraint" ? CORAL : AMBER} />
      )}
    </group>
  );
}
