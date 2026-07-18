import { parseUseCases, type UseCase } from "./schema";
import { serviceLineUseCasesRaw } from "./service-line-use-cases.generated";
import { deploymentAugments } from "./deployment-augments";

// Merge evidence-backed deployment additions into a raw use-case's deployedAt.
function withAugmentedDeployments(uc: unknown): unknown {
  const rec = uc as { id?: unknown; deployedAt?: unknown };
  const id = typeof rec.id === "string" ? rec.id : "";
  const extra = deploymentAugments[id];
  if (!extra) return uc;
  const existing = Array.isArray(rec.deployedAt) ? (rec.deployedAt as string[]) : [];
  return { ...rec, deployedAt: Array.from(new Set([...existing, ...extra])) };
}

// Robotic use cases inside the migrated clinical dataset, tagged with the
// robotics-category lens so they surface when browsing by robot architecture.
const ROBOTICS_TRACK_BY_ID: Record<string, string> = {
  "ORT-03": "Orthopedic & Spine Robotics", // robotic joint replacement
  "ORT-07": "Orthopedic & Spine Robotics", // spine planning + navigation
  "ORT-08": "Orthopedic & Spine Robotics", // autonomous spinal decompression
  "NEU-06": "Orthopedic & Spine Robotics", // spine surgical navigation
  "GI-07": "Soft-Tissue Surgical Robotics", // robotic colorectal surgery
  "GI-08": "Soft-Tissue Surgical Robotics", // robotic bariatric surgery
  "GI-21": "Surgical Intelligence", // surgical video analysis
  "WH-11": "Surgical Intelligence", // robotic gyn surgery planning + guidance
  "AUTO-09": "Surgical Intelligence", // autonomous surgical robot research
  "HLV-05": "Surgical Intelligence", // cardiac pre-surgical planning
};

function withRoboticsTrack(uc: unknown): unknown {
  const rec = uc as { id?: unknown; track?: unknown };
  const id = typeof rec.id === "string" ? rec.id : "";
  const track = ROBOTICS_TRACK_BY_ID[id];
  if (!track || rec.track) return uc;
  return { ...rec, track };
}

// All-specialty cases (XC/ADM/AUTO) enumerate every clinical service line in
// the source data, which buried line-specific evidence — filtering "Cancer"
// returned every scheduling/billing/coding case. Anything claiming most of the
// clinical lines is really cross-cutting; deliberate 2–3-line mappings stay.
const CROSS_CUTTING_THRESHOLD = 4;
function withNormalizedServiceLines(uc: unknown): unknown {
  const rec = uc as { serviceLines?: unknown };
  if (!Array.isArray(rec.serviceLines) || rec.serviceLines.length < CROSS_CUTTING_THRESHOLD) return uc;
  return { ...rec, serviceLines: ["Cross-Cutting"] };
}

/**
 * Hand-authored robotic-surgery use cases (the meeting-track lens), written from
 * public sources. Authored in a robotics-native shape and transformed below into
 * the canonical schema so they sit alongside the migrated service-line dataset.
 */
