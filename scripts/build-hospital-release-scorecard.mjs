import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS,
  HOSPITAL_STORY_VISUAL_EXHALE_MS,
} from "../src/lib/hospital-story.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "evals/release-scorecard.current.json");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function optionalJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath) ? JSON.parse(fs.readFileSync(absolutePath, "utf8")) : null;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    command: [command, ...args].join(" "),
    pass: result.status === 0,
    exitCode: result.status,
  };
}

function currentCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unavailable";
}

function worktreeDirty() {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  return result.status !== 0 || result.stdout.trim().length > 0;
}

function candidateDigest() {
  const files = [
    "index.html",
    "src/main.tsx",
    "src/index.css",
    "src/components/HospitalTwin.tsx",
    "src/components/HospitalCutaway.tsx",
    "src/components/HospitalCutaway.css",
    "src/lib/hospital-sim.ts",
    "src/lib/hospital-story.ts",
    "src/lib/hospital-storyboard.ts",
    "src/lib/performance-probe.ts",
    "scripts/browser-hospital-evaluator.mjs",
  ];
  const digest = crypto.createHash("sha256");
  for (const relativePath of files) {
    digest.update(relativePath);
    digest.update(fs.readFileSync(path.join(root, relativePath)));
  }
  return digest.digest("hex");
}

function parsePercent(value) {
  return Number.parseFloat(String(value).replace("%", ""));
}

function countCameraTimingMismatches(evidence) {
  let mismatches = 0;
  for (const viewport of evidence) {
    let previous;
    for (const state of viewport.states) {
      if (previous) {
        const distance = Math.hypot(
          parsePercent(state.cameraPanX) - parsePercent(previous.cameraPanX),
          parsePercent(state.cameraPanY) - parsePercent(previous.cameraPanY),
        );
        if ((state.beat === "reveal" && distance <= 0.1) || (state.beat !== "reveal" && distance > 0.1)) {
          mismatches += 1;
        }
      }
      previous = state;
    }
  }
  return mismatches;
}

function countMetricTimingMismatches(states) {
  const expected = {
    surface: "hold",
    materialize: "hold",
    resolve: "compare",
    reveal: "update",
  };
  return states.filter((state) => state.metricAction !== expected[state.beat]).length;
}

function countInvalidVisualStates(states) {
  return states.filter((state) => {
    const isMaterialize = state.beat === "materialize";
    const hasMaterializingLever = typeof state.materializingLever === "string";
    return (
      hasMaterializingLever !== isMaterialize
      || (state.visualState === "solution") !== isMaterialize
      || (isMaterialize && state.materializingLever !== state.lever)
    );
  }).length;
}

function statusResult(id, status, measuredValue, evidence, notes) {
  const result = {
    id,
    status,
    pass: status === "passed",
    measuredValue,
    evidence,
    notes,
  };
  if (typeof result.pass !== "boolean") throw new Error(`${id} must resolve to a boolean pass value`);
  return result;
}

function optionalEvidenceStatus(relativePath, validator) {
  const value = optionalJson(relativePath);
  if (!value) return { status: "pending", value: null, path: relativePath };
  return { status: validator(value) ? "passed" : "failed", value, path: relativePath };
}

const standard = readJson("evals/hospital-release-standard.json");
const template = readJson("evals/release-scorecard.template.json");
const story = readJson("evals/canonical-story-states.json");
const browserQa = readJson("evals/evidence/current/browser-qa.json");
const reducedMotion = readJson("evals/evidence/current/reduced-motion.json");
const viewportEvidence = standard.viewportMatrix.map((viewport) =>
  readJson(`evals/evidence/current/${viewport.id}.json`),
);

const checks = {
  evalHarnessSelfCheck: run(process.execPath, ["scripts/check-hospital-evals.mjs"]),
  typecheck: run("npm", ["run", "typecheck"]),
  simulationCheck: run(process.execPath, ["scripts/check-hospital-sim.ts"]),
  storyStateCheck: run(process.execPath, ["scripts/check-hospital-story.ts"]),
  motionCheck: run(process.execPath, ["scripts/check-hospital-motion.mjs"]),
  productionBuild: run("npm", ["run", "build"]),
};

