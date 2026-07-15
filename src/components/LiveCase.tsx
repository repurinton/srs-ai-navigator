import { useEffect, useMemo, useState } from "react";
import type { View } from "@/App";

type Phase = "idle" | "running" | "decision" | "approved";
type ApprovalStep = 0 | 1;

const RISKS = [
  {
    domain: "Access",
    lever: "Digital Front Door + Task Automation",
    title: "Authorization evidence requested",
    detail: "Payer criteria changed; supporting pathology note is not attached.",
    source: "Payer API · updated 4 min ago",
    tone: "risk",
  },
  {
    domain: "Readiness",
    lever: "Clinical Diagnosis + Task Automation",
    title: "Pre-op lab still pending",
    detail: "CBC has not resulted; two priority collection slots remain today.",
    source: "LIS · updated 21 min ago",
    tone: "watch",
  },
  {
    domain: "Capacity",
    lever: "Robotics + Task Automation",
    title: "Scrub coverage gap",
    detail: "One credentialed team member is absent from 14:00–16:00.",
    source: "Workforce system · live",
    tone: "risk",
  },
  {
    domain: "Flow",
    lever: "Longitudinal Care + Task Automation",
    title: "Only one staffed critical-care bed",
    detail: "The case requires a two-bed contingency under local policy.",
    source: "Bed command · live",
    tone: "watch",
  },
] as const;

const AGENTS = [
  {
    name: "Access agent",
    task: "Reconcile payer criteria and assemble missing evidence",
    result: "Complete packet assembled; final submission requires approval",
  },
  {
    name: "Readiness agent",
    task: "Find a viable lab slot and verify pre-op dependencies",
    result: "14:20 collection slot held; patient outreach drafted",
  },
  {
    name: "Capacity agent",
    task: "Search credentialed staffing, block, and bed alternatives",
    result: "One safe schedule swap releases staff and bed contingency",
  },
  {
    name: "Safety agent",
    task: "Check the proposal against local policy and stop conditions",
    result: "No clinical rule conflicts; two consequential actions gated",
  },
] as const;

const ACTIONS = [
  {
    action: "Retrieve payer criteria and assemble the evidence packet",
    authority: "Executed",
    owner: "Access agent",
    tone: "verified",
  },
  {
    action: "Hold the 14:20 priority lab slot for 30 minutes",
    authority: "Executed",
    owner: "Readiness agent",
    tone: "verified",
  },
  {
    action: "Swap Case 7B with lower-acuity Case 9C",
    authority: "Approval required",
    owner: "OR director",
    tone: "approval",
  },
  {
    action: "Submit the completed prior-authorization response",
    authority: "Approval required",
    owner: "Access lead",
    tone: "approval",
  },
] as const;

const METRICS = [
  { label: "Case status", before: "At risk", after: "Ready" },
  { label: "Manual touches", before: "23", after: "7" },
  { label: "OR minutes recovered", before: "0", after: "96" },
  { label: "Overtime exposure", before: "6.5 h", after: "1.8 h" },
  { label: "Margin protected", before: "$0", after: "$41K" },
] as const;

