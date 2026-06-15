import type { UseCase } from "@/data/schema";

/**
 * Adoption-readiness score, adapted from the original Navigator's weighted
 * composite. Higher = more ready to deploy today. Drives the Roadmap view.
 */
export function priorityScore(uc: UseCase): number {
  const maturity: Record<UseCase["maturity"], number> = {
    "Clinical Standard": 4,
    Established: 3,
    Emerging: 2,
    Investigational: 1,
  };
  const complexity: Record<UseCase["implementationComplexity"], number> = {
    Low: 4,
    Medium: 3,
    High: 2,
    "Very High": 1,
  };
  const investment: Record<UseCase["investmentTier"], number> = {
    "Software Add-On": 4,
    "Capital — Mid": 3,
    "Capital — Major": 2,
    "Program & Infrastructure": 1,
  };
  const evidence: Record<UseCase["evidenceTier"], number> = {
    "RCT / Meta-Analysis": 4,
    "Peer-Reviewed": 3,
    "Regulatory Cleared": 3,
    "Early Clinical": 2,
    "Preclinical / Concept": 1,
  };

  const regBonus = uc.fdaCleared ? 1 : 0;

  return (
    maturity[uc.maturity] * 0.3 +
    complexity[uc.implementationComplexity] * 0.2 +
    investment[uc.investmentTier] * 0.2 +
    evidence[uc.evidenceTier] * 0.2 +
    regBonus * 0.1
  );
}

export interface Recommendation {
  label: string;
  color: string;
}

export function recommendation(score: number): Recommendation {
  if (score >= 3.0) return { label: "Adopt Now", color: "#2e9e6b" };
  if (score >= 2.2) return { label: "Pilot & Scale", color: "#f2a33c" };
  return { label: "Watch & Partner", color: "#7c5cff" };
}
