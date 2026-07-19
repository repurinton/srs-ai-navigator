import type { UseCase } from "./schema";

/**
 * The six levers — the strategic taxonomy that ties the portfolio to the
 * thesis, the Six Levers tab, the hospital twin, and the Operating Model.
 * Every use case maps to exactly one primary lever: the part of the
 * transformation story that investment serves. Order and colors match the
 * simulation sequence.
 */
export interface Lever {
  id: "front-door" | "diagnosis" | "precision" | "robotics" | "longitudinal" | "automation";
  monogram: string;
  name: string;
  color: string;
}

export const LEVERS: Lever[] = [
  { id: "front-door", monogram: "FD", name: "Digital Front Door", color: "#5bf0c3" },
  { id: "diagnosis", monogram: "DX", name: "Clinical Diagnosis", color: "#5e8fff" },
  { id: "precision", monogram: "PM", name: "Precision Medicine", color: "#7fcf5a" },
  { id: "robotics", monogram: "RX", name: "Robotics", color: "#ffb454" },
  { id: "longitudinal", monogram: "LC", name: "Longitudinal Care", color: "#b695ff" },
  { id: "automation", monogram: "TA", name: "Task Automation", color: "#ff716d" },
];

const LEVER_BY_ID = new Map(LEVERS.map((lever) => [lever.id, lever]));

// Curated overrides where the rules would misread the case.
const LEVER_OVERRIDES: Record<string, Lever["id"]> = {
  "XC-02": "automation", // patient scheduling + capacity = ops orchestration
  "XC-05": "diagnosis", // sepsis detection = clinical state recognition
  "XC-06": "diagnosis", // contactless vitals = continuous measurement
  "NUR-01": "automation", // falls CV amplifies scarce observation labor
  "NUR-02": "automation", // virtual sitting
  "NUR-03": "automation", // virtual nursing
  "NUR-04": "automation", // ambient nursing documentation
  "FLW-03": "diagnosis", // ED triage acuity = clinical assessment
  "RCM-01": "front-door", // price estimation is patient-facing access
  "NEU-12": "diagnosis", // headache classification is diagnostic
  "NEU-24": "diagnosis", // EEG co-pilot reads clinical signals
  "CAN-02": "diagnosis", // digital pathology is diagnostic interpretation
  "CAN-09": "diagnosis", // lung screening is detection, not follow-up
  "XC-08": "longitudinal", // chronic-care agents own the between-visit queue
};

/**
 * Classification rules, evaluated in order; the first match wins. Robotics
 * (any robot-architecture track) is checked before everything, then the
 * clinical-strategy levers, then operational automation; the diagnosis-heavy
 * remainder of the catalog defaults to Clinical Diagnosis.
 */
const LEVER_RULES: Array<{ lever: Lever["id"]; test: RegExp }> = [
  {
    lever: "precision",
    test: /genomic|multi-omic|microbiome|pharmacogen|trial match|therapy match|precision oncolog|liquid biops|molecular profil|biomarker-guided|dosing optimiz/i,
  },
  {
    lever: "front-door",
    test: /front door|self-triage|symptom checker|chatbot|patient intake|no-show|voice agent|contact center|patient access|self-schedul|referral intake|patient-facing|price estimat|financial engagement|unattached patients/i,
  },
  {
    lever: "longitudinal",
    test: /remote (patient )?monitor|wearable|chronic|care gap|survivorship|follow-up|adherence|hospital at home|readmission|population screening|outreach|wellness|rehabilitat|digital therapeutic|disease management|midlife|menopause|prevention program/i,
  },
  {
    lever: "automation",
    test: /coding|billing|denial|prior auth|revenue cycle|claims|underpayment|charge capture|utilization review|documentation|scribe|dictation|credential|staff schedul|workforce|retention|supply chain|inventory|procure|compound|shortage|diversion|medication histor|logistic|transport|disinfect|sterile process|instrument recogni|asset|floor-care|environmental services|command center|bed manage|patient flow|capacity|scheduling optimiz|discharge plan|admission prediction|abstraction|compliance|accreditation|benchmark|grant writing|IRB|preference card|market share|demand forecast|food/i,
  },
];

const cache = new Map<string, Lever>();

/** The primary lever a use case serves. */
export function leverFor(uc: UseCase): Lever {
  const cached = cache.get(uc.id);
  if (cached) return cached;

  let id = LEVER_OVERRIDES[uc.id];
  if (!id && uc.track) id = "robotics";
  if (!id) {
    const haystack = [uc.name, uc.description, uc.subSpecialty, uc.aiType].filter(Boolean).join(" ");
    id = LEVER_RULES.find((rule) => rule.test.test(haystack))?.lever ?? "diagnosis";
  }
  const lever = LEVER_BY_ID.get(id) ?? LEVERS[1];
  cache.set(uc.id, lever);
  return lever;
}
