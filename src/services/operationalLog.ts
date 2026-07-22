import type { GuidanceResult } from '../features/guidance/guidanceTypes';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';

export type OperationalLog = {
  timestamp: string;
  machineId: string;
  bucketEast: number;
  bucketNorth: number;
  bucketElevation: number;
  designElevation: number | null;
  verticalOffset: number | null;
  guidanceStatus: GuidanceResult['status'];
  gnssSolution: MachineTelemetry['gnss']['solution'];
  verticalAccuracyM: number;
  boomAngleDeg: number;
  armAngleDeg: number;
  bucketAngleDeg: number;
};

export function createOperationalLog(
  telemetry: MachineTelemetry,
  guidance: GuidanceResult,
): OperationalLog {
  return {
    timestamp: telemetry.timestamp,
    machineId: telemetry.machineId,
    bucketEast: guidance.bucketTip[0],
    bucketNorth: guidance.bucketTip[2],
    bucketElevation: guidance.bucketTip[1],
    designElevation: guidance.designElevation,
    verticalOffset: guidance.verticalOffset,
    guidanceStatus: guidance.status,
    gnssSolution: telemetry.gnss.solution,
    verticalAccuracyM: telemetry.gnss.verticalAccuracyM,
    boomAngleDeg: telemetry.imu.boomAngleDeg,
    armAngleDeg: telemetry.imu.armAngleDeg,
    bucketAngleDeg: telemetry.imu.bucketAngleDeg,
  };
}
