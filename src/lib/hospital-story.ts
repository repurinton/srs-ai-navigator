import { LEVER_SEQUENCE, type LeverId } from "./hospital-sim.ts";

export type HospitalStoryBeat = "surface" | "materialize" | "reveal";

export type HospitalStoryState = {
  activeLevers: LeverId[];
  beat: HospitalStoryBeat;
};

export const INITIAL_HOSPITAL_STORY: HospitalStoryState = {
  activeLevers: [],
  beat: "surface",
};

export const HOSPITAL_STORY_DWELL_MS: Record<HospitalStoryBeat, number> = {
  surface: 4_800,
  materialize: 3_600,
  reveal: 5_200,
};

export function isHospitalStoryComplete(story: HospitalStoryState) {
  return story.activeLevers.length === LEVER_SEQUENCE.length && story.beat === "reveal";
}

export function nextHospitalStoryLever(story: HospitalStoryState) {
  return LEVER_SEQUENCE[story.activeLevers.length];
}

export function advanceHospitalStory(story: HospitalStoryState): HospitalStoryState {
  if (isHospitalStoryComplete(story)) return story;

  if (story.beat === "surface") {
    return {
      ...story,
      beat: nextHospitalStoryLever(story) ? "materialize" : "reveal",
    };
  }

  if (story.beat === "materialize") {
    const nextLever = nextHospitalStoryLever(story);
    if (!nextLever) return { ...story, beat: "reveal" };
    return {
      activeLevers: [...story.activeLevers, nextLever],
      beat: "reveal",
    };
  }

  return { ...story, beat: "surface" };
}
