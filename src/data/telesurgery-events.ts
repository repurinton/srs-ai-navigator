/**
 * Real, sourced telesurgery milestones — the data behind the "Collapse of
 * Distance" time-lapse map. Each event is a console-site → patient-site link
 * with a date, distance, and citation. Distances are approximate great-circle
 * (straight-line) km; notable network-path figures are called out in `note`.
 */
export interface GeoPoint {
  city: string;
  country: string;
  lat: number;
  lng: number;
}
export interface TeleEvent {
  id: string;
  date: string; // ISO
  t: number; // decimal year (for the timeline)
  title: string;
  from: GeoPoint; // surgeon / console
  to: GeoPoint; // patient
  distanceKm: number;
  platform: string;
  procedure: string;
  note: string;
  source: string;
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
const LUANDA: GeoPoint = { city: "Luanda", country: "Angola", lat: -8.84, lng: 13.23 };
const SAO_PAULO: GeoPoint = { city: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63 };

export const teleEvents: TeleEvent[] = [
  {
    id: "lindbergh-2001",
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
    id: "toumai-casablanca-2024",
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
    date: "2025-02-20",
    t: 2025.14,
    title: "Telesurgery across the Americas",
    from: ORLANDO,
    to: SAO_PAULO,
    distanceKm: 6600,
    platform: "MicroPort Toumai",
    procedure: "Connectivity demonstration (model)",
    note: "First remote surgical connection between North and South America — Orlando to São Paulo — proving the link before first-in-human.",
    source: "J. Robotic Surgery (PMC), 2025",
  },
  {
    id: "orlando-angola-2025",
    date: "2025-06-14",
    t: 2025.45,
    title: "First FDA-cleared telesurgery on a human",
    from: ORLANDO,
    to: LUANDA,
    distanceKm: 10800,
    platform: "MicroPort Toumai",
    procedure: "Radical prostatectomy",
    note: "Dr. Vipul Patel operated from AdventHealth's Global Robotics Institute in Orlando on a patient in Luanda, Angola — the world's first FDA-IDE telesurgery on a human (~17,000 km network path, ~90 min).",
    source: "MicroPort MedBot / PR Newswire, 2025",
    hero: true,
  },
];

export const TELE_MIN_T = 2000.8;
export const TELE_MAX_T = 2025.9;
