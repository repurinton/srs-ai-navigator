import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS, MATURITY_LEVELS } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { OPS_CATEGORIES, opsCategoriesFor } from "@/data/operations";
import { LEVERS, leverFor } from "@/data/levers";
import { consumePortfolioLeverFilter } from "@/lib/portfolio-link";
import { priorityScore, recommendation } from "@/lib/scoring";
import { UseCaseCard } from "@/components/UseCaseCard";
import { RadarView } from "@/components/RadarView";
import { UseCaseModal } from "@/components/UseCaseModal";
import type { UseCase } from "@/data/schema";

type Mode = "cards" | "radar";

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
  // Deep links from the Six Levers tab arrive as a one-shot lever filter;
  // every other filter starts wide open, so the promised count always matches.
  const [deepLinkLever] = useState(() => consumePortfolioLeverFilter());
  const [mode, setMode] = useState<Mode>("cards");
  const [query, setQuery] = useState("");
  const [serviceLine, setServiceLine] = useState("all");
  const [track, setTrack] = useState("all");
  const [opsCategory, setOpsCategory] = useState("all");
  const [lever, setLever] = useState(deepLinkLever ?? "all");
  const [maturity, setMaturity] = useState("all");
  const [autonomy, setAutonomy] = useState("all");
  const [modalUc, setModalUc] = useState<UseCase | null>(null);

  // Card/modal accent follows the robotics taxonomy while a robotics
  // category is selected, the service-line taxonomy otherwise.
  const lens = track !== "all" ? "track" : "service-line";

  const plays = useMemo(() => {
    const counts = { "Adopt Now": 0, "Pilot & Scale": 0, "Watch & Partner": 0 };
    for (const useCase of useCases) counts[recommendation(priorityScore(useCase)).label as keyof typeof counts]++;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return useCases
      .filter((useCase) => {
        if (serviceLine !== "all" && !useCase.serviceLines.includes(serviceLine as never)) return false;
        if (track !== "all" && useCase.track !== track) return false;
        if (opsCategory !== "all" && !(opsCategoriesFor(useCase) as string[]).includes(opsCategory)) return false;
        if (lever !== "all" && leverFor(useCase).id !== lever) return false;
        if (maturity !== "all" && useCase.maturity !== maturity) return false;
        if (autonomy !== "all" && autonomyBucket(useCase.autonomyLevel) !== autonomy) return false;
        if (!normalizedQuery) return true;
        return matchesSearchQuery(useCase, normalizedQuery);
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [serviceLine, track, opsCategory, lever, maturity, autonomy, query]);

  const hasActiveFilters =
    serviceLine !== "all" || track !== "all" || opsCategory !== "all" || lever !== "all"
    || maturity !== "all" || autonomy !== "all" || query.trim() !== "";

  function clearFilters() {
    setServiceLine("all");
    setTrack("all");
    setOpsCategory("all");
    setLever("all");
    setMaturity("all");
    setAutonomy("all");
    setQuery("");
  }

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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="w-full xl:max-w-xl">
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
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio view">
            <ToggleButton active={mode === "cards"} onClick={() => setMode("cards")}>Evidence cards</ToggleButton>
            <ToggleButton active={mode === "radar"} onClick={() => setMode("radar")}>Portfolio radar</ToggleButton>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <select value={serviceLine} onChange={(event) => setServiceLine(event.target.value)} aria-label="Service line" className="filter-select">
            <option value="all">All service lines</option>
            {SERVICE_LINES.map((line) => <option key={line} value={line}>{line}</option>)}
          </select>
          <select value={track} onChange={(event) => setTrack(event.target.value)} aria-label="Robotics category" className="filter-select">
            <option value="all">All robotics</option>
            {TRACKS.map((item) => <option key={item} value={item}>{TRACK_META[item].label}</option>)}
          </select>
          <select value={opsCategory} onChange={(event) => setOpsCategory(event.target.value)} aria-label="Operations function" className="filter-select">
            <option value="all">All operations</option>
            {OPS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
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

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-white/60">
          {filtered.length === useCases.length
            ? `All ${useCases.length} use cases`
            : `${filtered.length} of ${useCases.length} use cases`}
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="ml-3 text-[11px] font-bold text-[var(--color-mint)] hover:underline">
              Clear filters
            </button>
          )}
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
          No use cases match these filters.
          <button type="button" onClick={clearFilters} className="ml-2 font-bold text-[var(--color-mint)] hover:underline">
            Clear filters
          </button>
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
