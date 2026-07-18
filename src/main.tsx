import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  scheduleHospitalAccessibilityProbe,
  scheduleHospitalPerformanceProbe,
  scheduleHospitalStoryTimingProbe,
} from "./lib/performance-probe";

// Deterministic accessibility QA hook. The normal experience still follows
// the operating system's prefers-reduced-motion setting.
if (new URLSearchParams(window.location.search).get("motion") === "reduced") {
  document.documentElement.dataset.reducedMotion = "true";
}

// Opt-in production telemetry for the release harness. It is inert unless the
// evaluator loads the app with ?qa=performance.
scheduleHospitalPerformanceProbe();
scheduleHospitalStoryTimingProbe();
scheduleHospitalAccessibilityProbe();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
