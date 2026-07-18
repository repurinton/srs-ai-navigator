import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import {
  CAMERA_DIRECTION,
  CAMERA_REFERENCE_WIDTH,
  CAMERA_TWEEN_SECONDS,
  WORLD_CAMERA_POSES,
  type WorldPoseId,
} from "@/lib/hospital-world";

const CAMERA_OFFSET = new Vector3(...CAMERA_DIRECTION).normalize().multiplyScalar(90);

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * Orthographic architectural camera. Fixed azimuth/elevation; only the target
 * and zoom change, and they change exactly once per pose transition (the story
 * contract moves the camera only on reveal beats or manual jumps). Reduced
 * motion turns tweens into cuts.
 */
export function CameraDirector({ poseId, reducedMotion }: { poseId: WorldPoseId; reducedMotion: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  const current = useRef({ target: new Vector3(), zoom: 0, initialized: false });
  const from = useRef({ target: new Vector3(), zoom: 0 });
  const goal = useRef({ target: new Vector3(), zoom: 0 });
  const tween = useRef({ active: false, elapsed: 0 });

  const portrait = size.height > size.width;
  const zoomScale = size.width / CAMERA_REFERENCE_WIDTH;

  useEffect(() => {
    const pose = WORLD_CAMERA_POSES[poseId] ?? WORLD_CAMERA_POSES.overview;
    const variant = portrait && pose.portrait ? pose.portrait : pose;
    const target = new Vector3(...variant.target);
    const zoom = variant.zoom * zoomScale;

    if (!current.current.initialized || reducedMotion) {
      current.current = { target, zoom, initialized: true };
      tween.current.active = false;
    } else {
      from.current = { target: current.current.target.clone(), zoom: current.current.zoom };
      goal.current = { target, zoom };
      tween.current = { active: true, elapsed: 0 };
    }
    invalidate();
  }, [poseId, portrait, zoomScale, reducedMotion, invalidate]);

  useFrame((state, delta) => {
    if (tween.current.active) {
      tween.current.elapsed += delta;
      const progress = Math.min(1, tween.current.elapsed / CAMERA_TWEEN_SECONDS);
      const eased = smoothstep(progress);
      current.current.target.lerpVectors(from.current.target, goal.current.target, eased);
      current.current.zoom = from.current.zoom + (goal.current.zoom - from.current.zoom) * eased;
      if (progress >= 1) tween.current.active = false;
      invalidate();
    }
    camera.position.copy(current.current.target).add(CAMERA_OFFSET);
    camera.zoom = current.current.zoom;
    camera.lookAt(current.current.target);
    camera.updateProjectionMatrix();

    (window as unknown as { __hospital3dDebug?: object }).__hospital3dDebug = {
      poseId,
      target: current.current.target.toArray(),
      zoom: current.current.zoom,
      cameraPosition: camera.position.toArray(),
      tweenActive: tween.current.active,
      drawCalls: state.gl.info.render.calls,
      triangles: state.gl.info.render.triangles,
      size: { width: size.width, height: size.height },
    };
  });

  return null;
}
