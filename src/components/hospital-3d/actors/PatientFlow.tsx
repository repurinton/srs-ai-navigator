import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { StageId } from "@/lib/hospital-sim";
import {
  PATIENT_FLOW_COUNT,
  PATIENT_FLOW_SPEED,
  PATIENT_STRETCHER_SPEED,
  PATIENT_WAIT_RED_SECONDS,
  WORLD_PATIENT_JOURNEY,
  WORLD_PATIENT_QUEUES,
  type PatientTravelMode,
} from "@/lib/hospital-world";
import { createWalkSpriteTexture, WALK_FRAME_COUNT } from "./walk-sprite";

const BASE_COLOR = new Color("#cfd9e6");
const WAIT_COLOR = new Color("#ff5347");
const RELEASE_RECOVERY_SECONDS = 5;
const RELEASE_STAGGER_SECONDS = 0.35;
const SLOT_APPROACH_SPEED = 2.6;
const WALK_FRAMES_PER_METER = 5;

type PatientMode = "walking" | "queued" | "releasing";

interface PatientState {
  s: number;
  mode: PatientMode;
  queueStage?: StageId;
  slot: number;
  wait: number;
  tint: number;
  releaseAt: number;
  walkDistance: number;
  flipped: boolean;
  position: Vector3;
  heading: number;
}

interface JourneyGeometry {
  points: Vector3[];
  cumulative: number[];
  total: number;
  /** Travel mode of the segment beginning at waypoint i. */
  segmentMode: PatientTravelMode[];
  checkpointS: Partial<Record<StageId, number>>;
  checkpointMode: Partial<Record<StageId, PatientTravelMode>>;
}

