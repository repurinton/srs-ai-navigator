import assert from "node:assert/strict";
import {
  LEVER_SEQUENCE,
  buildLeverEvidence,
  scenarioSignature,
  simulateHospital,
  type LeverId,
  type StageId,
} from "../src/lib/hospital-sim.ts";
import {
  HOSPITAL_STORYBOARD,
  hospitalStoryMetricImproved,
} from "../src/lib/hospital-storyboard.ts";
import {
  HOSPITAL_STORY_STATES,
  advanceHospitalStory,
  currentHospitalStoryPressure,
  hospitalStoryStateHash,
  isHospitalStoryComplete,
  type HospitalStoryState,
} from "../src/lib/hospital-story.ts";

const EXPECTED_CONSTRAINTS: StageId[] = [
  "diagnosis",
  "diagnosis",
  "readiness",
  "robotics",
  "longitudinal",
  "readiness",
  "care",
];

const snapshots: Array<{
  step: number;
  lever: LeverId | "Baseline";
  completed: number;
  journeyDays: number;
  touches: number;
  constraint: string;
}> = [];

for (let step = 0; step <= LEVER_SEQUENCE.length; step += 1) {
  const active = LEVER_SEQUENCE.slice(0, step);
  const first = simulateHospital(active);
  const second = simulateHospital(active);

  assert.equal(scenarioSignature(first), scenarioSignature(second), `Step ${step} must be deterministic`);
  assert.equal(first.constraint, EXPECTED_CONSTRAINTS[step], `Step ${step} must expose the authored constraint`);
  assert.ok(first.completed >= 0 && first.completed <= first.episodes, `Step ${step} conserves episodes`);
  assert.ok(Number.isFinite(first.medianJourneyDays), `Step ${step} returns a finite journey time`);
  assert.ok(Number.isFinite(first.administrativeTouches), `Step ${step} returns finite touches`);

  snapshots.push({
    step,
    lever: step === 0 ? "Baseline" : LEVER_SEQUENCE[step - 1]!,
    completed: first.completed,
    journeyDays: first.medianJourneyDays,
    touches: first.administrativeTouches,
    constraint: first.stageResults[first.constraint].shortName,
  });
}

for (const [index, lever] of LEVER_SEQUENCE.entries()) {
  const before = simulateHospital(LEVER_SEQUENCE.slice(0, index));
  const after = simulateHospital(LEVER_SEQUENCE.slice(0, index + 1));
  const evidence = buildLeverEvidence(lever, before, after);
  const reduction = (evidence.beforePressure - evidence.afterPressure) / Math.max(1, evidence.beforePressure);

  assert.ok(evidence.pressureDelta < 0, `${lever} must reduce its addressed operating pressure`);
  assert.ok(reduction >= 0.1, `${lever} must produce at least a 10% material pressure reduction`);
  assert.ok(
    hospitalStoryMetricImproved(HOSPITAL_STORYBOARD[index]!.resolution.metric, before, after),
    `${lever} resolution metric must improve in its authored direction`,
  );
}

const baseline = snapshots[0]!;
const connected = snapshots.at(-1)!;
assert.ok(connected.completed > baseline.completed, "The connected system should complete more episodes");
assert.ok(connected.journeyDays < baseline.journeyDays, "The connected system should shorten the journey");
assert.ok(connected.touches < baseline.touches, "The connected system should reduce administrative touches");

assert.equal(HOSPITAL_STORY_STATES.length, 19, "The guided story must contain 19 exclusive states");

for (const [index, state] of HOSPITAL_STORY_STATES.entries()) {
  const simulation = simulateHospital(state.activeLevers);
  const pressure = currentHospitalStoryPressure(state);

  if (state.beat !== "resolve" && pressure?.evidenceBasis === "simulation-constraint") {
    assert.equal(
      pressure.stage,
      simulation.constraint,
      `${state.stateId} cannot call a stage the system constraint unless the model ranks it first`,
    );
  }

  const next = HOSPITAL_STORY_STATES[index + 1];
  if (!next) continue;
  const currentSignature = scenarioSignature(simulation);
  const nextSignature = scenarioSignature(simulateHospital(next.activeLevers));

  if (state.beat === "surface" || state.beat === "resolve" || state.beat === "reveal") {
    assert.equal(
      currentSignature,
      nextSignature,
      `${state.stateId} → ${next.stateId} must hold the deterministic metrics constant`,
    );
  } else {
    assert.equal(next.beat, "resolve", "Only materialize may commit the next operating rule");
    assert.equal(next.activeLevers.length, state.activeLevers.length + 1);
  }
}

let replay: HospitalStoryState = { ...HOSPITAL_STORY_STATES[0]!, activeLevers: [] };
const replayHashes = [hospitalStoryStateHash(replay)];
while (!isHospitalStoryComplete(replay)) {
  replay = advanceHospitalStory(replay);
  replayHashes.push(hospitalStoryStateHash(replay));
}
assert.deepEqual(replayHashes, HOSPITAL_STORY_STATES.map(hospitalStoryStateHash));

console.table(snapshots);
console.log("Hospital simulation contract passed: deterministic demand, honest constraints, and 6 material pressure reductions.");
