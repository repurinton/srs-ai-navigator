import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CapsuleGeometry, Color, InstancedMesh, Object3D, SphereGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { StageId } from "@/lib/hospital-sim";
import {
  PATIENT_FLOW_COUNT,
  PATIENT_FLOW_SPEED,
  PATIENT_WAIT_RED_SECONDS,
  WORLD_PATIENT_JOURNEY,
  WORLD_PATIENT_QUEUES,
} from "@/lib/hospital-world";

const BASE_COLOR = new Color("#cfd9e6");
const WAIT_COLOR = new Color("#ff5347");
const RELEASE_RECOVERY_SECONDS = 5;
const RELEASE_STAGGER_SECONDS = 0.35;
const SLOT_APPROACH_SPEED = 2.6;

type PatientMode = "walking" | "queued" | "releasing";

interface PatientState {
  s: number;
  mode: PatientMode;
  queueStage?: StageId;
  slot: number;
  wait: number;
  tint: number;
  releaseAt: number;
  position: Vector3;
  heading: number;
}

interface JourneyGeometry {
  points: Vector3[];
  cumulative: number[];
  total: number;
  /** Path distance of each gate checkpoint, keyed by stage. */
  checkpointS: Partial<Record<StageId, number>>;
}

function buildJourney(): JourneyGeometry {
  const points = WORLD_PATIENT_JOURNEY.map((w) => new Vector3(...w.point));
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    cumulative.push(cumulative[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  const checkpointS: Partial<Record<StageId, number>> = {};
  WORLD_PATIENT_JOURNEY.forEach((w, i) => {
    if (w.queueStage) checkpointS[w.queueStage] = cumulative[i];
  });
  return { points, cumulative, total: cumulative[cumulative.length - 1], checkpointS };
}

function pointAt(journey: JourneyGeometry, s: number, out: Vector3): Vector3 {
  const distance = Math.max(0, Math.min(journey.total, s));
  let index = 1;
  while (index < journey.cumulative.length - 1 && journey.cumulative[index] < distance) index += 1;
  const segStart = journey.cumulative[index - 1];
  const segLength = journey.cumulative[index] - segStart || 1;
  const t = (distance - segStart) / segLength;
  return out.copy(journey.points[index - 1]).lerp(journey.points[index], t);
}

function slotPosition(stage: StageId, slot: number, out: Vector3): Vector3 {
  const queue = WORLD_PATIENT_QUEUES[stage];
  const row = Math.floor(slot / queue.perRow);
  const column = slot % queue.perRow;
  return out.set(
    queue.origin[0] + queue.right[0] * column + queue.back[0] * row,
    queue.origin[1] + queue.right[1] * column + queue.back[1] * row,
    queue.origin[2] + queue.right[2] * column + queue.back[2] * row,
  );
}

const dummy = new Object3D();
const target = new Vector3();
const color = new Color();

/**
 * A continuous population of patients walking the full care journey.
 * When the story's pressure sits on a stage, arriving patients stop at that
 * stage's checkpoint and accumulate in a queue, reddening the longer they
 * wait. When the pressure resolves, the queue drains forward one patient at
 * a time and hue recovers as they walk.
 */
export function PatientFlow({
  gateStage,
  playing,
  reducedMotion,
}: {
  gateStage?: StageId;
  playing: boolean;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const journey = useMemo(buildJourney, []);
  const geometry = useMemo(() => {
    const body = new CapsuleGeometry(0.3, 0.68, 3, 8);
    body.translate(0, 0.66, 0);
    const head = new SphereGeometry(0.22, 8, 6);
    head.translate(0, 1.34, 0);
    return mergeGeometries([body, head]);
  }, []);

  const elapsed = useRef(0);
  const previousGate = useRef<StageId | undefined>(undefined);
  const queueLength = useRef(0);
  const states = useRef<PatientState[]>([]);
  if (states.current.length === 0) {
    states.current = Array.from({ length: PATIENT_FLOW_COUNT }, (_, i) => {
      const s = (i / PATIENT_FLOW_COUNT) * journey.total;
      const position = pointAt(journey, s, new Vector3()).clone();
      return { s, mode: "walking" as PatientMode, slot: 0, wait: 0, tint: 0, releaseAt: 0, position, heading: 0 };
    });
  }

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const delta = reducedMotion || !playing ? 0 : Math.min(rawDelta, 0.06);
    elapsed.current += delta;

    // Gate transitions: release everyone queued at a stage that is no longer
    // the active pressure, staggered so the queue visibly drains.
    if (previousGate.current !== gateStage) {
      let releaseIndex = 0;
      for (const patient of states.current) {
        if (patient.mode === "queued" && patient.queueStage !== gateStage) {
          patient.mode = "releasing";
          patient.releaseAt = elapsed.current + releaseIndex * RELEASE_STAGGER_SECONDS;
          releaseIndex += 1;
        }
      }
      queueLength.current = 0;
      previousGate.current = gateStage;
    }

    const gateS = gateStage ? journey.checkpointS[gateStage] : undefined;

    for (let i = 0; i < states.current.length; i += 1) {
      const patient = states.current[i];

      if (patient.mode === "walking") {
        const previousS = patient.s;
        patient.s += PATIENT_FLOW_SPEED * delta;
        patient.tint = Math.max(0, patient.tint - delta / RELEASE_RECOVERY_SECONDS);
        if (gateStage && gateS !== undefined && previousS < gateS && patient.s >= gateS) {
          patient.mode = "queued";
          patient.queueStage = gateStage;
          patient.slot = queueLength.current;
          queueLength.current += 1;
          patient.s = gateS;
          patient.wait = 0;
        }
        if (patient.s >= journey.total) {
          patient.s -= journey.total;
          patient.tint = 0;
          patient.position.copy(pointAt(journey, patient.s, target));
        }
      } else if (patient.mode === "queued") {
        patient.wait += delta;
        patient.tint = Math.min(1, patient.wait / PATIENT_WAIT_RED_SECONDS);
      } else if (patient.mode === "releasing" && elapsed.current >= patient.releaseAt) {
        patient.mode = "walking";
        patient.queueStage = undefined;
      }

      // Movement: queued (and not-yet-released) patients drift to their slot;
      // walkers track the journey path.
      if (patient.mode === "queued" || patient.mode === "releasing") {
        slotPosition(patient.queueStage ?? gateStage ?? "access", patient.slot, target);
      } else {
        pointAt(journey, patient.s, target);
      }
      const distance = patient.position.distanceTo(target);
      if (distance > 0.001) {
        const step = (patient.mode === "walking" ? PATIENT_FLOW_SPEED : SLOT_APPROACH_SPEED) * delta;
        if (delta === 0 || step >= distance) {
          patient.position.copy(target);
        } else {
          patient.heading = Math.atan2(target.x - patient.position.x, target.z - patient.position.z);
          patient.position.lerp(target, step / distance);
        }
      }

      dummy.position.copy(patient.position);
      dummy.rotation.set(0, patient.heading, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(BASE_COLOR).lerp(WAIT_COLOR, patient.tint);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    (window as unknown as { __patientFlowDebug?: object }).__patientFlowDebug = {
      gateStage: gateStage ?? null,
      queued: states.current.filter((p) => p.mode === "queued").length,
      releasing: states.current.filter((p) => p.mode === "releasing").length,
      maxTint: Math.round(Math.max(...states.current.map((p) => p.tint)) * 100) / 100,
    };
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, PATIENT_FLOW_COUNT]} frustumCulled={false}>
      <meshLambertMaterial />
    </instancedMesh>
  );
}
