export type LeverId =
  | "front-door"
  | "diagnosis"
  | "precision"
  | "robotics"
  | "longitudinal"
  | "automation";

export type StageId =
  | "access"
  | "diagnosis"
  | "precision"
  | "readiness"
  | "robotics"
  | "care"
  | "longitudinal";

type Cohort = "routineSurgery" | "precisionSurgery" | "medical";
type PriorityBand = "urgent" | "standard";
type Calendar = "office" | "or" | "continuous";

interface StageConfig {
  id: StageId;
  name: string;
  shortName: string;
  leverId?: LeverId;
  servers: number;
  serviceHours: number;
  handoffHours: number;
  exceptionRate: number;
  reworkHours: number;
  administrativeTouches: number;
  calendar: Calendar;
}

interface Episode {
  id: number;
  cohort: Cohort;
  priorityBand: PriorityBand;
  complexityFactor: number;
  arrivalTime: number;
  route: StageId[];
  readyTime: number;
  completionTime: number;
  touches: number;
}

interface StageRecord {
  episodeId: number;
  readyTime: number;
  startTime: number;
  finishTime: number;
  touches: number;
  exception: boolean;
}

export interface StageResult {
  id: StageId;
  name: string;
  shortName: string;
  leverId?: LeverId;
  queueAtHorizon: number;
  peakQueue: number;
  averageWaitHours: number;
  completedByHorizon: number;
  averageTouches: number;
}

export interface SimulationResult {
  episodes: number;
  completed: number;
  medianJourneyDays: number;
  administrativeTouches: number;
  stageResults: Record<StageId, StageResult>;
  constraint: StageId;
  activeLevers: LeverId[];
}

export type LeverEvidence = {
  lever: LeverId;
  addressedStage: StageId;
  beforePressure: number;
  afterPressure: number;
  pressureDelta: number;
  beforeQueue: number;
  afterQueue: number;
  beforeWaitHours: number;
  afterWaitHours: number;
  completedDelta: number;
  journeyDeltaDays: number;
  administrativeTouchesDelta: number;
};

export const SIMULATION_HORIZON_DAYS = 30;
export const SIMULATION_EPISODES = 600;

export const LEVER_SEQUENCE: LeverId[] = [
  "front-door",
  "diagnosis",
  "precision",
  "robotics",
  "longitudinal",
  "automation",
];

export const LEVER_EVIDENCE_STAGE: Record<LeverId, StageId> = {
  "front-door": "access",
  diagnosis: "diagnosis",
  precision: "readiness",
  robotics: "robotics",
  longitudinal: "longitudinal",
  automation: "readiness",
};

export const LEVER_META: Record<
  LeverId,
  { number: string; monogram: string; name: string; color: string; mechanism: string }
