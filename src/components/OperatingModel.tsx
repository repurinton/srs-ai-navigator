import type { View } from "@/App";

// Lever colors match the Six Levers tab so the monogram chips read as one system.
const LEVER_COLOR: Record<string, string> = {
  FD: "#5bf0c3",
  DX: "#5e8fff",
  PM: "#7fcf5a",
  RX: "#ffb454",
  LC: "#b695ff",
  TA: "#ff716d",
};

// The autonomy ladder, with the levers that typically operate at each rung.
const LEVELS = [
  {
    level: "01",
    title: "Observe",
    subtitle: "AI watches",
    copy: "AI reads the operation, reconciles data, and flags risk. It changes nothing.",
    actions: ["Read status", "Compare policy", "Surface exception"],
    note: "Nothing is changed—read and report only.",
    levers: ["DX", "LC"],
  },
  {
    level: "02",
    title: "Recommend",
    subtitle: "Human decides",
    copy: "AI assembles one decision packet—options, tradeoffs, and a named approver.",
    actions: ["Draft plan", "Estimate effect", "Name approver"],
    note: "Nothing is changed—a person says yes first.",
    levers: ["DX", "PM"],
  },
  {
    level: "03",
    title: "Act, reversibly",
    subtitle: "AI does the undoable",
    copy: "AI takes low-stakes actions it can undo—each one logged, expiring, reversible.",
    actions: ["Hold slot", "Create task", "Retrieve evidence"],
    note: "Logged, expiring, and undoable.",
    levers: ["FD", "TA"],
  },
  {
    level: "04",
    title: "Orchestrate",
    subtitle: "Humans keep the veto",
    copy: "AI coordinates work across systems and hands anything consequential to a person.",
    actions: ["Sequence agents", "Verify completion", "Stop on threshold"],
    note: "Escalates to a human at policy thresholds.",
    levers: ["TA", "RX"],
  },
] as const;

const HORIZONS = [
  {
    label: "Proven now",
    title: "Forecast and assist",
    examples: "Documentation · coding · duration prediction · scheduling support",
    color: "var(--color-blue)",
    active: false,
  },
  {
    label: "Emerging now",
    title: "Plan, act, verify",
    examples: "Cross-system operational agents with explicit permissions",
    color: "var(--color-mint)",
    active: true,
  },
  {
    label: "Frontier",
    title: "Clinical autonomy",
    examples: "Autonomous clinical judgment or autonomous surgery",
    color: "var(--color-coral)",
    active: false,
  },
] as const;

function LeverChips({ levers }: { levers: readonly string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {levers.map((monogram) => (
        <i
          key={monogram}
          className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold not-italic"
          style={{
            color: `color-mix(in srgb, ${LEVER_COLOR[monogram]} 70%, white)`,
            background: `color-mix(in srgb, ${LEVER_COLOR[monogram]} 14%, transparent)`,
          }}
        >
          {monogram}
        </i>
      ))}
    </div>
  );
}

export function OperatingModel({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <>
      <section className="bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="eyebrow text-[var(--color-mint)]">Governed autonomy</p>
              <h1 className="display-title mt-4 text-white">Human-in-the-loop is not a compromise. It is the control architecture.</h1>
            </div>
            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-lg leading-relaxed text-white/55">
                Autonomy should expand by reversibility and consequence—not by technical possibility. Humans set the
                goal, permissions, approval thresholds, and stop conditions.
              </p>
              <p className="mt-4 text-sm font-bold text-[var(--color-mint)]">
                The argument in one line: grant autonomy by reversibility, fund the middle horizon, prove it in 90
                days on one flow.
              </p>
            </div>
          </div>

          <p className="mt-14 text-[10px] font-extrabold uppercase tracking-[0.17em] text-white/50">
            Step 1 · Grant autonomy by reversibility
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {LEVELS.map((item) => (
              <div key={item.level} className="autonomy-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-white/30">{item.level}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-white/35">{item.subtitle}</span>
                </div>
                <h2 className="mt-8 text-2xl font-semibold tracking-[-0.035em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{item.copy}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
                  {item.actions.map((action) => (
                    <li key={action} className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-white/70">
                      {action}
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-[11px] leading-relaxed text-white/35">{item.note}</p>
                <LeverChips levers={item.levers} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="eyebrow">Step 2 · Fund the middle horizon</p>
              <h2 className="section-title mt-4">Invest in the middle horizon.</h2>
              <p className="lede mt-5">
                More consequential than a scribe. More credible than autonomous clinical care. The investable frontier
                is governed coordination across administrative and operational work—rungs three and four of the ladder,
                applied where mistakes are reversible.
              </p>
            </div>
            <div className="proof-ladder">
              {HORIZONS.map((horizon) => (
                <div key={horizon.label} className={`proof-horizon ${horizon.active ? "proof-horizon-active" : ""}`}>
                  <div className="proof-horizon-line" style={{ background: horizon.color }} />
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: horizon.color }}>{horizon.label}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{horizon.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{horizon.examples}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="eyebrow">Step 3 · Prove it in 90 days</p>
              <h2 className="section-title mt-4">Prove one flow. Then replicate the operating pattern.</h2>
            </div>
            <button type="button" onClick={() => onNavigate("case")} className="button-ghost whitespace-nowrap">
              Watch this slice in the hospital twin →
            </button>
          </div>
          <div className="ninety-day-grid">
            <RoadmapStep day="00–30" title="Choose the clock" copy="One constrained surgical flow—the slice the hospital twin demonstrates—one executive owner, one accountable P&L." />
            <RoadmapStep day="31–60" title="Bound the actions" copy="Map permissions, approval gates, policies, rollback, and the evidence trail." />
            <RoadmapStep day="61–90" title="Move the scorecard" copy="Measure access, flow, workforce, economics, and trust against a baseline." />
            <RoadmapStep day="90+" title="Scale the pattern" copy="Reuse the orchestration layer across beds, revenue, staffing, and supply." active />
          </div>
          <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-5">
            {[
              ["Access", "days to procedure"],
              ["Flow", "minutes + bed-days"],
              ["Workforce", "touches + overtime"],
              ["Economics", "margin + cash"],
              ["Trust", "overrides + failures"],
            ].map(([label, metric]) => (
              <div key={label}>
                <p className="text-sm font-bold">{label}</p>
                <p className="mt-1 text-xs text-white/60">{metric}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-mint)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-night)]/50">The investment question</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[var(--color-night)]">Does it sit in the workflow—and can it prove the outcome?</h2>
          </div>
          <button type="button" onClick={() => onNavigate("portfolio")} className="button-dark whitespace-nowrap">Explore the portfolio →</button>
        </div>
      </section>
    </>
  );
}

function RoadmapStep({ day, title, copy, active }: { day: string; title: string; copy: string; active?: boolean }) {
  return (
    <div className={`roadmap-step ${active ? "roadmap-step-active" : ""}`}>
      <span className="font-mono text-[10px] font-bold text-white/50">DAY {day}</span>
      <h3 className="mt-9 text-2xl font-semibold tracking-[-0.035em]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{copy}</p>
    </div>
  );
}
