import assert from "node:assert/strict";
import { LEVER_SEQUENCE, simulateHospital, type StageId } from "../src/lib/hospital-sim.ts";
import {
  HOSPITAL_FINAL_PRESSURE,
  HOSPITAL_OPENING_PRESSURE,
  HOSPITAL_STORYBOARD,
  hospitalStoryMetricImproved,
  type HospitalPressureKind,
} from "../src/lib/hospital-storyboard.ts";
import {
  HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS,
  HOSPITAL_STORY_DWELL_MS,
  HOSPITAL_STORY_STATES,
  HOSPITAL_STORY_VISUAL_EXHALE_MS,
  INITIAL_HOSPITAL_STORY,
  advanceHospitalStory,
  currentHospitalStoryCycle,
  currentHospitalStoryPressure,
  hospitalStoryStateHash,
  isCanonicalHospitalStoryState,
  isHospitalStoryComplete,
  materializingHospitalStoryLever,
  resolvingHospitalStoryLever,
  revealedHospitalStoryPressure,
  retreatHospitalStory,
  type HospitalStoryBeat,
  type HospitalStoryState,
} from "../src/lib/hospital-story.ts";

const EXPECTED_PRESSURE_CHAIN: Array<{
  stage: StageId;
  kind: HospitalPressureKind;
}> = [
  { stage: "access", kind: "pain-point" },
  { stage: "diagnosis", kind: "system-constraint" },
  { stage: "readiness", kind: "system-constraint" },
  { stage: "robotics", kind: "system-constraint" },
  { stage: "longitudinal", kind: "system-constraint" },
  { stage: "readiness", kind: "operating-friction" },
  { stage: "care", kind: "investment-constraint" },
];

function wordCount(value: string) {
  return value.trim().split(/\s+/u).length;
}

assert.equal(HOSPITAL_STORYBOARD.length, 6, "The story must contain six intervention cycles");
assert.deepEqual(
  HOSPITAL_STORYBOARD.map((cycle) => cycle.lever),
  LEVER_SEQUENCE,
  "Storyboard order must match the deterministic simulation",
);
assert.equal(HOSPITAL_OPENING_PRESSURE, HOSPITAL_STORYBOARD[0]?.pressure);
assert.equal(HOSPITAL_FINAL_PRESSURE, HOSPITAL_STORYBOARD.at(-1)?.nextPressure);

const pressureChain = [
  HOSPITAL_STORYBOARD[0]?.pressure,
  ...HOSPITAL_STORYBOARD.map((cycle) => cycle.nextPressure),
];
assert.deepEqual(
  pressureChain.map((pressure) => ({ stage: pressure?.stage, kind: pressure?.kind })),
  EXPECTED_PRESSURE_CHAIN,
  "Pressure stages and taxonomy must follow the evidence-backed causal chain",
);

for (const [index, cycle] of HOSPITAL_STORYBOARD.entries()) {
  assert.equal(cycle.number, index + 1, `Cycle ${index + 1} must retain its display number`);
  assert.equal(cycle.id, `cycle-${cycle.lever}`);
  assert.ok(wordCount(cycle.pressure.title) <= 8, `${cycle.pressure.id} title must be glance-readable`);
  assert.ok(wordCount(cycle.pressure.detail) <= 20, `${cycle.pressure.id} detail must stay concise`);
  assert.ok(wordCount(cycle.intervention.title) <= 8, `${cycle.lever} intervention title must be glance-readable`);
  assert.ok(wordCount(cycle.intervention.detail) <= 20, `${cycle.lever} intervention detail must stay concise`);
  assert.ok(wordCount(cycle.resolution.title) <= 8, `${cycle.lever} resolution title must be glance-readable`);
  assert.ok(wordCount(cycle.resolution.detail) <= 20, `${cycle.lever} resolution detail must stay concise`);
  assert.notEqual(cycle.pressure.id, cycle.nextPressure.id, `${cycle.lever} must expose a new downstream pressure`);

  const nextCycle = HOSPITAL_STORYBOARD[index + 1];
  if (nextCycle) {
    assert.equal(
      cycle.nextPressure,
      nextCycle.pressure,
      `${cycle.lever} reveal must be the identical pressure object used by the next cycle`,
    );
    assert.equal(cycle.nextPressure.id, nextCycle.pressure.id);
  }

  const stageMetric = cycle.resolution.metric.measure.startsWith("stage-");
  assert.equal(Boolean(cycle.resolution.metric.stage), stageMetric, `${cycle.lever} metric stage must be unambiguous`);

  const before = simulateHospital(LEVER_SEQUENCE.slice(0, index));
  const after = simulateHospital(LEVER_SEQUENCE.slice(0, index + 1));
  assert.ok(
    hospitalStoryMetricImproved(cycle.resolution.metric, before, after),
    `${cycle.lever} resolution metric must improve in the authored direction`,
  );
}

