import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { View } from "@/App";

// Ordered to match the hospital twin: the sequence in which the simulation
// materializes each lever as the constraint moves through the building.
const LEVERS = [
  {
    id: "front-door",
    number: "01",
    monogram: "FD",
    name: "Digital Front Door",
    seed: "One functional channel · voice, chat, text",
    color: "#5bf0c3",
    thesis: "The front door becomes one persistent, multimodal relationship—not a collection of channels.",
    shift: "Portal + call center → resolution layer",
    unlock: "Voice, chat, and text can share context across identity, eligibility, scheduling, authorization, navigation, and escalation—turning demand into access.",
    decision: "Measure resolution and access, not bot containment.",
    measures: ["First-contact resolution", "Days to appointment", "Abandonment", "Referral leakage"],
    boundary: "Identity, consent, accessibility, language access, and human handoff are designed in from the start.",
  },
  {
    id: "diagnosis",
    number: "02",
    monogram: "DX",
    name: "Clinical Diagnosis",
    seed: "AI-first impressions · intelligent pathways",
    color: "#5e8fff",
    thesis: "Diagnosis moves from an episodic interpretation to a continuously updated routing decision.",
    shift: "Point model → pathway intelligence",
    unlock: "AI can connect the first impression to the next best test, specialist, site of care, and follow-up—reducing diagnostic delay, duplication, and drift.",
    decision: "Build the intelligent pathway, not the isolated algorithm.",
    measures: ["Time to diagnosis", "Avoidable testing", "Referral completion", "Outcome variance"],
    boundary: "Clinicians remain accountable; every model exposes provenance, confidence, and subgroup performance.",
  },
  {
    id: "precision",
    number: "03",
    monogram: "PM",
    name: "Precision Medicine",
    seed: "Genomics · pharma · microbiome",
    color: "#7fcf5a",
    thesis: "Personalization becomes an operating model, not a specialist report.",
    shift: "One-time test → learning care system",
    unlock: "Genomic, pharmacologic, and microbiome insight can route therapy, trial matching, formulary choices, procurement, and monitoring—then learn from response.",
    decision: "Design how the insight changes care and learns from the result.",
    measures: ["Time to therapy", "Match rate", "Adverse events", "Cost per response"],
    boundary: "Evidence thresholds, bias, explainability, reimbursement, privacy, and incidental findings stay visible.",
  },
  {
    id: "robotics",
    number: "04",
    monogram: "RX",
    name: "Robotics",
    seed: "Surgical assist · telesurgery · automation · humanoids",
    color: "#ffb454",
    thesis: "Robotics evolves from a precision instrument to a distributed capacity platform.",
    shift: "Capital device → networked care capacity",
    unlock: "Surgical assistance, telesurgery, automation, and service robots can distribute expertise and physical work—but only when the surrounding episode is reliable.",
    decision: "Sell and manage the reliable episode, not the machine.",
    measures: ["Platform utilization", "Cases + access", "Turnover time", "Availability + safety"],
    boundary: "Credentialing, network resilience, bedside readiness, fail-safe states, and human command remain explicit.",
  },
  {
    id: "longitudinal",
    number: "05",
    monogram: "LC",
    name: "Longitudinal Care",
    seed: "Wellness · disease management · care gaps · referrals",
    color: "#b695ff",
    thesis: "Care becomes a continuously managed queue, not a sequence of visits.",
    shift: "Scheduled encounter → always-on orchestration",
    unlock: "AI can sense changing risk, incomplete referrals, care gaps, and adherence barriers—then trigger the next owned action before a patient disappears between encounters.",
    decision: "Make every risk signal accountable to an owned action.",
    measures: ["Care gaps closed", "Referral completion", "Avoidable utilization", "Days healthy"],
    boundary: "Consent, alert burden, equity, escalation, and the limits of remote inference are continuously monitored.",
  },
  {
    id: "automation",
    number: "06",
    monogram: "TA",
    name: "Task Automation",
    seed: "GenAI · agents · RPA · workflow redesign",
    color: "#ff716d",
    thesis: "The unit of automation moves from a task to an outcome.",
    shift: "RPA scripts → governed agent workflows",
    unlock: "Generative AI, agents, and RPA can coordinate authorization, scheduling, staffing, records, supply, and finance—executing reversible work and escalating consequence.",
    decision: "Redesign the flow before automating it.",
    measures: ["Manual touches", "Cycle time", "Exceptions + rework", "Cost per outcome"],
    boundary: "Least-privilege access, audit, rollback, uncertainty, and human approval are the architecture—not afterthoughts.",
  },
] as const;

const LEVER_COLOR: Record<string, string> = Object.fromEntries(LEVERS.map((lever) => [lever.monogram, lever.color]));

// One shared loop, told with the levers that participate at each step.
const LOOP_STEPS = [
  { number: "01", title: "Sense", copy: "The front door, diagnosis, precision medicine, and longitudinal care detect need as it appears.", levers: ["FD", "DX", "PM", "LC"] },
  { number: "02", title: "Decide", copy: "Agents assemble the evidence, constraints, options, and tradeoffs into one decision.", levers: ["DX", "TA"] },
  { number: "03", title: "Act", copy: "People, workflows, and robotics execute within explicit permission.", levers: ["RX", "TA"] },
  { number: "04", title: "Learn", copy: "Outcomes update pathways, operating rules, and investment priorities—then the loop repeats.", levers: ["FD", "DX", "PM", "RX", "LC", "TA"] },
] as const;

