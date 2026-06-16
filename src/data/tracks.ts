import type { Track } from "./schema";

export interface TrackMeta {
  key: Track;
  label: string;
  blurb: string;
  colorVar: string; // CSS custom property name from index.css @theme
}

/**
 * Robotics categories — organized by the robot's architecture/role rather than
 * by surgical specialty or meeting theme. Color vars are reused from index.css.
 */
export const TRACK_META: Record<Track, TrackMeta> = {
  "Soft-Tissue Surgical Robotics": {
    key: "Soft-Tissue Surgical Robotics",
    label: "Soft-Tissue Surgical",
    blurb:
      "Rigid multi-port and single-port telemanipulator consoles for soft-tissue surgery across urology, gynecology, general, thoracic, and head & neck.",
    colorVar: "--color-track-urology",
  },
  "Orthopedic & Spine Robotics": {
    key: "Orthopedic & Spine Robotics",
    label: "Orthopedic & Spine",
    blurb:
      "Haptic-guided and navigated bone surgery — robotic joint replacement and pedicle-screw placement with planning and alignment.",
    colorVar: "--color-track-ortho",
  },
  "Flexible & Endoluminal Robotics": {
    key: "Flexible & Endoluminal Robotics",
    label: "Flexible & Endoluminal",
    blurb:
      "Flexible robots that navigate natural orifices and lumens — robotic bronchoscopy today, with endoluminal and catheter robotics emerging.",
    colorVar: "--color-track-surgical-ai",
  },
  "Telesurgery & Remote Surgery": {
    key: "Telesurgery & Remote Surgery",
    label: "Telesurgery & Remote",
    blurb:
      "Remote and tele-mentored operation over low-latency networks, following the society's Telesurgery Guidelines.",
    colorVar: "--color-track-telesurgery",
  },
  "Surgical Intelligence": {
    key: "Surgical Intelligence",
    label: "Surgical Intelligence",
    blurb:
      "The software layer around the robot — intraoperative AI, surgical-phase and safety recognition, skills assessment, digital surgery data, and autonomy research.",
    colorVar: "--color-track-digital",
  },
  "Service & Non-Clinical Robotics": {
    key: "Service & Non-Clinical Robotics",
    label: "Service & Non-Clinical",
    blurb:
      "Mobile and humanoid robots for hospital operations — logistics, disinfection, pharmacy automation, and frontier clinical-assist.",
    colorVar: "--color-track-humanoids",
  },
};
