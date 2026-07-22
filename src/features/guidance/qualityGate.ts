import type { MachineTelemetry } from '../telemetry/telemetrySchema';

export type QualityLimits = {
  maximumVerticalAccuracyM: number;
  maximumCorrectionAgeSec: number;
  maximumTelemetryAgeMs: number;
  minimumGnssQuality: 'RTK_FIX';
};

export const DEFAULT_QUALITY_LIMITS: QualityLimits = {
  maximumVerticalAccuracyM: 0.05,
  maximumCorrectionAgeSec: 3,
  maximumTelemetryAgeMs: 1500,
  minimumGnssQuality: 'RTK_FIX',
};

export function getGuidanceQualityFailure(
  telemetry: MachineTelemetry,
  designAvailable: boolean,
  nowMs = Date.now(),
  limits: QualityLimits = DEFAULT_QUALITY_LIMITS,
): string | null {
  if (!designAvailable) return 'Mine design unavailable';
  if (telemetry.gnss.solution !== limits.minimumGnssQuality) return 'RTK solution degraded';
  if (telemetry.gnss.verticalAccuracyM > limits.maximumVerticalAccuracyM)
    return 'GNSS vertical accuracy degraded';
  if (telemetry.gnss.correctionAgeSec > limits.maximumCorrectionAgeSec)
    return 'Correction data is stale';
  if (telemetry.imu.health !== 'OK') return 'Required IMU data unavailable';
  if (telemetry.machine.canStatus !== 'OK') return 'CAN bus data unavailable';
  if (nowMs - new Date(telemetry.timestamp).getTime() > limits.maximumTelemetryAgeMs)
    return 'Sensor telemetry is stale';
  return null;
}
