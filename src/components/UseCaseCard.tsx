import type { ReactNode } from "react";
import type { UseCase } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { SERVICE_LINE_COLOR } from "@/data/service-lines";
import { leverFor } from "@/data/levers";
import { priorityScore, recommendation } from "@/lib/scoring";

const MATURITY_COLOR: Record<string, string> = {
  "Standard of Care": "#43c98d",
  "Best Practice": "#4db8ff",
  Frontier: "#f2a33c",
  "Emerging Research": "#9d86b3",
};

export function UseCaseCard({
  uc,
  lens,
  onOpen,
}: {
  uc: UseCase;
  lens: "service-line" | "track";
  onOpen?: (uc: UseCase) => void;
}) {
  const accent =
    lens === "track" && uc.track
      ? `var(${TRACK_META[uc.track].colorVar})`
      : (SERVICE_LINE_COLOR[uc.serviceLines[0] ?? "Cross-Cutting"] ??
        "var(--color-steel)");

  const badge =
    lens === "track" && uc.track
      ? TRACK_META[uc.track].label
      : (uc.serviceLines[0] ?? "Cross-Cutting");

  const rec = recommendation(priorityScore(uc));

  return (
    <article
      className="group flex cursor-pointer flex-col rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
      style={{ borderTop: `3px solid ${accent}` }}
      onClick={() => onOpen?.(uc)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(uc);
        }
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{
            background: `color-mix(in srgb, ${accent} 18%, transparent)`,
            color: `color-mix(in srgb, ${accent} 55%, white)`,
          }}
        >
          {badge}
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold not-italic"
            style={{
              color: `color-mix(in srgb, ${leverFor(uc).color} 70%, white)`,
              background: `color-mix(in srgb, ${leverFor(uc).color} 14%, transparent)`,
            }}
            title={`Lever: ${leverFor(uc).name}`}
          >
            {leverFor(uc).monogram}
          </i>
          <span className="font-mono text-[11px] text-white/50">{uc.id}</span>
        </span>
      </div>

      <h3 className="mb-1.5 text-[15px] font-bold leading-snug text-white">
        {uc.name}
      </h3>
      <p className="mb-3 line-clamp-4 text-[13px] leading-relaxed text-white/60">
        {uc.description}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Tag color={MATURITY_COLOR[uc.maturity] ?? "#9fb3bb"}>{uc.maturity}</Tag>
        {uc.fdaCleared && <Tag color="#43c98d">FDA Cleared</Tag>}
        {uc.aiType && <Tag color="#9fb3bb">{uc.aiType}</Tag>}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2.5">
        <span className="truncate text-[11px] text-white/55">
          {uc.keyPlatforms?.[0] ?? uc.keyVendors[0] ?? "—"}
        </span>
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[11px] font-bold"
          style={{
            color: `color-mix(in srgb, ${rec.color} 55%, white)`,
            background: `color-mix(in srgb, ${rec.color} 15%, transparent)`,
          }}
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
      style={{
        color: `color-mix(in srgb, ${color} 55%, white)`,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
