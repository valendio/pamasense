import { SITE_ORIGIN } from '../../config/site';
import type { ConnectionStatus } from '../../types/common';
import type { TelemetryProvider } from './TelemetryProvider';
import type { MachineTelemetry } from './telemetrySchema';

export type SimulationFault = 'rtk' | 'imu' | 'network' | 'can';
export type SimulationSpeed = 0.4 | 1 | 2.5;
export type DiggingScenario = 'UNDERDIG' | 'ON_GRADE' | 'OVERDIG';

type ManualAngles = Pick<
  MachineTelemetry['imu'],
  'boomAngleDeg' | 'armAngleDeg' | 'bucketAngleDeg'
>;

function seededNoise(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296 - 0.5;
  };
}

export class MockTelemetryProvider implements TelemetryProvider {
  private listeners = new Set<(data: MachineTelemetry) => void>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private status: ConnectionStatus = 'OFFLINE';
  private paused = false;
  private speed: SimulationSpeed = 1;
  private elapsedSec = 0;
  private noise = seededNoise(21_072_026);
  private faults: Record<SimulationFault, boolean> = {
    rtk: false,
    imu: false,
    network: false,
    can: false,
  };
  private manualAngles: ManualAngles | null = null;

  async connect() {
    if (this.interval) return;
    this.status = 'CONNECTING';
    await Promise.resolve();
    this.status = 'ONLINE';
    this.emit();
    this.interval = setInterval(() => {
      if (!this.paused) this.elapsedSec += 0.05 * this.speed;
      this.emit();
    }, 50);
  }

  disconnect() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.status = 'OFFLINE';
  }

  subscribe(callback: (data: MachineTelemetry) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getConnectionStatus() {
    return this.status;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.emit();
  }

  isPaused() {
    return this.paused;
  }

  setSpeed(speed: SimulationSpeed) {
    this.speed = speed;
  }

  getSpeed() {
    return this.speed;
  }

  reset() {
    this.elapsedSec = 0;
    this.manualAngles = null;
    this.noise = seededNoise(21_072_026);
    this.faults = { rtk: false, imu: false, network: false, can: false };
    this.emit();
  }

  setFault(fault: SimulationFault, enabled: boolean) {
    this.faults[fault] = enabled;
    this.emit();
  }

  getFaults() {
    return { ...this.faults };
  }

  setManualAngles(angles: ManualAngles | null) {
    this.manualAngles = angles;
    this.emit();
  }

  setDiggingScenario(scenario: DiggingScenario) {
    const scenarios: Record<DiggingScenario, ManualAngles> = {
      UNDERDIG: { boomAngleDeg: 38, armAngleDeg: -60, bucketAngleDeg: -40 },
      ON_GRADE: { boomAngleDeg: 28.5, armAngleDeg: -78, bucketAngleDeg: -50 },
      OVERDIG: { boomAngleDeg: 20, armAngleDeg: -95, bucketAngleDeg: -60 },
    };
    this.manualAngles = scenarios[scenario];
    this.emit();
  }

  private emit() {
    const telemetry = this.createTelemetry();
    for (const listener of this.listeners) listener(telemetry);
  }

  private createTelemetry(): MachineTelemetry {
    const t = this.elapsedSec;
    const jitter = this.noise();
    const automaticAngles: ManualAngles = {
      boomAngleDeg: 28 + Math.sin(t * 0.32) * 4.8,
      armAngleDeg: -78 + Math.sin(t * 0.44 + 1.1) * 8,
      bucketAngleDeg: -50 + Math.sin(t * 0.58 + 2.4) * 15,
    };
    const angles = this.manualAngles ?? automaticAngles;
    const networkOnline = !this.faults.network;

    return {
      timestamp: new Date().toISOString(),
      machineId: 'EX-021',
      gnss: {
        east: SITE_ORIGIN.east + 18 + Math.sin(t * 0.025) * 5 + jitter * 0.008,
        north: SITE_ORIGIN.north - 24 + Math.cos(t * 0.021) * 4 + jitter * 0.008,
        elevation: 120.28 + Math.sin(t * 0.12) * 0.025,
        headingDeg: (258.2 + Math.sin(t * 0.08) * 2 + 360) % 360,
        rollDeg: 0.8 + Math.sin(t * 0.9) * 0.18,
        pitchDeg: -1.1 + Math.cos(t * 0.7) * 0.22,
        solution: this.faults.rtk ? 'RTK_FLOAT' : 'RTK_FIX',
        horizontalAccuracyM: this.faults.rtk ? 0.38 : 0.012 + Math.abs(jitter) * 0.002,
        verticalAccuracyM: this.faults.rtk ? 0.72 : 0.024 + Math.abs(jitter) * 0.004,
        correctionAgeSec: this.faults.rtk ? 6.8 : 0.7 + Math.abs(jitter) * 0.12,
        satelliteCount: this.faults.rtk ? 8 : 22,
        headingAccuracyDeg: this.faults.rtk ? 1.8 : 0.06,
      },
      imu: {
        ...angles,
        updateRateHz: 20,
        health: this.faults.imu ? 'FAULT' : 'OK',
      },
      machine: {
        engineRunning: true,
        hydraulicPressureBar: 278 + Math.sin(t * 1.1) * 12,
        canStatus: this.faults.can ? 'ERROR' : 'OK',
      },
      network: {
        online: networkOnline,
        signalStrengthPercent: networkOnline ? 76 + Math.round(Math.sin(t * 0.1) * 8) : 0,
        masterControlConnected: networkOnline,
      },
    };
  }
}
