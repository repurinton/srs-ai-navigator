import { z } from "zod";

/**
 * SRS 2026 data model.
 *
 * Reworked from the National Service Line AI Navigator's service-line-centric
 * schema into a robotic-surgery-centric one organized around the meeting's
 * tracks (Urology, Telesurgery, Surgical AI, Digital Surgery, Orthopedics,
 * Humanoids) and surgical specialties. The satellite data files from the
 * original (vendors, sources, deployments, investment tiers) remain joinable
 * by `id`.
 */

// Meeting tracks — the primary lens of the navigator.
export const TRACKS = [
  "Robotic Platforms",
  "Urology",
  "Telesurgery",
  "Surgical AI",
  "Digital Surgery",
  "Orthopedics",
  "Humanoids",
] as const;
export const TrackSchema = z.enum(TRACKS);
export type Track = z.infer<typeof TrackSchema>;

// Surgical specialties a use case applies to (a case can span several).
export const SPECIALTIES = [
  "Urology",
  "Gynecology",
  "General Surgery",
  "Colorectal",
  "Thoracic",
  "Cardiac",
  "Head & Neck / ENT",
  "Orthopedics",
  "Neurosurgery / Spine",
  "Multispecialty",
  "Non-clinical",
] as const;
export const SpecialtySchema = z.enum(SPECIALTIES);

// Levels of Autonomy in Surgical Robotics (Yang et al., Sci. Robotics 2017).
export const AUTONOMY_LEVELS = [
  "0 — No Autonomy",
  "1 — Robot Assistance",
  "2 — Task Autonomy",
  "3 — Conditional Autonomy",
  "4 — High Autonomy",
  "5 — Full Autonomy",
] as const;
export const AutonomySchema = z.enum(AUTONOMY_LEVELS);

export const MATURITY_LEVELS = [
  "Clinical Standard",
  "Established",
  "Emerging",
  "Investigational",
] as const;
export const MaturitySchema = z.enum(MATURITY_LEVELS);

export const EVIDENCE_TIERS = [
  "RCT / Meta-Analysis",
  "Peer-Reviewed",
  "Regulatory Cleared",
  "Early Clinical",
  "Preclinical / Concept",
] as const;
export const EvidenceSchema = z.enum(EVIDENCE_TIERS);

export const SETTINGS = ["Clinical", "Non-clinical", "Both"] as const;
export const SettingSchema = z.enum(SETTINGS);

export const COMPLEXITY = ["Low", "Medium", "High", "Very High"] as const;
export const ComplexitySchema = z.enum(COMPLEXITY);

export const INVESTMENT_TIERS = [
  "Software Add-On",
  "Capital — Mid",
  "Capital — Major",
  "Program & Infrastructure",
] as const;
export const InvestmentSchema = z.enum(INVESTMENT_TIERS);

const RegClearanceSchema = z.object({
  product: z.string(),
  company: z.string(),
  type: z.string(), // 510(k), De Novo, PMA, CE Mark, etc.
  number: z.string().optional(),
  year: z.number().int().optional(),
  url: z.string().url().optional(),
});

export const UseCaseSchema = z.object({
  id: z.string().regex(/^[A-Z]{2,4}-\d{2,3}$/),
  name: z.string(),
  description: z.string(),
  track: TrackSchema,
  specialties: z.array(SpecialtySchema).min(1),
  setting: SettingSchema,
  autonomyLevel: AutonomySchema,
  maturity: MaturitySchema,
  evidenceTier: EvidenceSchema,
  fdaCleared: z.boolean(),
  keyPlatforms: z.array(z.string()),
  keyVendors: z.array(z.string()),
  keyMetric: z.string(),
  source: z.string(),
  implementationComplexity: ComplexitySchema,
  investmentTier: InvestmentSchema,
  regulatory: z.array(RegClearanceSchema).default([]),
});

export type UseCase = z.infer<typeof UseCaseSchema>;

/** Validate the full dataset at module load; fail loudly on bad data. */
export function parseUseCases(raw: unknown[]): UseCase[] {
  const result = z.array(UseCaseSchema).safeParse(raw);
  if (!result.success) {
    console.error("Invalid use-case data:", result.error.format());
    throw new Error("SRS 2026 use-case data failed schema validation.");
  }
  const ids = new Set<string>();
  for (const uc of result.data) {
    if (ids.has(uc.id)) throw new Error(`Duplicate use-case id: ${uc.id}`);
    ids.add(uc.id);
  }
  return result.data;
}
