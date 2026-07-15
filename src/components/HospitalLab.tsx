import { useState } from "react";
import { HospitalTwin } from "@/components/HospitalTwin";
import { LiveCase } from "@/components/LiveCase";
import type { View } from "@/App";

type LabMode = "twin" | "case";

export function HospitalLab({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [mode, setMode] = useState<LabMode>("twin");

  function selectMode(nextMode: LabMode) {
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="lab-mode-bar bg-[var(--color-night)] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-1 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div>
            <span>Hospital flow lab</span>
            <strong>{mode === "twin" ? "System view" : "Decision drill-down"}</strong>
          </div>
          <div className="lab-mode-tabs" role="tablist" aria-label="Hospital lab mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "twin"}
              aria-controls="hospital-twin-panel"
              onClick={() => selectMode("twin")}
            >
              Hospital twin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "case"}
              aria-controls="hospital-case-panel"
              onClick={() => selectMode("case")}
            >
              Case 7B
            </button>
          </div>
        </div>
      </section>

      {mode === "twin" ? (
        <div id="hospital-twin-panel" role="tabpanel">
          <HospitalTwin onOpenCase={() => selectMode("case")} />
        </div>
      ) : (
        <div id="hospital-case-panel" role="tabpanel">
          <LiveCase onNavigate={onNavigate} />
        </div>
      )}
    </>
  );
}
