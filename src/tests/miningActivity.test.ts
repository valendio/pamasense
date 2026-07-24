import { describe, expect, it } from 'vitest';
import {
  calculateMiningActivity,
  type MiningActivityEvent,
} from '../features/mine-design/miningActivity';

const NOW_MS = Date.parse('2026-07-24T04:00:00.000Z');

function activityEvent(overrides: Partial<MiningActivityEvent> = {}): MiningActivityEvent {
  return {
    timestamp: new Date(NOW_MS - 5_000).toISOString(),
    machineId: 'EX-021',
    centerEastM: 10,
    centerNorthM: -20,
    bucketElevationM: 120,
    radiusM: 16,
    affectedPoints: 6,
    maximumCutM: 0.2,
    designElevationM: 120.2,
    actualElevationBeforeM: 120.3,
    actualElevationAfterM: 120.23,
    deviationAfterM: 0.03,
    ...overrides,
  };
}

describe('mining activity calculation', () => {
  it('counts unique shoveling units and digging passes per interval', () => {
    const result = calculateMiningActivity(
      [
        activityEvent(),
        activityEvent({
          timestamp: new Date(NOW_MS - 4_000).toISOString(),
          machineId: 'EX-034',
        }),
      ],
      0.05,
      NOW_MS,
    );

    expect(result.summary.activeUnitCount).toBe(2);
    expect(result.summary.shovelingUnitCount).toBe(2);
    expect(result.summary.diggingPasses).toBe(2);
    expect(result.series.at(-1)?.activeUnitCount).toBe(2);
    expect(result.series.at(-1)?.diggingPasses).toBe(2);
  });

  it('calculates average actual-design deviation and tolerance compliance', () => {
    const result = calculateMiningActivity(
      [
        activityEvent({ deviationAfterM: 0.03 }),
        activityEvent({
          timestamp: new Date(NOW_MS - 15_000).toISOString(),
          deviationAfterM: -0.09,
        }),
      ],
      0.05,
      NOW_MS,
    );

    expect(result.summary.averageDeviationM).toBeCloseTo(-0.03, 6);
    expect(result.summary.withinTolerancePercent).toBe(50);
    expect(result.summary.affectedPoints).toBe(12);
  });

  it('excludes activity outside the rolling window', () => {
    const result = calculateMiningActivity(
      [activityEvent({ timestamp: new Date(NOW_MS - 130_000).toISOString() })],
      0.05,
      NOW_MS,
    );

    expect(result.summary.shovelingUnitCount).toBe(0);
    expect(result.summary.diggingPasses).toBe(0);
    expect(result.summary.averageDeviationM).toBeNull();
    expect(result.series).toHaveLength(12);
  });
});
