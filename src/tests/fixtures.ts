import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';

export function createTelemetry(overrides: Partial<MachineTelemetry> = {}): MachineTelemetry {
  const base: MachineTelemetry = {
    timestamp: '2026-07-22T07:35:12.120Z',
    machineId: 'EX-021',
    gnss: {
      east: 473221.427,
      north: 9238744.118,
      elevation: 120.2,
      headingDeg: 258.2,
      rollDeg: 0.8,
      pitchDeg: -1.1,
      solution: 'RTK_FIX',
      horizontalAccuracyM: 0.012,
      verticalAccuracyM: 0.024,
      correctionAgeSec: 0.7,
      satelliteCount: 22,
      headingAccuracyDeg: 0.06,
    },
    imu: {
      boomAngleDeg: 32.4,
      armAngleDeg: -67.8,
      bucketAngleDeg: -41.2,
      updateRateHz: 20,
      health: 'OK',
    },
    machine: {
      engineRunning: true,
      hydraulicPressureBar: 281,
      canStatus: 'OK',
    },
    network: {
      online: true,
      signalStrengthPercent: 78,
      masterControlConnected: true,
    },
  };
  return {
    ...base,
    ...overrides,
    gnss: { ...base.gnss, ...overrides.gnss },
    imu: { ...base.imu, ...overrides.imu },
    machine: { ...base.machine, ...overrides.machine },
    network: { ...base.network, ...overrides.network },
  };
}
