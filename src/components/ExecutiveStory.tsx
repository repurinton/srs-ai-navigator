import type { View } from "@/App";

const HANDOFFS = [
  { time: "T−48h", label: "Authorization", state: "risk" },
  { time: "T−24h", label: "Pre-op", state: "ready" },
  { time: "T−12h", label: "Staff + instruments", state: "risk" },
  { time: "T−6h", label: "Bed capacity", state: "watch" },
  { time: "T−0", label: "Incision", state: "locked" },
] as const;

const EVIDENCE = [
  {
    value: "$1.635T",
    label: "U.S. hospital spend in 2024",
    detail: "+8.9% in one year",
    href: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
    source: "CMS",
  },
  {
    value: "56%",
    label: "of hospital cost is labor",
    detail: "the system must amplify scarce talent",
    href: "https://www.aha.org/guides-and-reports/2026-03-09-2025-cost-caring-report",
    source: "AHA",
  },
  {
    value: "−0.63 days",
    label: "average length of stay",
    detail: "Hartford implementation study",
    href: "https://pubsonline.informs.org/doi/10.1287/inte.2024.0170",
    source: "INFORMS",
  },
  {
    value: "884 hours",
    label: "less OR scheduling error",
    detail: "one year at Penn Medicine",
    href: "https://chti.upenn.edu/oracle",
    source: "Penn",
  },
] as const;

