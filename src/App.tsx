import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS, MATURITY_LEVELS } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { priorityScore } from "@/lib/scoring";
import { SERVICE_LINE_COLOR, SERVICE_LINE_ICON } from "@/data/service-lines";
import { UseCaseCard } from "@/components/UseCaseCard";
import { RadarView } from "@/components/RadarView";
import { UseCaseModal } from "@/components/UseCaseModal";
import { Home } from "@/components/Home";
import { TelesurgeryMap } from "@/components/TelesurgeryMap";
import { Header } from "@/components/Header";
import type { UseCase } from "@/data/schema";

type Lens = "service-line" | "track";
type View = "home" | "explorer" | "radar" | "telesurgery";
type SortBy = "readiness" | "name" | "maturity";

const VIEW_LABELS: Record<View, string> = {
  home: "Overview",
  explorer: "Use Case Explorer",
  radar: "Radar View",
  telesurgery: "Global Timeline",
};

const AUTONOMY_BUCKETS = ["Decision Support", "Augmentation", "Autonomous"] as const;
const MATURITY_RANK: Record<string, number> = {
  "Standard of Care": 0,
  "Best Practice": 1,
  Frontier: 2,
  "Emerging Research": 3,
};

function autonomyBucket(a: string | null | undefined): string {
  const s = (a ?? "").toLowerCase();
  if (s.includes("autonom") || s.includes("automation")) return "Autonomous";
  if (s.includes("augment")) return "Augmentation";
  return "Decision Support";
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [lens, setLens] = useState<Lens>("service-line");
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [maturity, setMaturity] = useState<string>("all");
  const [fda, setFda] = useState<string>("all"); // all | yes | no
  const [autonomy, setAutonomy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("readiness");
  const [modalUc, setModalUc] = useState<UseCase | null>(null);

  const facetsActive = maturity !== "all" || fda !== "all" || autonomy !== "all";

  function clearFacets() {
    setMaturity("all");
    setFda("all");
    setAutonomy("all");
  }

  function switchLens(next: Lens) {
    setLens(next);
    setFilter("all");
  }

  function navigateFromHome(
    nextView: "explorer" | "radar",
    nextLens?: Lens,
    nextFilter?: string,
  ) {
    if (nextLens) setLens(nextLens);
    setFilter(nextFilter ?? "all");
    setView(nextView);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return useCases.filter((uc) => {
      if (lens === "service-line") {
        if (filter !== "all" && !uc.serviceLines.includes(filter as never)) return false;
      } else {
        if (filter === "all") {
          if (!uc.track) return false; // track lens shows robotic-surgery cases
        } else if (uc.track !== filter) {
          return false;
        }
      }
      if (maturity !== "all" && uc.maturity !== maturity) return false;
      if (fda === "yes" && !uc.fdaCleared) return false;
      if (fda === "no" && uc.fdaCleared) return false;
      if (autonomy !== "all" && autonomyBucket(uc.autonomyLevel) !== autonomy) return false;
      if (!q) return true;
      return (
        uc.name.toLowerCase().includes(q) ||
        uc.description.toLowerCase().includes(q) ||
        (uc.subSpecialty?.toLowerCase().includes(q) ?? false) ||
        (uc.aiType?.toLowerCase().includes(q) ?? false) ||
        uc.keyVendors.some((v) => v.toLowerCase().includes(q)) ||
        (uc.keyPlatforms?.some((p) => p.toLowerCase().includes(q)) ?? false) ||
        (uc.specialties?.some((sp) => sp.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [lens, filter, query, maturity, fda, autonomy]);

  const displayed = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "maturity")
      arr.sort(
        (a, b) =>
          (MATURITY_RANK[a.maturity] ?? 9) - (MATURITY_RANK[b.maturity] ?? 9) ||
          priorityScore(b) - priorityScore(a),
      );
    else arr.sort((a, b) => priorityScore(b) - priorityScore(a));
    return arr;
  }, [filtered, sortBy]);

  const chips =
    lens === "service-line"
      ? SERVICE_LINES.map((sl) => ({
          key: sl,
          label: `${SERVICE_LINE_ICON[sl]} ${sl}`,
          color: SERVICE_LINE_COLOR[sl],
        }))
      : TRACKS.map((t) => ({
          key: t,
          label: TRACK_META[t].label,
          color: `var(${TRACK_META[t].colorVar})`,
        }));

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-6">
        {/* View navigation */}
        <div className="mb-4 flex gap-5 border-b border-[var(--color-line)]">
          {(["home", "explorer", "radar", "telesurgery"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="-mb-px border-b-2 px-1 pb-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors"
              style={{
                borderColor: view === v ? "var(--color-teal)" : "transparent",
                color: view === v ? "var(--color-navy)" : "var(--color-steel)",
              }}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {view === "home" && <Home onNavigate={navigateFromHome} />}
        {view === "telesurgery" && <TelesurgeryMap />}

        {/* Lens toggle (Explorer/Radar only) */}
        {view !== "home" && view !== "telesurgery" && (
        <>
        <div className="mb-4 inline-flex rounded-lg border border-[var(--color-line)] bg-white p-1">
          <LensButton active={lens === "service-line"} onClick={() => switchLens("service-line")}>
            Service Lines
          </LensButton>
          <LensButton active={lens === "track"} onClick={() => switchLens("track")}>
            Robotics Categories
          </LensButton>
        </div>

        {/* Filter chips for the active lens */}
        <div className="mb-5 flex flex-wrap gap-2">
          <TrackChip active={filter === "all"} onClick={() => setFilter("all")}>
            {lens === "service-line" ? "All Service Lines" : "All Categories"}
          </TrackChip>
          {chips.map((c) => (
            <TrackChip
              key={c.key}
              active={filter === c.key}
              color={c.color}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </TrackChip>
          ))}
        </div>

        {/* Search */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search use cases, platforms, vendors, specialties…"
            className="w-full max-w-md rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal)]/20"
          />
        </div>

        {/* Facet filters + sort */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <FacetSelect value={maturity} onChange={setMaturity} label="Maturity">
            <option value="all">All maturity</option>
            {MATURITY_LEVELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </FacetSelect>
          <FacetSelect value={fda} onChange={setFda} label="FDA">
            <option value="all">FDA: any</option>
            <option value="yes">FDA cleared</option>
            <option value="no">Not cleared</option>
          </FacetSelect>
          <FacetSelect value={autonomy} onChange={setAutonomy} label="Autonomy">
            <option value="all">All autonomy</option>
            {AUTONOMY_BUCKETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </FacetSelect>
          <span className="mx-1 h-5 w-px bg-[var(--color-line)]" />
          <FacetSelect value={sortBy} onChange={(v) => setSortBy(v as SortBy)} label="Sort">
            <option value="readiness">Sort: Readiness</option>
            <option value="maturity">Sort: Maturity</option>
            <option value="name">Sort: A–Z</option>
          </FacetSelect>
          {facetsActive && (
            <button
              onClick={clearFacets}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--color-teal)] hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-sm text-[var(--color-steel)]">
            {filtered.length} use case{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {lens === "track" && filter !== "all" && (
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-[var(--color-steel)]">
            {TRACK_META[filter as keyof typeof TRACK_META].blurb}
          </p>
        )}

        {/* Explorer: card grid */}
        {view === "explorer" && (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
              {displayed.map((uc) => (
                <UseCaseCard key={uc.id} uc={uc} lens={lens} onOpen={setModalUc} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-16 text-center text-[var(--color-steel)]">
                No use cases match your filters.
              </p>
            )}
          </>
        )}

        {/* Radar */}
        {view === "radar" && <RadarView ucs={filtered} onSelect={setModalUc} />}
        </>
        )}
      </main>

      <UseCaseModal uc={modalUc} lens={lens} onClose={() => setModalUc(null)} />

      <footer className="border-t border-[var(--color-line)] bg-white px-5 py-4 text-center text-xs text-[var(--color-steel)]">
        SRS 2026 — Robotic Surgery &amp; Surgical AI Navigator · Society of Robotic
        Surgery Annual Meeting · July 23–26, 2026 · Fort Lauderdale, FL
      </footer>
    </div>
  );
}

function LensButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md px-4 py-1.5 text-xs font-bold transition-colors"
      style={{
        background: active ? "var(--color-navy)" : "transparent",
        color: active ? "white" : "var(--color-steel)",
      }}
    >
      {children}
    </button>
  );
}

function TrackChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
      style={{
        borderColor: active ? color ?? "var(--color-navy)" : "var(--color-line)",
        background: active ? color ?? "var(--color-navy)" : "white",
        color: active ? "white" : "var(--color-steel)",
      }}
    >
      {children}
    </button>
  );
}

function FacetSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-teal)]"
    >
      {children}
    </select>
  );
}
