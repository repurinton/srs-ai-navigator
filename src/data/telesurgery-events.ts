/**
 * Real, sourced milestones behind "The Rise of Robotic Surgery" time-lapse map.
 *
 * Two kinds of event, on one shared timeline:
 *  - "platform"    a robotic-surgery system reaches a new country/market —
 *                   rendered as a single glowing site marker (a capability
 *                   "lighting up").
 *  - "telesurgery"  a console-site → patient-site remote procedure —
 *                   rendered as a bowed arc between the two points.
 *
 * All dates are the earliest public date confirmed by a citation; where only
 * a month/year is documented, the day is set to the 1st rather than implying
 * false precision.
 */
export interface GeoPoint {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export type EventKind = "platform" | "telesurgery";

export interface TeleEvent {
  id: string;
  kind: EventKind;
  date: string; // ISO
  t: number; // decimal year (for the timeline)
  title: string;
  from: GeoPoint; // surgeon / console / launch site
  to?: GeoPoint; // patient site (telesurgery only)
  distanceKm?: number; // telesurgery only
  platform: string;
  procedure?: string;
  note: string;
  source: string;
  fromVenue?: string; // originating institution (console site)
  hero?: boolean;
}

const NY: GeoPoint = { city: "New York", country: "USA", lat: 40.71, lng: -74.01 };
const STRASBOURG: GeoPoint = { city: "Strasbourg", country: "France", lat: 48.58, lng: 7.75 };
const HAMILTON: GeoPoint = { city: "Hamilton, ON", country: "Canada", lat: 43.26, lng: -79.87 };
const NORTH_BAY: GeoPoint = { city: "North Bay, ON", country: "Canada", lat: 46.31, lng: -79.46 };
const SANYA: GeoPoint = { city: "Sanya", country: "China", lat: 18.25, lng: 109.51 };
const BEIJING: GeoPoint = { city: "Beijing", country: "China", lat: 39.9, lng: 116.4 };
const SHANGHAI: GeoPoint = { city: "Shanghai", country: "China", lat: 31.23, lng: 121.47 };
const CASABLANCA: GeoPoint = { city: "Casablanca", country: "Morocco", lat: 33.57, lng: -7.59 };
const NEW_DELHI: GeoPoint = { city: "New Delhi", country: "India", lat: 28.61, lng: 77.21 };
const JAIPUR: GeoPoint = { city: "Jaipur", country: "India", lat: 26.91, lng: 75.79 };
const ORLANDO: GeoPoint = { city: "Orlando", country: "USA", lat: 28.54, lng: -81.38 };
const PEACHTREE: GeoPoint = { city: "Peachtree Corners, GA", country: "USA", lat: 33.97, lng: -84.22 };
const LUANDA: GeoPoint = { city: "Luanda", country: "Angola", lat: -8.84, lng: 13.23 };
const SAO_PAULO: GeoPoint = { city: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63 };
const SUNNYVALE: GeoPoint = { city: "Sunnyvale, CA", country: "USA", lat: 37.37, lng: -122.04 };
const CAMBRIDGE_UK: GeoPoint = { city: "Cambridge", country: "UK", lat: 52.2, lng: 0.13 };
const DUBLIN: GeoPoint = { city: "Dublin", country: "Ireland", lat: 53.35, lng: -6.26 };

const rawEvents: TeleEvent[] = [
  {
    id: "davinci-fda-2000",
    kind: "platform",
    date: "2000-07-01",
    t: 2000.52,
    title: "da Vinci cleared for surgery — the modern era begins",
    from: SUNNYVALE,
    platform: "Intuitive da Vinci",
    note: "The FDA cleared da Vinci for general laparoscopic surgery in July 2000 — the device that would define robotic surgery for the next two decades.",
    source: "FDA clearance record, 2000",
  },
  {
    id: "lindbergh-2001",
    kind: "telesurgery",
    date: "2001-09-07",
    t: 2001.7,
    title: "Operation Lindbergh — the first transatlantic surgery",
    from: NY,
    to: STRASBOURG,
    distanceKm: 6200,
    platform: "ZEUS (Computer Motion)",
    procedure: "Cholecystectomy",
    note: "Prof. Jacques Marescaux operated from New York on a patient in Strasbourg — the proof that distance could be crossed.",
    source: "Marescaux et al., Nature 2001",
  },
  {
    id: "anvari-2003",
    kind: "telesurgery",
    date: "2003-03-01",
    t: 2003.2,
    title: "First regular remote-surgery service",
    from: HAMILTON,
    to: NORTH_BAY,
    distanceKm: 340,
    platform: "ZEUS",
    procedure: "Laparoscopic (multi-specialty)",
    note: "Mehran Anvari ran the world's first sustained telerobotic surgery service between Hamilton and North Bay, Ontario.",
    source: "Anvari et al., Annals of Surgery 2005",
  },
  {
    id: "china-5g-2019",
    kind: "telesurgery",
    date: "2019-03-16",
    t: 2019.2,
    title: "First 5G remote surgery",
    from: SANYA,
    to: BEIJING,
    distanceKm: 3000,
    platform: "5G remote system (PLAGH)",
    procedure: "Deep brain stimulation (Parkinson's)",
    note: "Dr. Ling Zhipei operated from Sanya on a patient 3,000 km away in Beijing — 5G finally killed the latency that stalled telesurgery for 18 years.",
    source: "China Daily / CGTN 2019",
  },
  {
    id: "versius-ce-2019",
    kind: "platform",
    date: "2019-03-01",
    t: 2019.3,
    title: "Versius reaches the market — the first serious challenger",
    from: CAMBRIDGE_UK,
    platform: "CMR Surgical Versius",
    note: "CMR Surgical secured CE Mark for Versius in March 2019, launching the first credible modular challenger to da Vinci's two-decade lead.",
    source: "MassDevice, 2019",
  },
  {
    id: "hugo-ce-2021",
    kind: "platform",
    date: "2021-10-11",
    t: 2021.78,
    title: "Hugo RAS reaches Europe",
    from: DUBLIN,
    platform: "Medtronic Hugo RAS",
    note: "Medtronic announced CE Mark approval for the Hugo robotic-assisted surgery system on October 11, 2021, bringing a second global medtech giant into the market.",
    source: "Medtronic press release, Oct 11, 2021",
  },
  {
    id: "toumai-nmpa-2022",
    kind: "platform",
    date: "2022-01-01",
    t: 2022.02,
    title: "Toumai reaches China — the first homegrown Chinese platform",
    from: SHANGHAI,
    platform: "MicroPort Toumai",
    note: "China's NMPA approved the Toumai laparoscopic surgical robot in January 2022 — the first commercialized four-arm platform developed in China.",
    source: "MicroPort MedBot, 2022",
  },
  {
    id: "mantra-india-2022",
    kind: "platform",
    date: "2022-07-01",
    t: 2022.5,
    title: "SSi Mantra reaches India",
    from: NEW_DELHI,
    platform: "SS Innovations SSi Mantra",
    note: "The first SSi Mantra system was installed at the Rajiv Gandhi Cancer Institute in July 2022 — India's first homegrown surgical robot.",
    source: "SS Innovations, 2022",
  },
  {
    id: "toumai-casablanca-2024",
    kind: "telesurgery",
    date: "2024-11-16",
    t: 2024.88,
    title: "Longest intercontinental telesurgery",
    from: SHANGHAI,
    to: CASABLANCA,
    distanceKm: 12000,
    platform: "MicroPort Toumai",
    procedure: "Radical prostatectomy",
    note: "Dr. Youness Ahallal operated from Shanghai on a patient in Casablanca — a 12,000 km world record at the time.",
    source: "MicroPort MedBot, 2024",
  },
  {
    id: "ssi-cardiac-2025",
    kind: "telesurgery",
    date: "2025-01-15",
    t: 2025.04,
    title: "First robotic cardiac telesurgery",
    from: NEW_DELHI,
    to: JAIPUR,
    distanceKm: 300,
    platform: "SSi Mantra 3",
    procedure: "Robotic CABG (coronary bypass)",
    note: "Dr. Sudhir Srivastava performed a world-first robotic cardiac telesurgery from New Delhi on a patient ~300 km away in Jaipur.",
    source: "SS Innovations, 2025",
  },
  {
    id: "americas-saopaulo-2025",
    kind: "telesurgery",
    date: "2025-02-20",
    t: 2025.14,
    title: "Telesurgery across the Americas",
    from: ORLANDO,
    to: SAO_PAULO,
    distanceKm: 6600,
    platform: "MicroPort Toumai",
    procedure: "Connectivity demonstration (model)",
    note: "First remote surgical connection between North and South America — from AdventHealth's Global Robotics Institute in Orlando to São Paulo — proving the link before first-in-human.",
    source: "J. Robotic Surgery (PMC), 2025",
    fromVenue: "AdventHealth Global Robotics Institute · Celebration, FL",
  },
  {
    id: "orlando-angola-2025",
    kind: "telesurgery",
    date: "2025-06-14",
    t: 2025.45,
    title: "First FDA-authorized human telesurgery under IDE",
    from: ORLANDO,
    to: LUANDA,
    distanceKm: 10800,
    platform: "MicroPort Toumai",
    procedure: "Radical prostatectomy",
    note: "Dr. Vipul Patel operated from AdventHealth's Global Robotics Institute in Orlando on a patient in Luanda, Angola — the world's first FDA-IDE telesurgery on a human (~17,000 km network path, ~90 min).",
    source: "MicroPort MedBot / PR Newswire, 2025",
    fromVenue: "AdventHealth Global Robotics Institute · Celebration, FL",
    hero: true,
  },
  {
    id: "intuitive-davinci5-2025",
    kind: "telesurgery",
    date: "2025-07-15",
    t: 2025.54,
    title: "da Vinci 5 telesurgery — the dominant platform arrives",
    from: PEACHTREE,
    to: STRASBOURG,
    distanceKm: 6900,
    platform: "Intuitive da Vinci 5 (dual console)",
    procedure: "Demonstration (tissue model)",
    note: "Intuitive demonstrated da Vinci 5 telesurgery — surgeons in Georgia and Strasbourg passing instrument control with haptic feedback across 4,000+ miles — unveiled at the Society of Robotic Surgery meeting. (Research; not yet cleared for clinical use.)",
    source: "Intuitive Surgical / The Robot Report, 2025",
  },
];

export const teleEvents: TeleEvent[] = [...rawEvents].sort((a, b) => a.t - b.t);

export const TELE_MIN_T = 2000.3;
export const TELE_MAX_T = 2025.9;