const roboticsNative: Array<Record<string, unknown>> = [
  // ── Robotic Platforms ─────────────────────────────────────────────
  {
    id: "PLT-01",
    name: "Multi-Port Soft-Tissue Robotic Surgery",
    description:
      "Master–slave robotic platforms provide wristed instruments, 3D vision, and tremor filtration for minimally invasive soft-tissue procedures across urology, gynecology, and general surgery. The de facto standard for robotic MIS worldwide.",
    track: "Robotic Platforms",
    specialties: ["Multispecialty", "Urology", "Gynecology", "General Surgery"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Clinical Standard",
    evidenceTier: "RCT / Meta-Analysis",
    fdaCleared: true,
    keyPlatforms: ["da Vinci 5", "da Vinci Xi", "Hugo RAS", "Versius"],
    keyVendors: ["Intuitive Surgical", "Medtronic", "CMR Surgical"],
    keyMetric: "12M+ procedures performed cumulatively on da Vinci platforms",
    source: "Intuitive Surgical 2025 disclosures; multiple specialty RCTs",
    implementationComplexity: "Very High",
    investmentTier: "Capital — Major",
    regulatory: [
      { product: "da Vinci 5", company: "Intuitive Surgical", type: "510(k)", number: "K233670", year: 2024 },
      { product: "Hugo RAS", company: "Medtronic", type: "CE Mark", year: 2021 },
    ],
  },
  {
    id: "PLT-02",
    name: "Single-Port Robotic Surgery",
    description:
      "A single 2.5cm cannula delivers three multi-jointed instruments and a fully wristed camera, enabling deep, narrow-access procedures (transoral, transanal, retroperitoneal) with one incision.",
    track: "Robotic Platforms",
    specialties: ["Urology", "Head & Neck / ENT", "Colorectal"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["da Vinci SP"],
    keyVendors: ["Intuitive Surgical"],
    keyMetric: "Expanded indications across urology, TORS, and colorectal since 2018",
    source: "FDA 510(k) clearances; peer-reviewed single-port series",
    implementationComplexity: "High",
    investmentTier: "Capital — Major",
    regulatory: [
      { product: "da Vinci SP", company: "Intuitive Surgical", type: "510(k)", number: "K183614", year: 2019 },
    ],
  },

  // ── Urology ───────────────────────────────────────────────────────
  {
    id: "URO-01",
    name: "Robot-Assisted Radical Prostatectomy (RARP)",
    description:
      "Robotic prostatectomy is the most common surgical treatment for localized prostate cancer in the US, offering reduced blood loss and shorter convalescence with oncologic and functional outcomes comparable to open surgery.",
    track: "Urology",
    specialties: ["Urology"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Clinical Standard",
    evidenceTier: "RCT / Meta-Analysis",
    fdaCleared: true,
    keyPlatforms: ["da Vinci Xi", "da Vinci SP", "Hugo RAS"],
    keyVendors: ["Intuitive Surgical", "Medtronic"],
    keyMetric: "~85% of US radical prostatectomies performed robotically",
    source: "Lancet RCT (Coughlin 2018); AUA guidelines",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },

  // ── Telesurgery ───────────────────────────────────────────────────
  {
    id: "TELE-01",
    name: "Remote Telesurgery over Low-Latency Networks",
    description:
      "A surgeon operates on a geographically distant patient via a robotic console linked over dedicated 5G/fiber networks. Recent transcontinental procedures demonstrated sub-150ms round-trip latency within safe operating thresholds.",
    track: "Telesurgery",
    specialties: ["Urology", "General Surgery", "Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Emerging",
    evidenceTier: "Early Clinical",
    fdaCleared: false,
    keyPlatforms: ["MicroPort Toumai", "edge by SS Innovations"],
    keyVendors: ["MicroPort MedBot", "SS Innovations"],
    keyMetric: "Successful intercontinental procedures at <150ms latency (2024–2025)",
    source: "SRS Telesurgery Guidelines 2025; peer-reviewed case series",
    implementationComplexity: "Very High",
    investmentTier: "Program & Infrastructure",
    regulatory: [],
  },

  // ── Surgical AI ───────────────────────────────────────────────────
  {
    id: "SAI-01",
    name: "Intraoperative Surgical Phase Recognition",
    description:
      "Computer-vision models analyze the laparoscopic/endoscopic video stream in real time to recognize the current surgical phase, anticipate next steps, and trigger context-aware decision support and documentation.",
    track: "Surgical AI",
    specialties: ["General Surgery", "Colorectal", "Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Emerging",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Intuitive Hub", "Medtronic Touch Surgery", "Theator"],
    keyVendors: ["Theator", "Medtronic", "Intuitive Surgical"],
    keyMetric: "Phase-recognition accuracy >90% on benchmark cholecystectomy datasets",
    source: "Nature Medicine / IJCARS surgical data-science literature",
    implementationComplexity: "High",
    investmentTier: "Software Add-On",
    regulatory: [],
  },
  {
    id: "SAI-02",
    name: "Critical-View-of-Safety Detection (Go/No-Go AI)",
    description:
      "Real-time AI overlays flag anatomical safety landmarks (e.g., the Critical View of Safety in cholecystectomy) to reduce bile-duct injury, providing an intraoperative 'second set of eyes'.",
    track: "Surgical AI",
    specialties: ["General Surgery"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Emerging",
    evidenceTier: "Early Clinical",
    fdaCleared: false,
    keyPlatforms: ["GoNoGoNet", "Theator", "Caresyntax"],
    keyVendors: ["Theator", "Caresyntax"],
    keyMetric: "AI CVS assessment concordant with expert review in validation studies",
    source: "JAMA Surgery; Surgical Endoscopy validation studies",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },

  // ── Digital Surgery ───────────────────────────────────────────────
  {
    id: "DIG-01",
    name: "Connected-OR Surgical Data & Video Platform",
    description:
      "Cloud platforms capture, de-identify, and analyze full-length surgical video and device telemetry to power performance analytics, case review, and AI model training across an enterprise's OR fleet.",
    track: "Digital Surgery",
    specialties: ["Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "0 — No Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Caresyntax qvid™", "Theator", "Intuitive Hub", "Touch Surgery Enterprise"],
    keyVendors: ["Caresyntax", "Theator", "Medtronic", "Intuitive Surgical"],
    keyMetric: "Enterprise OR video capture & analytics across multi-site systems",
    source: "Vendor deployments; surgical data-science reviews",
    implementationComplexity: "High",
    investmentTier: "Capital — Mid",
    regulatory: [],
  },

  // ── Orthopedics ───────────────────────────────────────────────────
  {
    id: "ORT-01",
    name: "Robotic-Assisted Total Knee Arthroplasty",
    description:
      "Haptic-guided robotic arms execute a CT- or imageless-planned bone resection for total and partial knee replacement, improving implant-positioning accuracy and limb alignment versus manual instrumentation.",
    track: "Orthopedics",
    specialties: ["Orthopedics"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Established",
    evidenceTier: "RCT / Meta-Analysis",
    fdaCleared: true,
    keyPlatforms: ["Mako SmartRobotics", "ROSA Knee", "VELYS", "CORI"],
    keyVendors: ["Stryker", "Zimmer Biomet", "Johnson & Johnson MedTech", "Smith+Nephew"],
    keyMetric: "Improved radiographic alignment; growing share of US TKA volume",
    source: "Multiple RCTs and registry analyses (2020–2025)",
    implementationComplexity: "High",
    investmentTier: "Capital — Major",
    regulatory: [
      { product: "Mako", company: "Stryker", type: "510(k)", year: 2015 },
      { product: "ROSA Knee", company: "Zimmer Biomet", type: "510(k)", number: "K183058", year: 2019 },
    ],
  },

  // ── Humanoids ─────────────────────────────────────────────────────
  {
    id: "HUM-01",
    name: "Autonomous Hospital Logistics Robots",
    description:
      "Mobile autonomous robots transport supplies, medications, linens, and lab specimens through hospital corridors and elevators, freeing clinical staff from non-clinical transport tasks.",
    track: "Humanoids",
    specialties: ["Non-clinical"],
    setting: "Non-clinical",
    autonomyLevel: "4 — High Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Aethon TUG", "Moxi", "Relay"],
    keyVendors: ["ST Engineering Aethon", "Diligent Robotics", "Relay Robotics"],
    keyMetric: "Thousands of autonomous deliveries/month per deployed fleet",
    source: "Health-system case studies; press releases",
    implementationComplexity: "Medium",
    investmentTier: "Capital — Mid",
    regulatory: [],
  },
  {
    id: "HUM-02",
    name: "Humanoid Clinical-Assist Robots (Frontier)",
    description:
      "General-purpose humanoid robots are being piloted for bedside material handling, room turnover, and tele-assistance — the subject of the meeting's dedicated humanoids session. Early-stage and investigational in clinical settings.",
    track: "Humanoids",
    specialties: ["Non-clinical", "Multispecialty"],
    setting: "Both",
    autonomyLevel: "3 — Conditional Autonomy",
    maturity: "Investigational",
    evidenceTier: "Preclinical / Concept",
    fdaCleared: false,
    keyPlatforms: ["Figure 02", "Apptronik Apollo", "Tesla Optimus"],
    keyVendors: ["Figure AI", "Apptronik", "Tesla"],
    keyMetric: "Pilot deployments; no clinical-autonomy clearance to date",
    source: "Industry announcements; SRS 2026 humanoids session",
    implementationComplexity: "Very High",
    investmentTier: "Program & Infrastructure",
    regulatory: [],
  },

  // ── Robotic Platforms (additional specialties) ────────────────────
  {
    id: "PLT-03",
    name: "Robotic-Assisted Lobectomy & Thoracic Surgery",
    description:
      "Robotic platforms enable anatomic lung resection, mediastinal, and thymic surgery with enhanced dexterity in the chest. Compared with open thoracotomy, robotic approaches reduce length of stay and complications, with outcomes comparable to VATS.",
    track: "Robotic Platforms",
    specialties: ["Thoracic", "General Surgery"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["da Vinci Xi"],
    keyVendors: ["Intuitive Surgical"],
    keyMetric: "Shorter LOS and fewer complications vs. open; rising share of anatomic lung resections",
    source: "Annals of Thoracic Surgery; JTCVS comparative series",
    implementationComplexity: "High",
    investmentTier: "Software Add-On",
    regulatory: [],
  },
  {
    id: "PLT-04",
    name: "Transoral Robotic Surgery (TORS)",
    description:
      "Robotic access to the oropharynx, larynx, and hypopharynx enables minimally invasive resection of head-and-neck tumors and obstructive sleep-apnea surgery, often reducing the need for open approaches and adjuvant therapy intensity.",
    track: "Robotic Platforms",
    specialties: ["Head & Neck / ENT"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["da Vinci (TORS)", "da Vinci SP"],
    keyVendors: ["Intuitive Surgical"],
    keyMetric: "FDA-cleared for select T1–T2 oropharyngeal and benign lesions since 2009",
    source: "FDA clearance; ORL and Laryngoscope outcomes literature",
    implementationComplexity: "High",
    investmentTier: "Software Add-On",
    regulatory: [
      { product: "da Vinci Si (TORS)", company: "Intuitive Surgical", type: "510(k)", year: 2009 },
    ],
  },
  {
    id: "PLT-05",
    name: "Robotic Bronchoscopy for Peripheral Lung Nodules",
    description:
      "Flexible robotic endoluminal platforms navigate to peripheral lung nodules for biopsy with greater stability and reach than manual bronchoscopy, improving diagnostic yield for small and hard-to-reach lesions.",
    track: "Robotic Platforms",
    specialties: ["Thoracic"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["Ion", "Monarch"],
    keyVendors: ["Intuitive Surgical", "Johnson & Johnson MedTech"],
    keyMetric: "Diagnostic yield ~80%+ for peripheral nodules in prospective studies",
    source: "CHEST; Journal of Bronchology prospective trials",
    implementationComplexity: "High",
    investmentTier: "Capital — Mid",
    regulatory: [
      { product: "Ion Endoluminal System", company: "Intuitive Surgical", type: "510(k)", year: 2019 },
      { product: "Monarch Platform", company: "Auris / J&J", type: "510(k)", year: 2018 },
    ],
  },

  // ── Urology ───────────────────────────────────────────────────────
  {
    id: "URO-02",
    name: "Robot-Assisted Partial Nephrectomy",
    description:
      "Robotic partial nephrectomy enables nephron-sparing tumor excision with precise tumor resection and renal reconstruction, preserving kidney function while achieving oncologic control for small renal masses.",
    track: "Urology",
    specialties: ["Urology"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Clinical Standard",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["da Vinci Xi", "da Vinci SP"],
    keyVendors: ["Intuitive Surgical"],
    keyMetric: "Lower ischemia time and function loss vs. open in comparative series",
    source: "European Urology; Journal of Urology outcomes studies",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },
  {
    id: "URO-03",
    name: "Robot-Assisted Radical Cystectomy with Intracorporeal Diversion",
    description:
      "Robotic cystectomy with fully intracorporeal urinary diversion treats muscle-invasive bladder cancer with reduced blood loss and faster recovery; the RAZOR trial showed non-inferior 2-year progression-free survival vs. open.",
    track: "Urology",
    specialties: ["Urology"],
    setting: "Clinical",
    autonomyLevel: "1 — Robot Assistance",
    maturity: "Established",
    evidenceTier: "RCT / Meta-Analysis",
    fdaCleared: true,
    keyPlatforms: ["da Vinci Xi"],
    keyVendors: ["Intuitive Surgical"],
    keyMetric: "RAZOR RCT: non-inferior 2-yr PFS vs. open radical cystectomy",
    source: "The Lancet 2018 (RAZOR trial)",
    implementationComplexity: "High",
    investmentTier: "Software Add-On",
    regulatory: [],
  },

  // ── Telesurgery ───────────────────────────────────────────────────
  {
    id: "TELE-02",
    name: "Robotic Tele-Mentoring & Tele-Proctoring",
    description:
      "Experienced surgeons remotely guide, annotate, and supervise procedures in real time over secure video and telestration, extending expertise to lower-resource sites and accelerating the robotic learning curve.",
    track: "Telesurgery",
    specialties: ["Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "0 — No Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Proximie", "Intuitive Telepresence", "Avail"],
    keyVendors: ["Proximie", "Intuitive Surgical", "Avail Medsystems"],
    keyMetric: "Remote proctoring used for credentialing and training across networks",
    source: "Surgical Endoscopy; telemedicine in surgery reviews",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },

  // ── Surgical AI ───────────────────────────────────────────────────
  {
    id: "SAI-03",
    name: "AI Video-Based Surgical Skills Assessment",
    description:
      "Machine-learning models score technical skill and instrument motion from operative video, providing objective, automated performance feedback for training, credentialing, and quality improvement.",
    track: "Surgical AI",
    specialties: ["Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Emerging",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Theator", "Caresyntax", "C-SATS"],
    keyVendors: ["Theator", "Caresyntax", "C-SATS (J&J)"],
    keyMetric: "Automated skill scores correlate with expert ratings and outcomes",
    source: "Annals of Surgery; npj Digital Medicine validation studies",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },
  {
    id: "SAI-04",
    name: "Generative-AI Operative Note & Documentation",
    description:
      "Large language models draft operative reports and structured documentation from surgical video, dictation, and EHR context, reducing administrative burden and improving completeness and coding accuracy.",
    track: "Surgical AI",
    specialties: ["Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Emerging",
    evidenceTier: "Early Clinical",
    fdaCleared: false,
    keyPlatforms: ["Ambient documentation suites"],
    keyVendors: ["Abridge", "Microsoft (DAX)", "Nuance"],
    keyMetric: "Reported reductions in documentation time in early deployments",
    source: "JAMA / NEJM AI perspectives on ambient documentation",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },
  {
    id: "SAI-05",
    name: "Autonomous Soft-Tissue Surgical Tasks (Research)",
    description:
      "Research systems demonstrate supervised-autonomous execution of discrete soft-tissue tasks (e.g., intestinal anastomosis) using imaging guidance and learned policies — a step toward higher levels of surgical autonomy.",
    track: "Surgical AI",
    specialties: ["General Surgery", "Multispecialty"],
    setting: "Clinical",
    autonomyLevel: "3 — Conditional Autonomy",
    maturity: "Investigational",
    evidenceTier: "Preclinical / Concept",
    fdaCleared: false,
    keyPlatforms: ["STAR (research)", "SRT-H (research)"],
    keyVendors: ["Academic / research consortia"],
    keyMetric: "Supervised-autonomous anastomosis demonstrated preclinically (STAR)",
    source: "Science Robotics (STAR); Johns Hopkins SRT-H research",
    implementationComplexity: "Very High",
    investmentTier: "Program & Infrastructure",
    regulatory: [],
  },

  // ── Digital Surgery ───────────────────────────────────────────────
  {
    id: "DIG-02",
    name: "Preoperative Planning & Surgical Digital Twins",
    description:
      "Patient-specific 3D models and digital twins built from imaging support preoperative rehearsal, implant sizing, and intraoperative navigation, improving precision in complex reconstructive and oncologic cases.",
    track: "Digital Surgery",
    specialties: ["Multispecialty", "Orthopedics"],
    setting: "Clinical",
    autonomyLevel: "0 — No Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["3D anatomical modeling", "patient-specific planning"],
    keyVendors: ["Materialise", "Surgical Theater", "PrecisionOS"],
    keyMetric: "Improved planning accuracy and OR efficiency in complex cases",
    source: "Peer-reviewed surgical planning and simulation literature",
    implementationComplexity: "Medium",
    investmentTier: "Software Add-On",
    regulatory: [],
  },

  // ── Orthopedics ───────────────────────────────────────────────────
  {
    id: "ORT-02",
    name: "Robotic-Assisted Total Hip Arthroplasty",
    description:
      "Robotic guidance improves acetabular cup positioning and leg-length restoration in total hip replacement, increasing the proportion of implants placed within target safe zones versus manual technique.",
    track: "Orthopedics",
    specialties: ["Orthopedics"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["Mako SmartRobotics", "VELYS"],
    keyVendors: ["Stryker", "Johnson & Johnson MedTech"],
    keyMetric: "Higher rate of cups within Lewinnek safe zone vs. manual",
    source: "Journal of Arthroplasty; Bone & Joint registry analyses",
    implementationComplexity: "High",
    investmentTier: "Capital — Major",
    regulatory: [],
  },
  {
    id: "ORT-03",
    name: "Robotic-Assisted & Navigated Spine Surgery",
    description:
      "Robotic guidance and navigation improve pedicle-screw placement accuracy and reduce radiation exposure in spinal fusion, supporting minimally invasive and complex deformity correction.",
    track: "Orthopedics",
    specialties: ["Neurosurgery / Spine", "Orthopedics"],
    setting: "Clinical",
    autonomyLevel: "2 — Task Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: true,
    keyPlatforms: ["Mazor X Stealth", "ExcelsiusGPS", "ROSA Spine"],
    keyVendors: ["Medtronic", "Globus Medical", "Zimmer Biomet"],
    keyMetric: "High pedicle-screw accuracy and reduced fluoroscopy time",
    source: "Spine; Journal of Neurosurgery comparative studies",
    implementationComplexity: "High",
    investmentTier: "Capital — Major",
    regulatory: [
      { product: "ExcelsiusGPS", company: "Globus Medical", type: "510(k)", year: 2017 },
    ],
  },

  // ── Humanoids / Service Robotics (non-clinical) ───────────────────
  {
    id: "HUM-03",
    name: "UV-C Disinfection Robots",
    description:
      "Autonomous mobile robots deliver ultraviolet-C germicidal irradiation to terminally disinfect operating rooms and patient areas, reducing environmental bioburden and supplementing manual cleaning.",
    track: "Humanoids",
    specialties: ["Non-clinical"],
    setting: "Non-clinical",
    autonomyLevel: "4 — High Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["Xenex LightStrike", "UVD Robots"],
    keyVendors: ["Xenex", "UVD Robots (Blue Ocean Robotics)"],
    keyMetric: "Demonstrated reductions in environmental pathogen burden",
    source: "Infection Control & Hospital Epidemiology studies",
    implementationComplexity: "Low",
    investmentTier: "Capital — Mid",
    regulatory: [],
  },
  {
    id: "HUM-04",
    name: "Pharmacy & Sterile-Compounding Automation Robots",
    description:
      "Robotic systems automate IV compounding, oral medication dispensing, and sterile preparation, improving dosing accuracy, reducing contamination risk, and freeing pharmacy staff for clinical work.",
    track: "Humanoids",
    specialties: ["Non-clinical"],
    setting: "Non-clinical",
    autonomyLevel: "4 — High Autonomy",
    maturity: "Established",
    evidenceTier: "Peer-Reviewed",
    fdaCleared: false,
    keyPlatforms: ["IV compounding robots", "automated dispensing"],
    keyVendors: ["Omnicell", "BD Rowa", "Swisslog"],
    keyMetric: "Improved compounding accuracy and reduced contamination risk",
    source: "AJHP; pharmacy automation outcomes literature",
    implementationComplexity: "Medium",
    investmentTier: "Capital — Mid",
    regulatory: [],
  },
];

// ── Transform robotics-native entries into the canonical (de-branded) schema ──
const MATURITY_MAP: Record<string, string> = {
  "Clinical Standard": "Standard of Care",
  Established: "Best Practice",
  Emerging: "Frontier",
  Investigational: "Emerging Research",
};
const INVESTMENT_MAP: Record<string, string> = {
  "Software Add-On": "Incremental SaaS",
  "Capital — Mid": "Enterprise Investment",
  "Capital — Major": "Capital & Infrastructure",
  "Program & Infrastructure": "Capital & Infrastructure",
};
// Levels of Autonomy in Surgical Robotics → original autonomy buckets
const AUTONOMY_MAP: Record<string, string> = {
  "0 — No Autonomy": "Decision Support",
  "1 — Robot Assistance": "Augmentation",
  "2 — Task Autonomy": "Augmentation",
  "3 — Conditional Autonomy": "Autonomous",
  "4 — High Autonomy": "Autonomous",
  "5 — Full Autonomy": "Autonomous",
};
// Best-fit service-line tag(s) for robotics cases (default Cross-Cutting)
const SERVICE_LINE_BY_ID: Record<string, string[]> = {
  "PLT-01": ["Cancer", "Women’s Health", "Gastrointestinal"],
  "PLT-02": ["Cancer", "Gastrointestinal"],
  "PLT-03": ["Heart, Lung & Vascular", "Cancer"],
  "PLT-04": ["Cancer"],
  "PLT-05": ["Heart, Lung & Vascular", "Cancer"],
  "URO-01": ["Cancer"],
  "URO-02": ["Cancer"],
  "URO-03": ["Cancer"],
  "ORT-01": ["Orthopedics"],
  "ORT-02": ["Orthopedics"],
  "ORT-03": ["Orthopedics", "Neurosciences"],
  "SAI-02": ["Gastrointestinal"],
  "DIG-02": ["Orthopedics"],
};
const AI_TYPE_BY_ID: Record<string, string> = {
  "SAI-01": "Computer Vision",
  "SAI-02": "Computer Vision",
  "SAI-03": "Computer Vision",
  "SAI-04": "Generative AI",
  "SAI-05": "Robotics",
  "DIG-01": "Computer Vision",
  "DIG-02": "Simulation / Digital Twin",
};
// Robotics category (the navigator's own taxonomy, by robot architecture/role).
const CATEGORY_BY_ID: Record<string, string> = {
  "PLT-01": "Soft-Tissue Surgical Robotics",
  "PLT-02": "Soft-Tissue Surgical Robotics",
  "PLT-03": "Soft-Tissue Surgical Robotics",
  "PLT-04": "Soft-Tissue Surgical Robotics",
  "URO-01": "Soft-Tissue Surgical Robotics",
  "URO-02": "Soft-Tissue Surgical Robotics",
  "URO-03": "Soft-Tissue Surgical Robotics",
  "PLT-05": "Flexible & Endoluminal Robotics",
  "ORT-01": "Orthopedic & Spine Robotics",
  "ORT-02": "Orthopedic & Spine Robotics",
  "ORT-03": "Orthopedic & Spine Robotics",
  "TELE-01": "Telesurgery & Remote Surgery",
  "TELE-02": "Telesurgery & Remote Surgery",
  "SAI-01": "Surgical Intelligence",
  "SAI-02": "Surgical Intelligence",
  "SAI-03": "Surgical Intelligence",
  "SAI-04": "Surgical Intelligence",
  "SAI-05": "Surgical Intelligence",
  "DIG-01": "Surgical Intelligence",
  "DIG-02": "Surgical Intelligence",
  "HUM-01": "Service & Non-Clinical Robotics",
  "HUM-02": "Service & Non-Clinical Robotics",
  "HUM-03": "Service & Non-Clinical Robotics",
  "HUM-04": "Service & Non-Clinical Robotics",
};
const PROXIMITY_BY_CATEGORY: Record<string, string> = {
  "Service & Non-Clinical Robotics": "Back Office",
  "Surgical Intelligence": "Clinical Operations",
};

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

const roboticsCanonical: unknown[] = roboticsNative.map((uc) => {
  const id = s(uc.id); // native id (e.g. "ORT-01") — used for lookups
  const category = CATEGORY_BY_ID[id] ?? "Soft-Tissue Surgical Robotics";
  return {
    id: `RS-${id}`, // namespaced to avoid collisions with the migrated dataset
    name: s(uc.name),
    description: s(uc.description),
    serviceLines: SERVICE_LINE_BY_ID[id] ?? ["Cross-Cutting"],
    subSpecialty: arr(uc.specialties)[0],
    autonomyLevel: AUTONOMY_MAP[s(uc.autonomyLevel)] ?? "Augmentation",
    surgicalAutonomyLevel: s(uc.autonomyLevel),
    patientProximity: PROXIMITY_BY_CATEGORY[category] ?? "Direct Care",
    evidenceTier: s(uc.evidenceTier),
    aiType: AI_TYPE_BY_ID[id] ?? "Robotics",
    metricsImpacted: ["Quality", "Growth"],
    primaryImpact: "Quality",
    secondaryImpact: "Growth",
    maturity: MATURITY_MAP[s(uc.maturity)] ?? "Frontier",
    implementationComplexity: s(uc.implementationComplexity) || "High",
    investmentTier: INVESTMENT_MAP[s(uc.investmentTier)] ?? "Incremental SaaS",
    fdaCleared: Boolean(uc.fdaCleared),
    keyVendors: arr(uc.keyVendors),
    keyPlatforms: arr(uc.keyPlatforms),
    keyMetric: s(uc.keyMetric),
    source: s(uc.source),
    fdaClearances: Array.isArray(uc.regulatory) ? uc.regulatory : [],
    deployedAt: [],
    track: category,
    specialties: arr(uc.specialties),
    setting: s(uc.setting) || undefined,
    lens: "robotics",
  };
});

export const useCases: UseCase[] = parseUseCases(
  [...serviceLineUseCasesRaw, ...roboticsCanonical]
    .map(withAugmentedDeployments)
    .map(withRoboticsTrack)
    .map(withNormalizedServiceLines),
);

