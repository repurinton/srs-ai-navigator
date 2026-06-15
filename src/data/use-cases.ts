import { parseUseCases, type UseCase } from "./schema";

/**
 * Seed dataset for SRS 2026 — a representative slice across every track to
 * validate the schema and UI end-to-end. This will be expanded into the full
 * library (and the relevant robotic-surgery entries migrated from the original
 * National Service Line AI Navigator dataset).
 */
const raw: unknown[] = [
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
];

export const useCases: UseCase[] = parseUseCases(raw);
