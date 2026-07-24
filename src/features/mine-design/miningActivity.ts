import type { ExcavationEvent } from './excavation';

export type MiningActivityEvent = ExcavationEvent & {
  machineId: string;
  designElevationM: number | null;
  actualElevationBeforeM: number | null;
  actualElevationAfterM: number | null;
  deviationAfterM: number | null;
};

export type MiningActivityPoint = {
  timestampMs: number;
  activeUnitCount: number;
  diggingPasses: number;
  averageDeviationM: number | null;
  affectedPoints: number;
};

export type MiningActivitySummary = {
  activeUnitCount: number;
  shovelingUnitCount: number;
  diggingPasses: number;
  averageDeviationM: number | null;
  withinTolerancePercent: number;
  affectedPoints: number;
};

export type MiningActivityResult = {
  series: MiningActivityPoint[];
  summary: MiningActivitySummary;
};

export type MiningActivityOptions = {
  intervalMs?: number;
  bucketCount?: number;
  activeWindowMs?: number;
};

export function calculateMiningActivity(
  events: MiningActivityEvent[],
  toleranceM: number,
  nowMs = Date.now(),
  options: MiningActivityOptions = {},
): MiningActivityResult {
  const intervalMs = options.intervalMs ?? 10_000;
  const bucketCount = options.bucketCount ?? 12;
  const activeWindowMs = options.activeWindowMs ?? 30_000;
  const windowEndMs = Math.ceil(nowMs / intervalMs) * intervalMs;
  const windowStartMs = windowEndMs - intervalMs * bucketCount;
  const windowEvents = events.filter((event) => {
    const timestampMs = new Date(event.timestamp).getTime();
    return (
      Number.isFinite(timestampMs) && timestampMs >= windowStartMs && timestampMs <= windowEndMs
    );
  });

  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    timestampMs: windowStartMs + index * intervalMs,
    machineIds: new Set<string>(),
    deviationsM: [] as number[],
    diggingPasses: 0,
    affectedPoints: 0,
  }));

  for (const event of windowEvents) {
    const timestampMs = new Date(event.timestamp).getTime();
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((timestampMs - windowStartMs) / intervalMs)),
    );
    const bucket = buckets[bucketIndex];
    bucket.machineIds.add(event.machineId);
    bucket.diggingPasses += 1;
    bucket.affectedPoints += event.affectedPoints;
    if (event.deviationAfterM !== null) bucket.deviationsM.push(event.deviationAfterM);
  }

  const validDeviationsM = windowEvents
    .map((event) => event.deviationAfterM)
    .filter((deviation): deviation is number => deviation !== null);
  const activeMachineIds = new Set(
    windowEvents
      .filter((event) => new Date(event.timestamp).getTime() >= nowMs - activeWindowMs)
      .map((event) => event.machineId),
  );
  const shovelingMachineIds = new Set(windowEvents.map((event) => event.machineId));
  const withinToleranceCount = validDeviationsM.filter(
    (deviationM) => Math.abs(deviationM) <= toleranceM,
  ).length;

  return {
    series: buckets.map((bucket) => ({
      timestampMs: bucket.timestampMs,
      activeUnitCount: bucket.machineIds.size,
      diggingPasses: bucket.diggingPasses,
      averageDeviationM: bucket.deviationsM.length
        ? bucket.deviationsM.reduce((total, value) => total + value, 0) / bucket.deviationsM.length
        : null,
      affectedPoints: bucket.affectedPoints,
    })),
    summary: {
      activeUnitCount: activeMachineIds.size,
      shovelingUnitCount: shovelingMachineIds.size,
      diggingPasses: windowEvents.length,
      averageDeviationM: validDeviationsM.length
        ? validDeviationsM.reduce((total, value) => total + value, 0) / validDeviationsM.length
        : null,
      withinTolerancePercent: validDeviationsM.length
        ? (withinToleranceCount / validDeviationsM.length) * 100
        : 0,
      affectedPoints: windowEvents.reduce((total, event) => total + event.affectedPoints, 0),
    },
  };
}
