import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { clearProjectedAnchors, publishProjectedAnchors, type ProjectedAnchor } from "@/lib/anchor-projection";
import { WORLD_ANCHORS, WORLD_ZONE_LABEL_ANCHORS } from "@/lib/hospital-world";

const scratch = new Vector3();

/**
 * Projects every semantic world anchor into viewport percentages each frame
 * and publishes them to the DOM overlay store. The store itself deduplicates,
 * so a static camera publishes nothing.
 */
export function AnchorProjector() {
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const projected: Record<string, ProjectedAnchor> = {};
    for (const [id, point] of Object.entries(WORLD_ANCHORS)) {
      scratch.set(point[0], point[1], point[2]).project(camera);
      projected[id] = {
        x: ((scratch.x + 1) / 2) * 100,
        y: ((1 - scratch.y) / 2) * 100,
      };
    }
    for (const [id, point] of Object.entries(WORLD_ZONE_LABEL_ANCHORS)) {
      scratch.set(point[0], point[1], point[2]).project(camera);
      projected[`zone-${id}`] = {
        x: ((scratch.x + 1) / 2) * 100,
        y: ((1 - scratch.y) / 2) * 100,
      };
    }
    publishProjectedAnchors(projected);
  });

  useEffect(() => () => clearProjectedAnchors(), []);

  return null;
}
