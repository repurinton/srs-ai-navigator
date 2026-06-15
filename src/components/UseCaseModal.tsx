import { useEffect } from "react";
import type { ReactNode } from "react";
import type { UseCase } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { SERVICE_LINE_COLOR } from "@/data/service-lines";
import { priorityScore, recommendation } from "@/lib/scoring";
import { clearanceUrl, grantUrl } from "@/lib/links";

const MATURITY_COLOR: Record<string, string> = {
  "Standard of Care": "#2e9e6b",
  "Best Practice": "#2bb3ff",
  Frontier: "#f2a33c",
  "Emerging Research": "#7c5cff",
};

type Rec = Record<string, unknown>;
function str(v: unknown): string {
  return v == null ? "" : String(v);
}

export function UseCaseModal({
  uc,
  lens,
  onClose,
}: {
  uc: UseCase | null;
  lens: "service-line" | "track";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!uc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [uc, onClose]);

  if (!uc) return null;

  const accent =
    lens === "track" && uc.track
      ? `var(${TRACK_META[uc.track].colorVar})`
      : (SERVICE_LINE_COLOR[uc.serviceLines[0] ?? "Cross-Cutting"] ?? "var(--color-steel)");

  const score = priorityScore(uc);
  const rec = recommendation(score);
  const clearances = (uc.fdaClearances ?? []) as Rec[];
  const grants = (uc.federalGrants ?? []) as Rec[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/55 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={uc.name}
    >
      <div className="w-full max-w-2xl rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-lift)]">
        {/* Header */}
        <div
          className="sticky top-0 z-10 rounded-t-[var(--radius-card)] border-b border-[var(--color-line)] bg-white px-5 py-4"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: accent }}
                >
                  {lens === "track" && uc.track ? TRACK_META[uc.track].label : (uc.serviceLines[0] ?? "Cross-Cutting")}
                </span>
                <span className="font-mono text-[11px] text-[var(--color-steel)]">{uc.id}</span>
              </div>
              <h2 className="text-lg font-bold leading-snug text-[var(--color-ink)]">{uc.name}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 shrink-0 rounded-md px-2 py-1 text-xl leading-none text-[var(--color-steel)] hover:bg-[var(--color-mist)]"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          <p className="text-sm leading-relaxed text-[var(--color-steel)]">{uc.description}</p>

          {/* Adoption readiness */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-mist)] px-4 py-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-steel)]">
                Adoption readiness
              </div>
              <div className="text-xs text-[var(--color-steel)]">Score {score.toFixed(2)} / 3.85</div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ color: rec.color, background: `${rec.color}1a` }}
            >
              {rec.label}
            </span>
          </div>

          {/* Key facts */}
          <Group title="At a glance">
            <Facts>
              <Fact label="Maturity" value={uc.maturity} color={MATURITY_COLOR[uc.maturity]} />
              <Fact label="FDA cleared" value={uc.fdaCleared ? "Yes" : "No"} color={uc.fdaCleared ? "#2e9e6b" : undefined} />
              {uc.evidenceTier && <Fact label="Evidence" value={uc.evidenceTier} />}
              {uc.implementationComplexity && <Fact label="Complexity" value={uc.implementationComplexity} />}
              {uc.investmentTier && <Fact label="Investment" value={uc.investmentTier} />}
              {uc.autonomyLevel && <Fact label="Autonomy" value={uc.autonomyLevel} />}
              {uc.surgicalAutonomyLevel && <Fact label="Surgical autonomy (LASR)" value={uc.surgicalAutonomyLevel} />}
              {uc.patientProximity && <Fact label="Patient proximity" value={uc.patientProximity} />}
              {uc.aiType && <Fact label="AI type" value={uc.aiType} />}
              {uc.setting && <Fact label="Setting" value={uc.setting} />}
            </Facts>
          </Group>

          {/* Impact */}
          {(uc.primaryImpact || uc.metricsImpacted.length > 0) && (
            <Group title="Impact">
              {uc.primaryImpact && (
                <p className="mb-2 text-xs text-[var(--color-steel)]">
                  Primary: <strong className="text-[var(--color-ink)]">{uc.primaryImpact}</strong>
                  {uc.secondaryImpact ? <> · Secondary: <strong className="text-[var(--color-ink)]">{uc.secondaryImpact}</strong></> : null}
                </p>
              )}
              <Chips items={uc.metricsImpacted} />
            </Group>
          )}

          {/* Classification */}
          <Group title="Classification">
            <div className="space-y-1.5 text-xs text-[var(--color-steel)]">
              {uc.serviceLines.length > 0 && <Line label="Service lines" value={uc.serviceLines.join(", ")} />}
              {uc.track && <Line label="Robotic track" value={TRACK_META[uc.track].label} />}
              {uc.specialties && uc.specialties.length > 0 && <Line label="Specialties" value={uc.specialties.join(", ")} />}
              {uc.subSpecialty && <Line label="Sub-specialty" value={uc.subSpecialty} />}
            </div>
          </Group>

          {/* Vendors & platforms */}
          {(uc.keyPlatforms?.length || uc.keyVendors.length > 0) && (
            <Group title="Vendors & platforms">
              {uc.keyPlatforms && uc.keyPlatforms.length > 0 && (
                <div className="mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-steel)]">Platforms</span>
                  <Chips items={uc.keyPlatforms} />
                </div>
              )}
              {uc.keyVendors.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-steel)]">Vendors</span>
                  <Chips items={uc.keyVendors} />
                </div>
              )}
            </Group>
          )}

          {/* Key metric */}
          {uc.keyMetric && (
            <Group title="Key metric">
              <p className="text-sm leading-relaxed text-[var(--color-ink)]">{uc.keyMetric}</p>
            </Group>
          )}

          {/* Deployments */}
          {uc.deployedAt.length > 0 && (
            <Group title={`Deployed at (${uc.deployedAt.length})`}>
              <Chips items={uc.deployedAt} />
            </Group>
          )}

          {/* Regulatory clearances */}
          {clearances.length > 0 && (
            <Group title="Regulatory clearances">
              <ul className="space-y-1.5">
                {clearances.map((c, i) => {
                  const url = clearanceUrl(c);
                  return (
                    <li key={i} className="text-xs text-[var(--color-steel)]">
                      <strong className="text-[var(--color-ink)]">{str(c.product) || str(c.company)}</strong>
                      {c.company && c.product ? ` — ${str(c.company)}` : ""}
                      {c.type ? ` · ${str(c.type)}` : ""}
                      {c.number ? ` ${str(c.number)}` : ""}
                      {c.year ? ` (${str(c.year)})` : ""}
                      {url ? <> · <Ext href={url} /></> : null}
                    </li>
                  );
                })}
              </ul>
            </Group>
          )}

          {/* Federal grants */}
          {grants.length > 0 && (
            <Group title="Federal grants">
              <ul className="space-y-1.5">
                {grants.map((g, i) => {
                  const url = grantUrl(g);
                  return (
                    <li key={i} className="text-xs text-[var(--color-steel)]">
                      {g.agency ? <strong className="text-[var(--color-ink)]">{str(g.agency)}</strong> : null}
                      {g.title ? ` — ${str(g.title)}` : ""}
                      {g.id ? ` (${str(g.id)})` : g.program ? ` (${str(g.program)})` : ""}
                      {url ? <> · <Ext href={url} /></> : null}
                    </li>
                  );
                })}
              </ul>
            </Group>
          )}

          {/* Source */}
          {uc.source && (
            <p className="border-t border-[var(--color-line)] pt-4 text-[11px] italic leading-relaxed text-[var(--color-steel)]">
              Source: {uc.source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-teal)]">{title}</h3>
      {children}
    </div>
  );
}

function Facts({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">{children}</div>;
}

function Fact({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-steel)]">{label}</div>
      <div className="text-[13px] font-bold" style={{ color: color ?? "var(--color-ink)" }}>{value}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-[var(--color-ink)]">{label}:</span> {value}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it} className="rounded-full bg-[var(--color-cloud)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-navy)]">
          {it}
        </span>
      ))}
    </div>
  );
}

function Ext({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[var(--color-cyan)] underline">
      link ↗
    </a>
  );
}
