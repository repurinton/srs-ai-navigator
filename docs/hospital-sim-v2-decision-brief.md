# Hospital Sim V2 — Decision Brief

## Decision

Build a true 3D **hospital operating diorama** inside the current application.

Do not build a game, a BIM model, or a new simulation engine. Preserve the seeded operating model and its proven 19-state narrative. Replace the raster/CSS scene with a stylized, open-sided 3D campus whose queues, handoffs, room states, and active constraint respond to the same canonical story.

## The proposition

> **The building stays the same. AI changes the operating rules. The constraint moves.**

The audience should see one hospital become progressively more coordinated—and see each local improvement reveal the next enterprise constraint. The final frame makes staffed recovery capacity an explicit investment decision.

## Recommended build

- **Runtime:** React Three Fiber + Three.js/WebGL2, lazy-loaded within the current React/Vite app.
- **First-release geometry:** code-native low-poly campus, floor plates, rooms, equipment, actors, and world-space splines.
- **Later art pass:** modular Blender-authored GLB replacements after the graybox passes narrative and performance gates.
- **Camera:** fixed architectural shot rail; one move only on each `reveal` beat.
- **Text and evidence:** existing DOM callouts, dashboard, controls, and live region remain outside the canvas.
- **Fallback:** current 2D cutaway remains instantly available for WebGL, asset, or performance failure.

## Smallest credible conference scope

One open-front campus with three stepped clinical plates:

- parking, valet, arrivals, and main access;
- EMS road, ambulance bay, and ED entry;
- CT/MRI and diagnostic routing;
- precision planning and pre-op readiness;
- two robotic ORs, sterile/instrument flow, and turnover;
- PACU, inpatient beds, discharge, and longitudinal/home-care path;
- 30–36 low-poly desktop entities on the inherited route families;
- six embedded AI mechanisms, one active constraint, and the complete 19-state story;
- authored desktop and portrait-mobile camera poses.

This is a presentation-grade 3D spatial operating model, not a hospital digital twin.

## What must not change

- Six-lever order: Digital Front Door → Clinical Diagnosis → Precision Medicine → Robotics → Longitudinal Care → Task Automation.
- Metrics remain frozen during materialization.
- The operating rule commits only on resolve.
- Actor speed never increases to imply better performance.
- The camera moves only on reveal.
- One foreground proposition at a time.
- Final message: AI exposes the next physical-capacity decision; it does not eliminate constraint.

## Five-day conference plan

| Day | Prove | Required exit |
|---|---|---|
| 1 | Scene and engine | Every required component recognizable; feature-flagged 3D and V1 fallback; native stage laptop meets frame-time target |
| 2 | Flow | All inherited route semantics in world space; no floor/wall violations; queues and room states are visible |
| 3 | Story | All 19 states align scene, callout, metric, and camera; all six mechanisms read operationally |
| 4 | Presentation safety | Desktop/mobile composition, reduced motion, accessibility, hosted assets, and failure recovery pass |
| 5 | Rehearsal | Three clean full runs, offline/local backup, and a practiced one-action return to V1 |

**Stop rule:** if the graybox does not depict every component, preserve story alignment, and pass native performance by the end of Day 3, use V1 live and show V2 only as a preview.

## Explicit cuts

- No photorealism or exact hospital floor plan.
- No physics, navmesh crowd simulation, or 600 literal patients.
- No unrestricted camera during the guided story.
- No skeletal avatars, facial animation, weather, day/night, construction, or game mechanics.
- No WebGPU dependency, post-processing stack, or high-cost real-time shadows.
- No 3D body text or essential meaning inside the canvas alone.
- No changes to model values, claims, lever order, or story timing for the 3D build.

## Release decision

Proceed to bespoke production art only after the procedural vertical slice proves that 3D materially improves spatial-system understanding without weakening the argument.

The release test is not “does this look more impressive?” It is:

> **Can an uncoached executive see where the constraint is, what AI changed, why the constraint moved, and what decision comes next?**

See the full plan in [`hospital-sim-v2-plan.md`](hospital-sim-v2-plan.md) and the draft 3D release contract in [`../evals/hospital-v2-release-standard.draft.json`](../evals/hospital-v2-release-standard.draft.json).

