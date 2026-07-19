import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS, MATURITY_LEVELS } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { OPS_CATEGORIES, OPS_CATEGORY_COLOR, opsCategoriesFor } from "@/data/operations";
import { LEVERS, leverFor } from "@/data/levers";
import { consumePortfolioLeverFilter } from "@/lib/portfolio-link";
import { priorityScore, recommendation } from "@/lib/scoring";
import { SERVICE_LINE_COLOR } from "@/data/service-lines";
import { UseCaseCard } from "@/components/UseCaseCard";
import { RadarView } from "@/components/RadarView";
import { UseCaseModal } from "@/components/UseCaseModal";
import type { UseCase } from "@/data/schema";

type Area = "service-lines" | "robotics" | "operations";
type Mode = "cards" | "radar";

const AREA_META: Record<Area, { label: string; subLabel: string }> = {
  "service-lines": { label: "Service lines", subLabel: "Clinical systems" },
  robotics: { label: "Robotics", subLabel: "Robot categories" },
  operations: { label: "Hospital operations", subLabel: "Operations functions" },
};

const AREA_ORDER: Area[] = ["service-lines", "robotics", "operations"];

function inArea(useCase: UseCase, area: Area): boolean {
  if (area === "service-lines") return useCase.serviceLines.length > 0;
  if (area === "robotics") return useCase.track !== undefined;
  return opsCategoriesFor(useCase).length > 0;
}

function autonomyBucket(value: string | null | undefined): string {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("semi-autonom") || normalized.includes("augment")) return "Augmentation";
  if (normalized.includes("autonom") || normalized === "automation") return "Autonomous";
  return "Decision Support";
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
    ...opsCategoriesFor(useCase),
    ...(useCase.specialties ?? []),
    ...(useCase.keyPlatforms ?? []),
  ];

  return searchableValues.some(
    (value) => typeof value === "string" && value.toLowerCase().includes(query),
  );
}

