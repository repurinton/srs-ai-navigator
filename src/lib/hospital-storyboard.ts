import type { LeverId, SimulationResult, StageId } from "./hospital-sim.ts";

/**
 * The narrative deliberately distinguishes a modeled system constraint from a
 * pain point or operating friction. Those terms are not interchangeable.
 */
export type HospitalPressureKind =
  | "operating-friction"
  | "pain-point"
  | "capacity-pressure"
  | "system-constraint"
  | "investment-constraint";

export type HospitalEvidenceBasis =
  | "simulation-constraint"
  | "simulation-metric"
  | "operating-hypothesis"
  | "strategic-implication";

export type HospitalPressureId =
  | "access-friction"
  | "diagnosis-constraint"
  | "readiness-constraint"
  | "or-capacity-constraint"
  | "discharge-continuity-constraint"
  | "administrative-handoffs"
  | "recovery-capacity-constraint";

export type HospitalStoryMetricMeasure =
  | "stage-peak-queue"
  | "stage-average-wait"
  | "stage-completions"
  | "administrative-touches"
  | "completed-episodes"
  | "median-journey";

export interface HospitalStoryMetric {
  id: string;
  label: string;
  measure: HospitalStoryMetricMeasure;
  stage?: StageId;
  improvement: "higher" | "lower";
}

export interface HospitalStoryPressure {
  id: HospitalPressureId;
  kind: HospitalPressureKind;
  evidenceBasis: HospitalEvidenceBasis;
  label: string;
  title: string;
  detail: string;
  stage?: StageId;
}

export interface HospitalStoryIntervention {
  kicker: "AI response materializing";
  title: string;
  detail: string;
}

export interface HospitalStoryResolution {
  kicker: "Operating impact";
  title: string;
  detail: string;
  receipt: string;
  metric: HospitalStoryMetric;
}

export interface HospitalStoryCycle {
  id: `cycle-${LeverId}`;
  number: number;
  lever: LeverId;
  thesis: string;
  pressure: HospitalStoryPressure;
  intervention: HospitalStoryIntervention;
  resolution: HospitalStoryResolution;
  nextPressure: HospitalStoryPressure;
}

export const HOSPITAL_PRESSURE_KIND_LABELS: Record<HospitalPressureKind, string> = {
  "operating-friction": "Hidden busywork",
  "pain-point": "Everyday friction",
  "capacity-pressure": "Capacity strain",
  "system-constraint": "The new bottleneck",
  "investment-constraint": "An investment decision",
};

/**
 * Shared pressure objects are intentional. A cycle's nextPressure is the exact
 * same object as the following cycle's pressure, preventing a second authored
 * introduction of the same issue.
 */
export const HOSPITAL_PRESSURES: Record<HospitalPressureId, HospitalStoryPressure> = {
  "access-friction": {
    id: "access-friction",
    kind: "pain-point",
    evidenceBasis: "simulation-metric",
    label: "Everyday friction surfaces",
    title: "Patients repeat everything just to get in.",
    detail: "Parking, registration, and intake each ask patients to repeat what the hospital already knows.",
    stage: "access",
  },
  "diagnosis-constraint": {
    id: "diagnosis-constraint",
    kind: "system-constraint",
    evidenceBasis: "simulation-constraint",
    label: "The new bottleneck appears",
    title: "Now the wait moves to diagnosis.",
    detail: "Patients who got in faster now queue for scans, results, and a clear answer.",
    stage: "diagnosis",
  },
  "readiness-constraint": {
    id: "readiness-constraint",
    kind: "system-constraint",
    evidenceBasis: "simulation-constraint",
    label: "The new bottleneck appears",
    title: "Diagnosed, but not ready for surgery.",
    detail: "Missing labs, clearances, and late plan changes leave diagnosed patients waiting for a surgery date.",
    stage: "readiness",
  },
  "or-capacity-constraint": {
    id: "or-capacity-constraint",
    kind: "system-constraint",
    evidenceBasis: "simulation-constraint",
    label: "The new bottleneck appears",
    title: "The robot waits for the hospital.",
    detail: "Operating rooms sit idle between cases while setup, instruments, and room turnover catch up.",
    stage: "robotics",
  },
  "discharge-continuity-constraint": {
    id: "discharge-continuity-constraint",
    kind: "system-constraint",
    evidenceBasis: "simulation-constraint",
    label: "The new bottleneck appears",
    title: "No one owns the next step home.",
    detail: "After surgery, recovery, follow-up, and home care wait on handoffs no one is assigned to own.",
    stage: "longitudinal",
  },
  "administrative-handoffs": {
    id: "administrative-handoffs",
    kind: "operating-friction",
    evidenceBasis: "simulation-metric",
    label: "Hidden busywork revealed",
    title: "Staff time goes to paperwork, not patients.",
    detail: "Every patient is handed between disconnected systems, and each handoff creates more routine work.",
    stage: "readiness",
  },
  "recovery-capacity-constraint": {
    id: "recovery-capacity-constraint",
    kind: "investment-constraint",
    evidenceBasis: "simulation-constraint",
    label: "An investment decision revealed",
    title: "Recovery beds are now the real limit.",
    detail: "Coordination no longer hides the decision: the next gain requires investing in staffed recovery beds.",
    stage: "care",
  },
};

