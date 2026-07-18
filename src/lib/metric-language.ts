import type { SimulationResult } from "./hospital-sim.ts";
import {
  hospitalStoryMetricValue,
  type HospitalStoryMetric,
  type HospitalStoryMetricMeasure,
  type HospitalStoryPressure,
} from "./hospital-storyboard.ts";

/**
 * Layperson vocabulary for every simulation measure. Authored strings stay
 * number-free; values are always computed from the simulation at render time.
 */
export const HUMAN_MEASURE_LABELS: Record<HospitalStoryMetricMeasure, string> = {
  "stage-peak-queue": "patients waiting at once",
  "stage-average-wait": "wait time",
  "stage-completions": "patients treated",
  "administrative-touches": "staff handoffs per patient",
  "completed-episodes": "patients fully cared for",
  "median-journey": "days from arrival to home",
};

const HOURS_PER_DAY = 24;
const DAYS_THRESHOLD_HOURS = 48;

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function withUnit(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

/** "57 hrs", "7.1 days", "311" — waits of two days or more read as days. */
export function formatHumanValue(measure: HospitalStoryMetricMeasure, value: number) {
  if (measure === "stage-average-wait") {
    if (value >= DAYS_THRESHOLD_HOURS) return withUnit(roundToTenth(value / HOURS_PER_DAY), "day", "days");
    return withUnit(Math.round(value), "hr", "hrs");
  }
  if (measure === "median-journey") return withUnit(roundToTenth(value), "day", "days");
  return String(Math.round(value));
}

/** "Wait to get in: 57 hrs → 10 hrs" — the before→after receipt shown on resolve. */
export function humanReceipt(
  metric: HospitalStoryMetric,
  before: SimulationResult,
  after: SimulationResult,
) {
  const beforeValue = hospitalStoryMetricValue(metric, before);
  const afterValue = hospitalStoryMetricValue(metric, after);
  return `${metric.label}: ${formatHumanValue(metric.measure, beforeValue)} → ${formatHumanValue(metric.measure, afterValue)}`;
}

/** "85 patients waiting at once · 57 hrs average wait" — the problem stated in human terms. */
export function humanPressureValue(pressure: HospitalStoryPressure, simulation: SimulationResult) {
  if (pressure.id === "administrative-handoffs") {
    return `${simulation.administrativeTouches} staff handoffs for every patient`;
  }
  if (!pressure.stage) return undefined;
  const stage = simulation.stageResults[pressure.stage];
  return `${stage.peakQueue} patients waiting at once · ${formatHumanValue("stage-average-wait", stage.averageWaitHours)} average wait`;
}
