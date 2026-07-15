import assert from "node:assert/strict";
import {
  LEVER_SEQUENCE,
  scenarioSignature,
  simulateHospital,
  type LeverId,
} from "../src/lib/hospital-sim.ts";

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

console.table(snapshots);