export function PortfolioView() {
  const [areas, setAreas] = useState<Area[]>(["operations"]);
  const [mode, setMode] = useState<Mode>("cards");
  const [subFilter, setSubFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [maturity, setMaturity] = useState("all");
  const [autonomy, setAutonomy] = useState("all");
  // Deep links from the Six Levers tab arrive as a one-shot lever filter.
  const [lever, setLever] = useState(() => consumePortfolioLeverFilter() ?? "all");
  const [modalUc, setModalUc] = useState<UseCase | null>(null);

  // Exactly one focus area selected → its own second row of sub-filters.
  const soloArea = areas.length === 1 ? areas[0] : null;
  const lens = areas.includes("robotics") ? "track" : "service-line";

  function toggleArea(area: Area) {
    setAreas((previous) => (previous.includes(area) ? previous.filter((a) => a !== area) : [...previous, area]));
    setSubFilter("all");
  }

  const plays = useMemo(() => {
    const counts = { "Adopt Now": 0, "Pilot & Scale": 0, "Watch & Partner": 0 };
    for (const useCase of useCases) counts[recommendation(priorityScore(useCase)).label as keyof typeof counts]++;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return useCases
      .filter((useCase) => {
        for (const area of areas) if (!inArea(useCase, area)) return false;
        if (soloArea && subFilter !== "all") {
          if (soloArea === "service-lines" && !useCase.serviceLines.includes(subFilter as never)) return false;
          if (soloArea === "robotics" && useCase.track !== subFilter) return false;
          if (soloArea === "operations" && !(opsCategoriesFor(useCase) as string[]).includes(subFilter)) return false;
        }
        if (maturity !== "all" && useCase.maturity !== maturity) return false;
        if (autonomy !== "all" && autonomyBucket(useCase.autonomyLevel) !== autonomy) return false;
        if (lever !== "all" && leverFor(useCase).id !== lever) return false;
        if (!normalizedQuery) return true;
        return matchesSearchQuery(useCase, normalizedQuery);
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [areas, soloArea, subFilter, query, maturity, autonomy, lever]);

  const scopeLabel = areas.length === 0
    ? "across the full catalog"
    : `in ${areas.map((area) => AREA_META[area].label.toLowerCase()) .join(" × ")}`;

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div>
          <p className="eyebrow">Evidence library</p>
          <h1 className="display-title mt-4">{useCases.length} possibilities. One portfolio discipline.</h1>
          <p className="lede mt-5 max-w-3xl">
            The catalog is not the strategy. Sequence use cases by evidence, workflow fit, action rights, and the
            operating outcome they can prove.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[24px] border border-white/10 bg-white/10 lg:justify-self-end lg:min-w-[560px]">
          {[
            [plays["Adopt Now"], "Adopt now", "#43c98d"],
            [plays["Pilot & Scale"], "Pilot + scale", "#f2a33c"],
            [plays["Watch & Partner"], "Watch + partner", "#9c8bf0"],
          ].map(([count, label, color]) => (
            <div key={String(label)} className="bg-[var(--color-night)] p-5">
              <strong className="block text-3xl font-semibold tracking-[-0.04em]" style={{ color: String(color) }}>{count}</strong>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/55">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[26px] border border-white/10 bg-white/[0.035] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Areas of focus">
            <span className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">Focus</span>
            {AREA_ORDER.map((area) => (
              <ToggleButton key={area} active={areas.includes(area)} onClick={() => toggleArea(area)}>
                {AREA_META[area].label}
              </ToggleButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio view">
            <ToggleButton active={mode === "cards"} onClick={() => setMode("cards")}>Evidence cards</ToggleButton>
            <ToggleButton active={mode === "radar"} onClick={() => setMode("radar")}>Portfolio radar</ToggleButton>
          </div>
        </div>

        {soloArea && (
          <div
            className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5"
            role="group"
            aria-label={`${AREA_META[soloArea].subLabel} filter`}
          >
            <span className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/40">
              {AREA_META[soloArea].subLabel}
            </span>
            <FilterButton active={subFilter === "all"} onClick={() => setSubFilter("all")}>All</FilterButton>
            {soloArea === "service-lines" && SERVICE_LINES.map((line) => (
              <FilterButton key={line} active={subFilter === line} onClick={() => setSubFilter(line)} color={SERVICE_LINE_COLOR[line]}>
                {line}
              </FilterButton>
            ))}
            {soloArea === "robotics" && TRACKS.map((track) => (
              <FilterButton key={track} active={subFilter === track} onClick={() => setSubFilter(track)} color={`var(${TRACK_META[track].colorVar})`}>
                {TRACK_META[track].label}
              </FilterButton>
            ))}
            {soloArea === "operations" && OPS_CATEGORIES.map((category) => (
              <FilterButton key={category} active={subFilter === category} onClick={() => setSubFilter(category)} color={OPS_CATEGORY_COLOR[category]}>
                {category}
              </FilterButton>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label htmlFor="portfolio-search" className="sr-only">
              Search use cases by workflow, vendor, specialty, or outcome
            </label>
            <input
              id="portfolio-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workflow, vendor, specialty, or outcome…"
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[var(--color-mint)] focus:ring-2 focus:ring-[var(--color-mint)]/20"
            />
          </div>
          <select value={lever} onChange={(event) => setLever(event.target.value)} aria-label="Lever" className="filter-select">
            <option value="all">All levers</option>
            {LEVERS.map((item, index) => (
              <option key={item.id} value={item.id}>{`0${index + 1} ${item.name}`}</option>
            ))}
          </select>
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
        <p className="text-sm font-semibold text-white/60">
          {filtered.length} use case{filtered.length === 1 ? "" : "s"} {scopeLabel}
        </p>
        <p className="hidden text-[11px] text-white/50 sm:block">Heuristic readiness score · directional, not a financial recommendation</p>
      </div>

      {mode === "cards" ? (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4">
          {filtered.map((useCase) => <UseCaseCard key={useCase.id} uc={useCase} lens={lens} onOpen={setModalUc} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-4 shadow-[var(--shadow-soft)] sm:p-6">
          <RadarView ucs={filtered} onSelect={setModalUc} />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-[26px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center text-sm text-white/60">
          No use cases match this combination of focus areas and filters.
        </div>
      )}

      <UseCaseModal uc={modalUc} lens={lens} onClose={() => setModalUc(null)} />
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full border px-4 py-2 text-[11px] font-bold transition-colors"
      style={{
        borderColor: active ? "rgba(91,240,195,0.4)" : "rgba(255,255,255,0.16)",
        background: active ? "rgba(91,240,195,0.14)" : "transparent",
        color: active ? "var(--color-mint)" : "rgba(255,255,255,0.6)",
      }}
    >
      {children}
    </button>
  );
}

function FilterButton({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  const activeColor = color ?? "var(--color-mint)";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors"
      style={{
        borderColor: active ? `color-mix(in srgb, ${activeColor} 45%, transparent)` : "rgba(255,255,255,0.16)",
        background: active ? `color-mix(in srgb, ${activeColor} 18%, transparent)` : "transparent",
        color: active ? `color-mix(in srgb, ${activeColor} 55%, white)` : "rgba(255,255,255,0.6)",
      }}
    >
      {children}
    </button>
  );
}
