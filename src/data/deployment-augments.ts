/**
 * Evidence-backed additions to the competitive-landscape (`deployedAt`) data.
 *
 * The migrated dataset only "checked" ~19 large US academic systems, so it
 * misses well-documented deployments at other systems and (by design) had
 * AdventHealth scrubbed. This layer adds verified public deployments back,
 * each with a citable source. It is merged into `deployedAt` at load time
 * (see use-cases.ts), keeping the migration itself a clean de-brand.
 *
 * Naming matches the existing dataset exactly so bars merge rather than split.
 */
export const deploymentAugments: Record<string, string[]> = {
  // ── AdventHealth × Aidoc ──────────────────────────────────────────────────
  // "One of the largest imaging-AI deployments in the U.S.", spanning radiology,
  // neuroscience, and emergency medicine across dozens of hospitals (FL, KY).
  // Source: AdventHealth/Aidoc, PR Newswire 2025; Imaging Technology News.
  "NEU-19": ["AdventHealth"], // intracranial hemorrhage triage (Aidoc)
  "NEU-22": ["AdventHealth"], // radiology worklist prioritization (Aidoc)
  "AUTO-02": ["AdventHealth"], // autonomous imaging triage (Aidoc CARE)
  "HLV-18": ["AdventHealth"], // pulmonary embolism triage (Aidoc)
  "HLV-06": ["AdventHealth"], // aneurysm / vascular (Aidoc)
  "ORT-01": ["AdventHealth"], // fracture detection (Aidoc)

  // ── Stroke / LVO (Viz.ai) ─────────────────────────────────────────────────
  // Henry Ford Health: AI stroke care with Viz.ai (AHA News & AMA, 2025).
  // Mount Sinai Health System: Viz.ai customer (Viz.ai disclosures).
  // AdventHealth: neuroscience is named in the Aidoc deployment scope.
  "HLV-04": ["AdventHealth", "Henry Ford Health", "Mount Sinai Health System"],
  "NEU-01": ["AdventHealth", "Henry Ford Health", "Mount Sinai Health System"],
  "AUTO-03": ["Henry Ford Health", "Mount Sinai Health System"], // Viz.ai LVO
  "NEU-09": ["Henry Ford Health"], // prehospital stroke recognition

  // ── Ambient documentation (Abridge, enterprise deployments) ───────────────
  // UPMC (12,000 clinicians), Emory Healthcare, Duke Health, Johns Hopkins (EM).
  // Source: Abridge press releases; Fierce Healthcare 2025.
  "XC-01": ["Emory Healthcare", "UPMC", "Johns Hopkins Medicine"],
  "AUTO-21": ["Duke Health", "Emory Healthcare", "UPMC"],

  // ── Restore AdventHealth to the original verified Women's Health mappings ──
  // (Present in the source dataset before the public de-brand.)
  "WH-11": ["AdventHealth"],
  "WH-15": ["AdventHealth"],
  "WH-16": ["AdventHealth"],
  "WH-19": ["AdventHealth"],
  "WH-21": ["AdventHealth"],
  "WH-26": ["AdventHealth"],
};