const sourceDigest = candidateDigest();
const browserEvidenceFresh = browserQa.candidateSourceDigest === sourceDigest;
const allBrowserObservations = viewportEvidence.flatMap((viewport) => viewport.states);
const expectedObservations = story.stateCount * standard.viewportMatrix.length;
const browserEvidenceComplete =
  browserEvidenceFresh
  && browserQa.verdict === "pass"
  && browserQa.stateViewportObservations === expectedObservations
  && allBrowserObservations.length === expectedObservations;

const maximumForegroundCallouts = Math.max(...allBrowserObservations.map((state) => state.visibleCallouts));
const alignedStates = allBrowserObservations.filter((state) => state.evidenceAligned === "true").length;
const alignedPercent = Number(((alignedStates / expectedObservations) * 100).toFixed(2));
const metricTimingMismatches = countMetricTimingMismatches(story.states);
const cameraTimingMismatches = countCameraTimingMismatches(viewportEvidence);
const invalidVisualStateCount = countInvalidVisualStates(story.states);
const maximumProtectedOverlap = Math.max(
  ...allBrowserObservations.map((state) => Math.max(
    state.protectedOverlapPx2,
    state.sceneDashboardOverlapPx2,
    state.dashboardCaptionOverlapPx2,
  )),
);
const overflowOrClippingCount = allBrowserObservations.filter(
  (state) => state.horizontalOverflow > 0 || state.clippedText > 0 || state.cardClipped,
).length;
const minimumControlHeight = Math.min(...allBrowserObservations.map((state) => state.minControlHeightPx));
const reducedMotionPass =
  reducedMotion.reducedMotion === true
  && reducedMotion.states.length === story.stateCount
  && reducedMotion.states.every((state) =>
    state.visibleCallouts === 1
    && state.infiniteForegroundAnimationsDefined === 0
    && state.clippedText === 0
    && state.cardClipped === false,
  );

// Optional evidence files let the same generator graduate pending gates without
// weakening the current release decision. Each must explicitly report a pass.
const autoplay = optionalEvidenceStatus(
  "evals/evidence/current/autoplay-runtime.json",
  (value) => value.pass === true && value.runtimeMs >= 120_000 && value.runtimeMs <= 130_000 && value.minimumSettledMs >= 800,
);
const performance = optionalEvidenceStatus(
  "evals/evidence/current/performance-qa.json",
  (value) => value.pass === true && value.baseline?.pass === true && value.cpu4x?.pass === true,
);
const performanceProbePath = "evals/evidence/current/performance-probe.json";
const performanceProbe = optionalJson(performanceProbePath);
const performanceProbeIsCalibrated = performanceProbe
  && performanceProbe.measurementStatus === "calibrated-inconclusive"
  && performanceProbe.releaseGatePass === false
  && performanceProbe.animatedRun?.estimatedFpsP50 === performanceProbe.reducedMotionCalibration?.estimatedFpsP50
  && performanceProbe.baselineThresholdDecision === "pending-native-60hz-run"
  && performanceProbe.cpu4xThresholdDecision === "not-run";
const accessibility = optionalEvidenceStatus(
  "evals/evidence/current/accessibility-qa.json",
  (value) => value.pass === true,
);
const controls = optionalEvidenceStatus(
  "evals/evidence/current/control-qa.json",
  (value) => value.pass === true && value.sequenceMismatches === 0,
);
const productionRuntime = optionalEvidenceStatus(
  "evals/evidence/current/production-runtime.json",
  (value) => value.pass === true && value.consoleErrors === 0 && value.failedAssetRequests === 0,
);
const human = optionalEvidenceStatus(
  "evals/evidence/current/human-audience-summary.json",
  (value) => value.pass === true
    && value.sessionsCompleted >= standard.releasePolicy.requiredHumanSessions
    && value.executiveSessionsCompleted >= standard.releasePolicy.requiredExecutiveSessions
    && value.medianRating >= standard.releasePolicy.requiredAudienceMedian,
);

