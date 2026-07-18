# Executive story: AI Transforming Hospital Operations

## Central narrative

The hospital is already full of intelligence. It is short on coordination.

Robotic surgery proved that precision can transform a procedure. The next frontier is making the institution around every episode move with the same precision. Agentic AI can create that operating layer by sensing risk, coordinating work across systems, executing reversible actions within explicit permission, escalating consequential decisions to named humans, and verifying what happened.

The decision is not whether to fund more disconnected AI pilots. It is whether to prove one closed-loop surgical workflow with one executive owner, explicit action rights, human approval thresholds, rollback and stop conditions, and a causal scorecard.

## Audience misconceptions to overturn

1. **AI is a collection of departmental copilots.**  
   AI becomes an enterprise operating loop when shared context, action rights, and measurement connect the parts.

2. **Autonomy means removing people.**  
   Governed autonomy means people define the goal, policy, permissions, approval thresholds, rollback, and stop conditions.

3. **The largest near-term value requires autonomous clinical care.**  
   Material value can come from coordinating access, readiness, capacity, flow, workforce, supply, and revenue around existing care.

4. **More pilots equal progress.**  
   Value compounds only when sensing, decision, action, and learning close into one reusable loop.

5. **Robotics ends at the operating-room door.**  
   Authorization, pre-op readiness, staffing, instruments, beds, discharge, and follow-up determine whether robotic capacity becomes enterprise value.

## Story arc

1. **Tension** — the robot is ready; the hospital is not.
2. **Economics** — coordination waste is now a board-level problem.
3. **System problem** — no workflow owns the end-to-end clock.
4. **Technology shift** — record → see → predict → coordinate.
5. **Architecture** — six levers, one operating system.
6. **Mechanism** — sense → decide → act → learn.
7. **System proof** — replay one synthetic hospital and watch each intervention move the constraint.
8. **Decision drill-down** — one robotic case, four operational workstreams, two named approvals.
9. **Outcome** — same physical asset base, more coordinated care; modeled and assumption-bounded.
10. **Evidence and warning** — workflow-embedded intelligence can move outcomes; visibility alone does not.
11. **Control** — autonomy is a consequence-weighted risk budget.
12. **Decision** — prove one flow in 90 days, then scale the operating pattern.

## The 19-state causal contract

The operating twin has one opening state plus three exclusive beats for each of six levers:

```text
Pressure is visible
  → AI response materializes while performance is held constant
  → operating rule commits and the addressed pressure clears
  → camera moves once and reveals the next constraint
```

The next cycle begins directly with its AI response. It does not resurface the pressure that the audience just saw. This is the core sequencing rule that prevents duplicate callouts and makes causality legible.

| Cycle | Starting pressure | AI lever | Resolution proof | What becomes visible next |
| --- | --- | --- | --- | --- |
| Opening | Every arrival starts over | — | — | Access is the first pain point |
| 01 | Repeated access context and intake friction | Digital Front Door | Access wait decreases | Diagnosis absorbs released demand |
| 02 | Routing errors and diagnostic recycling | Clinical Diagnosis | Diagnostic wait decreases | Readiness becomes the invisible queue |
| 03 | Late prerequisites and plan revision | Precision Medicine | Readiness peak queue decreases | The robot waits for the hospital |
| 04 | Room readiness, instrument flow, and turnover | Robotics | OR completions increase | Discharge and continuity absorb released capacity |
| 05 | Recovery, navigation, and follow-up have no end-to-end owner | Longitudinal Care | Follow-up wait decreases | Administrative handoffs become visible |
| 06 | Staff carry routine coordination across disconnected systems | Task Automation | Administrative touches decrease | Staffed recovery capacity becomes the explicit investment decision |

The language is deliberate:

- **Pain point** describes observed operating friction in the story.
- **System constraint** is used only when the model ranks that stage first at the applicable state.
- **Operating friction** describes administrative work without overstating it as the system constraint.
- **Investment constraint** names the physical-capacity decision exposed after coordination improves.

## What belongs on screen versus in the speaker track

On screen:

- One assertion headline
- One foreground callout
- One active care-area focus
- One operating receipt at resolution
- The current queue, wait, completion, journey, and touch measures
- The six-lever sequence and current state

Say aloud:

- Why the constraint moved
- Why a local improvement may not immediately improve enterprise throughput
- What is modeled, what is externally evidenced, and what remains a hypothesis
- Why a human approval is required
- What changes for CEOs, operators, med-tech companies, and investors
- The final decision request

