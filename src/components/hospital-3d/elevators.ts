import { WORLD_ELEVATOR_STOPS } from "@/lib/hospital-world";

/**
 * Deterministic schedules for the two independent elevator cabs. The same
 * pure state function drives both the rendered cabs (with sliding doors) and
 * patient boarding logic, so riders and cabs can never desynchronize.
 */

export const ELEVATOR_TRAVEL_SECONDS = 2.2;
export const ELEVATOR_DWELL_SECONDS = 3.2;

export interface ElevatorCabSpec {
  x: number;
  z: number;
  /** Schedule offset so the two cabs run out of phase. */
  phaseOffset: number;
}

const LEG_SECONDS = ELEVATOR_TRAVEL_SECONDS + ELEVATOR_DWELL_SECONDS;
const LEGS = WORLD_ELEVATOR_STOPS.length * 2 - 2;
export const ELEVATOR_PERIOD_SECONDS = LEGS * LEG_SECONDS;

export const ELEVATOR_CABS: ElevatorCabSpec[] = [
  { x: -26.5, z: -9.3, phaseOffset: 0 },
  { x: -26.5, z: -6.7, phaseOffset: ELEVATOR_PERIOD_SECONDS / 2 },
];

export interface ElevatorCabState {
  y: number;
  /** Stop index while dwelling, null while traveling. */
  stopIndex: number | null;
  /** 0 closed → 1 fully open (only during dwell). */
  doorsOpen: number;
  /** Direction of the next travel leg (+1 up, -1 down). */
  direction: 1 | -1;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function legEndpoints(leg: number): [number, number] {
  const upLegs = WORLD_ELEVATOR_STOPS.length - 1;
  const from = leg < upLegs ? leg : LEGS - leg;
  const to = leg < upLegs ? leg + 1 : LEGS - leg - 1;
  return [from, to];
}

export function elevatorCabState(elapsed: number, cab: ElevatorCabSpec): ElevatorCabState {
  const t = (((elapsed + cab.phaseOffset) % ELEVATOR_PERIOD_SECONDS) + ELEVATOR_PERIOD_SECONDS) % ELEVATOR_PERIOD_SECONDS;
  const leg = Math.floor(t / LEG_SECONDS);
  const within = t - leg * LEG_SECONDS;
  const [fromIndex, toIndex] = legEndpoints(leg);
  const fromY = WORLD_ELEVATOR_STOPS[fromIndex];
  const toY = WORLD_ELEVATOR_STOPS[toIndex];

  if (within < ELEVATOR_TRAVEL_SECONDS) {
    const progress = smoothstep(within / ELEVATOR_TRAVEL_SECONDS);
    return {
      y: fromY + (toY - fromY) * progress,
      stopIndex: null,
      doorsOpen: 0,
      direction: toIndex > fromIndex ? 1 : -1,
    };
  }

  const dwellT = (within - ELEVATOR_TRAVEL_SECONDS) / ELEVATOR_DWELL_SECONDS;
  const doorsOpen = dwellT < 0.25 ? dwellT / 0.25 : dwellT > 0.75 ? (1 - dwellT) / 0.25 : 1;
  const [nextFrom, nextTo] = legEndpoints((leg + 1) % LEGS);
  return {
    y: toY,
    stopIndex: toIndex,
    doorsOpen,
    direction: nextTo > nextFrom ? 1 : -1,
  };
}

/** Stop index whose height matches a journey waypoint, or -1. */
export function elevatorStopIndexForY(y: number): number {
  return WORLD_ELEVATOR_STOPS.findIndex((stop) => Math.abs(stop - y) < 0.05);
}
