import { describe, expect, it } from 'vitest';
import { getGuidanceQualityFailure } from '../features/guidance/qualityGate';
import { createTelemetry } from './fixtures';

const now = new Date('2026-07-22T07:35:12.500Z').getTime();

describe('guidance quality gating', () => {
  it('accepts fresh RTK FIX and healthy implement telemetry', () => {
    expect(getGuidanceQualityFailure(createTelemetry(), true, now)).toBeNull();
  });

  it('rejects RTK FLOAT', () => {
    const telemetry = createTelemetry({
      gnss: { ...createTelemetry().gnss, solution: 'RTK_FLOAT' },
    });
    expect(getGuidanceQualityFailure(telemetry, true, now)).toBe('RTK solution degraded');
  });

  it('rejects degraded vertical accuracy', () => {
    const telemetry = createTelemetry({
      gnss: { ...createTelemetry().gnss, verticalAccuracyM: 0.2 },
    });
    expect(getGuidanceQualityFailure(telemetry, true, now)).toBe('GNSS vertical accuracy degraded');
  });

  it('rejects stale or offline required sensors', () => {
    expect(
      getGuidanceQualityFailure(
        createTelemetry({ imu: { ...createTelemetry().imu, health: 'OFFLINE' } }),
        true,
        now,
      ),
    ).toBe('Required IMU data unavailable');
    expect(getGuidanceQualityFailure(createTelemetry(), false, now)).toBe(
      'Mine design unavailable',
    );
    expect(getGuidanceQualityFailure(createTelemetry(), true, now + 5000)).toBe(
      'Sensor telemetry is stale',
    );
  });
});
