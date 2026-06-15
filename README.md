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

## Structure

- `src/data/schema.ts` — Zod schema + types (tracks, specialties, autonomy, etc.)
- `src/data/tracks.ts` — meeting-track metadata + colors
- `src/data/use-cases.ts` — the use-case dataset (currently a seed slice)
- `src/lib/scoring.ts` — adoption-readiness priority score + recommendation
- `src/components/` — UI components
- `src/App.tsx` — app shell (track nav, search, card grid)

## Status

Foundation scaffold: track navigation, search, and the card-grid Explorer over a
representative seed dataset. Next: full dataset, additional views (Roadmap,
Radar/landscape, Platforms, Methodology), detail modal, and shareable URLs.