assert.equal(HOSPITAL_STORY_STATES.length, 19, "One opening plus three beats per lever must produce 19 states");
const beatCounts = HOSPITAL_STORY_STATES.reduce<Record<HospitalStoryBeat, number>>(
  (counts, state) => ({ ...counts, [state.beat]: counts[state.beat] + 1 }),
  { surface: 0, materialize: 0, resolve: 0, reveal: 0 },
);
assert.deepEqual(beatCounts, { surface: 1, materialize: 6, resolve: 6, reveal: 6 });
assert.equal(new Set(HOSPITAL_STORY_STATES.map((state) => state.stateId)).size, 19, "State IDs must be unique");
assert.equal(new Set(HOSPITAL_STORY_STATES.map(hospitalStoryStateHash)).size, 19, "State hashes must be unique");

for (const [index, state] of HOSPITAL_STORY_STATES.entries()) {
  assert.ok(isCanonicalHospitalStoryState(state), `${state.stateId} must be canonical`);
  assert.deepEqual(
    state.activeLevers,
    LEVER_SEQUENCE.slice(0, state.activeLevers.length),
    `${state.stateId} must retain an ordered lever prefix`,
  );

  const cycle = currentHospitalStoryCycle(state);
  assert.ok(cycle, `${state.stateId} must resolve to one authored cycle`);
  assert.equal(currentHospitalStoryPressure(state), state.beat === "reveal" ? cycle.nextPressure : cycle.pressure);
  assert.equal(materializingHospitalStoryLever(state), state.beat === "materialize" ? cycle.lever : undefined);
  assert.equal(resolvingHospitalStoryLever(state), state.beat === "resolve" ? cycle.lever : undefined);
  assert.equal(revealedHospitalStoryPressure(state), state.beat === "reveal" ? cycle.nextPressure : undefined);

  const next = HOSPITAL_STORY_STATES[index + 1];
  if (!next) continue;
  if (state.beat === "surface") {
    assert.equal(next.beat, "materialize");
    assert.equal(next.activeLevers.length, state.activeLevers.length, "Surface cannot change metrics");
  } else if (state.beat === "materialize") {
    assert.equal(next.beat, "resolve");
    assert.equal(next.activeLevers.length, state.activeLevers.length + 1, "A lever commits on resolve");
    assert.equal(next.activeLevers.at(-1), cycle.lever);
  } else if (state.beat === "resolve") {
    assert.equal(next.beat, "reveal");
    assert.deepEqual(next.activeLevers, state.activeLevers, "Resolve and reveal use the same committed simulation");
  } else {
    assert.equal(next.beat, "materialize", "Reveal must go directly to the next intervention");
    assert.deepEqual(next.activeLevers, state.activeLevers, "Reveal cannot change metrics");
    assert.equal(currentHospitalStoryPressure(next), cycle.nextPressure, "The revealed pressure cannot be reintroduced");
  }
}

let replay: HospitalStoryState = { ...INITIAL_HOSPITAL_STORY, activeLevers: [] };
const replayHashes = [hospitalStoryStateHash(replay)];
while (!isHospitalStoryComplete(replay)) {
  const next = advanceHospitalStory(replay);
  assert.notEqual(hospitalStoryStateHash(next), hospitalStoryStateHash(replay), "Advance must change state");
  replay = next;
  replayHashes.push(hospitalStoryStateHash(replay));
}
assert.deepEqual(replayHashes, HOSPITAL_STORY_STATES.map(hospitalStoryStateHash));
assert.deepEqual(advanceHospitalStory(replay), replay, "The final reveal is stable until reset");

for (let index = 1; index < HOSPITAL_STORY_STATES.length; index += 1) {
  const current = HOSPITAL_STORY_STATES[index];
  const expected = HOSPITAL_STORY_STATES[index - 1];
  assert.ok(current && expected);
  assert.equal(hospitalStoryStateHash(retreatHospitalStory(current)), hospitalStoryStateHash(expected));
}

assert.ok(HOSPITAL_STORY_DWELL_MS.surface >= 7_000, "Opening pressure needs a deliberate read");
assert.ok(HOSPITAL_STORY_DWELL_MS.materialize >= 5_000, "Materialization must remain legible");
assert.ok(HOSPITAL_STORY_DWELL_MS.resolve >= 6_000, "Resolution must show operating impact");
assert.ok(HOSPITAL_STORY_DWELL_MS.reveal >= 7_000, "A revealed pressure needs a deliberate read");
assert.ok(
  HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS >= 120_000 && HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS <= 130_000,
  `Complete autoplay, including the final reveal hold, must run 120-130s; received ${HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS}ms`,
);
assert.ok(
  HOSPITAL_STORY_VISUAL_EXHALE_MS >= 800 && HOSPITAL_STORY_VISUAL_EXHALE_MS <= 1_000,
  "Every resolution needs at least 800ms of settled visual silence before advance",
);

const transitionRows = HOSPITAL_STORY_STATES.map((state, index) => ({
  state: index + 1,
  id: state.stateId,
  beat: state.beat,
  committed: state.activeLevers.length,
  focus: currentHospitalStoryPressure(state)?.id,
}));

console.table(transitionRows);
console.log("Hospital story contract passed: 19 states, 6 causal cycles, 0 duplicate surfaces.");
