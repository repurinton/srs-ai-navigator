import assert from "node:assert/strict";
import {
  LEVER_SEQUENCE,
  scenarioSignature,
  simulateHospital,
  type LeverId,
} from "../src/lib/hospital-sim.ts";
import {
  INITIAL_HOSPITAL_STORY,
  advanceHospitalStory,
  isHospitalStoryComplete,
  nextHospitalStoryLever,
  type HospitalStoryState,
} from "../src/lib/hospital-story.ts";

const active: LeverId[] = [];
const snapshots = [];

for (let step = 0; step <= LEVER_SEQUENCE.length; step += 1) {
  const first = simulateHospital(active);
  const second = simulateHospital(active);

  assert.equal(scenarioSignature(first), scenarioSignature(second), `Step ${step} must be deterministic`);
  assert.ok(first.completed >= 0 && first.completed <= first.episodes, `Step ${step} conserves episodes`);
  assert.ok(Number.isFinite(first.medianJourneyDays), `Step ${step} returns a finite journey time`);
  assert.ok(Number.isFinite(first.administrativeTouches), `Step ${step} returns finite touches`);

  snapshots.push({
    step,
    lever: step === 0 ? "Baseline" : LEVER_SEQUENCE[step - 1],
    completed: first.completed,
    journeyDays: first.medianJourneyDays,
    touches: first.administrativeTouches,
    constraint: first.stageResults[first.constraint].shortName,
  });

  const nextLever = LEVER_SEQUENCE[step];
  if (nextLever) active.push(nextLever);
}

const baseline = snapshots[0];
const connected = snapshots.at(-1);
assert.ok(baseline && connected);
assert.ok(connected.completed > baseline.completed, "The connected system should complete more episodes");
assert.ok(connected.journeyDays < baseline.journeyDays, "The connected system should shorten the journey");
assert.ok(connected.touches < baseline.touches, "The connected system should reduce administrative touches");

const storyStates: HospitalStoryState[] = [];
let story: HospitalStoryState = { ...INITIAL_HOSPITAL_STORY, activeLevers: [] };

while (!isHospitalStoryComplete(story)) {
  storyStates.push(story);
  const next = advanceHospitalStory(story);

  if (story.beat === "surface") {
    assert.equal(next.beat, "materialize", "A surfaced pressure should advance to AI materialization");
    assert.equal(next.activeLevers.length, story.activeLevers.length, "Surfacing does not change the simulation");
  } else if (story.beat === "materialize") {
    assert.equal(next.beat, "reveal", "Materialization should advance to operating impact");
    assert.equal(next.activeLevers.length, story.activeLevers.length + 1, "A lever commits only on reveal");
  } else {
    assert.equal(next.beat, "surface", "An impact reveal should surface the next pressure");
    assert.equal(next.activeLevers.length, story.activeLevers.length, "The reveal dwell preserves the simulation");
  }

  assert.deepEqual(
    next.activeLevers,
    LEVER_SEQUENCE.slice(0, next.activeLevers.length),
    "Guided story levers must remain an ordered prefix",
  );
  story = next;
}

storyStates.push(story);
assert.equal(storyStates.length, 18, "The guided story should expose three deliberate beats for each lever");
assert.equal(storyStates.filter((state) => state.beat === "surface").length, 6);
assert.equal(storyStates.filter((state) => state.beat === "materialize").length, 6);
assert.equal(storyStates.filter((state) => state.beat === "reveal").length, 6);
assert.equal(nextHospitalStoryLever(story), undefined);
assert.deepEqual(story.activeLevers, LEVER_SEQUENCE);

console.table(snapshots);