export function ExecutiveStory({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <>
      <section className="hero-grid relative overflow-hidden bg-[var(--color-night)] text-white">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="relative mx-auto grid min-h-[calc(100vh-78px)] max-w-[1440px] items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-20">
          <div className="max-w-4xl">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="status-dot status-dot-live" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--color-mint)]">
                AI Transforming Hospital Operations
              </p>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">SRS 2026</span>
            </div>
            <h1 className="hero-title">
              The hospital is already full of intelligence.
              <span>It is short on coordination.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
              A dashboard tells you a robotic case will fail. An agent helps prevent it—across access,
              capacity, readiness, and the human decisions that still matter.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" onClick={() => onNavigate("case")} className="button-primary">
                Run the hospital twin <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={() => onNavigate("levers")} className="button-ghost">
                Explore the six levers
              </button>
            </div>
            <p className="mt-8 max-w-xl text-[11px] font-semibold leading-relaxed text-white/35">
              Executive briefing for hospital leaders, med-tech founders, and capital partners. The live scenario uses
              synthetic data and modeled outcomes.
            </p>
          </div>

          <CaseClock />
        </div>
      </section>

      <section className="story-section bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">The capacity paradox</p>
              <h2 className="section-title mt-4">Your most expensive robot can still wait on your cheapest workflow.</h2>
            </div>
            <p className="lede max-w-2xl lg:justify-self-end">
              The procedure may be precise. The episode is still fragmented. One patient moves through systems that
              predict, document, and alert—yet no system owns the whole clock.
            </p>
          </div>

          <div className="mt-14 grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] lg:grid-cols-5">
            {HANDOFFS.map((handoff, index) => (
              <div key={handoff.label} className="handoff-cell relative border-b border-white/10 p-6 last:border-0 lg:border-b-0 lg:border-r">
                <div className="mb-10 flex items-center justify-between">
                  <span className={`handoff-node handoff-node-${handoff.state}`} />
                  {index < HANDOFFS.length - 1 && <span className="handoff-line" aria-hidden="true" />}
                  <span className="font-mono text-[10px] font-bold text-white/50">{handoff.time}</span>
                </div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight">{handoff.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {handoff.state === "risk" && "A handoff can strand the case."}
                  {handoff.state === "ready" && "Evidence is present and current."}
                  {handoff.state === "watch" && "Capacity is changing in real time."}
                  {handoff.state === "locked" && "The outcome of every prior decision."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="eyebrow text-[var(--color-mint)]">The transformation map</p>
              <h2 className="section-title mt-4 text-white">Six levers change how care enters, moves, acts, and learns.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-white/52 lg:justify-self-end">
              Diagnosis, the digital front door, robotics, longitudinal care, task automation, and precision medicine
              are not separate programs. They are six interfaces to one AI operating layer.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["01", "Digital front door", "Channels become one resolution layer."],
              ["02", "Clinical diagnosis", "Interpretation becomes pathway intelligence."],
              ["03", "Precision medicine", "A report becomes a learning system."],
              ["04", "Robotics", "A device becomes distributed capacity."],
              ["05", "Longitudinal care", "Visits become continuous orchestration."],
              ["06", "Task automation", "Tasks become governed outcomes."],
            ].map(([number, title, copy]) => (
              <button key={number} type="button" onClick={() => onNavigate("levers")} className="six-lever-preview">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate("levers")} className="source-link mt-7 text-[var(--color-mint)]">
            Explore the six theses →
          </button>
        </div>
      </section>

      <section className="story-section bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mb-14 max-w-3xl">
            <p className="eyebrow">The technology shift</p>
            <h2 className="section-title mt-4">The next value layer is execution.</h2>
            <p className="lede mt-5">
              Intelligence matters only when it changes a decision, changes an action, and verifies the result.
            </p>
          </div>

          <div className="maturity-rail">
            <ProgressionStep number="01" title="Record" copy="What happened?" detail="System of record" />
            <ProgressionStep number="02" title="See" copy="What is happening?" detail="Dashboard" />
            <ProgressionStep number="03" title="Predict" copy="What will happen?" detail="Decision support" />
            <ProgressionStep number="04" title="Coordinate" copy="What should happen next?" detail="Governed agents" active />
          </div>

          <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-[1fr_1fr]">
            <blockquote className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              “Visibility without action rights is just a better view of the bottleneck.”
            </blockquote>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-base leading-relaxed text-white/60">
                A comparative NHS study found no significant, consistent patient-flow improvement after a hospital
                command center. The lesson is not that technology fails. It is that information without redesigned
                decisions, ownership, and action does not transform operations.
              </p>
              <a
                className="source-link mt-4 inline-flex"
                href="https://pubmed.ncbi.nlm.nih.gov/37750687/"
                target="_blank"
                rel="noreferrer"
              >
                Read the peer-reviewed study ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="max-w-xl">
              <p className="eyebrow text-[var(--color-mint)]">Proof, not hype</p>
              <h2 className="section-title mt-4 text-white">The evidence says: coordinate the work, not just the data.</h2>
              <p className="mt-5 text-base leading-relaxed text-white/55">
                The signals are credible but uneven. We distinguish peer-reviewed implementation, health-system
                evidence, and modeled demonstration—because trust is part of the operating system.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[26px] bg-white/10 sm:grid-cols-2">
              {EVIDENCE.map((item) => (
                <a key={item.value} href={item.href} target="_blank" rel="noreferrer" className="evidence-cell group">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[var(--color-mint)]">{item.source}</span>
                  <strong className="mt-5 block text-4xl font-semibold tracking-[-0.04em]">{item.value}</strong>
                  <span className="mt-2 block text-base font-bold">{item.label}</span>
                  <span className="mt-2 block text-sm text-white/45">{item.detail}</span>
                  <span className="mt-6 block text-xs font-bold text-white/45 transition-colors group-hover:text-[var(--color-mint)]">Source ↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section bg-[var(--color-mint)] text-[var(--color-night)]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 lg:py-20">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-night)]/55">The Monday decision</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Buy fewer pilots. Redesign one flow.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-[var(--color-night)]/65">
              Name the executive owner. Define action rights. Instrument access, flow, workforce, economics, and trust.
              Scale only when the causal scorecard moves.
            </p>
          </div>
          <button type="button" onClick={() => onNavigate("case")} className="button-dark">
            Enter the hospital lab →
          </button>
        </div>
      </section>
    </>
  );
}

function CaseClock() {
  return (
    <div className="case-clock-card relative justify-self-center lg:justify-self-end">
      <div className="case-clock-header">
        <span className="status-dot status-dot-risk" />
        <span>One robotic case · 48 hours out</span>
        <span className="ml-auto font-mono text-white/35">DEMO–7B</span>
      </div>
      <div className="case-clock-body">
        <div className="case-countdown">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/35">Time to incision</span>
          <strong>47:36</strong>
          <span className="text-sm text-white/55">hours remaining</span>
        </div>
        <div className="mt-8 space-y-4">
          <CaseSignal label="Authorization" state="Evidence requested" tone="risk" />
          <CaseSignal label="OR + robot" state="Block secured" tone="ready" />
          <CaseSignal label="Scrub coverage" state="2-hour gap" tone="risk" />
          <CaseSignal label="Bed capacity" state="1 staffed bed" tone="watch" />
        </div>
      </div>
      <div className="case-clock-footer">
        <span>A dashboard sees four systems.</span>
        <strong>An agent owns the clock.</strong>
      </div>
    </div>
  );
}

function CaseSignal({ label, state, tone }: { label: string; state: string; tone: "risk" | "ready" | "watch" }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`signal-mark signal-mark-${tone}`} />
      <span className="text-sm font-semibold text-white/65">{label}</span>
      <span className="ml-auto text-xs font-bold text-white">{state}</span>
    </div>
  );
}

function ProgressionStep({
  number,
  title,
  copy,
  detail,
  active,
}: {
  number: string;
  title: string;
  copy: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className={`progression-step ${active ? "progression-step-active" : ""}`}>
      <span className="font-mono text-[10px] font-bold text-white/50">{number}</span>
      <h3 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">{title}</h3>
      <p className="mt-3 text-base font-semibold">{copy}</p>
      <p className="mt-1 text-sm text-white/60">{detail}</p>
    </div>
  );
}
