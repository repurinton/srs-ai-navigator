import { useEffect } from "react";
import type { ReactNode } from "react";
import type { UseCase } from "@/data/schema";
import { TRACK_META } from "@/data/tracks";
import { SERVICE_LINE_COLOR } from "@/data/service-lines";
import { priorityScore, recommendation } from "@/lib/scoring";
import { clearanceUrl, grantUrl } from "@/lib/links";

const MATURITY_COLOR: Record<string, string> = {
  "Standard of Care": "#43c98d",
  "Best Practice": "#4db8ff",
  Frontier: "#f2a33c",
  "Emerging Research": "#9d86b3",
};

const TIPS = {
  call: "Heuristic adoption-readiness score (0–3.85) weighing maturity, implementation complexity, investment tier, competitive pressure, and evidence strength. Directional, not a financial recommendation.",
  maturity: "How proven the approach is in practice: Standard of Care → Best Practice → Frontier → Emerging Research.",
  lift: "What deployment takes: implementation complexity (integration and change-management effort) plus the investment tier, from platform-included features up to capital and infrastructure.",
  evidence: "Strength of the support behind this use case — from independently validated (peer-reviewed, clinical trials, regulatory clearance) down to vendor-reported claims.",
  autonomy: "How much the AI acts on its own: Decision Support informs a person, Augmentation shares the work, Autonomous executes within set permissions.",
  proximity: "Where the AI sits relative to the patient: back office and administration, clinical operations, or direct patient care.",
  lasr: "Levels of Autonomy in Surgical Robotics (0–5): from no autonomy through task and conditional autonomy to full autonomy.",
  aiType: "The dominant technique behind the use case (for example machine learning, computer vision, generative AI, or robotics).",
} as const;

type EvidenceStrength = { label: string; color: string; rank: 0 | 1 | 2 | 3; blurb: string };

