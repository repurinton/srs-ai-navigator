/**
 * Descriptive metadata for the frameworks the landing page frames:
 * impact measurement, maturity, autonomy, proximity, investment, evidence,
 * and the adoption-readiness scoring model. Kept here so the Home view stays
 * presentational and the definitions live in one place.
 */

export interface Concept {
  key: string;
  label?: string;
  icon?: string;
  color: string;
  def: string;
}

// Five perspectives on impact — how a use case creates value.
export const IMPACT_PERSPECTIVES: Concept[] = [
  { key: "Growth", icon: "📈", color: "#0078C8", def: "New volume, referrals, and access — expanding the reach of the service line." },
  { key: "Profitability", icon: "💰", color: "#6EBE49", def: "Margin, throughput, and efficiency — doing more with the same resources." },
  { key: "Quality", icon: "⭐", color: "#D4A843", def: "Outcomes, safety, and consistency — fewer complications, better results." },
  { key: "Research", icon: "🔬", color: "#6C5B7B", def: "Discovery and evidence — fueling trials, publications, and the innovation pipeline." },
  { key: "Population Outcomes", icon: "🌍", color: "#00A4B3", def: "Health at scale — screening, prevention, access, and equity across communities." },
];

// Maturity spectrum — where a use case sits on the adoption journey.
// Ordered most-adopted → most-novel.
export const MATURITY_SPECTRUM: Concept[] = [
  { key: "Standard of Care", icon: "✅", color: "#2E7D32", def: "Established and evidence-based. Widely adopted; the expected default." },
  { key: "Best Practice", icon: "🏆", color: "#0078C8", def: "Proven and cleared. Adopted by leading programs and scaling quickly." },
  { key: "Frontier", icon: "🚀", color: "#E87722", def: "Early clinical validation. Pilots underway; promising but not yet routine." },
  { key: "Emerging Research", icon: "🔬", color: "#6C5B7B", def: "Investigational. Compelling science, pre-commercial, worth watching." },
];

// Levels of Autonomy in Surgical Robotics (Yang et al., Science Robotics 2017).
export const AUTONOMY_LASR: { level: number; label: string; def: string }[] = [
  { level: 0, label: "No Autonomy", def: "The surgeon performs; the robot does not act on its own." },
  { level: 1, label: "Robot Assistance", def: "Continuous assistance under full surgeon control — tremor filtering, motion scaling." },
  { level: 2, label: "Task Autonomy", def: "The robot performs a discrete task on surgeon command (e.g., a suture)." },
  { level: 3, label: "Conditional Autonomy", def: "The system plans and executes; the surgeon approves and can intervene." },
  { level: 4, label: "High Autonomy", def: "The system performs a procedure under close surgeon supervision." },
  { level: 5, label: "Full Autonomy", def: "Performs without human intervention. None exist clinically today." },
];

// Strategic autonomy buckets used across the dataset and the Radar's Y-axis.
export const STRATEGIC_AUTONOMY: Concept[] = [
  { key: "Decision Support", color: "#6C5B7B", def: "AI informs; the human decides." },
  { key: "Augmentation", color: "#0078C8", def: "AI assists the clinician in real time." },
  { key: "Autonomous", color: "#00A4B3", def: "AI acts with minimal human oversight." },
];

// Patient proximity — the Radar's X-axis: how close to the patient.
export const PROXIMITY_SCALE: Concept[] = [
  { key: "Internal", color: "#3a5a7d", def: "Operations & back office — scheduling, billing, logistics." },
  { key: "Clinical Operations", color: "#0078C8", def: "Behind-the-scenes clinical — imaging, pathology, planning." },
  { key: "External", color: "#00A6A6", def: "Patient & consumer facing — bedside, in-procedure, direct care." },
];

// Investment tiers — the cost of adoption.
export const INVESTMENT_LADDER: Concept[] = [
  { key: "Platform-Included", color: "#2E7D32", def: "Already in your licensing — activation and configuration only." },
  { key: "Incremental SaaS", color: "#0078C8", def: "$50K–$500K / year — a new cloud subscription." },
  { key: "Enterprise Investment", color: "#E87722", def: "$500K–$5M — software, integration, and training." },
  { key: "Capital & Infrastructure", color: "#C44D58", def: "$5M+ — hardware, facilities, and staffing." },
];

// Evidence tiers — strength of the supporting evidence (high → low rigor).
export const EVIDENCE_SCALE: Concept[] = [
  { key: "RCT / Clinical Trial", color: "#2E7D32", def: "Randomized or prospective trial evidence." },
  { key: "Peer-Reviewed", color: "#0078C8", def: "Published, peer-reviewed studies." },
  { key: "Regulatory Cleared", color: "#00A6A6", def: "FDA / CE cleared or approved." },
  { key: "Institutional", color: "#E87722", def: "Single-center or registry experience." },
  { key: "Industry / Vendor", color: "#8B9BB5", def: "Vendor data or industry analysis." },
];

// Adoption-readiness scoring model (drives the Roadmap).
export const SCORING_WEIGHTS = [
  { key: "Maturity", weight: 30, color: "#0078C8" },
  { key: "Implementation Complexity", weight: 20, color: "#00A6A6" },
  { key: "Investment", weight: 20, color: "#6EBE49" },
  { key: "Competitive Pressure", weight: 15, color: "#E87722" },
  { key: "Evidence", weight: 15, color: "#6C5B7B" },
];

export const RECOMMENDATIONS: Concept[] = [
  { key: "Adopt Now", color: "#2e9e6b", def: "High readiness — proven, accessible, and competitively urgent." },
  { key: "Pilot & Scale", color: "#f2a33c", def: "Promising — validate in a focused pilot, then expand." },
  { key: "Watch & Partner", color: "#7c5cff", def: "Early — monitor evidence and build vendor relationships." },
];
