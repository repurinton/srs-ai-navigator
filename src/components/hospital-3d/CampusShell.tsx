import { useMemo } from "react";
import { BoxGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { WORLD_DOORWAY, WORLD_GROUND, WORLD_SURFACES, WORLD_ZONES, type Vec3, type WorldZone } from "@/lib/hospital-world";
import { FadeGroup } from "./FadeGroup";

function boxCenter(min: Vec3, max: Vec3): Vec3 {
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
}

function boxSize(min: Vec3, max: Vec3): Vec3 {
  return [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
}

function translatedBox(size: Vec3, position: Vec3) {
  const geometry = new BoxGeometry(size[0], size[1], size[2]);
  geometry.translate(position[0], position[1], position[2]);
  return geometry;
}

/**
 * One graybox zone volume — floor slab plus back and side walls (open toward
 * the camera) merged into a single geometry: one draw call per zone. Side
 * walls carry a doorway gap in the shared corridor band so paths cross
 * between zones through openings instead of clipping through solid walls.
 */
function ZoneVolume({ zone }: { zone: WorldZone }) {
  const geometry = useMemo(() => {
    const center = boxCenter(zone.min, zone.max);
    const size = boxSize(zone.min, zone.max);
    const wall = 0.35;
    const floorThickness = 0.4;

    const parts = [
      translatedBox([size[0], floorThickness, size[2]], [center[0], zone.min[1] + floorThickness / 2, center[2]]),
      translatedBox([size[0], size[1], wall], [center[0], center[1], zone.min[2] + wall / 2]),
    ];

    // Side walls, split around the doorway band when the zone spans it.
    for (const x of [zone.min[0] + wall / 2, zone.max[0] - wall / 2]) {
      const spansDoorway = zone.min[2] < WORLD_DOORWAY.zMin && zone.max[2] > WORLD_DOORWAY.zMax;
      if (spansDoorway) {
        const northDepth = WORLD_DOORWAY.zMin - zone.min[2];
        const southDepth = zone.max[2] - WORLD_DOORWAY.zMax;
        if (northDepth > 0.1) {
          parts.push(translatedBox([wall, size[1], northDepth], [x, center[1], zone.min[2] + northDepth / 2]));
        }
        if (southDepth > 0.1) {
          parts.push(translatedBox([wall, size[1], southDepth], [x, center[1], zone.max[2] - southDepth / 2]));
        }
      } else {
        parts.push(translatedBox([wall, size[1], size[2]], [x, center[1], center[2]]));
      }
    }

    return mergeGeometries(parts);
  }, [zone]);

  return (
    <mesh name={`zone-${zone.id}`} geometry={geometry}>
      <meshLambertMaterial color={zone.color} />
    </mesh>
  );
}

function Surface({ min, max, color }: { min: Vec3; max: Vec3; color: string }) {
  const center = boxCenter(min, max);
  const size = boxSize(min, max);
  return (
    <mesh position={[center[0], min[1] + 0.05, center[2]]}>
      <boxGeometry args={[size[0], 0.1, size[2]]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/**
 * The open-sided campus: ground, roads, parking, and one graybox volume per
 * zone. Zone volumes at or above the camera's focus ceiling fade out so the
 * zoomed floor reads unobstructed.
 */
export function CampusShell({ ceilingY }: { ceilingY: number }) {
  const groundCenter = boxCenter(WORLD_GROUND.min, WORLD_GROUND.max);
  const groundSize = boxSize(WORLD_GROUND.min, WORLD_GROUND.max);
  // The home node is an open neighborhood plot, not a walled hospital room.
  const zones = useMemo(() => Object.values(WORLD_ZONES).filter((zone) => zone.id !== "home"), []);
  const home = WORLD_ZONES.home;

  return (
    <group name="campus">
      <mesh position={[groundCenter[0], groundCenter[1], groundCenter[2]]}>
        <boxGeometry args={[groundSize[0], groundSize[1], groundSize[2]]} />
        <meshLambertMaterial color="#152730" />
      </mesh>

      <Surface min={WORLD_SURFACES.mainRoad.min} max={WORLD_SURFACES.mainRoad.max} color="#233842" />
      <Surface min={WORLD_SURFACES.arrivalLoop.min} max={WORLD_SURFACES.arrivalLoop.max} color="#26404b" />
      <Surface min={WORLD_SURFACES.emsSpur.min} max={WORLD_SURFACES.emsSpur.max} color="#233842" />
      <Surface min={WORLD_SURFACES.parkingConnector.min} max={WORLD_SURFACES.parkingConnector.max} color="#233842" />
      <Surface min={WORLD_SURFACES.parking.min} max={WORLD_SURFACES.parking.max} color="#1d323c" />
      <Surface min={WORLD_SURFACES.serviceDock.min} max={WORLD_SURFACES.serviceDock.max} color="#26333b" />
      <Surface min={WORLD_SURFACES.dischargePlaza.min} max={WORLD_SURFACES.dischargePlaza.max} color="#26404b" />
      <Surface min={home.min} max={[home.max[0], home.min[1] + 0.1, home.max[2]] as Vec3} color="#1e3226" />

      {zones.map((zone) => (
        <FadeGroup key={zone.id} hidden={zone.min[1] >= ceilingY - 0.01}>
          <ZoneVolume zone={zone} />
        </FadeGroup>
      ))}
    </group>
  );
}
