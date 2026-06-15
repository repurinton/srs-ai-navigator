import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { TRACKS } from "@/data/schema";
import type { Track } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { UseCaseCard } from "@/components/UseCaseCard";
import { Header } from "@/components/Header";

type TrackFilter = Track | "all";

export default function App() {
  const [track, setTrack] = useState<TrackFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return useCases.filter((uc) => {
      if (track !== "all" && uc.track !== track) return false;
      if (!q) return true;
      return (
        uc.name.toLowerCase().includes(q) ||
        uc.description.toLowerCase().includes(q) ||
        uc.keyVendors.some((v) => v.toLowerCase().includes(q)) ||
        uc.keyPlatforms.some((p) => p.toLowerCase().includes(q)) ||
        uc.specialties.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [track, query]);

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-6">
        {/* Track navigation */}
        <div className="mb-5 flex flex-wrap gap-2">
          <TrackChip active={track === "all"} onClick={() => setTrack("all")}>
            All Tracks
          </TrackChip>
          {TRACKS.map((t) => (
            <TrackChip
              key={t}
              active={track === t}
              color={`var(${TRACK_META[t].colorVar})`}
              onClick={() => setTrack(t)}
            >
              {TRACK_META[t].label}
            </TrackChip>
          ))}
        </div>

        {/* Search + count */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search use cases, platforms, vendors, specialties…"
            className="w-full max-w-md rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal)]/20"
          />
          <span className="text-sm text-[var(--color-steel)]">
            {filtered.length} use case{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {track !== "all" && (
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-[var(--color-steel)]">
            {TRACK_META[track].blurb}
          </p>
        )}

        {/* Cards */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {filtered.map((uc) => (
            <UseCaseCard key={uc.id} uc={uc} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-[var(--color-steel)]">
            No use cases match your filters.
          </p>
        )}
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white px-5 py-4 text-center text-xs text-[var(--color-steel)]">
        SRS 2026 — Robotic Surgery &amp; Surgical AI Navigator · Society of Robotic
        Surgery Annual Meeting · July 23–26, 2026 · Fort Lauderdale, FL
      </footer>
    </div>
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
