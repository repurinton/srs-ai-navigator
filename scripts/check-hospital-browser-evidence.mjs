import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDirectory = path.join(root, "evals/evidence/current");
const standard = JSON.parse(fs.readFileSync(path.join(root, "evals/hospital-release-standard.json"), "utf8"));
const contract = JSON.parse(fs.readFileSync(path.join(root, "evals/canonical-story-states.json"), "utf8"));
const sourceFiles = [
  "index.html",
  "src/main.tsx",
  "src/index.css",
  "src/components/HospitalTwin.tsx",
  "src/components/HospitalCutaway.tsx",
  "src/components/HospitalCutaway.css",
  "src/lib/hospital-sim.ts",
  "src/lib/hospital-story.ts",
  "src/lib/hospital-storyboard.ts",
  "src/lib/metric-language.ts",
  "src/lib/hospital-world.ts",
  "src/lib/renderer-mode.ts",
  "src/lib/anchor-projection.ts",
  "src/components/CutawayScene2D.tsx",
  "src/components/hospital-3d/CutawayScene3D.tsx",
  "src/lib/performance-probe.ts",
  "scripts/browser-hospital-evaluator.mjs",
];

const sourceDigest = crypto.createHash("sha256");
for (const relativePath of sourceFiles) {
  sourceDigest.update(relativePath);
  sourceDigest.update(fs.readFileSync(path.join(root, relativePath)));
}
const candidateSourceDigest = sourceDigest.digest("hex");
const expectedStateIds = contract.states.map((state) => state.id);
const summaries = [];
let reviewedStates = 0;

function readEvidence(id) {
  const evidencePath = path.join(evidenceDirectory, `${id}.json`);
  assert.ok(fs.existsSync(evidencePath), `${id} browser evidence is required`);
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

function parsePercent(value) {
  return Number.parseFloat(String(value).replace("%", ""));
}

for (const viewport of standard.viewportMatrix) {
  const evidence = readEvidence(viewport.id);
  assert.equal(evidence.width, viewport.width, `${viewport.id} width drifted`);
  assert.equal(evidence.height, viewport.height, `${viewport.id} height drifted`);
  assert.equal(evidence.minimumBodyTextPx, viewport.minimumBodyTextPx, `${viewport.id} typography floor drifted`);
  assert.equal(evidence.safeMarginPx, viewport.safeMarginPx, `${viewport.id} safe margin drifted`);
  assert.equal(evidence.states.length, contract.stateCount, `${viewport.id} must review all canonical states`);
  assert.deepEqual(evidence.states.map((state) => state.stateId), expectedStateIds, `${viewport.id} state order drifted`);

  let previousState;
  for (const [index, state] of evidence.states.entries()) {
    const contracted = contract.states[index];
    assert.equal(state.beat, contracted.beat, `${viewport.id}/${state.stateId} beat drifted`);
    assert.equal(state.pressure, contracted.focusPressure, `${viewport.id}/${state.stateId} pressure drifted`);
    assert.equal(state.evidenceAligned, "true", `${viewport.id}/${state.stateId} evidence channels diverged`);
    assert.equal(state.visibleCallouts, 1, `${viewport.id}/${state.stateId} must render one foreground proposition`);
    assert.equal(state.calloutTitle, state.captionTitle, `${viewport.id}/${state.stateId} callout and caption must agree`);
    assert.equal(state.horizontalOverflow, 0, `${viewport.id}/${state.stateId} has horizontal overflow`);
    assert.equal(state.protectedOverlapPx2, 0, `${viewport.id}/${state.stateId} overlaps a protected region`);
    assert.equal(state.sceneDashboardOverlapPx2, 0, `${viewport.id}/${state.stateId} scene overlaps dashboard`);
    assert.equal(state.dashboardCaptionOverlapPx2, 0, `${viewport.id}/${state.stateId} dashboard overlaps caption`);
    assert.equal(state.cardClipped, false, `${viewport.id}/${state.stateId} clips its callout`);
    assert.equal(state.clippedText, 0, `${viewport.id}/${state.stateId} clips primary text`);
    assert.ok(state.primaryFontMinPx >= viewport.minimumBodyTextPx, `${viewport.id}/${state.stateId} primary text is too small`);
    assert.ok(state.minControlHeightPx >= standard.thresholds.layout.minimumTouchTargetPx, `${viewport.id}/${state.stateId} has an undersized control`);
    assert.ok(state.infiniteForegroundAnimationsDefined <= standard.thresholds.motion.maximumConcurrentForegroundPulses, `${viewport.id}/${state.stateId} has competing foreground pulses`);
    if (evidence.stage) {
      assert.ok(state.captionBottom <= viewport.height - viewport.safeMarginPx, `${viewport.id}/${state.stateId} leaves the stage safe area`);
    }

    if (previousState) {
      const cameraDistance = Math.hypot(
        parsePercent(state.cameraPanX) - parsePercent(previousState.cameraPanX),
        parsePercent(state.cameraPanY) - parsePercent(previousState.cameraPanY),
      );
      if (state.beat === "reveal") assert.ok(cameraDistance > 0.1, `${viewport.id}/${state.stateId} must move focus once`);
      else assert.ok(cameraDistance <= 0.1, `${viewport.id}/${state.stateId} moves focus outside the reveal beat`);
    }
    previousState = state;
  }

  reviewedStates += evidence.states.length;
  summaries.push({
    id: viewport.id,
    statesReviewed: evidence.states.length,
    pass: true,
    minimumPrimaryFontPx: Math.min(...evidence.states.map((state) => state.primaryFontMinPx)),
    minimumControlHeightPx: Math.min(...evidence.states.map((state) => state.minControlHeightPx)),
    maximumCaptionBottomPx: Math.max(...evidence.states.map((state) => state.captionBottom)),
    maximumForegroundInfiniteAnimations: Math.max(...evidence.states.map((state) => state.infiniteForegroundAnimationsDefined)),
  });
}

const reducedMotion = readEvidence("reduced-motion");
assert.equal(reducedMotion.reducedMotion, true, "Reduced-motion evidence must use the deterministic accessibility mode");
assert.deepEqual(reducedMotion.states.map((state) => state.stateId), expectedStateIds, "Reduced-motion state order drifted");
for (const state of reducedMotion.states) {
  assert.equal(state.visibleCallouts, 1, `Reduced motion must preserve ${state.stateId}`);
  assert.equal(state.infiniteForegroundAnimationsDefined, 0, `Reduced motion cannot leave an infinite animation in ${state.stateId}`);
  assert.equal(state.cardClipped, false, `Reduced motion clips ${state.stateId}`);
  assert.equal(state.clippedText, 0, `Reduced motion clips primary text in ${state.stateId}`);
}

const aggregate = {
  schemaVersion: "1.0.0",
  candidateSourceDigest,
  generatedAt: new Date().toISOString(),
  canonicalStates: contract.stateCount,
  requiredViewports: standard.viewportMatrix.length,
  stateViewportObservations: reviewedStates,
  reducedMotionStatesReviewed: reducedMotion.states.length,
  verdict: "pass",
  summaries,
};
fs.writeFileSync(path.join(evidenceDirectory, "browser-qa.json"), `${JSON.stringify(aggregate, null, 2)}\n`);
console.log(`Hospital browser evidence passed: ${reviewedStates} state/viewport observations + ${reducedMotion.states.length} reduced-motion states.`);