const gateEvidence = {
  contract: ["evals/canonical-story-states.json", "scripts/check-hospital-story.ts"],
  simulation: ["scripts/check-hospital-sim.ts", "src/lib/hospital-sim.ts", "src/lib/hospital-storyboard.ts"],
  browser: ["evals/evidence/current/browser-qa.json", "scripts/check-hospital-browser-evidence.mjs"],
  reduced: ["evals/evidence/current/reduced-motion.json", "scripts/browser-hospital-evaluator.mjs"],
};

const hardGateById = new Map([
  ["HG-NAR-01", statusResult("HG-NAR-01", checks.storyStateCheck.pass && story.states.length === 19 ? "passed" : "failed", story.states.length, gateEvidence.contract, "Exactly 19 canonical states in authored order.")],
  ["HG-NAR-02", statusResult("HG-NAR-02", browserEvidenceComplete && maximumForegroundCallouts === 1 ? "passed" : "failed", maximumForegroundCallouts, gateEvidence.browser, `${expectedObservations} state/viewport observations reviewed.`)],
  ["HG-NAR-03", statusResult("HG-NAR-03", story.surfaceStateCount === 1 ? "passed" : "failed", story.surfaceStateCount, gateEvidence.contract, "Only the opening pressure uses an explicit surface beat.")],
  ["HG-NAR-04", statusResult("HG-NAR-04", browserEvidenceComplete && alignedPercent === 100 ? "passed" : "failed", `${alignedPercent}%`, gateEvidence.browser, "Callout, caption, dashboard focus, and camera focus align.")],
  ["HG-NAR-05", statusResult("HG-NAR-05", checks.simulationCheck.pass ? "passed" : "failed", checks.simulationCheck.pass ? "100%" : "check failed", gateEvidence.simulation, "Simulation check verifies every system-constraint label against the model-selected constraint.")],
  ["HG-NAR-06", statusResult("HG-NAR-06", checks.simulationCheck.pass && metricTimingMismatches === 0 ? "passed" : "failed", metricTimingMismatches, [...gateEvidence.contract, ...gateEvidence.simulation], "Metrics hold through materialize and commit once on resolve.")],
  ["HG-NAR-07", statusResult("HG-NAR-07", browserEvidenceComplete && cameraTimingMismatches === 0 ? "passed" : "failed", cameraTimingMismatches, gateEvidence.browser, "Camera movement occurs only on reveal across all required viewports.")],
  ["HG-NAR-08", statusResult("HG-NAR-08", invalidVisualStateCount === 0 ? "passed" : "failed", invalidVisualStateCount, gateEvidence.contract, "Materializing, resolved, and pressure states are mutually exclusive.")],
  ["HG-LAY-01", statusResult("HG-LAY-01", browserEvidenceComplete && maximumProtectedOverlap === 0 ? "passed" : "failed", `${maximumProtectedOverlap}px2`, gateEvidence.browser, "Protected-region overlap is zero in every observation.")],
  ["HG-LAY-02", statusResult("HG-LAY-02", browserEvidenceComplete && overflowOrClippingCount === 0 ? "passed" : "failed", overflowOrClippingCount, gateEvidence.browser, "No horizontal overflow, clipped cards, or clipped primary text.")],
  ["HG-MOT-01", statusResult("HG-MOT-01", autoplay.status, autoplay.value ? `${autoplay.value.runtimeMs}ms; settle ${autoplay.value.minimumSettledMs}ms` : `configured ${HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS}ms; exhale ${HOSPITAL_STORY_VISUAL_EXHALE_MS}ms`, [autoplay.path, "src/lib/hospital-story.ts", "scripts/check-hospital-story.ts"], autoplay.value ? "Measured uninterrupted autoplay evidence evaluated." : "Static pacing contract passes, but the required uninterrupted autoplay recording has not been executed.")],
  ["HG-MOT-02", statusResult("HG-MOT-02", reducedMotionPass ? "passed" : "failed", `${reducedMotion.states.length}/${story.stateCount} states; 0 infinite animations`, gateEvidence.reduced, "Reduced-motion semantics and state coverage are complete.")],
  ["HG-PERF-01", statusResult(
    "HG-PERF-01",
    performance.status,
    performance.value
      ? performance.value.summary ?? "performance evidence evaluated"
      : performanceProbeIsCalibrated
        ? {
            measurementStatus: performanceProbe.measurementStatus,
            animatedHarnessFpsP50: performanceProbe.animatedRun.estimatedFpsP50,
            reducedMotionHarnessFpsP50: performanceProbe.reducedMotionCalibration.estimatedFpsP50,
            longTasks: performanceProbe.animatedRun.longTaskCount,
            cumulativeLayoutShift: performanceProbe.animatedRun.cumulativeLayoutShift,
            largestContentfulPaintMs: performanceProbe.animatedRun.largestContentfulPaintMs,
            runtimeErrors: performanceProbe.animatedRun.runtimeErrorCount,
            baselineThresholdDecision: performanceProbe.baselineThresholdDecision,
            cpu4xThresholdDecision: performanceProbe.cpu4xThresholdDecision,
          }
        : "pending baseline + 4x CPU run",
    [performance.path, ...(performanceProbe ? [performanceProbePath] : []), "evals/hospital-release-standard.json"],
    performance.value
      ? "Production performance evidence evaluated against the release thresholds."
      : performanceProbeIsCalibrated
        ? "Partial production evidence is clean for long tasks, layout shift, LCP, and runtime errors. Animated and reduced-motion controls share the harness's 30 Hz ceiling, so FPS is inconclusive; native 60 Hz baseline and 4x CPU runs remain required."
        : "No calibrated production probe or 4x CPU resilience run exists; performance cannot pass by inference.",
  )],
  ["HG-A11Y-01", statusResult("HG-A11Y-01", accessibility.value?.operablePass === true && minimumControlHeight >= 44 ? "passed" : accessibility.value ? "failed" : "pending", accessibility.value ? `touch ${minimumControlHeight}px; keyboard ${accessibility.value.keyboardReachabilityPercent}%` : `touch ${minimumControlHeight}px; keyboard audit pending`, [accessibility.path, "evals/evidence/current/browser-qa.json"], accessibility.value ? "Keyboard, focus, accessible-name, and target evidence evaluated." : "Touch targets pass; keyboard reachability, focus, and accessible-name audits remain unexecuted.")],
  ["HG-A11Y-02", statusResult("HG-A11Y-02", accessibility.value?.perceivablePass === true ? "passed" : accessibility.value ? "failed" : "pending", accessibility.value ? `normal ${accessibility.value.minimumNormalTextContrast}:1; large ${accessibility.value.minimumLargeTextContrast}:1` : "contrast and color-independence audit pending", [accessibility.path, "evals/hospital-release-standard.json"], accessibility.value ? "Contrast and color-independent meaning evidence evaluated." : "WCAG contrast and color-independent meaning have not been measured.")],
  ["HG-REL-01", statusResult("HG-REL-01", controls.status, controls.value ? controls.value.sequenceMismatches : "runtime control audit pending", [controls.path, "scripts/check-hospital-story.ts"], controls.value ? "Autoplay and manual control sequences evaluated." : "State-transition logic passes statically; pause, resume, replay, and reset still require browser execution.")],
  ["HG-REL-02", statusResult("HG-REL-02", productionRuntime.status, productionRuntime.value ? `${productionRuntime.value.consoleErrors} console errors; ${productionRuntime.value.failedAssetRequests} failed assets` : "production runtime audit pending", [productionRuntime.path, "dist/"], productionRuntime.value ? "Production runtime diagnostics evaluated." : "The production build passes, but console and network evidence have not been captured.")],
]);