Do not narrate every moving object. The motion creates system context; the foreground callout carries the argument.

## Presenter preflight

1. Run `npm run check:all` from the repository root.
2. Load the production build or a known-good local build and open `#case`.
3. Use 100% browser zoom. Confirm the stage output is one of the evaluated viewports.
4. Select **Stage view** and confirm the cutaway, mini-dashboard, and caption are all visible without scrolling.
5. Select **Next** once, **Back** once, and **Reset** to verify deterministic control before the room opens.
6. Disable notifications, sleep, automatic updates, and presenter-display mirroring surprises.
7. Keep the PowerPoint operating-twin frame available as a static fallback.

The production experience is static and does not require a backend. Do not make the live presentation dependent on network access.

## Live-demo runbook

### Enter the twin

1. Open `#case`.
2. State: **“Same 600 synthetic episodes. Same 30-day demand trace. Different operating rules.”**
3. Select **Stage view**.
4. Select **Run guided demo** and let the opening pressure settle before speaking again.

### Narrate the six cycles

Use one sentence per beat. The visual should do the rest.

1. **Digital Front Door** — “Context moves ahead of the patient; improved access exposes diagnostic capacity rather than declaring victory.”
2. **Clinical Diagnosis** — “Routing improves the first time; readiness, not diagnosis, now owns the delay.”
3. **Precision Medicine** — “We do more targeted work upstream so the plan changes less downstream; now usable OR capacity is visible.”
4. **Robotics** — “The procedure becomes faster only when the room moves with the robot; released capacity transfers pressure into recovery and continuity.”
5. **Longitudinal Care** — “The next step has an owner before discharge; routine coordination work is now the limiting friction.”
6. **Task Automation** — “Agents carry reversible routine work, people retain consequential decisions, and staffed recovery capacity becomes an explicit investment choice.”

Point to moving cars, EMS, patients, and caregivers once—not six times. Say that better performance is represented by queue, wait, completion, and journey changes, not by making people move faster.

Two credibility moments deserve a pause:

- Precision Medicine adds selective upstream work before it reduces downstream revision.
- Robotics releases local capacity without guaranteeing an immediate enterprise-throughput gain.

### Move from system to case

1. Land on: **“Coordination no longer masks the decision. Staffed recovery capacity is next.”**
2. Select **Inspect Case 7B**.
3. Name the four operational workstreams and their parent-lever mappings.
4. Select **Coordinate this case** and let the parallel workstreams complete.
5. Explain why evidence retrieval and the temporary lab hold are reversible.
6. Approve the schedule swap as the OR director, then the payer submission as the Access lead.
7. Open the audit strip briefly.
8. Land on **Same robot. More care.** and immediately restate that the result is modeled.
9. Move to the governed operating model and the 90-day decision.

## Presenter control map

| Control | Presenter use | Deterministic behavior |
| --- | --- | --- |
| **Run guided demo / Pause guided demo** | Uninterrupted story or a deliberate hold | Resumes from the current canonical state; a completed run restarts from the opening |
| **Back** | Recover a missed sentence | Moves back exactly one story state and pauses autoplay |
| **Next / Apply operating change / Reveal next constraint** | Manual narration | Moves forward exactly one story state and pauses autoplay |
| **Replay cycle** | Re-teach one causal mechanism | Returns to the pressure setup immediately before the current intervention |
| **Stage view / Exit stage** | Conference projection versus normal page | Removes surrounding page chrome and preserves the demo composition |
| **Reset** | Clean restart | Returns to `opening:surface` with no committed levers |
| **Lever rail** | Rehearsal and recovery | Returns to the pressure setup immediately before the selected lever |

The app's left and right arrow keys navigate chapters, not hospital-story beats. Use the on-screen controls inside the operating twin to preserve the 19-state sequence.

## Pacing

The default autoplay is intentionally unhurried:

| Beat | Authored dwell | Presenter purpose |
| --- | ---: | --- |
| Pressure surfaces | 7.2 seconds | Let the operating problem register |
| AI materializes | 5.4 seconds | Explain the mechanism while metrics remain fixed |
| Pressure clears | 6.6 seconds | Let the before-to-after receipt be read |
| Constraint moves | 7.2 seconds | Name the implication before the next intervention |

A 600 ms visual exhale separates resolution from the next reveal. The release standard measures the complete guided run at 120–130 seconds; use measured production evidence rather than inferring acceptance from dwell constants alone.