function buildJourney(): JourneyGeometry {
  const points = WORLD_PATIENT_JOURNEY.map((w) => new Vector3(...w.point));
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    cumulative.push(cumulative[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  const segmentMode: PatientTravelMode[] = [];
  let mode: PatientTravelMode = "walk";
  for (const waypoint of WORLD_PATIENT_JOURNEY) {
    if (waypoint.travel) mode = waypoint.travel;
    segmentMode.push(mode);
  }
  const checkpointS: Partial<Record<StageId, number>> = {};
  const checkpointMode: Partial<Record<StageId, PatientTravelMode>> = {};
  WORLD_PATIENT_JOURNEY.forEach((waypoint, i) => {
    if (waypoint.queueStage) {
      checkpointS[waypoint.queueStage] = cumulative[i];
      checkpointMode[waypoint.queueStage] = segmentMode[i];
    }
  });
  return { points, cumulative, total: cumulative[cumulative.length - 1], segmentMode, checkpointS, checkpointMode };
}

function segmentIndexAt(journey: JourneyGeometry, s: number): number {
  const distance = Math.max(0, Math.min(journey.total, s));
  let index = 1;
  while (index < journey.cumulative.length - 1 && journey.cumulative[index] < distance) index += 1;
  return index - 1;
}

function pointAt(journey: JourneyGeometry, s: number, out: Vector3): Vector3 {
  const distance = Math.max(0, Math.min(journey.total, s));
  const index = segmentIndexAt(journey, s) + 1;
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

function spriteWalkerMaterial() {
  return new ShaderMaterial({
    uniforms: { map: { value: createWalkSpriteTexture() } },
    vertexShader: /* glsl */ `
      attribute mat4 instanceMatrix;
      attribute vec3 instanceColor;
      attribute float frame;
      attribute float flip;
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vColor = instanceColor;
        float u = flip > 0.5 ? 1.0 - uv.x : uv.x;
        vUv = vec2((u + frame) / ${WALK_FRAME_COUNT.toFixed(1)}, uv.y);
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec2 scale = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
        mvPosition.xy += position.xy * scale;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vec4 tex = texture2D(map, vUv);
        if (tex.a < 0.4) discard;
        gl_FragColor = vec4(tex.rgb * vColor, tex.a);
      }
    `,
    transparent: true,
  });
}

function stretcherFrameGeometry() {
  const bed = new BoxGeometry(2.0, 0.14, 0.75);
  bed.translate(0, 0.86, 0);
  const chassis = new BoxGeometry(1.5, 0.62, 0.55);
  chassis.translate(0, 0.42, 0);
  return mergeGeometries([bed, chassis]);
}

function lyingBodyGeometry() {
  const body = new CapsuleGeometry(0.26, 1.15, 3, 8);
  body.rotateZ(Math.PI / 2);
  body.translate(0.05, 1.08, 0);
  return body;
}

const dummy = new Object3D();
const target = new Vector3();
const color = new Color();

/**
 * The patient population: 16-frame sprite walkers from the curb through
 * intake, then stretcher riders up the elevator core through radiology,
 * pre-op, the ORs, and recovery, then walkers again from discharge to home.
 * The story's active pressure gates its stage: arrivals accumulate in queue
 * grids and redden with wait time; resolve drains the queue forward.
 */
export function PatientFlow({
  gateStage,
  playing,
  reducedMotion,
  ceilingY,
}: {
  gateStage?: StageId;
  playing: boolean;
  reducedMotion: boolean;
  ceilingY: number;
}) {
  const walkerRef = useRef<InstancedMesh>(null);
  const stretcherRef = useRef<InstancedMesh>(null);
  const bodyRef = useRef<InstancedMesh>(null);
  const journey = useMemo(buildJourney, []);

  const walkerGeometry = useMemo(() => {
    const plane = new PlaneGeometry(1.5, 2.1);
    plane.translate(0, 1.05, 0);
    plane.setAttribute("frame", new InstancedBufferAttribute(new Float32Array(PATIENT_FLOW_COUNT), 1));
    plane.setAttribute("flip", new InstancedBufferAttribute(new Float32Array(PATIENT_FLOW_COUNT), 1));
    return plane;
  }, []);
  const walkerMaterial = useMemo(spriteWalkerMaterial, []);
  const frameGeometry = useMemo(stretcherFrameGeometry, []);
  const bodyGeometry = useMemo(lyingBodyGeometry, []);

  const elapsed = useRef(0);
  const previousGate = useRef<StageId | undefined>(undefined);
  const queueLength = useRef(0);
  const states = useRef<PatientState[]>([]);
  if (states.current.length === 0) {
    states.current = Array.from({ length: PATIENT_FLOW_COUNT }, (_, i) => {
      const s = (i / PATIENT_FLOW_COUNT) * journey.total;
      const position = pointAt(journey, s, new Vector3()).clone();
      return {
        s,
        mode: "walking" as PatientMode,
        slot: 0,
        wait: 0,
        tint: 0,
        releaseAt: 0,
        walkDistance: s * 0.7,
        flipped: false,
        position,
        heading: 0,
      };
    });
  }

  useFrame((_, rawDelta) => {
    const walker = walkerRef.current;
    const stretcher = stretcherRef.current;
    const body = bodyRef.current;
    if (!walker || !stretcher || !body) return;
    const delta = reducedMotion || !playing ? 0 : Math.min(rawDelta, 0.06);
    elapsed.current += delta;

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
    const frames = walkerGeometry.getAttribute("frame") as InstancedBufferAttribute;
    const flips = walkerGeometry.getAttribute("flip") as InstancedBufferAttribute;

    for (let i = 0; i < states.current.length; i += 1) {
      const patient = states.current[i];
      const segment = segmentIndexAt(journey, patient.s);
      const travel = journey.segmentMode[segment];
      const speed = travel === "stretcher" ? PATIENT_STRETCHER_SPEED : PATIENT_FLOW_SPEED;

      if (patient.mode === "walking") {
        const previousS = patient.s;
        patient.s += speed * delta;
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

      const queuedHere = patient.mode === "queued" || patient.mode === "releasing";
      if (queuedHere) {
        slotPosition(patient.queueStage ?? gateStage ?? "access", patient.slot, target);
      } else {
        pointAt(journey, patient.s, target);
      }
      const distance = patient.position.distanceTo(target);
      let moving = false;
      if (distance > 0.001) {
        const step = (patient.mode === "walking" ? speed : SLOT_APPROACH_SPEED) * delta;
        if (delta === 0 || step >= distance) {
          patient.position.copy(target);
        } else {
          const dx = target.x - patient.position.x;
          patient.heading = Math.atan2(dx, target.z - patient.position.z);
          if (Math.abs(dx) > 0.02) patient.flipped = dx < 0;
          patient.position.lerp(target, step / distance);
          moving = true;
          patient.walkDistance += step;
        }
      }

      // Presentation mode: sprite while on foot (including the intake and
      // discharge queues), stretcher for the clinical tower legs. Patients on
      // floors above the camera's focus hide with those floors.
      const queueTravel = patient.queueStage ? journey.checkpointMode[patient.queueStage] : undefined;
      const presentation = queuedHere ? queueTravel ?? "walk" : travel;
      const hiddenAbove = patient.position.y >= ceilingY - 0.01;
      color.copy(BASE_COLOR).lerp(WAIT_COLOR, patient.tint);

      if (hiddenAbove) {
        dummy.position.copy(patient.position);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        walker.setMatrixAt(i, dummy.matrix);
        stretcher.setMatrixAt(i, dummy.matrix);
        body.setMatrixAt(i, dummy.matrix);
      } else if (presentation === "walk") {
        dummy.position.copy(patient.position);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        walker.setMatrixAt(i, dummy.matrix);
        walker.setColorAt(i, color);
        frames.setX(i, moving ? 1 + (Math.floor(patient.walkDistance * WALK_FRAMES_PER_METER) % (WALK_FRAME_COUNT - 1)) : 0);
        flips.setX(i, patient.flipped ? 1 : 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        stretcher.setMatrixAt(i, dummy.matrix);
        body.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.copy(patient.position);
        dummy.rotation.set(0, patient.heading + Math.PI / 2, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        stretcher.setMatrixAt(i, dummy.matrix);
        body.setMatrixAt(i, dummy.matrix);
        body.setColorAt(i, color);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        walker.setMatrixAt(i, dummy.matrix);
      }
    }

    walker.instanceMatrix.needsUpdate = true;
    if (walker.instanceColor) walker.instanceColor.needsUpdate = true;
    frames.needsUpdate = true;
    flips.needsUpdate = true;
    stretcher.instanceMatrix.needsUpdate = true;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    (window as unknown as { __patientFlowDebug?: object }).__patientFlowDebug = {
      gateStage: gateStage ?? null,
      queued: states.current.filter((p) => p.mode === "queued").length,
      releasing: states.current.filter((p) => p.mode === "releasing").length,
      maxTint: Math.round(Math.max(...states.current.map((p) => p.tint)) * 100) / 100,
    };
  });

  return (
    <group name="patients">
      <instancedMesh ref={walkerRef} args={[walkerGeometry, walkerMaterial, PATIENT_FLOW_COUNT]} frustumCulled={false} />
      <instancedMesh ref={stretcherRef} args={[frameGeometry, undefined, PATIENT_FLOW_COUNT]} frustumCulled={false}>
        <meshLambertMaterial color="#aeb9c2" />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[bodyGeometry, undefined, PATIENT_FLOW_COUNT]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  );
}
