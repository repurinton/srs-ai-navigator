import type { UseCase } from "./schema";

/**
 * Lens C: hospital operations — the operational function a use case serves,
 * independent of which clinical service line or robot architecture delivers
 * it. Categories are executive-broad (nursing, diagnosis, logistics, billing…)
 * rather than sub-specialty-deep.
 *
 * Membership is multi-label: a robotic pharmacy compounding system is both
 * "Pharmacy & Supply Chain" and (via its robot) visible in the robotics lens.
 * Assignment = explicit per-id override when curated, else keyword rules over
 * the case's name/description/taxonomy. Cases that match nothing (e.g. pure
 * research or consumer wellness) are simply outside the operations lens.
 */
export const OPS_CATEGORIES = [
  "Nursing & Patient Care",
  "Diagnosis & Imaging",
  "Surgery & Procedures",
  "Patient Flow & Capacity",
  "Scheduling & Access",
  "Pharmacy & Supply Chain",
  "Logistics & Facilities",
  "Billing & Revenue Cycle",
  "Documentation & Workforce",
] as const;

export type OpsCategory = (typeof OPS_CATEGORIES)[number];

export const OPS_CATEGORY_COLOR: Record<OpsCategory, string> = {
  "Nursing & Patient Care": "#ff8fa8",
  "Diagnosis & Imaging": "#5e8fff",
  "Surgery & Procedures": "#ffb454",
  "Patient Flow & Capacity": "#5bf0c3",
  "Scheduling & Access": "#7fcf5a",
  "Pharmacy & Supply Chain": "#b695ff",
  "Logistics & Facilities": "#62d0e8",
  "Billing & Revenue Cycle": "#ffd166",
  "Documentation & Workforce": "#d4a373",
};

// Curated assignments where keywords would misread the case.
const OPS_OVERRIDES: Record<string, OpsCategory[]> = {
  "RS-HUM-01": ["Logistics & Facilities"],
  "RS-HUM-02": ["Nursing & Patient Care", "Logistics & Facilities"],
  "RS-HUM-03": ["Logistics & Facilities"],
  "RS-HUM-04": ["Pharmacy & Supply Chain"],
  "RS-SAI-04": ["Documentation & Workforce", "Billing & Revenue Cycle"],
  "RS-SAI-03": ["Surgery & Procedures", "Documentation & Workforce"],
  "RS-TELE-02": ["Surgery & Procedures", "Documentation & Workforce"],
};

// Keyword rules, evaluated over name + description + curated taxonomy fields.
// All matches apply (multi-label). Order is display order, not precedence.
const OPS_RULES: Array<{ category: OpsCategory; test: RegExp }> = [
  {
    category: "Nursing & Patient Care",
    test: /nurs|falls risk|fall prevention|pressure injur|sepsis|deteriorat|early warning|virtual sitt|remote (patient )?monitor|patient monitor|vital sign|rounding|bedside|hospital at home|icu monitor|telemetry/i,
  },
  {
    category: "Diagnosis & Imaging",
    test: /screening|imaging|radiolog|mammograph|patholog|diagnos|detection|echocardiogra|electrocardiogra|\becg\b|\beeg\b|endoscop|colonoscop|biops|nodule|lesion|ultrasound|\bmri\b|\bct\b|x-ray|triage of (scans|studies)|second reader/i,
  },
  {
    category: "Surgery & Procedures",
    test: /surg|operativ|robotic|operating room|perioperat|anesthes|arthroplast|resection|endoluminal|bronchoscop|cystectom|prostatectom|nephrectom|procedure video|ablation|catheter/i,
  },
  {
    category: "Patient Flow & Capacity",
    test: /length of stay|\blos\b|discharge|bed manage|bed capacity|census|capacity|throughput|patient flow|admission|readmission|emergency department|\bed\b crowd|boarding|transfer center|command center/i,
  },
  {
    category: "Scheduling & Access",
    test: /schedul|appointment|no-show|wait ?list|waiting list|referral|front door|patient intake|patient access|slot|self-triage|symptom checker|navigation to care/i,
  },
  {
    category: "Pharmacy & Supply Chain",
    test: /pharmac|medication|compound|formular|supply chain|inventory|procurement|dispens|infusion prep|drug interaction/i,
  },
  {
    category: "Logistics & Facilities",
    test: /logistic|transport|delivery robot|deliver(ies|y) of (supplies|specimens)|disinfect|environmental services|linen|specimen transport|courier|room turnover|facility|sterile processing|instrument tracking/i,
  },
  {
    category: "Billing & Revenue Cycle",
    test: /billing|revenue cycle|claims?|denial|prior authorization|coding|charge capture|reimburse|payer|utilization review|cost estimat/i,
  },
  {
    category: "Documentation & Workforce",
    test: /documentation|ambient scribe|scribe|dictation|operative note|clinical note|charting|staffing|workforce|scheduling of staff|credential|burnout|administrative burden|handoff|shift|quality measure|abstraction|regulatory report|compliance/i,
  },
];

const cache = new Map<string, OpsCategory[]>();

/** All hospital-operations categories a use case belongs to (possibly none). */
export function opsCategoriesFor(uc: UseCase): OpsCategory[] {
  const cached = cache.get(uc.id);
  if (cached) return cached;
  let result = OPS_OVERRIDES[uc.id];
  if (!result) {
    const haystack = [uc.name, uc.description, uc.subSpecialty, uc.aiType, uc.patientProximity, uc.keyMetric]
      .filter(Boolean)
      .join(" ");
    result = OPS_RULES.filter((rule) => rule.test.test(haystack)).map((rule) => rule.category);
  }
  cache.set(uc.id, result);
  return result;
}
