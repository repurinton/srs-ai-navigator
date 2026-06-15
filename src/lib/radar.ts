import type { UseCase } from "@/data/schema";

/**
 * Radar positioning — ported from the original National Service Line AI
 * Navigator's "Autonomy vs. Patient Proximity" radar.
 *
 *   Vertical (Y)   : Autonomy   — top = Fully Autonomous, bottom = Decision Support
 *   Horizontal (X) : Proximity  — left = Internal/Operations, right = External/Patient
 *
 * Dots are placed by a continuous 1–10 score per axis (categorical band + signal
 * modifiers + deterministic hash jitter), so use cases spread within their zone
 * instead of stacking on three fixed points.
 */

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
export function seededRand(id: string): number {
  return (Math.abs(hashCode(id)) % 1000) / 1000;
}

function has(v: string | null | undefined, needle: string): boolean {
  return typeof v === "string" && v.toLowerCase().includes(needle.toLowerCase());
}

// AUTONOMY (vertical): how independently does the AI act?
export function computeAutonomyScore(uc: UseCase): number {
  const a = uc.autonomyLevel ?? "";
  let base: number;
  if (has(a, "Autonomous") || a === "Automation") base = 8;
  else if (has(a, "Semi-Autonomous")) base = 6.5;
  else if (a === "Augmentation") base = 5;
  else base = 2; // Decision Support, Infrastructure, etc.

  let mod = 0;
  if (has(a, "Autonomous") && uc.fdaCleared) mod += 0.8;
  if (a === "Augmentation" && has(uc.aiType, "Robotics")) mod += 1.2;
  if (a === "Augmentation" && has(uc.aiType, "Signal Processing")) mod += 0.6;
  if (
    a === "Augmentation" &&
    has(uc.aiType, "Computer Vision") &&
    has(uc.patientProximity, "Direct")
  )
    mod += 0.5;
  if (a === "Decision Support" && has(uc.aiType, "Predictive")) mod -= 0.4;
  if (has(uc.aiType, "Generative")) mod += 0.3;
  if (uc.maturity === "Standard of Care") mod += 0.5;
  if (uc.maturity === "Emerging Research") mod -= 0.5;
  mod += (seededRand(uc.id + "auto") - 0.5) * 1.8;

  return Math.max(0.5, Math.min(9.8, base + mod));
}

// PROXIMITY (horizontal): how close to the patient?
export function computeProximityScore(uc: UseCase): number {
  const p = uc.patientProximity ?? "";
  let base: number;
  if (has(p, "Direct") || has(p, "Patient-Facing") || has(p, "Consumer")) base = 8;
  else if (has(p, "Clinical Operations")) base = 5;
  else base = 2; // Administrative, Back Office, Research, etc.

  let mod = 0;
  if (has(uc.aiType, "Robotics")) mod += 1.0;
  if (has(uc.subSpecialty, "surg")) mod += 0.5;
  if (has(uc.subSpecialty, "intraop")) mod += 0.8;
  if (has(p, "Clinical Operations") && has(uc.aiType, "Computer Vision")) mod += 0.4;
  if (uc.metricsImpacted.includes("Population Outcomes")) mod += 0.3;
  if (has(p, "Administrative") && has(uc.aiType, "Predictive")) mod -= 0.4;
  if (has(uc.subSpecialty, "schedul")) mod -= 0.6;
  if (has(uc.subSpecialty, "operation")) mod -= 0.3;
  if (has(uc.subSpecialty, "wearable") || has(uc.subSpecialty, "remote")) mod -= 0.5;
  if (uc.primaryImpact === "Research") mod -= 0.5;
  mod += (seededRand(uc.id + "prox") - 0.5) * 1.8;

  return Math.max(0.5, Math.min(9.8, base + mod));
}

export const RADAR_MATURITY_COLOR: Record<string, string> = {
  "Standard of Care": "#2E7D32",
  "Best Practice": "#0078C8",
  Frontier: "#E87722",
  "Emerging Research": "#6C5B7B",
};

export interface RadarGeom {
  cx: number;
  cy: number;
  maxR: number;
  plotR: number;
}

export interface PlottedDot {
  uc: UseCase;
  x: number;
  y: number;
  r: number;
  color: string;
}

/** Compute final clamped, jittered dot positions for a set of use cases. */
export function plotDots(ucs: UseCase[], g: RadarGeom): PlottedDot[] {
  return ucs.map((uc) => {
    const pScore = computeProximityScore(uc);
    const aScore = computeAutonomyScore(uc);

    const xNorm = (pScore - 5) / 4.5;
    const yNorm = -(aScore - 5) / 4.5; // flip: high autonomy = top

    let x = g.cx + xNorm * g.plotR + (seededRand(uc.id + "jx") - 0.5) * 18;
    let y = g.cy + yNorm * g.plotR + (seededRand(uc.id + "jy") - 0.5) * 18;

    const dx = x - g.cx;
    const dy = y - g.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > g.maxR - 8) {
      const scale = (g.maxR - 8) / dist;
      x = g.cx + dx * scale;
      y = g.cy + dy * scale;
    }

    return {
      uc,
      x,
      y,
      r: uc.fdaCleared ? 7 : 5,
      color: RADAR_MATURITY_COLOR[uc.maturity] ?? "#8B9BB5",
    };
  });
}
