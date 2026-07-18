import { LEVER_SEQUENCE, type LeverId } from "./hospital-sim.ts";
import {
  HOSPITAL_STORYBOARD,
  type HospitalStoryCycle,
  type HospitalStoryPressure,
} from "./hospital-storyboard.ts";

export type HospitalStoryBeat = "surface" | "materialize" | "resolve" | "reveal";
export type HospitalStoryStateId =
  | "opening:surface"
  | `${LeverId}:materialize`
  | `${LeverId}:resolve`
  | `${LeverId}:reveal`;

/**
 * cycleIndex and stateId are optional for compatibility with manual scenarios.
 * Canonical guided states always contain both fields.
 */
export type HospitalStoryState = {
  activeLevers: LeverId[];
  beat: HospitalStoryBeat;
  cycleIndex?: number;
  stateId?: HospitalStoryStateId;
};

export type CanonicalHospitalStoryState = HospitalStoryState & {
  cycleIndex: number;
  stateId: HospitalStoryStateId;
};

/**
 * Autoplay is intentionally unhurried. The live presentation should default
 * to presenter control; these dwell times support rehearsal and kiosk mode.
 */
export const HOSPITAL_STORY_DWELL_MS: Record<HospitalStoryBeat, number> = {
  surface: 7_200,
  materialize: 5_400,
  resolve: 6_800,
  reveal: 7_200,
};

/** A quiet beat between resolution and the next reveal keeps causality legible. */
export const HOSPITAL_STORY_VISUAL_EXHALE_MS = 800;

function makeState(
  stateId: HospitalStoryStateId,
  beat: HospitalStoryBeat,
  cycleIndex: number,
  activeLevers: LeverId[],
): CanonicalHospitalStoryState {
  return { stateId, beat, cycleIndex, activeLevers };
}

function buildHospitalStoryStates(): CanonicalHospitalStoryState[] {
  const states: CanonicalHospitalStoryState[] = [
    makeState("opening:surface", "surface", 0, []),
  ];

  HOSPITAL_STORYBOARD.forEach((cycle, cycleIndex) => {
    const committedBefore = LEVER_SEQUENCE.slice(0, cycleIndex);
    const committedAfter = LEVER_SEQUENCE.slice(0, cycleIndex + 1);

    states.push(
      makeState(`${cycle.lever}:materialize`, "materialize", cycleIndex, committedBefore),
      // The intervention commits on entry to resolve, never while materializing.
      makeState(`${cycle.lever}:resolve`, "resolve", cycleIndex, committedAfter),
      makeState(`${cycle.lever}:reveal`, "reveal", cycleIndex, committedAfter),
    );
  });

  return states;
}

/**
 * One opening pressure plus three exclusive beats for each of six levers.
 * Reveal goes directly to the next lever's materialize state; it is never
 * followed by a duplicate surface state.
 */
export const HOSPITAL_STORY_STATES: readonly CanonicalHospitalStoryState[] =
  buildHospitalStoryStates();

/** Includes the final reveal hold, so a complete unattended run lands at 123.6 seconds. */
export const HOSPITAL_STORY_AUTOPLAY_RUNTIME_MS = HOSPITAL_STORY_STATES.reduce(
  (total, state) => total + HOSPITAL_STORY_DWELL_MS[state.beat],
  0,
);

function cloneState(state: CanonicalHospitalStoryState): HospitalStoryState {
  return { ...state, activeLevers: [...state.activeLevers] };
}

export const INITIAL_HOSPITAL_STORY: HospitalStoryState = cloneState(
  HOSPITAL_STORY_STATES[0] as CanonicalHospitalStoryState,
);

function isSequencePrefix(activeLevers: readonly LeverId[]) {
  return activeLevers.every((lever, index) => LEVER_SEQUENCE[index] === lever);
}

function sameLevers(left: readonly LeverId[], right: readonly LeverId[]) {
  return left.length === right.length && left.every((lever, index) => lever === right[index]);
}

export function hospitalStoryStateIndex(story: HospitalStoryState) {
  return HOSPITAL_STORY_STATES.findIndex(
    (candidate) => candidate.beat === story.beat && sameLevers(candidate.activeLevers, story.activeLevers),
  );
}