export const HOSPITAL_STORYBOARD: readonly HospitalStoryCycle[] = [
  {
    id: "cycle-front-door",
    number: 1,
    lever: "front-door",
    thesis: "The front door should preserve context, not create another queue.",
    pressure: HOSPITAL_PRESSURES["access-friction"],
    intervention: {
      kicker: "AI response materializing",
      title: "Capture context once. Carry it forward.",
      detail: "Voice, chat, scheduling, identity, and prerequisites become one persistent access thread.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "Context arrives before the patient.",
      detail: "One access thread carries the patient's story, so care starts the moment they arrive.",
      receipt: "Front door cleared",
      metric: {
        id: "access-wait",
        label: "Wait to get in",
        measure: "stage-average-wait",
        stage: "access",
        improvement: "lower",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["diagnosis-constraint"],
  },
  {
    id: "cycle-diagnosis",
    number: 2,
    lever: "diagnosis",
    thesis: "Diagnostic intelligence creates value by routing correctly the first time.",
    pressure: HOSPITAL_PRESSURES["diagnosis-constraint"],
    intervention: {
      kicker: "AI response materializing",
      title: "Route correctly the first time.",
      detail: "Pathway intelligence combines history, imaging, and readiness signals before the next handoff.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "Diagnosis stops recycling demand.",
      detail: "Patients are routed right the first time, so answers arrive in hours, not weeks.",
      receipt: "Answers arrive faster",
      metric: {
        id: "diagnosis-wait",
        label: "Wait for answers",
        measure: "stage-average-wait",
        stage: "diagnosis",
        improvement: "lower",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["readiness-constraint"],
  },
  {
    id: "cycle-precision",
    number: 3,
    lever: "precision",
    thesis: "Precision planning moves consequential context ahead of the treatment decision.",
    pressure: HOSPITAL_PRESSURES["readiness-constraint"],
    intervention: {
      kicker: "AI response materializing",
      title: "Target earlier. Revise less.",
      detail: "Clinical and molecular context shifts targeted planning upstream, before the plan hardens.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "The plan stabilizes upstream.",
      detail: "Surgery plans firm up earlier, so fewer patients wait in limbo for a date.",
      receipt: "Surgery dates firm up",
      metric: {
        id: "readiness-queue",
        label: "Patients awaiting surgery",
        measure: "stage-peak-queue",
        stage: "readiness",
        improvement: "lower",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["or-capacity-constraint"],
  },
  {
    id: "cycle-robotics",
    number: 4,
    lever: "robotics",
    thesis: "Robotics creates capacity only when the surrounding operating model moves with it.",
    pressure: HOSPITAL_PRESSURES["or-capacity-constraint"],
    intervention: {
      kicker: "AI response materializing",
      title: "Coordinate the room around the robot.",
      detail: "Readiness and turnover synchronize while consequential surgical judgment stays human-led.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "OR cycle time releases capacity.",
      detail: "The same rooms complete more surgeries because the room is ready when the robot is.",
      receipt: "More surgeries, same rooms",
      metric: {
        id: "or-completions",
        label: "Surgeries completed",
        measure: "stage-completions",
        stage: "robotics",
        improvement: "higher",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["discharge-continuity-constraint"],
  },
  {
    id: "cycle-longitudinal",
    number: 5,
    lever: "longitudinal",
    thesis: "Longitudinal AI turns discharge from an event into an owned flow.",
    pressure: HOSPITAL_PRESSURES["discharge-continuity-constraint"],
    intervention: {
      kicker: "AI response materializing",
      title: "Own the next step before discharge.",
      detail: "Navigation, follow-up, and escalation receive named ownership before the patient leaves.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "Continuity begins before discharge.",
      detail: "Every patient leaves with the next step already booked and a named owner.",
      receipt: "Follow-up starts sooner",
      metric: {
        id: "longitudinal-wait",
        label: "Wait for follow-up",
        measure: "stage-average-wait",
        stage: "longitudinal",
        improvement: "lower",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["administrative-handoffs"],
  },
  {
    id: "cycle-automation",
    number: 6,
    lever: "automation",
    thesis: "Agents should execute routine coordination while people govern consequential decisions.",
    pressure: HOSPITAL_PRESSURES["administrative-handoffs"],
    intervention: {
      kicker: "AI response materializing",
      title: "Agents execute. Humans govern.",
      detail: "Agents carry routine work across systems; named people retain consequential approvals.",
    },
    resolution: {
      kicker: "Operating impact",
      title: "Coordination capacity returns to staff.",
      detail: "Software carries the routine handoffs; staff time returns to patients.",
      receipt: "Handoffs handed to AI",
      metric: {
        id: "administrative-touches",
        label: "Staff handoffs per patient",
        measure: "administrative-touches",
        improvement: "lower",
      },
    },
    nextPressure: HOSPITAL_PRESSURES["recovery-capacity-constraint"],
  },
] as const;

export const HOSPITAL_OPENING_PRESSURE = HOSPITAL_STORYBOARD[0].pressure;
export const HOSPITAL_FINAL_PRESSURE = HOSPITAL_STORYBOARD[HOSPITAL_STORYBOARD.length - 1]!.nextPressure;
export const HOSPITAL_PRESSURE_CHAIN: readonly HospitalStoryPressure[] = [
  HOSPITAL_OPENING_PRESSURE,
  ...HOSPITAL_STORYBOARD.map((cycle) => cycle.nextPressure),
];

export function hospitalStoryCycleForLever(lever: LeverId) {
  return HOSPITAL_STORYBOARD.find((cycle) => cycle.lever === lever);
}

export function hospitalPressureLabel(pressure: HospitalStoryPressure) {
  return HOSPITAL_PRESSURE_KIND_LABELS[pressure.kind];
}

export function hospitalStoryMetricValue(metric: HospitalStoryMetric, simulation: SimulationResult) {
  if (metric.measure === "administrative-touches") return simulation.administrativeTouches;
  if (metric.measure === "completed-episodes") return simulation.completed;
  if (metric.measure === "median-journey") return simulation.medianJourneyDays;

  if (!metric.stage) return Number.NaN;
  const stage = simulation.stageResults[metric.stage];
  if (metric.measure === "stage-peak-queue") return stage.peakQueue;
  if (metric.measure === "stage-average-wait") return stage.averageWaitHours;
  return stage.completedByHorizon;
}

export function hospitalStoryMetricImproved(
  metric: HospitalStoryMetric,
  before: SimulationResult,
  after: SimulationResult,
) {
  const beforeValue = hospitalStoryMetricValue(metric, before);
  const afterValue = hospitalStoryMetricValue(metric, after);
  return metric.improvement === "higher" ? afterValue > beforeValue : afterValue < beforeValue;
}
