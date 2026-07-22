import { create } from 'zustand';
import {
  MockTelemetryProvider,
  type DiggingScenario,
  type SimulationFault,
  type SimulationSpeed,
} from '../features/telemetry/MockTelemetryProvider';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';
import type { ConnectionStatus } from '../types/common';
import type { TelemetryProvider } from '../features/telemetry/TelemetryProvider';
import { WebSocketTelemetryProvider } from '../features/telemetry/WebSocketTelemetryProvider';
import { useSettingsStore } from './settingsStore';

const mockProvider = new MockTelemetryProvider();
let activeProvider: TelemetryProvider = mockProvider;
let activeProviderKey = 'MOCK';

type TelemetryState = {
  telemetry: MachineTelemetry | null;
  connectionStatus: ConnectionStatus;
  simulationRunning: boolean;
  speed: SimulationSpeed;
  faults: Record<SimulationFault, boolean>;
  initialize: () => Promise<() => void>;
  setSimulationRunning: (running: boolean) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  reset: () => void;
  toggleFault: (fault: SimulationFault) => void;
  setDiggingScenario: (scenario: DiggingScenario) => void;
  setManualAngles: (
    angles: Pick<MachineTelemetry['imu'], 'boomAngleDeg' | 'armAngleDeg' | 'bucketAngleDeg'> | null,
  ) => void;
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  telemetry: null,
  connectionStatus: 'OFFLINE',
  simulationRunning: true,
  speed: 1,
  faults: mockProvider.getFaults(),
  initialize: async () => {
    const connectivity = useSettingsStore.getState().settings.connectivity;
    const requestedKey = `${connectivity.telemetryProvider}:${connectivity.webSocketUrl}`;
    if (requestedKey !== activeProviderKey) {
      activeProvider.disconnect();
      activeProvider =
        connectivity.telemetryProvider === 'WEBSOCKET'
          ? new WebSocketTelemetryProvider(connectivity.webSocketUrl)
          : mockProvider;
      activeProviderKey = requestedKey;
    }
    const unsubscribe = activeProvider.subscribe((telemetry) =>
      set({ telemetry, connectionStatus: activeProvider.getConnectionStatus() }),
    );
    try {
      await activeProvider.connect();
      set({ connectionStatus: activeProvider.getConnectionStatus() });
    } catch (error) {
      console.error('Telemetry provider connection failed.', error);
      set({ connectionStatus: 'ERROR' });
    }
    return unsubscribe;
  },
  setSimulationRunning: (running) => {
    mockProvider.setPaused(!running);
    set({ simulationRunning: running });
  },
  setSpeed: (speed) => {
    mockProvider.setSpeed(speed);
    set({ speed });
  },
  reset: () => {
    mockProvider.reset();
    set({
      faults: mockProvider.getFaults(),
      speed: mockProvider.getSpeed(),
      simulationRunning: !mockProvider.isPaused(),
    });
  },
  toggleFault: (fault) => {
    const enabled = !get().faults[fault];
    mockProvider.setFault(fault, enabled);
    set({ faults: mockProvider.getFaults() });
  },
  setDiggingScenario: (scenario) => {
    mockProvider.setDiggingScenario(scenario);
  },
  setManualAngles: (angles) => {
    mockProvider.setManualAngles(
      angles
        ? {
            boomAngleDeg: angles.boomAngleDeg,
            armAngleDeg: angles.armAngleDeg,
            bucketAngleDeg: angles.bucketAngleDeg,
          }
        : null,
    );
  },
}));
