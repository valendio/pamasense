import { useEffect, useRef, type ReactNode } from 'react';
import { useGuidance } from '../hooks/useGuidance';
import { createOperationalLog } from '../services/operationalLog';
import { useAlarmStore } from '../stores/alarmStore';
import { useLogStore } from '../stores/logStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useDesignStore } from '../stores/designStore';
import { SITE_ORIGIN } from '../config/site';

function OperationalServices() {
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const initialize = useTelemetryStore((state) => state.initialize);
  const appendLog = useLogStore((state) => state.append);
  const triggerAlarm = useAlarmStore((state) => state.trigger);
  const guidance = useGuidance();
  const lastLogMs = useRef(0);
  const lastTerrainUpdateMs = useRef(0);
  const previousBucketSample = useRef<{ elevationM: number; timestampMs: number } | null>(null);
  const lastSynchronizationMs = useRef(0);
  const activeFaults = useRef(new Set<string>());
  const excavateActualTerrain = useDesignStore((state) => state.excavateActualTerrain);
  const design = useDesignStore((state) => state.design);
  const hydrateDesign = useDesignStore((state) => state.hydrate);
  const pendingPoints = useDesignStore((state) => state.pendingPoints);
  const retrySynchronization = useDesignStore((state) => state.retrySync);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    void initialize().then((cleanup) => {
      if (disposed) cleanup();
      else unsubscribe = cleanup;
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [initialize]);

  useEffect(() => {
    void hydrateDesign();
  }, [hydrateDesign]);

  useEffect(() => {
    if (!telemetry) return;
    const timestamp = new Date(telemetry.timestamp).getTime();
    if (timestamp - lastLogMs.current >= 1000) {
      appendLog(createOperationalLog(telemetry, guidance));
      lastLogMs.current = timestamp;
    }
    const previousBucket = previousBucketSample.current;
    const downwardMovementM = previousBucket
      ? previousBucket.elevationM - guidance.bucketTip[1]
      : 0;
    const sampleIntervalMs = previousBucket ? timestamp - previousBucket.timestampMs : 0;
    const bucketIsDigging =
      guidance.valid &&
      telemetry.machine.engineRunning &&
      telemetry.machine.hydraulicPressureBar > 180 &&
      sampleIntervalMs > 0 &&
      downwardMovementM > 0.002;
    if (bucketIsDigging && timestamp - lastTerrainUpdateMs.current >= 350) {
      const event = excavateActualTerrain(
        guidance.bucketTip[0] - (design?.originEast ?? SITE_ORIGIN.east),
        guidance.bucketTip[2] - (design?.originNorth ?? SITE_ORIGIN.north),
        guidance.bucketTip[1],
      );
      if (event) lastTerrainUpdateMs.current = timestamp;
    }
    previousBucketSample.current = {
      elevationM: guidance.bucketTip[1],
      timestampMs: timestamp,
    };
    if (
      telemetry.network.online &&
      pendingPoints > 0 &&
      timestamp - lastSynchronizationMs.current >= 5000
    ) {
      retrySynchronization();
      lastSynchronizationMs.current = timestamp;
    }

    const conditions = [
      {
        id: 'rtk-live',
        active: telemetry.gnss.solution !== 'RTK_FIX',
        severity: 'CRITICAL' as const,
        title: 'RTK solution degraded',
        description: 'Guidance is unavailable until an RTK FIX solution is restored.',
      },
      {
        id: 'imu-live',
        active: telemetry.imu.health !== 'OK',
        severity: 'CRITICAL' as const,
        title: 'IMU disconnected',
        description: 'One or more implement angle sensors are unavailable.',
      },
      {
        id: 'network-live',
        active: !telemetry.network.online,
        severity: 'WARNING' as const,
        title: 'Network offline',
        description: 'Cabin guidance remains active; updates are queued for synchronization.',
      },
      {
        id: 'can-live',
        active: telemetry.machine.canStatus !== 'OK',
        severity: 'CRITICAL' as const,
        title: 'CAN bus error',
        description: 'Implement pose data cannot be trusted.',
      },
      {
        id: 'critical-overdig',
        active: guidance.valid && (guidance.verticalOffset ?? 0) < -0.35,
        severity: 'CRITICAL' as const,
        title: 'Critical overdig',
        description: 'Bucket tooth is more than 0.35 m below the active design.',
      },
    ];
    for (const condition of conditions) {
      if (condition.active && !activeFaults.current.has(condition.id)) {
        triggerAlarm(condition);
        activeFaults.current.add(condition.id);
      } else if (!condition.active) activeFaults.current.delete(condition.id);
    }
  }, [
    appendLog,
    design,
    guidance,
    pendingPoints,
    retrySynchronization,
    excavateActualTerrain,
    telemetry,
    triggerAlarm,
  ]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <OperationalServices />
      {children}
    </>
  );
}
