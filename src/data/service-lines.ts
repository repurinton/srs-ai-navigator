import type { ServiceLine } from "./schema";

export const SERVICE_LINE_COLOR: Record<ServiceLine, string> = {
  Cancer: "#e07a83",
  "Heart, Lung & Vascular": "#3aa0e8",
  Orthopedics: "#6EBE49",
  Neurosciences: "#9d86b3",
  Gastrointestinal: "#E87722",
  "Women’s Health": "#e8558f",
  "Cross-Cutting": "#7fa3c9",
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
