import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Material, Mesh } from "three";

type FadableMaterial = Material & { opacity: number };

const HIDDEN_FLOOR = 0.05;
const FADE_RATE = 6;

/**
 * Fades an entire subtree toward near-invisible and back. Used to drop the
 * tower floors above the camera's focus so the zoomed interior reads
 * unobstructed. Baseline opacity/transparency/depthWrite of every material
 * is captured on first touch and restored when fully visible.
 */
export function FadeGroup({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  const groupRef = useRef<Group>(null);
  const level = useRef(1);
  const settled = useRef(false);

  useFrame((_, delta) => {
    const debug = ((window as unknown as { __fadeDebug?: { hidden: number; fading: number; total: number } }).__fadeDebug ??= { hidden: 0, fading: 0, total: 0 });
    debug.total += 1;
    if (hidden) debug.hidden += 1;
    const target = hidden ? 0 : 1;
    const distance = Math.abs(level.current - target);
    if (distance < 0.005) {
      if (!settled.current) {
        level.current = target;
        apply();
        settled.current = true;
      }
      return;
    }
    debug.fading += 1;
    settled.current = false;
    level.current += (target - level.current) * Math.min(1, delta * FADE_RATE);
    apply();
  });

  function apply() {
    groupRef.current?.traverse((object) => {
      const material = (object as Mesh).material as FadableMaterial | undefined;
      if (!material || typeof material.opacity !== "number") return;
      const data = material.userData as {
        baseOpacity?: number;
        baseTransparent?: boolean;
        baseDepthWrite?: boolean;
      };
      data.baseOpacity ??= material.opacity;
      data.baseTransparent ??= material.transparent;
      data.baseDepthWrite ??= material.depthWrite;
      const visibility = HIDDEN_FLOOR + (1 - HIDDEN_FLOOR) * level.current;
      const nextTransparent = data.baseTransparent || level.current < 0.999;
      if (material.transparent !== nextTransparent) {
        material.transparent = nextTransparent;
        material.needsUpdate = true;
      }
      material.opacity = data.baseOpacity * visibility;
      material.depthWrite = level.current > 0.5 ? data.baseDepthWrite : false;
      const debug = (window as unknown as { __fadeDebug?: { sampleOpacity?: number } }).__fadeDebug;
      if (debug && level.current < 0.99) debug.sampleOpacity = material.opacity;
    });
  }

  return <group ref={groupRef}>{children}</group>;
}
