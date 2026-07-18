# Hospital twin release evaluation

This folder turns the hospital operating twin's narrative and visual standard into a repeatable release decision. It is intentionally stricter than a conventional design review: a strong average score cannot hide a broken sequence, unsupported claim, overlap, accessibility failure, or unreliable live run.

## Files

- `hospital-release-standard.json` is the machine-readable release policy, hard-gate catalog, viewport matrix, thresholds, and 100-point qualitative rubric.
- `canonical-story-states.json` is the authoritative 19-state story contract.
- `human-audience-scorecard.template.json` captures immediate comprehension, unaided recall, credibility, decision utility, and qualitative audience response.
- `release-scorecard.template.json` is copied for each candidate and becomes the auditable release record.
- `release-scorecard.current.json` is generated evidence, never a hand-edited assessment. It resolves every hard gate to a boolean, labels missing evidence `pending`, and defaults the release decision to `hold`.
- `../scripts/check-hospital-evals.mjs` validates that these artifacts remain internally consistent using Node only.
- `../scripts/build-hospital-release-scorecard.mjs` runs repository checks, verifies browser-evidence freshness, and builds the current release decision.

## Self-check

From the repository root, run:

```sh
node scripts/check-hospital-evals.mjs
```

The command validates JSON syntax and checks that:

- the rubric totals 100 points;
- every domain's criteria total its allocated points;
- every hard gate and rubric criterion appears exactly once in the release template;
- every required viewport appears exactly once in the release template;
- the canonical story has exactly 19 ordered states;
- there is one initial `surface` state and six `materialize → resolve → reveal` cycles;
- committed lever counts, simulation phases, camera timing, metric timing, foreground count, and semantic alignment follow the contract;
- human and release templates retain the required null placeholders and success thresholds.

This self-check validates the evaluation system, not the application. A passing self-check means the measuring instrument is coherent; it does not mean the demo is release-ready.

## Current release scorecard

From the repository root, run:

```sh
npm run eval:release
```

The generator reruns typecheck, story, simulation, motion, evaluation-harness, and production-build checks. It then maps the canonical contract and the six-viewport browser evidence into `release-scorecard.current.json`. The source digest in `browser-qa.json` must match the current application source; stale browser evidence fails the affected gates.

Missing evidence is never inferred. The following optional evidence files graduate the remaining gates only when each explicitly reports `pass: true` and its underlying threshold values pass:

- `evidence/current/autoplay-runtime.json`
- `evidence/current/performance-qa.json` with both `baseline.pass` and `cpu4x.pass`
- `evidence/current/accessibility-qa.json` with separate `operablePass` and `perceivablePass`
- `evidence/current/control-qa.json`
- `evidence/current/production-runtime.json`
- `evidence/current/human-audience-summary.json`

`evidence/current/performance-probe.json` is calibrated partial evidence, not a release-pass artifact. The current animated and reduced-motion control runs both hit the browser harness's identical 30 Hz sampling ceiling. The generator records the probe's clean long-task, layout-shift, LCP, and runtime-error signals, but keeps `HG-PERF-01` pending until a native 60 Hz baseline run and a 4x CPU run satisfy the standard.

Until those files exist, the relevant hard gates are boolean `false` with status `pending`, and the release decision remains `hold`. This is deliberately different from a failed measurement: pending means the test has not been run, not that the design missed the threshold.

## Candidate evaluation workflow

1. Copy `release-scorecard.template.json` to an evidence location for the candidate. Do not overwrite the template.
2. Run the repository's type check, simulation checks, story-state checks, and production build. Record evidence in `automatedChecks`.
3. Step through all 19 canonical states at every required viewport. Capture screenshots or structured measurements using this naming convention:

   ```text
   <candidate>/<viewport-id>/<state-order>-<beat>.<ext>
   ```

4. Record protected-region geometry for callout, dashboard, controls, and caption. Any positive overlap area is a hard failure.
5. Record one uninterrupted autoplay run at `presentation-laptop`. Measure total runtime, animation settle time, camera moves, frame rate, long tasks, layout shift, and runtime errors.
6. Repeat the story with reduced motion enabled and confirm that all 19 semantic states remain available without infinite animation.
7. Run at least nine immediate audience sessions, including at least four hospital, medtech, finance, or investment executives. Use one fresh copy of `human-audience-scorecard.template.json` per evaluator.
8. Score each rubric criterion only after evidence is attached. Compute domain percentages and the total weighted score.
9. Release only when every hard gate passes, each domain reaches 85 percent, every core craft domain reaches 92 percent, the total reaches 93/100, audience thresholds pass, and no critical or high finding remains.

## Canonical story rule

There is only one explicit `surface` state: the initial access pain point. Every subsequent pressure is introduced by the prior cycle's `reveal`, so the next state goes directly to that pressure's AI response. This prevents the same constraint from being presented twice.

Each intervention follows the same evidence rhythm:

```text
AI materializes → addressed pressure resolves → next pressure is revealed
```

During `materialize`, the simulation and metrics remain in the before state. Entering `resolve` commits the lever and shows before-to-after evidence while the camera remains on the addressed pressure. Only `reveal` moves the camera and updates the dashboard to the new pressure.

## Scoring rules

- Hard gates are binary and cannot be offset by rubric points.
- Criterion scores range from zero to their listed maximum. Do not award partial points without evidence.
- A domain percentage is `domain score / domain maximum × 100`.
- Weighted score is the sum of all criterion scores and has a maximum of 100.
- Unmeasured fields remain `null`; `null` never counts as a pass.
- A candidate with missing viewport, audience, performance, or accessibility evidence is held.

## Human-session protocol

- Show one uninterrupted run before asking questions.
- Ask unaided recall questions before reopening the demo.
- Do not explain the intended sequence until recall scoring is complete.
- Capture the first moment of confusion, not only the evaluator's final impression.
- Treat repeated confusion across 20 percent or more of evaluators as a design defect even when average ratings are high.
- Prioritize the primary audience: hospital CEOs and medtech founders. Secondary-audience enthusiasm cannot compensate for primary-audience confusion.
- Require a median rating of at least 4.6 out of 5; no individual rating below 4 counts as a passing session.

## Release interpretation

The bar is designed to reward decision clarity, causal integrity, restraint, and proof—not decorative sophistication. The release candidate should make one idea dominant at a time, let the audience see the operating mechanism, and land on an explicit investment decision without requiring speaker rescue.