export function isCanonicalHospitalStoryState(story: HospitalStoryState) {
  return hospitalStoryStateIndex(story) >= 0;
}

/**
 * Resolve the authored cycle even for a legacy prefix + surface state created
 * by manual lever controls. Non-prefix manual combinations return undefined.
 */
export function currentHospitalStoryCycle(story: HospitalStoryState): HospitalStoryCycle | undefined {
  if (!isSequencePrefix(story.activeLevers)) return undefined;

  let cycleIndex: number;
  if (story.beat === "materialize") cycleIndex = story.activeLevers.length;
  else if (story.beat === "resolve" || story.beat === "reveal") cycleIndex = story.activeLevers.length - 1;
  else cycleIndex = story.activeLevers.length;

  return cycleIndex >= 0 ? HOSPITAL_STORYBOARD[cycleIndex] : undefined;
}

export function currentHospitalStoryLever(story: HospitalStoryState) {
  return currentHospitalStoryCycle(story)?.lever;
}

export function materializingHospitalStoryLever(story: HospitalStoryState) {
  return story.beat === "materialize" ? currentHospitalStoryLever(story) : undefined;
}

export function resolvingHospitalStoryLever(story: HospitalStoryState) {
  return story.beat === "resolve" ? currentHospitalStoryLever(story) : undefined;
}

export function currentHospitalStoryPressure(story: HospitalStoryState): HospitalStoryPressure | undefined {
  const cycle = currentHospitalStoryCycle(story);
  if (!cycle) return undefined;
  return story.beat === "reveal" ? cycle.nextPressure : cycle.pressure;
}

export function revealedHospitalStoryPressure(story: HospitalStoryState) {
  return story.beat === "reveal" ? currentHospitalStoryCycle(story)?.nextPressure : undefined;
}

/** The next not-yet-committed lever, retained for existing consumers. */
export function nextHospitalStoryLever(story: HospitalStoryState) {
  return LEVER_SEQUENCE[story.activeLevers.length];
}

export function hospitalStoryStateHash(story: HospitalStoryState) {
  const state = HOSPITAL_STORY_STATES[hospitalStoryStateIndex(story)];
  const stateId = state?.stateId ?? story.stateId ?? `manual:${story.beat}`;
  return `${stateId}|${story.activeLevers.join(",")}`;
}

export function isHospitalStoryComplete(story: HospitalStoryState) {
  return (
    story.beat === "reveal" &&
    story.activeLevers.length === LEVER_SEQUENCE.length &&
    sameLevers(story.activeLevers, LEVER_SEQUENCE)
  );
}

export function advanceHospitalStory(story: HospitalStoryState): HospitalStoryState {
  if (isHospitalStoryComplete(story)) return { ...story, activeLevers: [...story.activeLevers] };

  const index = hospitalStoryStateIndex(story);
  if (index >= 0) {
    const next = HOSPITAL_STORY_STATES[index + 1];
    return next ? cloneState(next) : { ...story, activeLevers: [...story.activeLevers] };
  }

  // Compatibility normalization for an ordered prefix in the retired
  // surface-after-every-reveal model. It advances into the next materialize.
  if (story.beat === "surface" && isSequencePrefix(story.activeLevers)) {
    const cycle = HOSPITAL_STORYBOARD[story.activeLevers.length];
    if (cycle) {
      return {
        stateId: `${cycle.lever}:materialize`,
        beat: "materialize",
        cycleIndex: story.activeLevers.length,
        activeLevers: [...story.activeLevers],
      };
    }
  }

  return { ...story, activeLevers: [...story.activeLevers] };
}

export function retreatHospitalStory(story: HospitalStoryState): HospitalStoryState {
  const index = hospitalStoryStateIndex(story);
  if (index <= 0) return cloneState(HOSPITAL_STORY_STATES[0] as CanonicalHospitalStoryState);
  return cloneState(HOSPITAL_STORY_STATES[index - 1] as CanonicalHospitalStoryState);
}
