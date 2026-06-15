import type { Track } from "./schema";

export interface TrackMeta {
  key: Track;
  label: string;
  blurb: string;
  colorVar: string; // CSS custom property name from index.css @theme
}

export const TRACK_META: Record<Track, TrackMeta> = {
  "Robotic Platforms": {
    key: "Robotic Platforms",
    label: "Robotic Platforms",
    blurb:
      "Soft-tissue and orthopedic surgical robots — multi-port, single-port, and emerging competitors reshaping the platform market.",
    colorVar: "--color-track-platforms",
  },
  Urology: {
    key: "Urology",
    label: "Urology",
    blurb:
      "The founding home of robotic surgery — prostatectomy, partial nephrectomy, cystectomy, and beyond.",
    colorVar: "--color-track-urology",
  },
  Telesurgery: {
    key: "Telesurgery",
    label: "Telesurgery",
    blurb:
      "Remote and tele-mentored surgery enabled by low-latency networks, following the society's Telesurgery Guidelines.",
    colorVar: "--color-track-telesurgery",
  },
  "Surgical AI": {
    key: "Surgical AI",
    label: "Surgical AI",
    blurb:
      "Computer vision and ML for intraoperative guidance, surgical phase recognition, skills assessment, and autonomy.",
    colorVar: "--color-track-surgical-ai",
  },
  "Digital Surgery": {
    key: "Digital Surgery",
    label: "Digital Surgery",
    blurb:
      "The connected OR — data capture, video analytics, digital twins, and end-to-end surgical data platforms.",
    colorVar: "--color-track-digital",
  },
  Orthopedics: {
    key: "Orthopedics",
    label: "Orthopedics",
    blurb:
      "Robotic-assisted joint replacement and spine — haptic guidance, planning, and navigation.",
    colorVar: "--color-track-ortho",
  },
  Humanoids: {
    key: "Humanoids",
    label: "Humanoids",
    blurb:
      "Frontier humanoid and mobile robotics for clinical assistance and non-clinical hospital operations.",
    colorVar: "--color-track-humanoids",
  },
};
