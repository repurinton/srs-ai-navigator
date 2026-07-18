import { useState } from "react";
import type { View } from "@/App";

const LEVELS = [
  {
    level: "01",
    title: "Observe",
    subtitle: "AI watches",
    copy: "AI reads the operation, reconciles data, and flags risk. It changes nothing.",
    actions: ["Read status", "Compare policy", "Surface exception"],
  },
  {
    level: "02",
    title: "Recommend",
    subtitle: "Human decides",
    copy: "AI assembles one decision packet—options, tradeoffs, and a named approver.",
    actions: ["Draft plan", "Estimate effect", "Name approver"],
  },
  {
    level: "03",
    title: "Act, reversibly",
    subtitle: "AI does the undoable",
    copy: "AI takes low-stakes actions it can undo—each one logged, expiring, reversible.",
    actions: ["Hold slot", "Create task", "Retrieve evidence"],
  },
  {
    level: "04",
    title: "Orchestrate",
    subtitle: "Humans keep the veto",
    copy: "AI coordinates work across systems and hands anything consequential to a person.",
    actions: ["Sequence agents", "Verify completion", "Stop on threshold"],
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

export function OperatingModel({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [selected, setSelected] = useState(2);

  return (
    <>
      <section className="bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="eyebrow text-[var(--color-mint)]">Governed autonomy</p>
              <h1 className="display-title mt-4 text-white">Human-in-the-loop is not a compromise. It is the control architecture.</h1>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-white/55 lg:justify-self-end">
              Autonomy should expand by reversibility and consequence—not by technical possibility. Humans set the
              goal, permissions, approval thresholds, and stop conditions.
            </p>
          </div>

          <div className="mt-14 grid gap-3 lg:grid-cols-4">
            {LEVELS.map((item, index) => (
              <button
                key={item.level}
                type="button"
                onClick={() => setSelected(index)}
                className={`autonomy-card ${selected === index ? "autonomy-card-active" : ""}`}
                aria-pressed={selected === index}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-white/30">{item.level}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-white/35">{item.subtitle}</span>
                </div>
                <h2 className="mt-8 text-2xl font-semibold tracking-[-0.035em]">{item.title}</h2>
                <p className="mt-3 min-h-16 text-sm leading-relaxed text-white/45">{item.copy}</p>
              </button>
            ))}
          </div>

          <div className="mt-3 grid overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] md:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-white/10 p-7 md:border-b-0 md:border-r">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-mint)]">Selected authority</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{LEVELS[selected].title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/48">{LEVELS[selected].copy}</p>
            </div>
            <div className="grid sm:grid-cols-3">
              {LEVELS[selected].actions.map((action, index) => (
                <div key={action} className="border-b border-white/10 p-7 last:border-0 sm:border-b-0 sm:border-r">
                  <span className="font-mono text-[10px] text-white/28">0{index + 1}</span>
                  <p className="mt-5 text-base font-bold">{action}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/38">
                    {selected < 2 ? "Nothing is changed—read and report only." : selected === 2 ? "Logged, expiring, and undoable." : "Escalates to a human at policy thresholds."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="eyebrow">Portfolio discipline</p>
              <h2 className="section-title mt-4">Invest in the middle horizon.</h2>
              <p className="lede mt-5">
                More consequential than a scribe. More credible than autonomous clinical care. The investable frontier
                is governed coordination across administrative and operational work.
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
          <div className="mb-12 max-w-3xl">
            <p className="eyebrow">A 90-day thin slice</p>
            <h2 className="section-title mt-4">Prove one flow. Then replicate the operating pattern.</h2>
          </div>
          <div className="ninety-day-grid">
            <RoadmapStep day="00–30" title="Choose the clock" copy="One constrained surgical flow, one executive owner, one accountable P&L." />
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
