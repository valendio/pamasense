import { z } from 'zod';

export const telemetrySchema = z.object({
  timestamp: z.string().datetime(),
  machineId: z.string().min(1),
  gnss: z.object({
    east: z.number().finite(),
    north: z.number().finite(),
    elevation: z.number().finite(),
    headingDeg: z.number().finite(),
    rollDeg: z.number().finite(),
    pitchDeg: z.number().finite(),
    solution: z.enum(['RTK_FIX', 'RTK_FLOAT', 'DGPS', 'SPS', 'LOST']),
    horizontalAccuracyM: z.number().nonnegative(),
    verticalAccuracyM: z.number().nonnegative(),
    correctionAgeSec: z.number().nonnegative(),
    satelliteCount: z.number().int().nonnegative(),
    headingAccuracyDeg: z.number().nonnegative(),
  }),
  imu: z.object({
    boomAngleDeg: z.number().finite(),
    armAngleDeg: z.number().finite(),
    bucketAngleDeg: z.number().finite(),
    updateRateHz: z.number().positive(),
    health: z.enum(['OK', 'DEGRADED', 'FAULT', 'OFFLINE']),
  }),
  machine: z.object({
    engineRunning: z.boolean(),
    hydraulicPressureBar: z.number().nonnegative(),
    canStatus: z.enum(['OK', 'DEGRADED', 'ERROR', 'OFFLINE']),
  }),
  network: z.object({
    online: z.boolean(),
    signalStrengthPercent: z.number().min(0).max(100),
    masterControlConnected: z.boolean(),
  }),
});

export type MachineTelemetry = z.infer<typeof telemetrySchema>;

export function validateTelemetry(payload: unknown) {
  return telemetrySchema.safeParse(payload);
}
