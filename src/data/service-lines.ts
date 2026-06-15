import type { ServiceLine } from "./schema";

export const SERVICE_LINE_COLOR: Record<ServiceLine, string> = {
  Cancer: "#C44D58",
  "Heart, Lung & Vascular": "#0078C8",
  Orthopedics: "#6EBE49",
  Neurosciences: "#6C5B7B",
  Gastrointestinal: "#E87722",
  "Women’s Health": "#C2185B",
  "Cross-Cutting": "#3a5a7d",
};

export const SERVICE_LINE_ICON: Record<ServiceLine, string> = {
  Cancer: "🎗️",
  "Heart, Lung & Vascular": "❤️",
  Orthopedics: "🦴",
  Neurosciences: "🧠",
  Gastrointestinal: "🔬",
  "Women’s Health": "♀",
  "Cross-Cutting": "🔗",
};
