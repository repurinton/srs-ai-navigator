import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { HospitalCutawayProps } from "@/components/HospitalCutaway";
import type { HospitalRendererMode } from "@/lib/renderer-mode";
import type { WorldPoseId } from "@/lib/hospital-world";
import { CampusShell } from "./CampusShell";
import { CameraDirector } from "./CameraDirector";
import { AnchorProjector } from "./AnchorProjector";
import { ActorSystem } from "./actors/ActorSystem";
import { PatientFlow } from "./actors/PatientFlow";
import { ZoneEquipment } from "./ZoneEquipment";
import { ZoneStateEffects, type ZoneVisualState } from "./ZoneStateEffects";

export type CutawayScene3DProps = {
  scene: HospitalCutawayProps;
  /** Camera pose for the current story focus (changes only on reveal/jump). */
  poseId: WorldPoseId;
  tier: Exclude<HospitalRendererMode, "2d">;
  /** Invoked on WebGL context loss or any unrecoverable renderer failure. */
  onFallback: (reason: string) => void;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      document.documentElement.dataset.reducedMotion === "true"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(
        document.documentElement.dataset.reducedMotion === "true" || query.matches,
      );
    };
    query.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduced-motion"] });
    return () => {
      query.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return reduced;
}

/**
 * WebGL2 hospital diorama. Renders inside `.cutaway-world`, so the shared DOM
 * overlays (zone labels, lever beacons, callouts) composite on top exactly as
 * they do over the 2D raster — their positions come from the anchor projector.
 */
export default function CutawayScene3D({ scene, poseId, tier, onFallback }: CutawayScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const dpr = tier === "3d" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onFallback("webgl context lost");
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [onFallback]);

  return (
    <div className="cutaway-canvas3d" aria-hidden="true">
      <Canvas
        ref={canvasRef}
        dpr={dpr}
        orthographic
        camera={{ position: [60, 66, 84], zoom: 11, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0b2028");
        }}
        fallback={null}
      >
        <hemisphereLight args={["#cfe8f2", "#182a33", 0.9]} />
        <directionalLight position={[30, 48, 18]} intensity={1.4} color="#fff4e0" />
        <CameraDirector poseId={poseId} reducedMotion={reducedMotion} />
        <AnchorProjector />
        <CampusShell />
        <ZoneEquipment />
        <ZoneStateEffects
          focusStage={scene.focusStage}
          visualState={scene.painPoints?.[0]?.visualState as ZoneVisualState | undefined}
          storyBeat={scene.storyBeat ?? "surface"}
          materializingLever={scene.materializingLever}
        />
        {/* Ambient life keeps moving while the presenter pauses to talk; only
            reduced motion freezes the diorama. */}
        <ActorSystem playing={!reducedMotion} reducedMotion={reducedMotion} />
        <PatientFlow
          gateStage={(() => {
            const visualState = scene.painPoints?.[0]?.visualState as ZoneVisualState | undefined;
            const beat = scene.storyBeat ?? "surface";
            if (beat === "resolve") return undefined;
            const pressureShown = visualState === "pressure" || visualState === "constraint" || beat === "materialize";
            return pressureShown ? scene.focusStage : undefined;
          })()}
          playing={!reducedMotion}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