const hardGateResults = standard.hardGates.map((gate) => {
  const result = hardGateById.get(gate.id);
  if (!result) throw new Error(`No current scorecard mapping exists for ${gate.id}`);
  return result;
});
if (hardGateResults.some((result) => result.pass === null || typeof result.pass !== "boolean")) {
  throw new Error("Current scorecard cannot contain a null or non-boolean hard-gate pass value");
}

const automatedCheckResults = Object.entries(checks).map(([id, value]) => ({
  id,
  status: value.pass ? "passed" : "failed",
  pass: value.pass,
  command: value.command,
  exitCode: value.exitCode,
}));
const automatedChecksPass = automatedCheckResults.every((check) => check.pass);
const allHardGatesPass = hardGateResults.every((result) => result.pass);
const pendingGateIds = hardGateResults.filter((result) => result.status === "pending").map((result) => result.id);
const failedGateIds = hardGateResults.filter((result) => result.status === "failed").map((result) => result.id);

const viewportResults = standard.viewportMatrix.map((viewport, index) => {
  const evidence = viewportEvidence[index];
  const pass = browserEvidenceComplete && browserQa.summaries.find((summary) => summary.id === viewport.id)?.pass === true;
  return {
    id: viewport.id,
    statesReviewed: evidence.states.length,
    statesRequired: story.stateCount,
    pass,
    evidence: [`evals/evidence/current/${viewport.id}.json`],
    notes: pass ? "All canonical states satisfy composition, type, target, and safe-area thresholds." : "Evidence missing, stale, or below threshold.",
  };
});

