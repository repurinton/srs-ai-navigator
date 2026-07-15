import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS, MATURITY_LEVELS } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { priorityScore, recommendation } from "@/lib/scoring";
import { SERVICE_LINE_COLOR } from "@/data/service-lines";
import { UseCaseCard } from "@/components/UseCaseCard";
import { RadarView } from "@/components/RadarView";
import { UseCaseModal } from "@/components/UseCaseModal";
import type { UseCase } from "@/data/schema";

type Lens = "service-line" | "track";
type Mode = "cards" | "radar";

const OPERATIONS_TERMS = [
  "operating room",
  "scheduling",
  "capacity",
  "staff",
  "workforce",
  "bed",
  "supply chain",
  "prior authorization",
  "revenue cycle",
  "patient flow",
  "logistics",
  "discharge",
  "sterile",
];

function autonomyBucket(value: string | null | undefined): string {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("semi-autonom") || normalized.includes("augment")) return "Augmentation";
  if (normalized.includes("autonom") || normalized === "automation") return "Autonomous";
  return "Decision Support";
}

function isOperationsCase(useCase: UseCase): boolean {
  const haystack = [useCase.name, useCase.description, useCase.subSpecialty, useCase.aiType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return OPERATIONS_TERMS.some((term) => haystack.includes(term));
}

function matchesSearchQuery(useCase: UseCase, query: string): boolean {
  const searchableValues = [
    useCase.id,
    useCase.name,
    useCase.description,
    useCase.subSpecialty,
    useCase.aiType,
    useCase.autonomyLevel,
    useCase.patientProximity,
    useCase.evidenceTier,
    useCase.primaryImpact,
    useCase.secondaryImpact,
    useCase.keyMetric,
    useCase.source,
    useCase.maturity,
    useCase.implementationComplexity,
    useCase.investmentTier,
    useCase.track,
    useCase.roboticsClass,
    useCase.setting,
    useCase.surgicalAutonomyLevel,
    ...useCase.serviceLines,
    ...useCase.metricsImpacted,
    ...useCase.keyVendors,
    ...useCase.deployedAt,
    ...(useCase.specialties ?? []),
    ...(useCase.keyPlatforms ?? []),
  ];

  return searchableValues.some(
    (value) => typeof value === "string" && value.toLowerCase().includes(query),
  );
}

export function PortfolioView() {
  const [lens, setLens] = useState<Lens>("service-line");
  const [mode, setMode] = useState<Mode>("cards");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [maturity, setMaturity] = useState("all");
  const [autonomy, setAutonomy] = useState("all");
  const [operationsOnly, setOperationsOnly] = useState(true);
  const [modalUc, setModalUc] = useState<UseCase | null>(null);

  const plays = useMemo(() => {
    const counts = { "Adopt Now": 0, "Pilot & Scale": 0, "Watch & Partner": 0 };
    for (const useCase of useCases) counts[recommendation(priorityScore(useCase)).label as keyof typeof counts]++;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return useCases
      .filter((useCase) => {
        if (lens === "service-line") {
          if (filter !== "all" && !useCase.serviceLines.includes(filter as never)) return false;
        } else if (filter === "all") {
          if (!useCase.track) return false;
        } else if (useCase.track !== filter) return false;
        if (operationsOnly && !isOperationsCase(useCase)) return false;
        if (maturity !== "all" && useCase.maturity !== maturity) return false;
        if (autonomy !== "all" && autonomyBucket(useCase.autonomyLevel) !== autonomy) return false;
        if (!normalizedQuery) return true;
        return matchesSearchQuery(useCase, normalizedQuery);
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [lens, filter, query, maturity, autonomy, operationsOnly]);

  const categories = lens === "service-line" ? SERVICE_LINES : TRACKS;

  function changeLens(next: Lens) {
    setLens(next);
    setFilter("all");
    if (next === "track") setOperationsOnly(false);
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div>
          <p className="eyebrow">Evidence library</p>
          <h1 className="display-title mt-4">272 possibilities. One portfolio discipline.</h1>
          <p className="lede mt-5 max-w-3xl">
            The catalog is not the strategy. Sequence use cases by evidence, workflow fit, action rights, and the
            operating outcome they can prove.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-[var(--color-line)] lg:justify-self-end lg:min-w-[560px]">
          {[
            [plays["Adopt Now"], "Adopt now", "#2e9e6b"],
            [plays["Pilot & Scale"], "Pilot + scale", "#cf7b19"],
            [plays["Watch & Partner"], "Watch + partner", "#735de8"],
          ].map(([count, label, color]) => (
            <div key={String(label)} className="bg-white p-5">
              <strong className="block text-3xl font-semibold tracking-[-0.04em]" style={{ color: String(color) }}>{count}</strong>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[26px] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio lens and scope">
            <ToggleButton active={lens === "service-line"} onClick={() => changeLens("service-line")}>Service lines</ToggleButton>
            <ToggleButton active={lens === "track"} onClick={() => changeLens("track")}>Robotics categories</ToggleButton>
            <span className="mx-1 hidden w-px bg-[var(--color-line)] sm:block" />
            <ToggleButton active={operationsOnly} onClick={() => setOperationsOnly((value) => !value)}>Hospital operations</ToggleButton>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio view">
            <ToggleButton active={mode === "cards"} onClick={() => setMode("cards")}>Evidence cards</ToggleButton>
            <ToggleButton active={mode === "radar"} onClick={() => setMode("radar")}>Portfolio radar</ToggleButton>
          </div>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-5"
          role="group"
          aria-label={lens === "service-line" ? "Service line filter" : "Robotics category filter"}
        >
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
          {categories.map((category) => (
            <FilterButton
              key={category}
              active={filter === category}
              onClick={() => setFilter(category)}
              color={lens === "service-line" ? SERVICE_LINE_COLOR[category as keyof typeof SERVICE_LINE_COLOR] : `var(${TRACK_META[category as keyof typeof TRACK_META].colorVar})`}
            >
              {lens === "track" ? TRACK_META[category as keyof typeof TRACK_META].label : category}
            </FilterButton>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="portfolio-search" className="sr-only">
              Search use cases by workflow, vendor, specialty, or outcome
            </label>
            <input
              id="portfolio-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workflow, vendor, specialty, or outcome…"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-mint-dark)] focus:ring-2 focus:ring-[var(--color-mint)]/20"
            />
          </div>
          <select value={maturity} onChange={(event) => setMaturity(event.target.value)} aria-label="Maturity" className="filter-select">
            <option value="all">All maturity</option>
            {MATURITY_LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
          <select value={autonomy} onChange={(event) => setAutonomy(event.target.value)} aria-label="Autonomy" className="filter-select">
            <option value="all">All autonomy</option>
            <option>Decision Support</option><option>Augmentation</option><option>Autonomous</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-muted)]">
          {filtered.length} use case{filtered.length === 1 ? "" : "s"}{operationsOnly ? " in the operations lens" : ""}
        </p>
        <p className="hidden text-[11px] text-[var(--color-muted)] sm:block">Heuristic readiness score · directional, not a financial recommendation</p>
      </div>

      {mode === "cards" ? (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4">
          {filtered.map((useCase) => <UseCaseCard key={useCase.id} uc={useCase} lens={lens} onOpen={setModalUc} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-[26px] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-6">
          <RadarView ucs={filtered} onSelect={setModalUc} />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-[26px] border border-dashed border-[var(--color-line)] bg-white px-6 py-16 text-center text-sm text-[var(--color-muted)]">
          No use cases match this portfolio lens.
        </div>
      )}

      <UseCaseModal uc={modalUc} lens={lens} onClose={() => setModalUc(null)} />
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className="rounded-full border px-4 py-2 text-[11px] font-bold transition-colors" style={{ borderColor: active ? "var(--color-night)" : "var(--color-line)", background: active ? "var(--color-night)" : "white", color: active ? "white" : "var(--color-muted)" }}>
      {children}
    </button>
  );
}

function FilterButton({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  const activeColor = color ?? "var(--color-night)";
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className="rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors" style={{ borderColor: active ? activeColor : "var(--color-line)", background: active ? activeColor : "white", color: active ? "white" : "var(--color-muted)" }}>
      {children}
    </button>
  );
}
