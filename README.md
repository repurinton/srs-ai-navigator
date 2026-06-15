# SRS 2026 — Robotic Surgery & Surgical AI Navigator

An interactive navigator of robotic surgery, telesurgery, surgical AI, digital
surgery, and humanoid use cases, built for the **Society of Robotic Surgery 2026
Annual Meeting** (July 23–26, 2026, Fort Lauderdale, FL — _"Innovation Continues"_).

This is the modernized successor to the original single-file National Service
Line AI Navigator, rebuilt on a typed, component-based stack and reorganized
around the meeting's tracks.

## Stack

- **Vite + React 19 + TypeScript** — fast, type-safe SPA
- **Tailwind CSS v4** — design tokens in `src/index.css` (`@theme`)
- **Zod** — the use-case dataset is schema-validated at load (`src/data/schema.ts`)
- **Fully serverless** — `npm run build` emits a static `dist/` deployable to any
  static host (S3/CloudFront, Netlify, GitHub Pages). No backend.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc project check
npm run build      # static production build → dist/
npm run preview    # preview the production build
```

## Data: parallel lenses

Every use case can be navigated by **two lenses**:

- **Service lines** — Cancer, Heart/Lung/Vascular, Orthopedics, Neurosciences,
  Gastrointestinal, Women's Health, Cross-Cutting (the original taxonomy).
- **Robotic-surgery tracks** — Robotic Platforms, Urology, Telesurgery, Surgical
  AI, Digital Surgery, Orthopedics, Humanoids (the meeting tracks).

The dataset combines **248 cases migrated** from the original navigator (curation,
taxonomy, scoring inputs, and investment tiers preserved) with **24 hand-authored
robotic-surgery cases** — 272 total.

### De-branding

The migration (`scripts/migrate-original.mjs`, run via `npm run migrate`) scrubs
organization-specific content for public use: it removes the `platformAlignment`
field (tied to a specific platform stack) and strips originating-organization
entries from deployment lists. The generated output is
`src/data/service-line-use-cases.generated.ts`.

## Structure

- `src/data/schema.ts` — Zod schema + types (both lenses; lenient on curated fields)
- `src/data/service-line-use-cases.generated.ts` — migrated, de-branded dataset
- `src/data/use-cases.ts` — aggregator (migrated + robotics, transformed & validated)
- `src/data/tracks.ts` · `src/data/service-lines.ts` — lens metadata + colors
- `src/lib/scoring.ts` — adoption-readiness score (platformAlignment removed, reweighted)
- `src/components/` — UI components
- `src/App.tsx` — app shell (lens toggle, filter chips, search, card grid)

## Status

Dual-lens Explorer (service lines + robotic tracks), search, and adoption-readiness
scoring over the full 272-case dataset. Next: additional views (Roadmap,
landscape, Methodology), a use-case detail modal, and shareable filtered URLs.