const findings = {
  critical: [],
  high: [
    "Complete the production performance run at baseline and 4x CPU slowdown.",
    "Complete keyboard, focus, accessible-name, WCAG contrast, and color-independence audits.",
    "Complete the uninterrupted autoplay, runtime-control, console, and failed-asset checks.",
    `Complete at least ${standard.releasePolicy.requiredHumanSessions} audience sessions, including ${standard.releasePolicy.requiredExecutiveSessions} executive sessions.`,
  ],
  medium: [],
  low: [],
};

const current = {
  ...template,
  candidate: {
    candidateId: `source-${sourceDigest.slice(0, 12)}`,
    commit: currentCommit(),
    buildUrl: null,
    evaluatedAt: browserQa.generatedAt,
    releaseOwner: null,
    technicalEvaluator: "deterministic-release-scorecard",
    designEvaluator: null,
    narrativeEvaluator: null,
    sourceDigest,
    browserEvidenceFresh,
    worktreeDirty: worktreeDirty(),
  },
  automatedChecks: {
    evalHarnessSelfCheck: checks.evalHarnessSelfCheck.pass,
    typecheck: checks.typecheck.pass,
    simulationCheck: checks.simulationCheck.pass,
    storyStateCheck: checks.storyStateCheck.pass,
    productionBuild: checks.productionBuild.pass,
    consoleErrors: productionRuntime.value ? productionRuntime.value.consoleErrors : "pending",
    failedAssetRequests: productionRuntime.value ? productionRuntime.value.failedAssetRequests : "pending",
    notes: automatedChecksPass
      ? "Repository checks and production build pass. Runtime diagnostics are reported separately and remain pending until captured."
      : "At least one repository check or the production build failed; see automatedCheckResults.",
  },
  automatedCheckResults,
  hardGateResults,
  viewportResults,
  humanAudienceSummary: human.value ?? {
    sessionsCompleted: 0,
    executiveSessionsCompleted: 0,
    medianRating: null,
    mainThesisRecallPercent: null,
    finalConstraintRecallPercent: null,
    actionableNextDecisionPercent: null,
    repeatedConfusionPoints: [],
    status: "pending",
    pass: false,
    evidence: [human.path, "evals/human-audience-scorecard.template.json"],
  },
  findings,
  releaseDecision: {
    ...template.releaseDecision,
    weightedScore: null,
    allHardGatesPass,
    allDomainsPass: false,
    humanAudiencePass: human.status === "passed",
    decision: "hold",
    decisionRationale: [
      `${hardGateResults.filter((result) => result.pass).length}/${hardGateResults.length} hard gates pass.`,
      pendingGateIds.length ? `Pending gates: ${pendingGateIds.join(", ")}.` : null,
      failedGateIds.length ? `Failed gates: ${failedGateIds.join(", ")}.` : null,
      "Qualitative rubric scoring and required audience sessions are incomplete; an automated score cannot substitute for executive comprehension evidence.",
    ].filter(Boolean).join(" "),
    approvedBy: null,
    approvedAt: null,
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(current, null, 2)}\n`);
console.log(`Hospital release scorecard generated: ${path.relative(root, outputPath)}`);
console.log(`Automated checks: ${automatedCheckResults.filter((check) => check.pass).length}/${automatedCheckResults.length} passed`);
console.log(`Hard gates: ${hardGateResults.filter((gate) => gate.pass).length}/${hardGateResults.length} passed; ${pendingGateIds.length} pending; ${failedGateIds.length} failed`);
console.log("Release decision: HOLD");
