import { useMemo } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS } from "@/data/schema";
import { SERVICE_LINE_COLOR, SERVICE_LINE_ICON } from "@/data/service-lines";
import { TRACK_META } from "@/data/tracks";
import {
  IMPACT_PERSPECTIVES,
  MATURITY_SPECTRUM,
  AUTONOMY_LASR,
  STRATEGIC_AUTONOMY,
  PROXIMITY_SCALE,
  INVESTMENT_LADDER,
  EVIDENCE_SCALE,
  SCORING_WEIGHTS,
  RECOMMENDATIONS,
} from "@/data/concepts";

export function Home({
  onNavigate,
}: {
  onNavigate: (view: "explorer" | "radar", lens?: "service-line" | "track", filter?: string) => void;
}) {
  const stats = useMemo(() => {
    const total = useCases.length;
    const fda = useCases.filter((u) => u.fdaCleared).length;
    const maturity: Record<string, number> = {};
    for (const m of MATURITY_SPECTRUM) maturity[m.key] = 0;
    for (const u of useCases) if (u.maturity in maturity) maturity[u.maturity]++;
    return { total, fda, maturity };
  }, []);

  return (
    <div className="space-y-12 pb-8">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-[var(--radius-card)] px-7 py-9 text-white sm:px-10 sm:py-11"
        style={{
          background:
            "linear-gradient(135deg, var(--color-ink) 0%, var(--color-navy) 45%, var(--color-teal) 130%)",
        }}
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Society of Robotic Surgery 2026 · Innovation Continues
        </p>
        <h1 className="max-w-3xl text-3xl font-light leading-tight sm:text-[34px]">
          A field guide to <span className="font-bold">robotic surgery &amp; surgical AI</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          From console platforms to telesurgery, intraoperative AI, and the
          frontier of autonomy — this navigator maps the landscape of use cases
          and frames how to weigh their impact, maturity, and readiness. The
          question is no longer <em>whether</em> to adopt, but{" "}
          <em>where to sequence investment</em> for maximum clinical impact.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Stat value={stats.total} label="Use cases" />
          <Stat value={stats.fda} label="FDA cleared" />
          <Stat value={SERVICE_LINES.length} label="Service lines" />
          <Stat value={TRACKS.length} label="Robotic tracks" />
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate("explorer")}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition-transform hover:-translate-y-0.5"
          >
            Explore use cases →
          </button>
          <button
            onClick={() => onNavigate("radar")}
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Open the radar
          </button>
        </div>
      </section>

      {/* ── Impact perspectives ──────────────────────────────────── */}
      <Section
        kicker="How we measure impact"
        title="Five perspectives on value"
        intro="Every use case is assessed against five impact perspectives. A tool rarely moves just one — the question is which it moves most, and for whom."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {IMPACT_PERSPECTIVES.map((p) => (
            <div
              key={p.key}
              className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-card)]"
              style={{ borderTop: `3px solid ${p.color}` }}
            >
              <div
                className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                style={{ background: `color-mix(in srgb, ${p.color} 14%, white)` }}
              >
                {p.icon}
              </div>
              <h3 className="text-sm font-bold" style={{ color: p.color }}>
                {p.key}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-steel)]">{p.def}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Maturity spectrum ────────────────────────────────────── */}
      <Section
        kicker="Where it sits today"
        title="The maturity spectrum"
        intro="From investigational science to the everyday standard of care. Maturity is the single biggest driver of adoption readiness."
      >
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
          <div className="flex h-2">
            {MATURITY_SPECTRUM.map((m) => (
              <div key={m.key} className="flex-1" style={{ background: m.color }} />
            ))}
          </div>
          <div className="grid gap-px bg-[var(--color-line)] sm:grid-cols-4">
            {MATURITY_SPECTRUM.map((m) => (
              <div key={m.key} className="bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-base">{m.icon}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ color: m.color, background: `color-mix(in srgb, ${m.color} 12%, white)` }}
                  >
                    {stats.maturity[m.key] ?? 0}
                  </span>
                </div>
                <h3 className="text-[13px] font-bold" style={{ color: m.color }}>
                  {m.key}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-steel)]">{m.def}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Autonomy ─────────────────────────────────────────────── */}
      <Section
        kicker="How much the machine decides"
        title="Levels of autonomy in surgical robotics"
        intro="The field's shared language for machine independence — from a tool the surgeon fully controls to systems that act on their own. Today's clinical robots live at Levels 1–2; the frontier sessions look ahead."
      >
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-end gap-2 overflow-x-auto pb-2">
            {AUTONOMY_LASR.map((a, i) => {
              const t = i / (AUTONOMY_LASR.length - 1);
              const color = `color-mix(in srgb, var(--color-teal) ${100 - t * 70}%, var(--color-track-humanoids) ${t * 70}%)`;
              return (
                <div key={a.level} className="flex min-w-[120px] flex-1 flex-col">
                  <div
                    className="mb-2 flex items-end justify-center rounded-t-md pb-1 text-sm font-bold text-white"
                    style={{ height: `${40 + i * 22}px`, background: color }}
                  >
                    {a.level}
                  </div>
                  <h4 className="text-[12px] font-bold leading-tight text-[var(--color-ink)]">
                    {a.label}
                  </h4>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-steel)]">{a.def}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-[11px] text-[var(--color-steel)]">
            Framework: Levels of Autonomy in Surgical Robotics — Yang et al.,{" "}
            <em>Science Robotics</em> (2017). In this navigator, cases are also tagged with a
            strategic autonomy bucket:{" "}
            {STRATEGIC_AUTONOMY.map((s, i) => (
              <span key={s.key}>
                <strong style={{ color: s.color }}>{s.key}</strong> ({s.def})
                {i < STRATEGIC_AUTONOMY.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </div>
      </Section>

      {/* ── Proximity + Investment + Evidence ────────────────────── */}
      <Section
        kicker="Three more lenses"
        title="Proximity, cost, and evidence"
        intro="Beyond impact and maturity, three axes shape where a use case fits and how fast it can move."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Proximity */}
          <Panel title="Patient proximity" subtitle="How close to the patient — the Radar's horizontal axis">
            <div className="mb-3 flex h-1.5 overflow-hidden rounded-full">
              {PROXIMITY_SCALE.map((p) => (
                <div key={p.key} className="flex-1" style={{ background: p.color }} />
              ))}
            </div>
            <Ladder items={PROXIMITY_SCALE} />
          </Panel>

          {/* Investment */}
          <Panel title="Investment tier" subtitle="The cost of getting it into the OR">
            <Ladder items={INVESTMENT_LADDER} />
          </Panel>

          {/* Evidence */}
          <Panel title="Evidence strength" subtitle="The rigor behind the claim">
            <Ladder items={EVIDENCE_SCALE} />
          </Panel>
        </div>
      </Section>

      {/* ── Scoring model ────────────────────────────────────────── */}
      <Section
        kicker="Putting it together"
        title="Adoption-readiness scoring"
        intro="The Roadmap ranks every use case with a single weighted score, then sorts them into three plays. Higher readiness = proven, accessible, and competitively urgent."
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="mb-3 text-xs font-semibold text-[var(--color-steel)]">
              Score composition
            </p>
            <div className="mb-3 flex h-7 overflow-hidden rounded-md">
              {SCORING_WEIGHTS.map((w) => (
                <div
                  key={w.key}
                  className="flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${w.weight}%`, background: w.color }}
                  title={`${w.key} — ${w.weight}%`}
                >
                  {w.weight}%
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {SCORING_WEIGHTS.map((w) => (
                <span key={w.key} className="flex items-center gap-1.5 text-[11px] text-[var(--color-steel)]">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: w.color }} />
                  {w.key}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {RECOMMENDATIONS.map((r) => (
              <div
                key={r.key}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-3 shadow-[var(--shadow-card)]"
              >
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} />
                <div>
                  <h4 className="text-[13px] font-bold" style={{ color: r.color }}>
                    {r.key}
                  </h4>
                  <p className="text-[11px] leading-snug text-[var(--color-steel)]">{r.def}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Two ways to navigate ─────────────────────────────────── */}
      <Section
        kicker="Two ways in"
        title="Navigate by service line or by track"
        intro="The same library, two lenses. Browse by clinical service line, or by the meeting's robotic-surgery tracks. Pick a starting point:"
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Clinical service lines" subtitle="The original navigator taxonomy">
            <div className="flex flex-wrap gap-2">
              {SERVICE_LINES.map((sl) => (
                <button
                  key={sl}
                  onClick={() => onNavigate("explorer", "service-line", sl)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-mist)]"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SERVICE_LINE_COLOR[sl] }} />
                  {SERVICE_LINE_ICON[sl]} {sl}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Robotic-surgery tracks" subtitle="The SRS 2026 meeting tracks">
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => (
                <button
                  key={t}
                  onClick={() => onNavigate("explorer", "track", t)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-mist)]"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${TRACK_META[t].colorVar})` }} />
                  {TRACK_META[t].label}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </Section>
    </div>
  );
}

// ── Small presentational helpers ─────────────────────────────────
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}

function Section({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-teal)]">{kicker}</p>
      <h2 className="mt-1 text-xl font-bold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1.5 mb-4 max-w-2xl text-sm leading-relaxed text-[var(--color-steel)]">{intro}</p>
      {children}
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-bold text-[var(--color-ink)]">{title}</h3>
      <p className="mb-3 text-[11px] text-[var(--color-steel)]">{subtitle}</p>
      {children}
    </div>
  );
}

function Ladder({ items }: { items: { key: string; color: string; def: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-start gap-2.5">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
          <div>
            <span className="text-[12px] font-bold text-[var(--color-ink)]">{it.key}</span>
            <span className="text-[11px] text-[var(--color-steel)]"> — {it.def}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