function evidenceStrength(tier: string | null | undefined): EvidenceStrength {
  const value = (tier ?? "").toLowerCase();
  if (/(peer|rct|meta|clinical trial|fda|regulatory)/.test(value)) {
    return {
      label: "Independently validated",
      color: "#43c98d",
      rank: 3,
      blurb: "Peer-reviewed literature, clinical trials, or regulatory clearance — the strongest evidence class in this library.",
    };
  }
  if (/(institutional|vc|pe-backed|early clinical)/.test(value)) {
    return {
      label: "Institutional signal",
      color: "#4db8ff",
      rank: 2,
      blurb: "Named health-system deployments or serious institutional investment, ahead of formal peer-reviewed publication.",
    };
  }
  if (/(industry|consultant|think)/.test(value)) {
    return {
      label: "Industry analysis",
      color: "#f2a33c",
      rank: 1,
      blurb: "Industry publications or consultant analysis — useful directional signal, not independent clinical validation.",
    };
  }
  if (value) {
    return {
      label: "Vendor-reported",
      color: "#e07a83",
      rank: 1,
      blurb: "Vendor claims or preclinical concepts. Treat outcomes as unverified until independent evidence lands.",
    };
  }
  return {
    label: "Not yet graded",
    color: "#9fb3bb",
    rank: 0,
    blurb: "No evidence tier has been assigned to this use case yet.",
  };
}

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
      : (SERVICE_LINE_COLOR[uc.serviceLines[0] ?? "Cross-Cutting"] ?? "#7fa3c9");

  const score = priorityScore(uc);
  const rec = recommendation(score);
  const evidence = evidenceStrength(uc.evidenceTier);
  const clearances = (uc.fdaClearances ?? []) as Rec[];
  const grants = (uc.federalGrants ?? []) as Rec[];
  const deployments = uc.deployedAt;
  const shownDeployments = deployments.slice(0, 8);
  const platforms = (uc.keyPlatforms ?? []).slice(0, 4);
  const vendors = uc.keyVendors.slice(0, 4);
  const impactChips = uc.metricsImpacted.slice(0, 6);

  const classification = [
    uc.serviceLines.length ? `Service lines: ${uc.serviceLines.join(", ")}` : "",
    uc.track ? `Robotics: ${TRACK_META[uc.track].label}` : "",
    uc.specialties?.length ? `Specialties: ${uc.specialties.join(", ")}` : "",
    uc.subSpecialty ? `Sub-specialty: ${uc.subSpecialty}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/70 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={uc.name}
    >
      <div className="w-full max-w-2xl rounded-[var(--radius-card)] border border-white/10 bg-[var(--color-panel)] shadow-[var(--shadow-lift)]">
        {/* Header */}
        <div
          className="sticky top-0 z-10 rounded-t-[var(--radius-card)] border-b border-white/10 bg-[var(--color-panel)] px-5 py-4"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    color: `color-mix(in srgb, ${accent} 55%, white)`,
                  }}
                >
                  {lens === "track" && uc.track ? TRACK_META[uc.track].label : (uc.serviceLines[0] ?? "Cross-Cutting")}
                </span>
                <span className="font-mono text-[11px] text-white/50">{uc.id}</span>
              </div>
              <h2 className="text-lg font-bold leading-snug text-white">{uc.name}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 shrink-0 rounded-md px-2 py-1 text-xl leading-none text-white/60 hover:bg-white/10"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          <p className="text-sm leading-relaxed text-white/65">{uc.description}</p>

          {/* Decision strip */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
            <div className="bg-[var(--color-panel)] px-3.5 py-3">
              <Tip tip={TIPS.call}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">The call</span>
              </Tip>
              <div
                className="mt-1 text-[13px] font-bold"
                style={{ color: `color-mix(in srgb, ${rec.color} 60%, white)` }}
              >
                {rec.label}
              </div>
              <div className="text-[11px] text-white/45">Readiness {score.toFixed(2)} / 3.85</div>
            </div>
            <div className="bg-[var(--color-panel)] px-3.5 py-3">
              <Tip tip={TIPS.maturity}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Maturity</span>
              </Tip>
              <div
                className="mt-1 text-[13px] font-bold"
                style={{ color: `color-mix(in srgb, ${MATURITY_COLOR[uc.maturity] ?? "#9fb3bb"} 60%, white)` }}
              >
                {uc.maturity}
              </div>
              <div className="text-[11px] text-white/45">{uc.fdaCleared ? "FDA cleared" : "Not FDA cleared"}</div>
            </div>
            <div className="bg-[var(--color-panel)] px-3.5 py-3">
              <Tip tip={TIPS.lift}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Lift</span>
              </Tip>
              <div className="mt-1 text-[13px] font-bold text-white">{uc.implementationComplexity} complexity</div>
              <div className="text-[11px] text-white/45">{uc.investmentTier ?? "Investment tier not set"}</div>
            </div>
          </div>

          {/* Evidence basis — the load-bearing card */}
          <section
            className="evidence-card"
            style={{ "--evidence-color": evidence.color } as React.CSSProperties}
            aria-label="Evidence basis"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tip tip={TIPS.evidence}>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Evidence basis</span>
              </Tip>
              <span className="evidence-dots" aria-label={`Evidence strength ${evidence.rank} of 3`}>
                {[1, 2, 3].map((dot) => <i key={dot} className={dot <= evidence.rank ? "is-on" : ""} />)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <strong className="text-[17px] font-bold" style={{ color: `color-mix(in srgb, ${evidence.color} 60%, white)` }}>
                {uc.evidenceTier ?? "Not yet graded"}
              </strong>
              <Tip tip={evidence.blurb}>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    background: `color-mix(in srgb, ${evidence.color} 16%, transparent)`,
                    color: `color-mix(in srgb, ${evidence.color} 55%, white)`,
                  }}
                >
                  {evidence.label}
                </span>
              </Tip>
            </div>

            {clearances.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-white/10 pt-2.5">
                {clearances.slice(0, 3).map((c, i) => {
                  const url = clearanceUrl(c);
                  return (
                    <li key={i} className="text-xs text-white/60">
                      <strong className="text-white/85">{str(c.product) || str(c.company)}</strong>
                      {c.type ? ` · ${str(c.type)}` : ""}
                      {c.number ? ` ${str(c.number)}` : ""}
                      {c.year ? ` (${str(c.year)})` : ""}
                      {url ? <> · <Ext href={url} /></> : null}
                    </li>
                  );
                })}
                {clearances.length > 3 && (
                  <li className="text-[11px] text-white/40">+ {clearances.length - 3} more clearances</li>
                )}
              </ul>
            )}

            {grants.length > 0 && (
              <ul className={`space-y-1 ${clearances.length ? "mt-2" : "mt-3 border-t border-white/10 pt-2.5"}`}>
                {grants.slice(0, 2).map((g, i) => {
                  const url = grantUrl(g);
                  return (
                    <li key={i} className="text-xs text-white/60">
                      {g.agency ? <strong className="text-white/85">{str(g.agency)}</strong> : null}
                      {g.title ? ` — ${str(g.title)}` : ""}
                      {url ? <> · <Ext href={url} /></> : null}
                    </li>
                  );
                })}
                {grants.length > 2 && (
                  <li className="text-[11px] text-white/40">+ {grants.length - 2} more federal grants</li>
                )}
              </ul>
            )}

            {uc.source && (
              <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] italic leading-relaxed text-white/45">
                Source: {uc.source}
              </p>
            )}
          </section>

          {/* Headline result */}
          {(uc.keyMetric || uc.primaryImpact || impactChips.length > 0) && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-mint)]">
                What it moves
              </h3>
              {uc.keyMetric && (
                <p className="text-[15px] font-semibold leading-snug text-white">{uc.keyMetric}</p>
              )}
              {uc.primaryImpact && (
                <p className="mt-1.5 text-xs text-white/60">
                  Primary impact: <strong className="text-white/85">{uc.primaryImpact}</strong>
                  {uc.secondaryImpact ? <> · Secondary: <strong className="text-white/85">{uc.secondaryImpact}</strong></> : null}
                </p>
              )}
              {impactChips.length > 0 && <Chips items={impactChips} />}
            </div>
          )}

          {/* Traction */}
          {(deployments.length > 0 || vendors.length > 0 || platforms.length > 0) && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-mint)]">
                Traction
              </h3>
              {deployments.length > 0 && (
                <>
                  <p className="text-xs text-white/60">
                    Deployed at <strong className="text-white/85">{deployments.length}</strong> named {deployments.length === 1 ? "organization" : "organizations"}
                  </p>
                  <Chips items={shownDeployments} more={deployments.length - shownDeployments.length} />
                </>
              )}
              {(platforms.length > 0 || vendors.length > 0) && (
                <p className="mt-2 text-xs text-white/60">
                  {platforms.length > 0 && <>Platforms: <strong className="text-white/85">{platforms.join(", ")}</strong></>}
                  {platforms.length > 0 && vendors.length > 0 && " · "}
                  {vendors.length > 0 && <>Vendors: <strong className="text-white/85">{vendors.join(", ")}</strong></>}
                </p>
              )}
            </div>
          )}

          {/* Operating profile */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-mint)]">
              Operating profile
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {uc.autonomyLevel && <Fact label="Autonomy" value={uc.autonomyLevel} tip={TIPS.autonomy} />}
              {uc.patientProximity && <Fact label="Patient proximity" value={uc.patientProximity} tip={TIPS.proximity} />}
              {uc.aiType && <Fact label="AI type" value={uc.aiType} tip={TIPS.aiType} />}
              {uc.setting && <Fact label="Setting" value={uc.setting} />}
              {uc.surgicalAutonomyLevel && <Fact label="Surgical autonomy" value={uc.surgicalAutonomyLevel} tip={TIPS.lasr} />}
            </div>
            {classification && (
              <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] leading-relaxed text-white/45">
                {classification}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tip({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <span className="tip" tabIndex={0} data-tip={tip} aria-label={tip}>
      {children}
      <i aria-hidden="true">i</i>
    </span>
  );
}

function Fact({ label, value, tip }: { label: string; value: string; tip?: string }) {
  const heading = (
    <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
  );
  return (
    <div>
      {tip ? <Tip tip={tip}>{heading}</Tip> : heading}
      <div className="text-[13px] font-bold text-white">{value}</div>
    </div>
  );
}

function Chips({ items, more = 0 }: { items: string[]; more?: number }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it} className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-white/80">
          {it}
        </span>
      ))}
      {more > 0 && (
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/45">+ {more} more</span>
      )}
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