export function SixLevers({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [selectedId, setSelectedId] = useState<(typeof LEVERS)[number]["id"]>("front-door");
  const selected = LEVERS.find((lever) => lever.id === selectedId) ?? LEVERS[0];

  // The compounding loop highlights each step in turn so it reads as a cycle,
  // not a static list. Respect reduced motion by holding on "Learn".
  const [loopStep, setLoopStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLoopStep(LOOP_STEPS.length - 1);
      return;
    }
    const timer = window.setInterval(() => setLoopStep((step) => (step + 1) % LOOP_STEPS.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <section className="lever-hero bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="eyebrow text-[var(--color-mint)]">Enterprise transformation map</p>
              <h1 className="display-title mt-4 text-white">Six levers. One operating system.</h1>
            </div>
            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-lg leading-relaxed text-white/55">
                AI transforms hospital operations at six points of value creation. Their impact compounds when they
                share context, action rights, and a causal scorecard.
              </p>
              <p className="mt-4 text-sm font-bold text-[var(--color-mint)]">
                The strategic mistake is funding six portfolios. The opportunity is connecting one system.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <div className="lever-hub-label">
              <span>Shared context</span><i /> <span>Governed action</span><i /> <span>Continuous learning</span>
            </div>
            <div className="lever-matrix">
              {LEVERS.map((lever) => {
                const active = selected.id === lever.id;
                return (
                  <button
                    key={lever.id}
                    type="button"
                    onClick={() => setSelectedId(lever.id)}
                    className={`lever-cell ${active ? "lever-cell-active" : ""}`}
                    style={{ "--lever-color": lever.color } as CSSProperties}
                    aria-pressed={active}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="lever-monogram">{lever.monogram}</span>
                      <span className="font-mono text-[10px] text-white/25">{lever.number}</span>
                    </div>
                    <h2>{lever.name}</h2>
                    <p>{lever.seed}</p>
                    <span className="lever-select-label">{active ? "Selected" : "Explore"} <b>→</b></span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="lever-detail-header" style={{ "--lever-color": selected.color } as CSSProperties}>
            <div className="flex items-center gap-4">
              <span className="lever-monogram lever-monogram-light">{selected.monogram}</span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-white/50">Lever {selected.number}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{selected.name}</h2>
              </div>
            </div>
            <p className="mt-8 max-w-5xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              {selected.thesis}
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] border border-white/10 bg-white/10 lg:grid-cols-3">
            <LeverDetail label="The shift" value={selected.shift} copy={selected.unlock} />
            <LeverDetail label="The executive bet" value={selected.decision} copy="Capital, ownership, and incentives should follow the end-to-end outcome—not the local technology." />
            <LeverDetail label="The trust boundary" value="Do not automate what you cannot audit." copy={selected.boundary} />
          </div>

          <div className="mt-9 border-t border-white/10 pt-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-white/50">Board scorecard</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {selected.measures.map((measure, index) => (
                <div key={measure} className="measure-line" style={{ "--lever-color": selected.color } as CSSProperties}>
                  <span className="font-mono text-[10px] text-white/55">0{index + 1}</span>
                  <strong>{measure}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-night)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="eyebrow">The compounding loop</p>
              <h2 className="section-title mt-4">The six levers become transformational only when the loop closes.</h2>
              <p className="lede mt-5">
                Each lever plays a position in one repeating cycle—sense, decide, act, learn. A fragmented portfolio
                creates local gains. A shared loop creates enterprise learning.
              </p>
            </div>
            <div className="compound-loop">
              {LOOP_STEPS.map((step, index) => (
                <LoopStep
                  key={step.number}
                  number={step.number}
                  title={step.title}
                  copy={step.copy}
                  levers={step.levers}
                  active={loopStep === index}
                  last={index === LOOP_STEPS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-mint)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-night)]/50">The operating twin</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-[var(--color-night)]">
              Hold demand constant. Materialize each lever. Watch the constraint move.
            </h2>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-relaxed text-[var(--color-night)]/65">
              The synthetic hospital makes one idea visible: local gains compound only when context, action rights,
              and handoffs connect across the full episode.
            </p>
          </div>
          <button type="button" onClick={() => onNavigate("case")} className="button-dark whitespace-nowrap">Run the hospital twin →</button>
        </div>
      </section>
    </>
  );
}

function LeverDetail({ label, value, copy }: { label: string; value: string; copy: string }) {
  return (
    <div className="bg-white/[0.035] p-7 lg:p-8">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/50">{label}</p>
      <h3 className="mt-6 text-2xl font-semibold leading-tight tracking-[-0.035em]">{value}</h3>
      <p className="mt-4 text-sm leading-relaxed text-white/60">{copy}</p>
    </div>
  );
}

function LoopStep({ number, title, copy, levers, active, last }: {
  number: string;
  title: string;
  copy: string;
  levers: readonly string[];
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`loop-step ${active ? "loop-step-active" : ""}`}>
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
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
      </div>
      <b aria-hidden="true">{last ? "↺" : "↓"}</b>
    </div>
  );
}