export function LiveCase({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [agentStep, setAgentStep] = useState(-1);
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>(0);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    if (phase !== "running") return;
    const totalAgentSteps = AGENTS.length * 2;
    const handles = Array.from({ length: totalAgentSteps }, (_, step) =>
      window.setTimeout(() => setAgentStep(step), 400 + step * 450),
    );
    handles.push(window.setTimeout(() => setPhase("decision"), 400 + totalAgentSteps * 450 + 700));
    return () => handles.forEach(window.clearTimeout);
  }, [phase]);

  function runCase() {
    setPhase("running");
    setAgentStep(-1);
    setApprovalStep(0);
    setAuditOpen(false);
  }

  function reset() {
    setPhase("idle");
    setAgentStep(-1);
    setApprovalStep(0);
    setAuditOpen(false);
  }

  const progress = useMemo(() => {
    if (phase === "idle") return 18;
    if (phase === "running") {
      const completedSteps = Math.max(agentStep + 1, 0);
      return 28 + (completedSteps / (AGENTS.length * 2)) * 46;
    }
    if (phase === "decision") return 82;
    return 100;
  }, [phase, agentStep]);

  const progressLabel =
    phase === "idle"
      ? "Signals detected"
      : phase === "running"
        ? "Operational workstreams coordinating in parallel"
        : phase === "decision"
          ? `${approvalStep} of 2 named approvals complete`
          : "Scenario resolved within policy";

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[var(--color-night)] text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="status-dot status-dot-live" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-mint)]">Modeled demonstration</p>
            </div>
            <h1 className="display-title mt-4 text-white">The robot is ready. Is the hospital?</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg">
              One synthetic robotic case. Four operational workstreams. A governed agent loop that detects,
              coordinates, acts within permission, and escalates the rest.
            </p>
          </div>
          <div className="flex gap-2">
            {phase !== "idle" && (
              <button type="button" onClick={reset} className="button-small-ghost">Reset</button>
            )}
            <button type="button" onClick={() => setAuditOpen((value) => !value)} className="button-small-ghost" aria-expanded={auditOpen}>
              {auditOpen ? "Close audit" : "Open audit"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            <span>Signal</span><span>Coordinate</span><span>Approve</span><span>Verify</span>
          </div>
          <div
            className="h-1 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Case coordination progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={progressLabel}
          >
            <div className="h-full rounded-full bg-[var(--color-mint)] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {auditOpen && <AuditStrip phase={phase} approvalStep={approvalStep} />}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="demo-panel min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">Robotic partial nephrectomy</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Case 7B · Thursday 07:30</h2>
                <p className="mt-2 text-sm text-white/50">Synthetic case · no patient data · 47h 36m to incision</p>
              </div>
              <div className="risk-badge"><span className="status-dot status-dot-risk" />4 cross-system risks</div>
            </div>

            <div className="mt-6 space-y-3">
              {RISKS.map((risk) => (
                <div key={risk.title} className="risk-row">
                  <span className={`signal-mark signal-mark-${risk.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-white/50">{risk.domain} workstream</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-mint)]/75">
                        Lever map · {risk.lever}
                      </span>
                      <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/50">{risk.detail}</p>
                  </div>
                  <span className="hidden shrink-0 text-right font-mono text-[9px] text-white/30 sm:block">{risk.source}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              {phase === "idle" ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-relaxed text-white/48">
                    Four departments can see a piece of the problem. No single workflow can resolve the whole case.
                  </p>
                  <button type="button" onClick={runCase} className="button-primary whitespace-nowrap">
                    Coordinate this case →
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
                  <span className={`status-dot ${phase === "running" ? "status-dot-live" : "status-dot-ready"}`} />
                  {phase === "running" && "Operational workstreams are running in parallel across authorized systems."}
                  {phase === "decision" && approvalStep === 0 && "A concise decision packet is ready for two named approvals."}
                  {phase === "decision" && approvalStep === 1 && "OR director approved the swap. Access lead approval remains."}
                  {phase === "approved" && "Scenario resolved. The modeled case is ready within policy."}
                </div>
              )}
            </div>
          </section>

          <section className="demo-panel min-w-0" aria-live="polite">
            {phase === "idle" && <IdleState />}
            {phase === "running" && <AgentRun agentStep={agentStep} />}
            {phase === "decision" && (
              <DecisionPacket
                approvalStep={approvalStep}
                onApprove={() => {
                  if (approvalStep === 0) setApprovalStep(1);
                  else setPhase("approved");
                }}
              />
            )}
            {phase === "approved" && <Outcome onNext={() => onNavigate("model")} />}
          </section>
        </div>
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex min-h-[530px] flex-col justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-mint)]">Agent workspace</p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">Not a chat window. A decision system.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/50">
          The agent receives a goal, permissions, policies, and stop conditions. It returns one coordinated plan—not
          four alerts and a transcript.
        </p>
      </div>
      <div className="agent-loop-rail">
        {[
          ["01", "Detect", "Cross-system risk"],
          ["02", "Reason", "One constrained plan"],
          ["03", "Act", "Only within authority"],
          ["04", "Verify", "Evidence and outcome"],
        ].map(([number, title, copy]) => (
          <div key={number}>
            <span>{number}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentRun({ agentStep }: { agentStep: number }) {
  const statuses = AGENTS.map((_, index) => {
    if (agentStep < index) return "queued" as const;
    if (agentStep < index + AGENTS.length) return "working" as const;
    return "verified" as const;
  });
  const verifiedCount = statuses.filter((status) => status === "verified").length;
  const activeCount = statuses.filter((status) => status === "working").length;

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-mint)]">Parallel operational workstreams</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">One governed goal. Four bounded agents.</h2>
        </div>
        <span className="font-mono text-xs text-white/55">
          {verifiedCount}/4 verified · {activeCount} active
        </span>
      </div>
      <div className="space-y-3">
        {AGENTS.map((agent, index) => {
          const status = statuses[index];
          const done = status === "verified";
          const active = status === "working";
          return (
            <div key={agent.name} className={`agent-row ${done ? "agent-row-done" : ""} ${active ? "agent-row-active" : ""}`}>
              <span className="agent-index">0{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold">{agent.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
                    {done ? "Verified" : active ? "Working in parallel" : "Queued"}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/45">{done ? agent.result : agent.task}</p>
              </div>
              <span className={`status-dot ${done ? "status-dot-ready" : active ? "status-dot-live" : "status-dot-muted"}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
        <p className="text-xs leading-relaxed text-white/38">
          Clinical judgment is out of scope. Schedule changes and payer submissions remain gated. Reversible reads,
          evidence assembly, and temporary holds can execute automatically.
        </p>
      </div>
    </div>
  );
}

function DecisionPacket({ approvalStep, onApprove }: { approvalStep: ApprovalStep; onApprove: () => void }) {
  const nextApprover = approvalStep === 0 ? "OR director" : "Access lead";

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="status-dot status-dot-watch" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-amber)]">
            Named approval · {approvalStep}/2 complete
          </p>
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
          {approvalStep === 0 ? "Recommended: preserve the case." : "Schedule secured. Authorization remains."}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          {approvalStep === 0
            ? "Two low-risk actions are complete. The OR director must approve the schedule tradeoff first."
            : "The OR director approved the swap. The Access lead must now authorize payer submission."}
        </p>
      </div>
      <div className="space-y-2.5">
        {ACTIONS.map((item) => {
          const namedApprovalComplete = item.owner === "OR director" && approvalStep === 1;
          const state = item.tone === "verified" || namedApprovalComplete ? "verified" : "approval";
          const authority = namedApprovalComplete ? "Approved" : item.authority;

          return (
            <div key={item.action} className="action-row">
              <span className={`action-state action-state-${state}`}>{state === "verified" ? "✓" : "!"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{item.action}</p>
                <p className="mt-1 text-[11px] text-white/55">Named owner: {item.owner}</p>
              </div>
              <span className={`authority-label authority-label-${state}`}>{authority}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-2xl border border-[var(--color-amber)]/25 bg-[var(--color-amber)]/[0.06] p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--color-amber)]">Tradeoff</p>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Case 9C moves 95 minutes later but remains within its clinical and staffing window. No patient loses access.
        </p>
      </div>
      <button
        type="button"
        onClick={onApprove}
        className="button-primary mt-6 w-full justify-center"
        aria-label={`Approve the next action as ${nextApprover}`}
      >
        {approvalStep === 0
          ? "OR director · Approve schedule swap"
          : "Access lead · Approve authorization submission"}
      </button>
    </div>
  );
}

function Outcome({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3"><span className="status-dot status-dot-ready" /><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-mint)]">Scenario resolved</p></div>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Same robot. More care.</h2>
        </div>
        <span className="rounded-full bg-[var(--color-mint)]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--color-mint)]">Modeled case ready</span>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
        The system did not make a clinical decision. It compressed coordination latency, executed reversible work,
        and made the consequential tradeoff explicit.
      </p>
      <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 bg-white/[0.035] px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/35">
          <span>Modeled metric</span><span>Before</span><span>After</span>
        </div>
        {METRICS.map((metric) => (
          <div key={metric.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/8 px-5 py-4 last:border-0">
            <span className="text-sm font-semibold text-white/65">{metric.label}</span>
            <span className="min-w-16 text-right font-mono text-sm text-white/35">{metric.before}</span>
            <span className="min-w-16 text-right font-mono text-sm font-bold text-[var(--color-mint)]">{metric.after}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--color-mint)]">Scenario assumptions</p>
        <p className="mt-2 text-xs leading-relaxed text-white/65">
          A 95-minute swap remains clinically and operationally feasible; qualified staff and a contingency bed stay
          available; contribution impact uses illustrative case economics; no downstream case is canceled.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">Illustrative outputs · not a clinical or financial forecast</p>
        <button type="button" onClick={onNext} className="source-link text-[var(--color-mint)]">See how this scales →</button>
      </div>
    </div>
  );
}

function AuditStrip({ phase, approvalStep }: { phase: Phase; approvalStep: ApprovalStep }) {
  const authority =
    phase === "approved" ? "2 actions approved" : approvalStep === 1 ? "1 of 2 approved" : "2 actions gated";

  return (
    <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
      {[
        ["Evidence", "4 sources · all ≤ 21 min"],
        ["Policy", "Periop capacity v4.2"],
        ["Authority", authority],
        ["Rollback", "Holds expire automatically"],
      ].map(([label, value]) => (
        <div key={label} className="bg-[var(--color-deep)] px-4 py-3">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/30">{label}</p>
          <p className="mt-1 text-xs font-semibold text-white/65">{value}</p>
        </div>
      ))}
    </div>
  );
}
