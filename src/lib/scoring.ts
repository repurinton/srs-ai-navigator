import type { UseCase } from "@/data/schema";

/**
 * Adoption-readiness score, ported from the original navigator.
 * `platformAlignment` (tied to a specific organization's platform stack) has
 * been removed and its 20% weight redistributed across the remaining factors:
 *
 *   maturity 0.30 · complexity 0.20 · investment 0.20 ·
 *   competitive pressure 0.15 · evidence 0.15
 *
 * Higher = more ready to deploy today. Drives the Roadmap view.
 */
const MATURITY: Record<string, number> = {
  "Standard of Care": 4,
  "Best Practice": 3,
  Frontier: 2,
  "Emerging Research": 1,
};
const COMPLEXITY: Record<string, number> = {
  Low: 4,
  Medium: 3,
  High: 2,
  "Very High": 1,
};
const INVESTMENT: Record<string, number> = {
  "Platform-Included": 4,
  "Incremental SaaS": 3,
  "Enterprise Investment": 2,
  "Capital & Infrastructure": 1,
};
// Lenient: covers the original's varied evidence tiers plus robotics values.
const EVIDENCE: Record<string, number> = {
  "Peer-Reviewed": 3,
  "Clinical Trial": 3,
  "RCT / Meta-Analysis": 3,
  "FDA-Cleared": 3,
  "Regulatory Cleared": 3,
  Institutional: 2,
  "VC/PE-Backed": 2,
  "Early Clinical": 2,
  "Industry Analysis": 1.5,
  "Consultant/Think-Tank": 1.5,
  Vendor: 1,
  "Preclinical / Concept": 1,
};

export function priorityScore(uc: UseCase): number {
  const maturity = MATURITY[uc.maturity] ?? 1;
  const complexity = COMPLEXITY[uc.implementationComplexity] ?? 2;
  const investment = uc.investmentTier ? (INVESTMENT[uc.investmentTier] ?? 2) : 2;
  const evidence = uc.evidenceTier ? (EVIDENCE[uc.evidenceTier] ?? 1.5) : 1.5;
  // Competitive pressure: more known deployments = more ready (0–4 scale).
  const pressure = Math.min(uc.deployedAt.length / 3, 4);

  return (
    maturity * 0.3 +
    complexity * 0.2 +
    investment * 0.2 +
    pressure * 0.15 +
    evidence * 0.15
  );
}

export interface Recommendation {
  label: string;
  color: string;
}

export function recommendation(score: number): Recommendation {
  if (score >= 2.8) return { label: "Adopt Now", color: "#2e9e6b" };
  if (score >= 2.0) return { label: "Pilot & Scale", color: "#f2a33c" };
  return { label: "Watch & Partner", color: "#7c5cff" };
}