> = {
  "front-door": {
    number: "01",
    monogram: "FD",
    name: "Digital Front Door",
    color: "#5bf0c3",
    mechanism: "Clears intake exceptions and preserves context.",
  },
  diagnosis: {
    number: "02",
    monogram: "DX",
    name: "Clinical Diagnosis",
    color: "#5e8fff",
    mechanism: "Routes the patient correctly the first time.",
  },
  precision: {
    number: "03",
    monogram: "PM",
    name: "Precision Medicine",
    color: "#7fcf5a",
    mechanism: "Adds targeted workup; prevents downstream plan revision.",
  },
  robotics: {
    number: "04",
    monogram: "RX",
    name: "Robotics",
    color: "#ffb454",
    mechanism: "Returns turnover time without changing surgical judgment.",
  },
  longitudinal: {
    number: "05",
    monogram: "LC",
    name: "Longitudinal Care",
    color: "#b695ff",
    mechanism: "Makes discharge and follow-up an owned flow.",
  },
  automation: {
    number: "06",
    monogram: "TA",
    name: "Task Automation",
    color: "#ff716d",
    mechanism: "Connects nonclinical handoffs across the system.",
  },
};

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id: "access",
    name: "Access center",
    shortName: "Access",
    leverId: "front-door",
    servers: 4,
    serviceHours: 1.4,
    handoffHours: 8,
    exceptionRate: 0.22,
    reworkHours: 4,
    administrativeTouches: 5,
    calendar: "office",
  },
  {
    id: "diagnosis",
    name: "Diagnostics",
    shortName: "Diagnose",
    leverId: "diagnosis",
    servers: 5,
    serviceHours: 2.7,
    handoffHours: 10,
    exceptionRate: 0.15,
    reworkHours: 6,
    administrativeTouches: 4,
    calendar: "office",
  },
  {
    id: "precision",
    name: "Precision planning",
    shortName: "Match",
    leverId: "precision",
    servers: 3,
    serviceHours: 3.4,
    handoffHours: 12,
    exceptionRate: 0.18,
    reworkHours: 8,
    administrativeTouches: 6,
    calendar: "office",
  },
  {
    id: "readiness",
    name: "Pre-op readiness",
    shortName: "Ready",
    servers: 4,
    serviceHours: 1.8,
    handoffHours: 18,
    exceptionRate: 0.18,
    reworkHours: 12,
    administrativeTouches: 5,
    calendar: "office",
  },
  {
    id: "robotics",
    name: "Robotic operating rooms",
    shortName: "Operate",
    leverId: "robotics",
    servers: 4,
    serviceHours: 5.5,
    handoffHours: 3,
    exceptionRate: 0.08,
    reworkHours: 2,
    administrativeTouches: 2,
    calendar: "or",
  },
  {
    id: "care",
    name: "Recovery and staffed beds",
    shortName: "Recover",
    leverId: "longitudinal",
    servers: 20,
    serviceHours: 25,
    handoffHours: 12,
    exceptionRate: 0.12,
    reworkHours: 8,
    administrativeTouches: 3,
    calendar: "continuous",
  },
  {
    id: "longitudinal",
    name: "Home and longitudinal care",
    shortName: "Continue",
    leverId: "longitudinal",
    servers: 4,
    serviceHours: 1.4,
    handoffHours: 24,
    exceptionRate: 0.25,
    reworkHours: 6,
    administrativeTouches: 4,
    calendar: "office",
  },
];

const ROUTES: Record<Cohort, StageId[]> = {
  routineSurgery: ["access", "diagnosis", "readiness", "robotics", "care", "longitudinal"],
  precisionSurgery: [
    "access",
    "diagnosis",
    "precision",
    "readiness",
    "robotics",
    "care",
    "longitudinal",
  ],
  medical: ["access", "diagnosis", "care", "longitudinal"],
};

const STAGE_ORDER = STAGE_CONFIGS.map((stage) => stage.id);
const HORIZON_HOURS = SIMULATION_HORIZON_DAYS * 24;
const SEED = "srs-hospital-operating-twin-v1";

