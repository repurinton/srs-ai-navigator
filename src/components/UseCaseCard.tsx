import type { ReactNode } from "react";
import type { UseCase } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { priorityScore, recommendation } from "@/lib/scoring";

const MATURITY_COLOR: Record<UseCase["maturity"], string> = {
  "Clinical Standard": "#2e9e6b",
  Established: "#2bb3ff",
  Emerging: "#f2a33c",
  Investigational: "#7c5cff",
};

export function UseCaseCard({ uc }: { uc: UseCase }) {
  const trackColor = `var(${TRACK_META[uc.track].colorVar})`;
  const rec = recommendation(priorityScore(uc));

  return (
    <article
      className="group flex flex-col rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
      style={{ borderTop: `3px solid ${trackColor}` }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: trackColor }}
        >
          {TRACK_META[uc.track].label}
        </span>
        <span className="font-mono text-[11px] text-[var(--color-steel)]">
          {uc.id}
        </span>
      </div>

      <h3 className="mb-1.5 text-[15px] font-bold leading-snug text-[var(--color-ink)]">
        {uc.name}
      </h3>
      <p className="mb-3 line-clamp-4 text-[13px] leading-relaxed text-[var(--color-steel)]">
        {uc.description}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Tag color={MATURITY_COLOR[uc.maturity]}>{uc.maturity}</Tag>
        {uc.fdaCleared && <Tag color="#2e9e6b">FDA Cleared</Tag>}
        <Tag color="var(--color-steel)">{uc.autonomyLevel}</Tag>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-line)] pt-2.5">
        <span className="text-[11px] text-[var(--color-steel)]">
          {uc.keyPlatforms[0] ?? uc.keyVendors[0] ?? "—"}
        </span>
        <span
          className="rounded px-2 py-0.5 text-[11px] font-bold"
          style={{ color: rec.color, background: `${rec.color}1a` }}
        >
          {rec.label}
        </span>
      </div>
    </article>
  );
}

function Tag({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ color, background: `color-mix(in srgb, ${color} 12%, white)` }}
    >
      {children}
    </span>
  );
}
