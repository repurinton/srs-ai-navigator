import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS,
  HOSPITAL_STORY_STATES,
  HOSPITAL_STORY_VISUAL_EXHALE_MS,
  currentHospitalStoryCycle,
  currentHospitalStoryPressure,
  materializingHospitalStoryLever,
} from "../src/lib/hospital-story.ts";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

const files = {
  standard: "evals/hospital-release-standard.json",
  story: "evals/canonical-story-states.json",
  human: "evals/human-audience-scorecard.template.json",
  release: "evals/release-scorecard.template.json",
  readme: "evals/README.md",
};

const errors = [];
let assertionCount = 0;

function check(condition, message) {
  assertionCount += 1;
  if (!condition) errors.push(message);
}

function loadJson(relativePath) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  check(fs.existsSync(absolutePath), `${relativePath} must exist`);
  if (!fs.existsSync(absolutePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath} must contain valid JSON: ${error.message}`);
    return {};
  }
}

function unique(values, label) {
  const present = values.filter((value) => typeof value === "string" && value.length > 0);
  check(present.length === values.length, `${label} must contain non-empty strings`);
  check(new Set(present).size === present.length, `${label} must be unique`);
  return new Set(present);
}

function sameSet(actualValues, expectedValues, label) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  check(actual.size === actualValues.length, `${label} must not contain duplicates`);
  check(actual.size === expected.size, `${label} must have exactly ${expected.size} entries`);
  for (const value of expected) check(actual.has(value), `${label} is missing ${value}`);
  for (const value of actual) check(expected.has(value), `${label} contains unexpected ${value}`);
}

function sameArray(actual, expected, label) {
  check(Array.isArray(actual), `${label} must be an array`);
  if (!Array.isArray(actual)) return;
  check(actual.length === expected.length, `${label} must have ${expected.length} entries`);
  for (let index = 0; index < expected.length; index += 1) {
    check(actual[index] === expected[index], `${label}[${index}] must be ${expected[index]}`);
  }
}

const standard = loadJson(files.standard);
const story = loadJson(files.story);
const human = loadJson(files.human);
const release = loadJson(files.release);

const readmePath = path.join(repositoryRoot, files.readme);
check(fs.existsSync(readmePath), `${files.readme} must exist`);
const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
const cutawayCss = fs.readFileSync(path.join(repositoryRoot, "src/components/HospitalCutaway.css"), "utf8");
check(readme.includes("node scripts/check-hospital-evals.mjs"), "README must document the self-check command");
check(readme.includes("19 canonical states"), "README must document the 19-state contract");
check(readme.includes("Hard gates are binary"), "README must explain hard-gate scoring");

check(standard.schemaVersion === "1.0.0", "release standard schemaVersion must be 1.0.0");
check(standard.standardId === "srs-hospital-twin-release-standard", "release standardId is invalid");
check(standard.releasePolicy?.minimumWeightedScore === 93, "minimum weighted release score must be 93");
check(standard.releasePolicy?.minimumDomainPercent === 85, "minimum domain score must be 85 percent");
check(standard.releasePolicy?.minimumCoreDomainPercent === 92, "core craft domains must score at least 92 percent");
check(standard.releasePolicy?.requireAllHardGates === true, "all hard gates must be required");
check(standard.releasePolicy?.maximumCriticalFindings === 0, "critical finding allowance must be zero");
check(standard.releasePolicy?.maximumHighFindings === 0, "high finding allowance must be zero");
check(standard.releasePolicy?.requiredHumanSessions >= 9, "at least nine human sessions must be required");
check(standard.releasePolicy?.requiredExecutiveSessions >= 4, "at least four executive sessions must be required");
check(standard.releasePolicy?.requiredAudienceMedian >= 4.6, "audience median threshold must be at least 4.6");

const requiredThresholdGroups = ["layout", "motion", "performance", "accessibility"];
for (const group of requiredThresholdGroups) {
  check(standard.thresholds?.[group] && typeof standard.thresholds[group] === "object", `thresholds.${group} must exist`);
}
check(standard.thresholds?.layout?.maximumProtectedRegionOverlapPx2 === 0, "protected overlap threshold must be zero");
check(standard.thresholds?.layout?.maximumHorizontalOverflowPx === 0, "horizontal overflow threshold must be zero");
check(standard.thresholds?.layout?.maximumClippedTextElements === 0, "clipped text threshold must be zero");
check(standard.thresholds?.layout?.minimumTouchTargetPx >= 44, "touch target threshold must be at least 44 pixels");
check(standard.thresholds?.layout?.maximumForegroundCallouts === 1, "foreground callout threshold must be one");
check(standard.thresholds?.motion?.minimumAutoplayRuntimeSeconds === 235, "minimum autoplay runtime must be 235 seconds");
check(standard.thresholds?.motion?.maximumAutoplayRuntimeSeconds === 245, "maximum autoplay runtime must be 245 seconds");
check(standard.thresholds?.motion?.minimumSettledTimeBeforeAdvanceMs >= 800, "settled time must be at least 800ms");
check(standard.thresholds?.motion?.cameraMovesPerCycle === 1, "camera must move once per cycle");
check(standard.thresholds?.motion?.maximumConcurrentForegroundPulses === 1, "only one foreground pulse may run");
check(standard.thresholds?.motion?.maximumReducedMotionInfiniteAnimations === 0, "reduced motion must allow no infinite animation");
check(standard.thresholds?.performance?.minimumAnimationFpsP95 >= 55, "p95 animation target must be at least 55fps");
check(standard.thresholds?.performance?.maximumConsoleErrors === 0, "console error threshold must be zero");
check(standard.thresholds?.performance?.maximumFailedAssetRequests === 0, "failed asset threshold must be zero");
check(standard.thresholds?.accessibility?.minimumNormalTextContrast >= 4.5, "normal text contrast must meet WCAG AA");
check(standard.thresholds?.accessibility?.minimumKeyboardReachabilityPercent === 100, "keyboard reachability must be 100 percent");
check(standard.thresholds?.accessibility?.autoplayMustBeUserInitiated === true, "autoplay must be user initiated");
check(standard.thresholds?.accessibility?.autoplayMustBePausable === true, "autoplay must be pausable");
check(
  HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS >= standard.thresholds.motion.minimumAutoplayRuntimeSeconds * 1_000
    && HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS <= standard.thresholds.motion.maximumAutoplayRuntimeSeconds * 1_000,
  "implemented autoplay runtime must satisfy the release standard",
);
check(
  HOSPITAL_STORY_VISUAL_EXHALE_MS >= standard.thresholds.motion.minimumSettledTimeBeforeAdvanceMs,
  "implemented visual exhale must satisfy the settled-time release threshold",
);
check(
  !/\.cutaway-callout-card\[data-state="solution"\][^{]*\{[^}]*infinite/u.test(cutawayCss),
  "materialization callouts must use a finite enter animation",
);
check(
  cutawayCss.includes('.hospital-cutaway[data-focus-kind="solution"] .cutaway-constraint-zone'),
  "materialization must silence the competing constraint pulse",
);
check(
  cutawayCss.includes("transform: translate3d(var(--camera-pan-x), var(--camera-pan-y), 0) scale(1.03)"),
  "desktop focus migration must be implemented as a restrained camera move",
);

const viewports = Array.isArray(standard.viewportMatrix) ? standard.viewportMatrix : [];
check(viewports.length >= 6, "release standard must define at least six viewports");
const viewportIds = unique(viewports.map((viewport) => viewport.id), "viewport ids");
for (const viewport of viewports) {
  check(Number.isInteger(viewport.width) && viewport.width >= 320, `${viewport.id} width must be at least 320`);
  check(Number.isInteger(viewport.height) && viewport.height >= 568, `${viewport.id} height must be at least 568`);
  check(Number.isFinite(viewport.deviceScaleFactor) && viewport.deviceScaleFactor >= 1, `${viewport.id} deviceScaleFactor must be at least 1`);
  check(viewport.required === true, `${viewport.id} must be required`);
  check(Number.isFinite(viewport.safeMarginPx) && viewport.safeMarginPx >= 10, `${viewport.id} safe margin must be at least 10px`);
  check(Number.isFinite(viewport.minimumBodyTextPx) && viewport.minimumBodyTextPx >= 13, `${viewport.id} body text floor must be at least 13px`);
  check(["in-scene", "responsive", "below-scene"].includes(viewport.calloutPolicy), `${viewport.id} callout policy is invalid`);
}
for (const requiredViewport of ["stage-1080p", "presentation-laptop", "projector-safe", "tablet-landscape", "phone-standard", "phone-narrow"]) {
  check(viewportIds.has(requiredViewport), `viewport matrix is missing ${requiredViewport}`);
}

const hardGates = Array.isArray(standard.hardGates) ? standard.hardGates : [];
check(hardGates.length >= 15, "release standard must include at least 15 hard gates");
const hardGateIds = unique(hardGates.map((gate) => gate.id), "hard gate ids");
for (const gate of hardGates) {
  check(typeof gate.category === "string" && gate.category.length > 0, `${gate.id} category is required`);
  check(typeof gate.name === "string" && gate.name.length > 0, `${gate.id} name is required`);
  check(typeof gate.requirement === "string" && gate.requirement.length > 20, `${gate.id} requirement must be substantive`);
  check(typeof gate.measure === "string" && gate.measure.length > 0, `${gate.id} measure is required`);
  check(gate.pass !== undefined && gate.pass !== null, `${gate.id} pass condition is required`);
}

const domains = Array.isArray(standard.rubric?.domains) ? standard.rubric.domains : [];
check(standard.rubric?.maximumPoints === 100, "rubric maximum must be 100 points");
const domainIds = unique(domains.map((domain) => domain.id), "rubric domain ids");
for (const coreDomainId of standard.releasePolicy?.coreDomainIds ?? []) {
  check(domainIds.has(coreDomainId), `core craft domain ${coreDomainId} must exist in the rubric`);
}
const domainPoints = domains.reduce((sum, domain) => sum + (domain.points ?? 0), 0);
check(domainPoints === 100, `rubric domains must total 100 points, found ${domainPoints}`);

const criteria = [];
for (const domain of domains) {
  check(Number.isFinite(domain.points) && domain.points > 0, `${domain.id} must allocate positive points`);
  check(Array.isArray(domain.criteria) && domain.criteria.length >= 3, `${domain.id} must contain at least three criteria`);
  const criterionPoints = (domain.criteria ?? []).reduce((sum, criterion) => sum + (criterion.points ?? 0), 0);
  check(criterionPoints === domain.points, `${domain.id} criteria must total ${domain.points}, found ${criterionPoints}`);
  criteria.push(...(domain.criteria ?? []));
}
const criterionIds = unique(criteria.map((criterion) => criterion.id), "rubric criterion ids");
for (const criterion of criteria) {
  check(Number.isFinite(criterion.points) && criterion.points > 0, `${criterion.id} must allocate positive points`);
  check(typeof criterion.name === "string" && criterion.name.length > 10, `${criterion.id} name must be substantive`);
}

check(story.schemaVersion === "1.0.0", "story schemaVersion must be 1.0.0");
check(story.contractId === "srs-hospital-twin-canonical-19-state-story", "story contractId is invalid");
check(story.stateCount === 19, "story stateCount must be 19");
check(story.cycleCount === 6, "story cycleCount must be 6");
check(story.surfaceStateCount === 1, "story surfaceStateCount must be 1");
check(Array.isArray(story.states) && story.states.length === 19, "story must contain exactly 19 states");
check(Array.isArray(story.cycleLedger) && story.cycleLedger.length === 6, "cycle ledger must contain six cycles");
check(Array.isArray(story.leverSequence) && story.leverSequence.length === 6, "lever sequence must contain six levers");
check(Array.isArray(story.pressureSequence) && story.pressureSequence.length === 7, "pressure sequence must contain seven pressures");
unique(story.leverSequence ?? [], "story lever sequence");
unique(story.pressureSequence ?? [], "story pressure sequence");
check(typeof story.finalDecision === "string" && story.finalDecision.includes("recovery capacity"), "final decision must name recovery capacity");

const ledgers = story.cycleLedger ?? [];
for (let index = 0; index < ledgers.length; index += 1) {
  const ledger = ledgers[index];
  check(ledger.cycle === index + 1, `cycle ledger ${index + 1} has incorrect cycle number`);
  check(ledger.lever === story.leverSequence[index], `cycle ${index + 1} lever must be ${story.leverSequence[index]}`);
  check(ledger.addressedPressure === story.pressureSequence[index], `cycle ${index + 1} addressed pressure is invalid`);
  check(ledger.revealedPressure === story.pressureSequence[index + 1], `cycle ${index + 1} revealed pressure is invalid`);
  check(["pain", "constraint", "friction"].includes(ledger.addressedKind), `cycle ${index + 1} addressed kind is invalid`);
  check(["pain", "constraint", "friction"].includes(ledger.revealedKind), `cycle ${index + 1} revealed kind is invalid`);
  check(typeof ledger.addressedStage === "string", `cycle ${index + 1} addressed stage is required`);
  check(typeof ledger.revealedStage === "string", `cycle ${index + 1} revealed stage is required`);
}

const states = story.states ?? [];
unique(states.map((state) => state.id), "canonical state ids");
check(states.filter((state) => state.beat === "surface").length === 1, "canonical story must contain one surface state");
check(states.filter((state) => state.beat === "materialize").length === 6, "canonical story must contain six materialize states");
check(states.filter((state) => state.beat === "resolve").length === 6, "canonical story must contain six resolve states");
check(states.filter((state) => state.beat === "reveal").length === 6, "canonical story must contain six reveal states");

const expectedPattern = [{ cycle: 1, beat: "surface" }];
for (let cycle = 1; cycle <= 6; cycle += 1) {
  expectedPattern.push(
    { cycle, beat: "materialize" },
    { cycle, beat: "resolve" },
    { cycle, beat: "reveal" },
  );
}

for (let index = 0; index < states.length; index += 1) {
  const state = states[index];
  const expected = expectedPattern[index];
  const ledger = ledgers[(state.cycle ?? 1) - 1];
  const expectedCommittedCount = state.beat === "surface" || state.beat === "materialize" ? state.cycle - 1 : state.cycle;
  const expectedFocus = state.beat === "reveal" ? ledger?.revealedPressure : ledger?.addressedPressure;
  const expectedKind = state.beat === "reveal" ? ledger?.revealedKind : ledger?.addressedKind;
  const expectedStage = state.beat === "reveal" ? ledger?.revealedStage : ledger?.addressedStage;
  const expectedSimulationPhase = state.beat === "surface" || state.beat === "materialize" ? "before" : "after";
  const expectedMetricAction = state.beat === "resolve" ? "compare" : state.beat === "reveal" ? "update" : "hold";
  const expectedCameraAction = state.beat === "reveal" ? "move" : "hold";
  const expectedVisualState = state.beat === "materialize"
    ? "solution"
    : state.beat === "resolve"
      ? "resolved"
      : expectedKind === "constraint"
        ? "constraint"
        : "pressure";

  check(state.order === index + 1, `state ${index + 1} order must be ${index + 1}`);
  check(state.cycle === expected?.cycle, `state ${index + 1} cycle must be ${expected?.cycle}`);
  check(state.beat === expected?.beat, `state ${index + 1} beat must be ${expected?.beat}`);
  check(state.lever === ledger?.lever, `state ${index + 1} lever must be ${ledger?.lever}`);
  check(Array.isArray(state.committedLevers), `state ${index + 1} committedLevers must be an array`);
  check(state.committedLevers?.length === expectedCommittedCount, `state ${index + 1} must have ${expectedCommittedCount} committed levers`);
  sameArray(state.committedLevers ?? [], (story.leverSequence ?? []).slice(0, expectedCommittedCount), `state ${index + 1} committedLevers`);
  check(state.materializingLever === (state.beat === "materialize" ? ledger?.lever : null), `state ${index + 1} materializing lever is invalid`);
  check(state.focusPressure === expectedFocus, `state ${index + 1} focus pressure must be ${expectedFocus}`);
  check(state.focusKind === expectedKind, `state ${index + 1} focus kind must be ${expectedKind}`);
  check(state.focusStage === expectedStage, `state ${index + 1} focus stage must be ${expectedStage}`);
  check(state.visualState === expectedVisualState, `state ${index + 1} visual state must be ${expectedVisualState}`);
  check(state.simulationPhase === expectedSimulationPhase, `state ${index + 1} simulation phase must be ${expectedSimulationPhase}`);
  check(state.metricAction === expectedMetricAction, `state ${index + 1} metric action must be ${expectedMetricAction}`);
  check(state.cameraAction === expectedCameraAction, `state ${index + 1} camera action must be ${expectedCameraAction}`);
  check(state.expectedForegroundCallouts === 1, `state ${index + 1} must contain one foreground callout`);
  check(state.expectedForegroundCallouts <= standard.thresholds?.layout?.maximumForegroundCallouts, `state ${index + 1} exceeds foreground callout threshold`);
  check(state.alignment && typeof state.alignment === "object", `state ${index + 1} alignment object is required`);
  for (const channel of ["callout", "caption", "dashboard", "camera"]) {
    check(state.alignment?.[channel] === state.focusPressure, `state ${index + 1} ${channel} must align to ${state.focusPressure}`);
  }
}

check(HOSPITAL_STORY_STATES.length === states.length, "TypeScript and JSON story contracts must contain the same state count");
for (let index = 0; index < HOSPITAL_STORY_STATES.length; index += 1) {
  const implemented = HOSPITAL_STORY_STATES[index];
  const contracted = states[index];
  const implementedCycle = currentHospitalStoryCycle(implemented);
  const implementedPressure = currentHospitalStoryPressure(implemented);
  check(implemented.stateId === contracted?.id, `implemented state ${index + 1} id must match canonical JSON`);
  check(implemented.beat === contracted?.beat, `implemented state ${index + 1} beat must match canonical JSON`);
  check((implemented.cycleIndex ?? 0) + 1 === contracted?.cycle, `implemented state ${index + 1} cycle must match canonical JSON`);
  check(implementedCycle?.lever === contracted?.lever, `implemented state ${index + 1} lever must match canonical JSON`);
  check(implementedPressure?.id === contracted?.focusPressure, `implemented state ${index + 1} focus pressure must match canonical JSON`);
  check(materializingHospitalStoryLever(implemented) === (contracted?.materializingLever ?? undefined), `implemented state ${index + 1} materializing lever must match canonical JSON`);
  sameArray(implemented.activeLevers, contracted?.committedLevers ?? [], `implemented state ${index + 1} committed levers`);
}

for (let cycle = 1; cycle < 6; cycle += 1) {
  const reveal = states.find((state) => state.cycle === cycle && state.beat === "reveal");
  const next = states.find((state) => state.cycle === cycle + 1 && state.beat === "materialize");
  check(Boolean(reveal && next), `cycle ${cycle} reveal and cycle ${cycle + 1} materialize must exist`);
  check(reveal?.focusPressure === next?.focusPressure, `cycle ${cycle} reveal must flow directly into cycle ${cycle + 1} materialize`);
  sameArray(next?.committedLevers ?? [], reveal?.committedLevers ?? [], `cycle ${cycle} reveal-to-materialize committed levers`);
}

check(release.schemaVersion === "1.0.0", "release template schemaVersion must be 1.0.0");
check(release.standardId === standard.standardId, "release template standardId must match the release standard");
sameSet((release.hardGateResults ?? []).map((result) => result.id), [...hardGateIds], "release hard gate results");
for (const result of release.hardGateResults ?? []) {
  check(result.pass === null, `${result.id} pass placeholder must be null`);
  check(Array.isArray(result.evidence), `${result.id} evidence must be an array`);
}

sameSet((release.rubricResults ?? []).map((result) => result.id), [...criterionIds], "release rubric results");
const criterionById = new Map(criteria.map((criterion) => [criterion.id, criterion]));
for (const result of release.rubricResults ?? []) {
  check(result.score === null, `${result.id} score placeholder must be null`);
  check(result.maximum === criterionById.get(result.id)?.points, `${result.id} maximum must match the rubric`);
  check(Array.isArray(result.evidence), `${result.id} evidence must be an array`);
}

sameSet((release.domainResults ?? []).map((result) => result.id), [...domainIds], "release domain results");
const domainById = new Map(domains.map((domain) => [domain.id, domain]));
for (const result of release.domainResults ?? []) {
  check(result.maximum === domainById.get(result.id)?.points, `${result.id} maximum must match the domain rubric`);
  check(result.score === null && result.percent === null && result.pass === null, `${result.id} result placeholders must be null`);
}

sameSet((release.viewportResults ?? []).map((result) => result.id), [...viewportIds], "release viewport results");
for (const result of release.viewportResults ?? []) {
  check(result.statesRequired === story.stateCount, `${result.id} statesRequired must be ${story.stateCount}`);
  check(result.statesReviewed === 0, `${result.id} template must begin with zero reviewed states`);
  check(result.pass === null, `${result.id} pass placeholder must be null`);
}
check(release.releaseDecision?.weightedScore === null, "release weighted score placeholder must be null");
check(release.releaseDecision?.decision === null, "release decision placeholder must be null");
sameArray(release.releaseDecision?.allowedDecisions ?? [], ["release", "hold"], "allowed release decisions");

check(human.schemaVersion === "1.0.0", "human template schemaVersion must be 1.0.0");
check(human.templateId === "srs-hospital-twin-human-audience-scorecard", "human templateId is invalid");
check(human.likertScale?.minimum === 1 && human.likertScale?.maximum === 5, "human Likert scale must run from 1 to 5");
const ratingIds = unique((human.ratings ?? []).map((rating) => rating.id), "human rating ids");
check(ratingIds.size >= 12, "human scorecard must include at least 12 ratings");
for (const rating of human.ratings ?? []) {
  check(typeof rating.prompt === "string" && rating.prompt.length > 30, `${rating.id} prompt must be substantive`);
  check(rating.score === null, `${rating.id} score placeholder must be null`);
}
check(human.allowedAudienceSegments?.includes("hospital-ceo"), "human scorecard must include hospital CEOs");
check(human.allowedAudienceSegments?.includes("medtech-founder"), "human scorecard must include medtech founders");
check(human.successThresholds?.minimumMedianRating === standard.releasePolicy?.requiredAudienceMedian, "human median threshold must match release policy");
check(human.successThresholds?.mainThesisRecallPercent >= 90, "main thesis recall threshold must be at least 90 percent");
check(human.successThresholds?.finalConstraintRecallPercent >= 90, "final constraint recall threshold must be at least 90 percent");
check(human.successThresholds?.actionableNextDecisionPercent >= 85, "actionable decision threshold must be at least 85 percent");
check(human.sessionResult?.pass === null, "human session pass placeholder must be null");
check(Array.isArray(human.unaidedRecall?.leversRecalledInOrder), "human recall lever answer must be an array");

if (errors.length > 0) {
  console.error(`Hospital evaluation harness failed ${errors.length} of ${assertionCount} assertions:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Hospital evaluation harness self-check passed.");
  console.log(`Assertions: ${assertionCount}`);
  console.log(`Hard gates: ${hardGates.length}`);
  console.log(`Rubric: ${criteria.length} criteria / ${standard.rubric.maximumPoints} points across ${domains.length} domains`);
  console.log(`Canonical story: ${states.length} states / ${story.cycleCount} cycles`);
  console.log(`Viewports: ${viewports.length}`);
  console.log(`Human audience prompts: ${ratingIds.size}`);
}