function stableUniform(...parts: Array<string | number>) {
  const value = `${SEED}:${parts.join(":")}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function cohortForEpisode(id: number): Cohort {
  const position = id % 20;
  if (position < 8) return "routineSurgery";
  if (position < 13) return "precisionSurgery";
  return "medical";
}

function buildEpisodes(): Episode[] {
  return Array.from({ length: SIMULATION_EPISODES }, (_, id) => {
    const cohort = cohortForEpisode(id);
    const day = Math.floor(id / 20);
    const position = id % 20;
    const wave = 7 + position * 0.48;
    const jitter = (stableUniform(id, "arrival") - 0.5) * 0.6;
    return {
      id,
      cohort,
      priorityBand: stableUniform(id, "priority") < 0.14 ? "urgent" : "standard",
      complexityFactor: 0.86 + stableUniform(id, "complexity") * 0.3,
      arrivalTime: day * 24 + wave + jitter,
      route: ROUTES[cohort],
      readyTime: day * 24 + wave + jitter,
      completionTime: day * 24 + wave + jitter,
      touches: 0,
    };
  });
}

function calendarWindow(calendar: Calendar) {
  if (calendar === "office") return { open: 8, close: 18 };
  if (calendar === "or") return { open: 7, close: 19 };
  return { open: 0, close: 24 };
}

function nextOpen(time: number, calendar: Calendar) {
  if (calendar === "continuous") return time;
  const { open, close } = calendarWindow(calendar);
  const day = Math.floor(time / 24);
  const hour = time - day * 24;
  if (hour < open) return day * 24 + open;
  if (hour >= close) return (day + 1) * 24 + open;
  return time;
}

function addWorkingHours(start: number, duration: number, calendar: Calendar) {
  if (calendar === "continuous") return start + duration;
  const { open, close } = calendarWindow(calendar);
  let time = nextOpen(start, calendar);
  let remaining = duration;

  while (remaining > 0.0001) {
    const day = Math.floor(time / 24);
    const hour = time - day * 24;
    const available = close - hour;
    const worked = Math.min(available, remaining);
    time += worked;
    remaining -= worked;
    if (remaining > 0.0001) time = (day + 1) * 24 + open;
  }

  return time;
}

function quantile(values: number[], position: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * position)));
  return sorted[index] ?? 0;
}

function effectiveStage(
  stage: StageConfig,
  episode: Episode,
  active: Set<LeverId>,
) {
  let serviceHours = stage.serviceHours;
  let handoffHours = stage.handoffHours;
  let exceptionRate = stage.exceptionRate;
  let reworkHours = stage.reworkHours;
  let touches = stage.administrativeTouches;

  if (stage.id === "access" && active.has("front-door")) {
    handoffHours *= 0.65;
    exceptionRate = 0.14;
    touches = 3;
  }

  if (stage.id === "diagnosis" && active.has("diagnosis")) {
    serviceHours *= 0.75;
    exceptionRate = 0.06;
    touches = 3;
  }

  if (stage.id === "precision" && active.has("precision")) {
    serviceHours *= 1.06;
    exceptionRate = 0.05;
    touches = 4;
  }

  if (stage.id === "readiness" && episode.cohort === "precisionSurgery" && active.has("precision")) {
    serviceHours *= 0.65;
    handoffHours = 8;
    exceptionRate = 0.03;
    reworkHours = 4;
    touches = Math.max(1, touches - 1);
  }

  if (stage.id === "robotics" && active.has("robotics")) {
    serviceHours = 3.2;
  }

  if (stage.id === "care" && active.has("longitudinal")) {
    handoffHours = 6;
  }

  if (stage.id === "longitudinal" && active.has("longitudinal")) {
    handoffHours = 10;
    exceptionRate = 0.14;
    touches = 3;
  }

  if (active.has("automation")) {
    if (stage.id === "access" || stage.id === "readiness" || stage.id === "longitudinal") {
      handoffHours *= 0.55;
    }
    reworkHours *= 0.6;
    touches *= 0.6;

    if (stage.leverId && active.has(stage.leverId)) {
      touches = Math.max(0, touches - 1);
    }
  }

  return { serviceHours, handoffHours, exceptionRate, reworkHours, touches };
}

export function simulateHospital(activeLeverIds: Iterable<LeverId>): SimulationResult {
  const active = new Set(activeLeverIds);
  const episodes = buildEpisodes();
  const records = Object.fromEntries(
    STAGE_ORDER.map((id) => [id, [] as StageRecord[]]),
  ) as Record<StageId, StageRecord[]>;

  for (const stage of STAGE_CONFIGS) {
    const serverAvailable = Array.from({ length: stage.servers }, () => 0);
    const stageEpisodes = episodes
      .filter((episode) => episode.route.includes(stage.id))
      .sort((a, b) => {
        const aPriorityReady = a.readyTime - (a.priorityBand === "urgent" ? 12 : 0);
        const bPriorityReady = b.readyTime - (b.priorityBand === "urgent" ? 12 : 0);
        return aPriorityReady - bPriorityReady || a.readyTime - b.readyTime || a.id - b.id;
      });

    for (const episode of stageEpisodes) {
      let serverIndex = 0;
      for (let index = 1; index < serverAvailable.length; index += 1) {
        if ((serverAvailable[index] ?? 0) < (serverAvailable[serverIndex] ?? 0)) serverIndex = index;
      }

      const effective = effectiveStage(stage, episode, active);
      const calendarReadyTime = nextOpen(episode.readyTime, stage.calendar);
      const startCandidate = Math.max(calendarReadyTime, serverAvailable[serverIndex] ?? 0);
      const startTime = nextOpen(startCandidate, stage.calendar);
      const exception = stableUniform(episode.id, stage.id, "exception") < effective.exceptionRate;
      const complexity = 0.82 + episode.complexityFactor * 0.18;
      const workHours = effective.serviceHours * complexity + (exception ? effective.reworkHours : 0);
      const finishTime = addWorkingHours(startTime, workHours, stage.calendar);
      const touchCount = effective.touches + (exception ? 2 : 0);

      serverAvailable[serverIndex] = finishTime;
      episode.touches += touchCount;
      episode.completionTime = finishTime;
      episode.readyTime = finishTime + effective.handoffHours;
      records[stage.id].push({
        episodeId: episode.id,
        readyTime: calendarReadyTime,
        startTime,
        finishTime,
        touches: touchCount,
        exception,
      });
    }
  }

  const stageResults = Object.fromEntries(
    STAGE_CONFIGS.map((stage) => {
      const stageRecords = records[stage.id];
      const waits = stageRecords.map((record) => Math.max(0, record.startTime - record.readyTime));
      const queueEvents = stageRecords
        .filter(
          (record) =>
            record.readyTime <= HORIZON_HOURS && record.startTime - record.readyTime > 0.001,
        )
        .flatMap((record) => [
          { time: record.readyTime, delta: 1 },
          { time: Math.min(record.startTime, HORIZON_HOURS), delta: -1 },
        ])
        .sort((a, b) => a.time - b.time || a.delta - b.delta);
      let queueDepth = 0;
      let peakQueue = 0;
      for (const event of queueEvents) {
        queueDepth += event.delta;
        peakQueue = Math.max(peakQueue, queueDepth);
      }
      const queueAtHorizon = stageRecords.filter(
        (record) => record.readyTime <= HORIZON_HOURS && record.startTime > HORIZON_HOURS,
      ).length;
      const completedByHorizon = stageRecords.filter((record) => record.finishTime <= HORIZON_HOURS).length;
      const averageTouches =
        stageRecords.reduce((sum, record) => sum + record.touches, 0) / Math.max(1, stageRecords.length);
      return [
        stage.id,
        {
          id: stage.id,
          name: stage.name,
          shortName: stage.shortName,
          leverId: stage.leverId,
          queueAtHorizon,
          peakQueue,
          averageWaitHours: waits.reduce((sum, wait) => sum + wait, 0) / Math.max(1, waits.length),
          completedByHorizon,
          averageTouches,
        },
      ];
    }),
  ) as Record<StageId, StageResult>;

  const completed = episodes.filter((episode) => episode.completionTime <= HORIZON_HOURS).length;
  const journeys = episodes.map((episode) => (episode.completionTime - episode.arrivalTime) / 24);
  const administrativeTouches =
    episodes.reduce((sum, episode) => sum + episode.touches, 0) / Math.max(1, episodes.length);
  const constraint = STAGE_CONFIGS.reduce((current, candidate) => {
    const currentResult = stageResults[current.id];
    const candidateResult = stageResults[candidate.id];
    const currentPressure = stagePressureScore(currentResult);
    const candidatePressure = stagePressureScore(candidateResult);
    return candidatePressure > currentPressure ? candidate : current;
  }, STAGE_CONFIGS[0]).id;

  return {
    episodes: SIMULATION_EPISODES,
    completed,
    medianJourneyDays: Math.round(quantile(journeys, 0.5) * 2) / 2,
    administrativeTouches: Math.round(administrativeTouches),
    stageResults,
    constraint,
    activeLevers: LEVER_SEQUENCE.filter((lever) => active.has(lever)),
  };
}

export function stagePressureScore(stage: Pick<StageResult, "peakQueue" | "averageWaitHours">) {
  return stage.peakQueue + stage.averageWaitHours / 2;
}

export function buildLeverEvidence(
  lever: LeverId,
  before: SimulationResult,
  after: SimulationResult,
): LeverEvidence {
  const addressedStage = LEVER_EVIDENCE_STAGE[lever];
  const beforeStage = before.stageResults[addressedStage];
  const afterStage = after.stageResults[addressedStage];
  const beforePressure = stagePressureScore(beforeStage);
  const afterPressure = stagePressureScore(afterStage);

  return {
    lever,
    addressedStage,
    beforePressure,
    afterPressure,
    pressureDelta: afterPressure - beforePressure,
    beforeQueue: beforeStage.peakQueue,
    afterQueue: afterStage.peakQueue,
    beforeWaitHours: beforeStage.averageWaitHours,
    afterWaitHours: afterStage.averageWaitHours,
    completedDelta: after.completed - before.completed,
    journeyDeltaDays: after.medianJourneyDays - before.medianJourneyDays,
    administrativeTouchesDelta: after.administrativeTouches - before.administrativeTouches,
  };
}

export function scenarioSignature(result: SimulationResult) {
  return JSON.stringify({
    completed: result.completed,
    medianJourneyDays: result.medianJourneyDays,
    administrativeTouches: result.administrativeTouches,
    constraint: result.constraint,
    queues: STAGE_ORDER.map((stage) => result.stageResults[stage].queueAtHorizon),
  });
}