If discussion becomes more valuable than autoplay, pause. The controls exist so the presenter—not the timer—owns the room.

## Simulation basis

### Fixed across comparisons

- 600 synthetic episodes over 30 days, arriving at 20 episodes per day
- 40% routine surgical, 25% precision-eligible surgical oncology, 35% medical or chronic
- Identical seeded arrival jitter, complexity, priority, and route for every scenario
- Four access staff, five diagnostic servers, three precision-planning servers, four readiness servers, four robotic rooms, 20 recovery beds, and four longitudinal-care servers
- Office, OR, and continuous-care calendar windows
- Clinical priority and cohort routes

### Lever calibration

These coefficients are transparent teaching assumptions. They are calibrated to make queue migration legible, not fitted to observed hospital performance.

| Lever | Modeled operating-rule change |
| --- | --- |
| Digital Front Door | Access handoff time ×0.65; exception rate 22% → 14%; routine touches 5 → 3 |
| Clinical Diagnosis | Diagnostic service time ×0.75; exception rate 15% → 6%; routine touches 4 → 3 |
| Precision Medicine | Precision-planning service time ×1.06, exception rate 18% → 5%, touches 6 → 4; for precision-eligible episodes, readiness service time ×0.65, handoff 18h → 8h, exception rate 18% → 3%, rework 12h → 4h |
| Robotics | Modeled robotic-room service time 5.5h → 3.2h; surgical judgment and the number of rooms do not change |
| Longitudinal Care | Recovery handoff 12h → 6h; longitudinal handoff 24h → 10h, exception rate 25% → 14%, touches 4 → 3 |
| Task Automation | Access, readiness, and longitudinal handoffs ×0.55; rework across stages ×0.60; routine touches ×0.60, with one additional touch removed where that stage's own lever is active |

### Metric definitions

- **Peak queue** — maximum number of episodes waiting at the stage during the 30-day horizon.
- **Average wait** — mean time from stage readiness to service start.
- **Completions** — episodes or stage records finished by the 30-day horizon, depending on the displayed receipt.
- **Median journey** — median modeled time from arrival to simulated episode completion.
- **Administrative touches** — rounded mean touch count across all synthetic episodes.
- **Model-selected constraint** — stage with the highest `peak queue + average wait hours / 2` pressure score.

Do not describe the pressure score as a validated hospital-operations index. It is an explicit narrative device for selecting the modeled constraint consistently.

## Model and visual discipline

- Replay the identical seeded population for every comparison.
- Commit a lever only when entering `resolve`; never change metrics during `materialize`.
- Hold the camera through resolution and move it once on reveal.
- Show queue migration rather than a composite “AI score.”
- Keep entity animation speed constant. Animated people and vehicles represent flow, not individual simulated records.
- Allow a locally improved stage to expose a worse downstream constraint.
- Treat the final recovery constraint as a decision unlocked by better information, not a failure of the six levers.
- Keep consequential clinical and operating approvals human-owned.

## Claim language

Use:

- “The calibrated simulation illustrates…”
- “Under these disclosed assumptions…”
- “The local pressure decreases, and the next constraint becomes visible…”
- “This is a decision rehearsal, not a deployed result.”

Avoid:

- “AI will deliver this exact improvement.”
- “The model predicts AdventHealth performance.”
- “The robot creates enterprise capacity by itself.”
- “The agent makes the clinical decision.”
- “The simulation is a validated digital twin.”

## Release discipline

Automated checks establish structural integrity; they do not substitute for a release evaluation.

```bash
npm run check:all
```

Release only when:

- every hard gate passes;
- all 19 states pass at all six required viewports;
- the weighted score is at least 93/100;
- every domain reaches 85%, and each core craft domain reaches 92%;
- production performance, reduced-motion, keyboard, contrast, and asset checks pass;
- at least nine uncoached audience sessions include at least four executives;
- the audience median is at least 4.6/5; and
- there are no critical or high findings.

The machine-readable standard and evidence workflow are documented in [`../evals/README.md`](../evals/README.md).

## Evidence discipline

- Keep external claims near a primary or peer-reviewed source.
- Label observational evaluations as observational.
- Never present synthetic case metrics as deployed results.
- Do not imply clinical autonomy, PHI suitability, regulatory approval, or realized savings from model capability alone.
- Treat the 272-case readiness score as a directional portfolio heuristic, not a financial recommendation.
- Use counterevidence to distinguish an operating model from a technology installation.
