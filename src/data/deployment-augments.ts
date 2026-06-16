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

  // ── Robotic-surgery deployments (robotics-lens cases, RS-*) ───────────────
  // These are notable high-volume programs and pioneers (illustrative, not
  // exhaustive — established robotic platforms like da Vinci are broadly adopted).
  //
  // Telesurgery: AdventHealth Global Robotics Institute (Orlando) performed the
  // world's first FDA-IDE robotic telesurgery on a human (Orlando→Angola, 2025).
  // Source: MicroPort MedBot / PR Newswire 2025.
  "RS-TELE-01": ["AdventHealth"],
  "RS-TELE-02": ["AdventHealth"],
  // Robotic urology: Vattikuti Urology Institute (Henry Ford) — invented robotic
  // prostatectomy, 10,000+ cases, first in Michigan for single-port. (Wikipedia/VUI)
  "RS-URO-01": ["Henry Ford Health", "Cleveland Clinic", "Mayo Clinic"],
  "RS-URO-02": ["Henry Ford Health", "Cleveland Clinic"],
  "RS-URO-03": ["Memorial Sloan Kettering", "MD Anderson Cancer Center"],
  "RS-PLT-02": ["Henry Ford Health"], // single-port (first in Michigan)
  // Thoracic / head & neck robotic programs (high-volume cancer centers).
  "RS-PLT-03": ["MD Anderson Cancer Center", "Memorial Sloan Kettering", "Mayo Clinic"],
  "RS-PLT-04": ["Penn Medicine", "MD Anderson Cancer Center"], // TORS (Penn = inventors)
  "RS-PLT-05": ["Cleveland Clinic", "Mayo Clinic"], // robotic bronchoscopy
  // Robotic orthopedics (notable high-volume joint/spine programs).
  "RS-ORT-01": ["Hospital for Special Surgery", "Cleveland Clinic", "Mayo Clinic"],
  "RS-ORT-02": ["Hospital for Special Surgery", "Cleveland Clinic"],
  "RS-ORT-03": ["Hospital for Special Surgery", "NYU Langone"],

  // Multi-port soft-tissue (da Vinci) — broadly adopted; high-volume programs
  // incl. AdventHealth's Global Robotics Institute.
  "RS-PLT-01": ["AdventHealth", "Cleveland Clinic", "Mayo Clinic", "Henry Ford Health"],

  // Autonomous soft-tissue tasks (STAR / SRT-H research). Source: Johns Hopkins
  // / Children's National; Science Robotics 2025.
  "RS-SAI-05": ["Johns Hopkins Medicine", "Children's National Hospital"],

  // Hospital logistics robots (Moxi, Diligent Robotics). Source: The Robot Report.
  "RS-HUM-01": ["Northwestern Medicine", "Cedars-Sinai", "MultiCare Health System", "Children's Hospital Los Angeles"],

  // UV-C disinfection robots (Xenex LightStrike). Source: Xenex; Henry Ford Health.
  "RS-HUM-03": ["Mayo Clinic", "MD Anderson Cancer Center", "Henry Ford Health", "HonorHealth"],
};
