/**
 * Evidence upgrades to the migrated dataset, from the July 2026 agentic
 * research sweep (four parallel research agents + adversarial audit of the
 * ten flagship cases). Each entry shallow-overrides fields on the raw record
 * before schema validation — `deployedAt` additions live in
 * deployment-augments.ts, never here.
 *
 * Claim-integrity rules carried from the audit:
 *  - metrics name their study and quantify precisely (no vague bands),
 *  - conditional findings state their condition (e.g. TREWS confirm-within-3h),
 *  - vendor-reported numbers are labeled as such inside the copy.
 */
export const evidenceAugments: Record<string, Record<string, unknown>> = {
  // ── Flagship audit fixes ──────────────────────────────────────────────────
  "CAN-01": {
    keyMetric:
      "MASAI final results: +29% relative cancer detection, 12% fewer interval cancers (n>105,000); 44% screen-reading workload reduction in the interim analysis",
    source:
      "The Lancet 2026 (MASAI final); Lancet Oncology 2023 (MASAI interim); Nature Medicine 2025 (PRAIM, n=463,094, +17.6% CDR); Nature Communications 2025 (AI-STREAM)",
    keyVendors: [
      "ScreenPoint Transpara",
      "Lunit (incl. Volpara)",
      "DeepHealth / RadNet (incl. iCAD)",
      "Therapixel MammoScreen",
    ],
  },
  "XC-05": {
    keyMetric:
      "COMPOSER: 17% relative in-hospital sepsis mortality reduction (UCSD, quasi-experimental); TREWS: 18.7% relative reduction when alerts were confirmed within 3 hours",
    source:
      "npj Digital Medicine 2024 (COMPOSER); Nature Medicine 2022 (TREWS); FDA De Novo DEN230036 (Prenosis Sepsis ImmunoScore, 2024); JAMA Network Open 2026 (Epic ESM v2 multicenter validation)",
    fdaCleared: true,
  },
  "XC-01": {
    keyMetric:
      "Physician burnout 51.9% → 38.8% within 30 days (Sutter, JAMA Network Open); 2.5M+ ambient encounters in year one at Kaiser Permanente",
    source:
      "JAMA Network Open 2025 (Sutter; Mass General Brigham/Emory); NEJM Catalyst 2025 (Kaiser Permanente); NEJM AI 2025 (Atrium longitudinal — savings not universal); PHTI 2025 (financial ROI still unproven)",
  },
  "XC-04": {
    keyMetric:
      "CMS-0057: 72-hour urgent decisions from Jan 2026, FHIR APIs by Jan 2027; the 2025 payer pledge had eliminated only ~11% of prior auths by mid-2026",
    source:
      "CMS-0057-F final rule; Health Affairs 2025–2026 (AI utilization-review arms race); KFF 2026; active algorithm-denial litigation (Cigna PxDx, UnitedHealth nH Predict)",
  },
  "AUTO-01": {
    keyMetric:
      "CPT 92229 national payment rate finalized by CMS; first fully autonomous portable diabetic-retinopathy screening cleared (AEYE, 2024)",
    source:
      "CMS Physician Fee Schedule; FDA 510(k) 2024 (AEYE Health); Johns Hopkins ACCESS RCT; npj Digital Medicine access studies",
    keyVendors: ["Digital Diagnostics LumineticsCore", "Eyenuk EyeArt", "AEYE Health"],
  },
  "HLV-25": {
    keyMetric:
      "CONCERN cluster-RCT: lower in-hospital mortality, LOS, and unplanned ICU transfers across 74 units; eCART FDA-cleared 2024 with ~13% mortality reduction reported at Yale New Haven",
    source:
      "Nature Medicine 2025 (CONCERN pragmatic cluster-RCT); FDA 510(k) 2024 + JAMA Network Open validation (eCART, 360,000+ encounters); JAMA Network Open 2024 (Epic Deterioration Index variability)",
    fdaCleared: true,
    keyVendors: ["AgileMD eCART", "CONCERN EWS", "Epic Deterioration Index", "Spacelabs (Rothman Index)"],
  },
  "XC-02": {
    keyMetric:
      "98 health systems / 5,600 ORs on iQueue (vendor-reported); Mayo Clinic multimodal model cut cardiovascular scheduling error ~50% (ACC 2026)",
    source:
      "LeanTaaS and Qventus case studies (vendor-reported); JMIR Medical Informatics 2025; Opmed.ai + Mayo Clinic (ACC 2026)",
  },
  "XC-06": {
    keyMetric:
      "FDA 510(k)s now cover contactless video heart-rate and respiratory-rate measurement (2023–2026); FDA-cleared radar monitoring at ~50 US sites",
    source: "FDA 510(k) records (FaceHeart 2023/2025; PanopticAI 2026); Fierce Biotech (Xandar Kardian)",
    fdaCleared: true,
  },

  // ── Back-of-house upgrades ────────────────────────────────────────────────
  "ADM-01": {
    keyMetric:
      "98.7% production coding accuracy and 96%+ automation rates claimed by autonomous-coding vendors (vendor-reported, not independently audited)",
    source: "Nym Health; CodaMetrix (vendor-reported)",
  },
  "AUTO-10": {
    keyMetric:
      "Coding-related denial rate on radiology profee cut 97% (0.0998% → 0.0030%) at one large system (vendor-reported)",
    source: "Nym Health deployment reports — Ochsner, Geisinger, Inova (vendor-reported)",
  },
  "AUTO-11": {
    keyMetric:
      "First order-to-approval touchless prior auth: 70% of covered CPT requests approved with zero staff involvement in month one (Allegheny Health Network, 2025)",
    source: "Humata Health × Allegheny Health Network announcement 2025; Healthcare Finance News",
  },
  "ADM-04": {
    keyMetric:
      "41% of providers now face denial rates ≥10% (up from 30% in 2022); 69% of AI adopters report reduced denials",
    source: "Experian State of Claims 2025; Health Affairs 2025 (payer-side AI arms race)",
  },
  "ADM-05": {
    keyMetric:
      "~$40B/yr in silent payer take-backs industry-wide; $32M in hidden recoupments surfaced at one ~$4B system (vendor-reported)",
    source: "Waystar AltitudeAI 2025 (vendor-reported); Fierce Healthcare",
  },
  "ADM-06": {
    keyMetric:
      "~6% case-volume lift and ~$100K incremental revenue per OR per year; +20% block utilization at University of Kansas (vendor case studies)",
    source: "LeanTaaS iQueue case studies (vendor-reported); Qventus Series D (KKR, 2025)",
  },
  "ADM-07": {
    keyMetric:
      "$10.9M ROI at Miami Cancer Institute; 40% shorter infusion waits at NewYork-Presbyterian (vendor case studies)",
    source: "LeanTaaS 2025 case studies (vendor-reported)",
  },
  "ADM-09": {
    keyMetric:
      "$30M saved in one year at Mercy; agency staffing cut from 25% to 8% of mix, RN turnover down 7.5%",
    source: "Healthcare IT News 2024 (Mercy × Works OnDemand, health-system reported)",
  },
  "ADM-10": {
    keyMetric:
      "Best in KLAS Capacity Management 2025 (92.5); 50,000+ excess days and $62M avoided over 3 years at HonorHealth",
    source: "KLAS 2025; Qventus × HonorHealth case study 2025; OhioHealth deployment reports",
  },
  "AUTO-13": {
    keyMetric:
      "Early market: only 15% of hospital leaders have fully deployed AI/ML for supply forecasting; 35% piloting (2026)",
    source: "Tecsys survey 2026 (industry analysis)",
  },

  // ── Precision Medicine audit corrections (July 2026 sweep) ────────────────
  "CAN-24": {
    keyMetric:
      "NHS-Galleri RCT (n=142,250) missed its primary stage-shift endpoint; secondary signals: ~4× detection over standard care, +16% stage I/II; PATHFINDER specificity 99.5%",
    source:
      "NHS-Galleri full results (ASCO 2026, primary endpoint not met); Annals of Oncology 2023 (PATHFINDER); GRAIL. Remains an LDT — not FDA-approved.",
    keyVendors: ["GRAIL (Galleri)", "Exact Sciences (Cancerguard)", "Freenome", "Harbinger Health"],
  },
  "CAN-03": {
    keyMetric:
      "SERENA-6: ctDNA-guided therapy switch extended median PFS to 16.0 vs 9.2 months (HR 0.44, 56% risk reduction)",
    source: "NEJM 2025 (SERENA-6); Natera Signatera (Medicare-covered MRD); Guardant Reveal",
    keyVendors: ["Natera (Signatera)", "Guardant Health (Reveal)", "Foundation Medicine", "Tempus"],
  },
  "CAN-14": {
    keyMetric:
      "TrialGPT reached 87.3% criterion-level matching accuracy and cut screening time 42.6% in a clinician user study",
    source: "Nature Communications 2024 (TrialGPT, NIH/NLM); Deep 6 AI acquired by Tempus 2024",
    keyVendors: ["TrialGPT (NIH)", "Tempus AI", "Mendel", "Flatiron Health (Roche)", "Epic"],
  },
  "GI-18": {
    keyMetric:
      "Emerging: AI microbiome models predict IBD flares and therapy response; no FDA-cleared AI microbiome diagnostic exists yet",
    source: "Research-stage literature; Nestlé Health Science (VOWST, acquired from Seres 2024)",
    keyVendors: ["Nestlé Health Science (VOWST)", "Academic / research-stage"],
  },
};

/** Shallow-merge evidence upgrades onto a raw use-case record. */
export function withEvidenceAugments(uc: unknown): unknown {
  const rec = uc as { id?: unknown };
  const id = typeof rec.id === "string" ? rec.id : "";
  const patch = evidenceAugments[id];
  return patch ? { ...(uc as Record<string, unknown>), ...patch } : uc;
}
