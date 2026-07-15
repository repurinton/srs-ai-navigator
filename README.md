# AI Transforming Hospital Operations

An executive presentation experience for the Society of Robotic Surgery 2026. The project combines a deterministic, conference-ready web demonstration with an editable PowerPoint deck.

The central thesis:

> The hospital is already full of intelligence. It is short on coordination. Agentic AI turns stranded capacity into care by closing the gap between signal and action under human control.

## The six transformation levers

The experience treats six levers as one enterprise operating architecture:

1. **Clinical Diagnosis** — episodic interpretation becomes a continuously updated routing decision.
2. **Digital Front Door** — fragmented channels become one persistent relationship that resolves needs.
3. **Robotics** — a precision instrument becomes a distributed capacity platform.
4. **Longitudinal Care** — visits become a continuously managed queue of risks, needs, and interventions.
5. **Task Automation** — isolated tasks become governed outcomes that are planned, executed, and verified.
6. **Precision Medicine** — a specialist report becomes a learning operating model.

Their impact compounds when they share context, governed action rights, and one causal scorecard.

## Presentation flow

The web app is organized as six chapters with direct links and arrow-key navigation:

- `#thesis` — the coordination gap and executive case for change
- `#levers` — the six-lever transformation architecture
- `#case` — the Hospital Lab: a deterministic operating twin plus the Case 7B approval drill-down
- `#model` — governed autonomy and the 90-day operating model
- `#portfolio` — the 272-case evidence library
- `#timeline` — the telesurgery and robotic-platform arc

The Hospital Lab replays the same 600 synthetic episodes across a fixed 30-day demand trace. Each lever changes disclosed operating parameters while clinical priority, demand, and physical assets remain fixed. Case 7B then drills from the system view into parallel agent work and two named approvals. Neither mode contains patient data or makes a clinical decision.

## Presentation artifact

The editable deck is at:

- `outputs/AI-Transforming-Hospital-Operations-SRS-2026.pptx`

The deck mirrors the web narrative and includes speaker notes, evidence grades, primary-source footers, and explicit modeling assumptions.

## Develop and verify

```bash
npm install
npm run dev
npm run typecheck
npm run check:simulation
npm run build
npm run preview
```

The production build is static and deployable without a backend. The evidence-heavy Portfolio and Timeline chapters are split from the initial bundle and preloaded during idle time for presentation reliability.

## Architecture

- React 19 + TypeScript + Vite
- Tailwind CSS v4 design tokens in `src/index.css`
- Zod validation for the use-case corpus
- 272 total use cases: 248 service-line cases and 24 robotics-native cases
- Hash-addressable presentation chapters
- Deterministic hospital operating twin with a stable episode trace, queue migration, and disclosed coefficients
- Deterministic live-case state machine with audit, assumptions, and approval gates
- Lazy-loaded evidence library and telesurgery map

## Evidence and limitations

The app separates three kinds of content:

- **External evidence** — linked to primary or peer-reviewed sources where used in the executive story.
- **Curated portfolio data** — directional and not a financial recommendation.
- **Modeled demonstration outputs** — synthetic illustrations, not clinical advice or a financial forecast.

See `docs/executive-story.md` for the narrative logic, audience misconceptions, talk track, demo runbook, and evidence discipline.
