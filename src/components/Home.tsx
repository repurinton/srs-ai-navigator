import { useMemo } from "react";
import type { ReactNode } from "react";
import { useCases } from "@/data/use-cases";
import { SERVICE_LINES, TRACKS } from "@/data/schema";
import { SERVICE_LINE_COLOR, SERVICE_LINE_ICON } from "@/data/service-lines";
import { TRACK_META } from "@/data/tracks";
import { priorityScore, recommendation } from "@/lib/scoring";
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

  const analytics = useMemo(() => {
    const total = useCases.length;

    // Adoption plays (from the scoring model)
    const plays: Record<string, number> = { "Adopt Now": 0, "Pilot & Scale": 0, "Watch & Partner": 0 };
    for (const u of useCases) plays[recommendation(priorityScore(u)).label]++;

    // Competitive landscape — top deploying systems, split by lens
    function landscapeFor(pred: (u: (typeof useCases)[number]) => boolean) {
      const counts: Record<string, number> = {};
      const matched = useCases.filter(pred);
      for (const u of matched) for (const s of u.deployedAt) counts[s] = (counts[s] ?? 0) + 1;
      return {
        top: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12),
        withDeployments: matched.filter((u) => u.deployedAt.length > 0).length,
        total: matched.length,
      };
    }
    const landscapeAI = landscapeFor((u) => u.lens === "service-line");
    const landscapeRobotic = landscapeFor((u) => u.lens === "robotics");

    // Investment profile — tier distribution
    const tierCounts: Record<string, number> = {};
    for (const t of INVESTMENT_LADDER) tierCounts[t.key] = 0;
    for (const u of useCases) if (u.investmentTier && u.investmentTier in tierCounts) tierCounts[u.investmentTier]++;

    // Autonomy distribution (bucketed to the strategic buckets)
    const autonomy: Record<string, number> = { "Decision Support": 0, Augmentation: 0, Autonomous: 0 };
    for (const u of useCases) {
      const a = (u.autonomyLevel ?? "").toLowerCase();
      if (a.includes("autonom") || a.includes("automation")) autonomy["Autonomous"]++;
      else if (a.includes("augment")) autonomy["Augmentation"]++;
      else autonomy["Decision Support"]++;
    }

    // Patient-proximity distribution (bucketed to the radar's poles)
    const proximity: Record<string, number> = { Internal: 0, "Clinical Operations": 0, External: 0 };
    for (const u of useCases) {
      const p = (u.patientProximity ?? "").toLowerCase();
      if (p.includes("direct") || p.includes("patient-facing") || p.includes("consumer")) proximity["External"]++;
      else if (p.includes("clinical operations")) proximity["Clinical Operations"]++;
      else proximity["Internal"]++;
    }

    return { total, plays, landscapeAI, landscapeRobotic, tierCounts, autonomy, proximity };
  }, []);

  const socBp = stats.maturity["Standard of Care"] + stats.maturity["Best Practice"];
  const emerging = stats.maturity["Emerging Research"];

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
          <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--color-steel)]">
            <span className="shrink-0">Less autonomy</span>
            <div
              className="h-1.5 flex-1 rounded-full"
              style={{ background: "linear-gradient(to right, var(--color-teal), var(--color-track-humanoids))" }}
            />
            <span className="shrink-0">More autonomy</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {AUTONOMY_LASR.map((a, i) => {
              const t = i / (AUTONOMY_LASR.length - 1);
              const color = `color-mix(in srgb, var(--color-teal) ${100 - t * 70}%, var(--color-track-humanoids) ${t * 70}%)`;
              return (
                <div
                  key={a.level}
                  className="flex flex-col items-center rounded-lg border border-[var(--color-line)] bg-[var(--color-mist)] p-3 text-center"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: color }}
                  >
                    {a.level}
                  </div>
                  <h4 className="mt-2 text-[12px] font-bold leading-tight text-[var(--color-ink)]">{a.label}</h4>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--color-steel)]">{a.def}</p>
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
        <div className="grid gap-3">
          {/* Proximity — a spectrum that mirrors the radar's X-axis */}
          <Panel title="Patient proximity" subtitle="How close to the patient — the Radar's horizontal axis">
            <div className="relative mb-5 mt-6">
              <div
                className="h-2.5 rounded-full"
                style={{ background: "linear-gradient(to right, #3a5a7d, #0078C8, #00A6A6)" }}
              />
              <span className="absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wide text-[var(--color-steel)]">
                ← Internal
              </span>
              <span className="absolute -top-5 right-0 text-[10px] font-bold uppercase tracking-wide text-[var(--color-steel)]">
                External →
              </span>
              {PROXIMITY_SCALE.map((p, i) => (
                <span
                  key={p.key}
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{ left: `calc(${[6, 50, 94][i]}% - 8px)`, background: p.color }}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {PROXIMITY_SCALE.map((p) => (
                <div key={p.key}>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-ink)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    {p.key}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-steel)]">{p.def}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* Investment — an ascending cost ladder */}
            <Panel title="Investment tier" subtitle="The cost of getting it into the OR">
              <div className="flex items-end gap-3" style={{ height: "118px" }}>
                {INVESTMENT_LADDER.map((t, i) => (
                  <div key={t.key} className="flex flex-1 flex-col items-center justify-end">
                    <span className="mb-1.5 text-[11px] font-bold text-[var(--color-ink)]">
                      {["Included", "$50K–500K", "$500K–5M", "$5M+"][i]}
                    </span>
                    <div className="w-full rounded-t-md" style={{ height: `${28 + i * 26}px`, background: t.color }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 border-t border-[var(--color-line)] pt-2 text-center">
                {INVESTMENT_LADDER.map((t) => (
                  <span key={t.key} className="text-[10px] font-semibold leading-tight text-[var(--color-steel)]">
                    {t.key}
                  </span>
                ))}
              </div>
            </Panel>

            {/* Evidence — a signal-strength meter */}
            <Panel title="Evidence strength" subtitle="The rigor behind the claim">
              <div className="space-y-2.5">
                {EVIDENCE_SCALE.map((e, i) => {
                  const filled = EVIDENCE_SCALE.length - i;
                  return (
                    <div key={e.key} className="flex items-center gap-3">
                      <div className="flex items-end gap-0.5" style={{ height: "18px" }}>
                        {EVIDENCE_SCALE.map((_, b) => (
                          <span
                            key={b}
                            className="w-1.5 rounded-sm"
                            style={{ height: `${6 + b * 3}px`, background: b < filled ? e.color : "var(--color-cloud)" }}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] leading-snug">
                        <strong className="text-[var(--color-ink)]">{e.key}</strong>
                        <span className="text-[var(--color-steel)]"> — {e.def}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
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

      {/* ── Strategic implications banner ────────────────────────── */}
      <section
        className="rounded-[var(--radius-card)] px-7 py-7 text-white sm:px-9"
        style={{ background: "linear-gradient(135deg, var(--color-ink) 0%, var(--color-navy) 70%, var(--color-navy-600) 130%)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          What it means
        </p>
        <h2 className="mt-1 text-xl font-bold">Strategic implications</h2>
        <p className="mt-1.5 mb-5 max-w-2xl text-sm text-white/65">
          Where the {analytics.total} use cases land when scored for readiness — and how to play each tier.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { key: "Adopt Now", color: "#5fd3a0", count: analytics.plays["Adopt Now"], copy: `Established console platforms, robotic joint replacement, and FDA-cleared surgical imaging AI are proven and accessible. ${socBp} use cases are already Standard of Care or Best Practice — immediate value with minimal clinical risk.` },
            { key: "Pilot & Scale", color: "#f6b860", count: analytics.plays["Pilot & Scale"], copy: "Surgical AI — phase recognition, critical-view detection, skills assessment — plus digital-surgery data platforms and telesurgery are maturing fast. Prioritize pilots that build the data and capability for the next wave." },
            { key: "Watch & Partner", color: "#a99bff", count: analytics.plays["Watch & Partner"], copy: `Higher levels of autonomy (LASR 3+), humanoids, and autonomous soft-tissue tasks remain investigational. Engage through academic partnerships and vendor advisory boards. ${emerging} Emerging Research use cases frame the long-term horizon.` },
          ].map((p) => (
            <div key={p.key}>
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: p.color }}>{p.count}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.key}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/80">{p.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Landscape analytics ──────────────────────────────────── */}
      <Section
        kicker="The landscape in numbers"
        title="Competitive landscape & investment profile"
        intro="A read on where these use cases are already running, what they cost to adopt, and how they distribute across autonomy and patient proximity."
      >
        {/* Competitive landscape — AI and robotic shown side by side */}
        <div className="mb-3 grid gap-3 lg:grid-cols-2">
          <LandscapeCard
            label="Competitive landscape · AI use cases"
            color="var(--color-teal)"
            note="academic-weighted"
            data={analytics.landscapeAI}
          />
          <LandscapeCard
            label="Competitive landscape · Robotic surgery"
            color="var(--color-track-humanoids)"
            note="robotic platforms are broadly adopted"
            data={analytics.landscapeRobotic}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Investment profile" subtitle="Not “how much does AI cost” but “how much are we already paying for?”">
            <div className="space-y-2.5">
              {INVESTMENT_LADDER.map((t) => {
                const count = analytics.tierCounts[t.key] ?? 0;
                return (
                  <DistBar
                    key={t.key}
                    label={t.key}
                    count={`${count} · ${Math.round((count / analytics.total) * 100)}%`}
                    pct={(count / analytics.total) * 100}
                    color={t.color}
                  />
                );
              })}
            </div>
          </Panel>

          <Panel title="By autonomy level" subtitle="How independently the AI acts">
            <div className="space-y-2.5">
              {([
                ["Decision Support", "#6C5B7B"],
                ["Augmentation", "#0078C8"],
                ["Autonomous", "#00A4B3"],
              ] as const).map(([k, color]) => {
                const count = analytics.autonomy[k] ?? 0;
                return (
                  <DistBar key={k} label={k} count={`${count} · ${Math.round((count / analytics.total) * 100)}%`} pct={(count / analytics.total) * 100} color={color} />
                );
              })}
            </div>
          </Panel>

          <Panel title="By patient proximity" subtitle="How close to the patient — the radar's horizontal axis">
            <div className="space-y-2.5">
              {([
                ["Internal", "#3a5a7d"],
                ["Clinical Operations", "#0078C8"],
                ["External", "#00A6A6"],
              ] as const).map(([k, color]) => {
                const count = analytics.proximity[k] ?? 0;
                return (
                  <DistBar key={k} label={k} count={`${count} · ${Math.round((count / analytics.total) * 100)}%`} pct={(count / analytics.total) * 100} color={color} />
                );
              })}
            </div>
          </Panel>
        </div>
      </Section>

      {/* ── Two ways to navigate ─────────────────────────────────── */}
      <Section
        kicker="Two ways in"
        title="Navigate by service line or by robotics category"
        intro="The same library, two lenses. Browse by clinical service line, or by robotics category (organized by the type of robotic application). Pick a starting point:"
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
          <Panel title="Robotics categories" subtitle="By type of robotic application">
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

function LandscapeCard({
  label,
  color,
  note,
  data,
}: {
  label: string;
  color: string;
  note: string;
  data: { top: [string, number][]; withDeployments: number; total: number };
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <h3 className="text-sm font-bold text-[var(--color-ink)]">{label}</h3>
      </div>
      <p className="mb-3 text-[11px] text-[var(--color-steel)]">
        Verified public deployments — illustrative, not exhaustive, {note}. {data.withDeployments} of{" "}
        {data.total} use cases mapped.
      </p>
      {data.top.length > 0 ? (
        <div className="space-y-2.5">
          {data.top.map(([name, count]) => (
            <DistBar key={name} label={name} count={`${count} use cases`} pct={(count / data.total) * 100} color={color} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-[11px] text-[var(--color-steel)]">No deployments mapped yet.</p>
      )}
    </div>
  );
}

function DistBar({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[var(--color-ink)]">
        <span>{label}</span>
        <span className="text-[var(--color-steel)]">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-cloud)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1.5)}%`, background: color }} />
      </div>
    </div>
  );
}
