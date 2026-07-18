# AI Transforming Hospital Operations

An executive presentation experience for the Society of Robotic Surgery 2026. The repository contains a deterministic hospital operating-twin demo and an editable PowerPoint deck designed to support one decision:

> Prove one closed-loop surgical workflow with shared context, explicit action rights, named human approvals, and a causal scorecard—then scale the operating pattern.

The central thesis is that the hospital is already full of intelligence; it is short on coordination. Agentic AI creates value when it closes the gap between signal and action under human control.

## What the audience sees

The Hospital Lab replays the same 600 synthetic episodes over a fixed 30-day demand trace inside an animated cutaway medical center. Arrivals, EMS, patients, caregivers, diagnostics, robotic ORs, recovery, and discharge remain in motion while one operating pressure is made visible at a time.

The guided story follows a 19-state contract:

```text
Opening pressure
  → 6 × (AI materializes → addressed pressure resolves → next pressure is revealed)
```

There is only one `surface` state. A pressure revealed at the end of one cycle becomes the context for the next intervention; it is not introduced a second time. During `materialize`, the operating metrics remain fixed. The lever commits on `resolve`, when the before-to-after receipt appears. The camera moves on `reveal`, after the addressed pressure has cleared.

The pressure chain is:

```text
Access friction
  → diagnostic constraint
  → readiness constraint
  → OR capacity constraint
  → discharge and continuity constraint
  → administrative handoffs
  → explicit recovery-capacity investment decision
```

The final frame is not “AI solved the hospital.” It is a more useful conclusion: coordination no longer masks the next physical-capacity decision.

## The six transformation levers

The guided sequence is a causal demonstration order, not a maturity ranking.

| Order | Lever | Thesis | Executive decision rule |
| --- | --- | --- | --- |
| 01 | Digital Front Door | The front door should preserve context, not create another queue. | Measure resolution and access, not bot containment. |
| 02 | Clinical Diagnosis | Diagnostic intelligence creates value by routing correctly the first time. | Build the intelligent pathway, not the isolated algorithm. |
| 03 | Precision Medicine | Consequential context should arrive before the treatment plan hardens. | Design how each insight changes care and improves the next decision. |
| 04 | Robotics | Robotics creates capacity only when the surrounding operating model moves with it. | Manage a reliable episode, not only a machine. |
| 05 | Longitudinal Care | Discharge should become an owned flow rather than a point-in-time event. | Every signal must map to an owned action. |
| 06 | Task Automation | Agents should execute routine coordination while people govern consequential decisions. | Redesign and govern the flow before automating it. |

The levers compound when they share context, governed action rights, and one causal scorecard.

## Presenter quick start

1. Open `#case` and select **Stage view**.
2. Say: “Same 600 synthetic episodes. Same 30-day demand trace. Different operating rules.”
3. Select **Run guided demo** for the roughly two-minute autoplay, or use the forward control to narrate beat by beat.
4. Use **Pause guided demo**, **Back**, **Replay cycle**, or **Reset** if the room needs more time or a point needs to be replayed.
5. Land on the explicit recovery-capacity decision, then select **Inspect Case 7B** to show governed action at the episode level.

The lever rail is a rehearsal and recovery tool. Selecting a lever returns to the pressure setup immediately before that intervention. Left and right arrow keys navigate application chapters; the on-screen story controls advance the hospital twin.

For the complete talk track, timing, operating assumptions, and contingency plan, see [`docs/executive-story.md`](docs/executive-story.md).

## Presentation flow

The web app is organized as six hash-addressable chapters:

- `#thesis` — the coordination gap and executive case for change
- `#levers` — the six-lever transformation architecture
- `#case` — the Hospital Lab and Case 7B governed-action drill-down
- `#model` — governed autonomy and the 90-day operating model
- `#portfolio` — the 272-case evidence library
- `#timeline` — the telesurgery and robotic-platform arc

## Model basis and claim discipline

- The simulation uses 600 synthetic episodes across 30 days: 40% routine surgical, 25% precision-eligible surgical oncology, and 35% medical or chronic.
- Every comparison replays the identical seeded demand trace, route mix, priority mix, complexity distribution, staffed assets, and calendar rules.
- Each lever changes disclosed operating coefficients. Clinical priority remains fixed; consequential approvals remain human-owned.
- A modeled constraint is the stage with the highest transparent pressure score: `peak queue + average wait hours / 2`.
- Animated entities communicate flow; they are not one-to-one representations of simulated episodes. Better performance is shown by queues, waits, completions, journeys, and administrative touches—not by making people move faster.
- All outputs are calibrated demonstrations. They are not observed AdventHealth performance, clinical outcome claims, a validated digital twin, or a financial forecast.

The model is designed to teach queue migration and operating tradeoffs. Precision Medicine intentionally adds selective upstream work before reducing revision downstream; Robotics releases local OR capacity before downstream capacity catches up.

## Presentation artifact

The editable deck is at:

- `outputs/AI-Transforming-Hospital-Operations-SRS-2026.pptx`

The deck mirrors the web narrative and includes speaker notes, evidence grades, primary-source footers, and explicit modeling assumptions.

## Develop and verify

```bash
npm install
npm run check:all
npm run dev
```

The checks can also be run independently:

- `npm run typecheck` — TypeScript integrity
- `npm run check:story` — 19-state order, pressure handoffs, metric timing, and causal semantics
- `npm run check:simulation` — seeded determinism, authored constraint migration, and lever-local pressure reduction
- `npm run check:evals` — internal consistency of the release standard and scorecards
- `npm run build` — production build and hosting-package preparation

A passing automated check suite does not by itself make the demo release-ready. The release standard also requires all 19 states at six viewports, production performance evidence, reduced-motion and accessibility checks, and uncoached audience evaluation. See [`evals/README.md`](evals/README.md).

## Architecture

- React 19 + TypeScript + Vite
- Tailwind CSS v4 design tokens in `src/index.css`
- Deterministic hospital simulation and 19-state story engine
- Animated 2.5D hospital cutaway with responsive focus behavior
- Deterministic live-case state machine with audit, assumptions, and approval gates
- Zod-validated, lazy-loaded 272-case evidence library
- Hash-addressable presentation chapters and keyboard chapter navigation

The production build is static and does not require a backend. The evidence-heavy Portfolio and Timeline chapters are split from the initial bundle and preloaded during idle time for presentation reliability.

## Evidence and limitations

The experience separates three kinds of content:

- **External evidence** — linked to primary or peer-reviewed sources where used in the executive story.
- **Curated portfolio data** — directional and not a financial recommendation.
- **Modeled demonstration outputs** — synthetic illustrations, not clinical advice or deployed results.

Do not infer clinical autonomy, PHI suitability, regulatory approval, or realized financial value from this demonstration.
