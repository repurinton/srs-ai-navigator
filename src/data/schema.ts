import { z } from "zod";

/**
 * SRS 2026 data model — a superset that preserves the original National Service
 * Line AI Navigator taxonomy (de-branded; `platformAlignment` removed) and adds
 * an optional robotic-surgery lens so use cases can be navigated by either
 * service line OR meeting track ("parallel lenses").
 *
 * Curated free-text fields (autonomyLevel, patientProximity, evidenceTier,
 * aiType, impacts) are kept lenient (z.string()) to preserve the original
 * curation without flattening its nuance. Fields the scoring model depends on
 * (maturity, complexity, investmentTier) use strict enums.
 */

// ── Lens A: service lines (canonical, normalized from the original data) ──────
export const SERVICE_LINES = [
  "Cancer",
  "Heart, Lung & Vascular",
  "Orthopedics",
  "Neurosciences",
  "Gastrointestinal",
  "Women’s Health",
  "Cross-Cutting",
] as const;
export const ServiceLineSchema = z.enum(SERVICE_LINES);
export type ServiceLine = z.infer<typeof ServiceLineSchema>;

// ── Lens B: robotics categories ──────────────────────────────────────────────
// Organized by the robot's architecture/role (a single consistent dimension),
// rather than the SRS meeting's mix of specialty + modality + platform + robot
// type. This is the navigator's own taxonomy, not the meeting track list.
export const TRACKS = [
  "Soft-Tissue Surgical Robotics",
  "Orthopedic & Spine Robotics",
  "Flexible & Endoluminal Robotics",
  "Telesurgery & Remote Surgery",
  "Surgical Intelligence",
  "Service & Non-Clinical Robotics",
] as const;
export const TrackSchema = z.enum(TRACKS);
export type Track = z.infer<typeof TrackSchema>;

// Strict enums (scoring depends on these) ─────────────────────────────────────
export const MATURITY_LEVELS = [
  "Standard of Care",
  "Best Practice",
  "Frontier",
  "Emerging Research",
] as const;
export const MaturitySchema = z.enum(MATURITY_LEVELS);

export const COMPLEXITY = ["Low", "Medium", "High", "Very High"] as const;
export const ComplexitySchema = z.enum(COMPLEXITY);

export const INVESTMENT_TIERS = [
  "Platform-Included",
  "Incremental SaaS",
  "Enterprise Investment",
  "Capital & Infrastructure",
] as const;
export const InvestmentSchema = z.enum(INVESTMENT_TIERS);

export const SETTINGS = ["Clinical", "Non-clinical", "Both"] as const;
export const SettingSchema = z.enum(SETTINGS);

// Loose object schemas for citation/clearance arrays (preserve all keys).
const LooseRecord = z.object({}).passthrough();

// Curated free-text fields may be absent or explicitly null in the source data.
const optStr = z.string().nullish();

export const UseCaseSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9-]+$/),
    name: z.string(),
    description: z.string(),

    // Lens A — service line (present for migrated cases; optional for robotics)
    serviceLines: z.array(ServiceLineSchema).default([]),
    subSpecialty: optStr,

    // Curated taxonomy (lenient to preserve original variants; may be null)
    autonomyLevel: optStr,
    patientProximity: optStr,
    evidenceTier: optStr,
    aiType: optStr,
    metricsImpacted: z.array(z.string()).default([]),
    primaryImpact: optStr,
    secondaryImpact: optStr,

    // Scoring inputs (strict)
    maturity: MaturitySchema,
    implementationComplexity: ComplexitySchema,
    investmentTier: InvestmentSchema.nullable().default(null),

    // Evidence / sourcing
    fdaCleared: z.boolean().default(false),
    keyVendors: z.array(z.string()).default([]),
    keyMetric: optStr,
    source: optStr,
    federalGrants: z.array(LooseRecord).optional(),
    fdaClearances: z.array(LooseRecord).optional(),
    deployedAt: z.array(z.string()).default([]),

    // Lens B — robotic-surgery (optional)
    track: TrackSchema.optional(),
    specialties: z.array(z.string()).optional(),
    roboticsClass: z.string().optional(),
    setting: SettingSchema.optional(),
    surgicalAutonomyLevel: z.string().optional(),

    lens: z.enum(["service-line", "robotics"]).default("service-line"),
    keyPlatforms: z.array(z.string()).optional(),
  })
  .refine((uc) => uc.serviceLines.length > 0 || uc.track !== undefined, {
    message: "Use case must belong to at least one lens (serviceLines or track)",
  });

export type UseCase = z.infer<typeof UseCaseSchema>;

/** Validate the full dataset; fail loudly on bad data or duplicate ids. */
export function parseUseCases(raw: unknown[]): UseCase[] {
  const result = z.array(UseCaseSchema).safeParse(raw);
  if (!result.success) {
    console.error("Invalid use-case data:", result.error.issues.slice(0, 12));
    throw new Error("SRS 2026 use-case data failed schema validation.");
  }
  const ids = new Set<string>();
  for (const uc of result.data) {
    if (ids.has(uc.id)) throw new Error(`Duplicate use-case id: ${uc.id}`);
    ids.add(uc.id);
  }
  return result.data;
}
