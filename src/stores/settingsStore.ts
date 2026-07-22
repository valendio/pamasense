import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KOMATSU_PC1250_GEOMETRY } from '../config/machine';
import type { MachineGeometry } from '../features/machine/machineGeometry';

export type AppSettings = {
  machine: MachineGeometry;
  guidance: {
    gradeToleranceM: number;
    warningToleranceM: number;
    extremeDeviationM: number;
    smoothingSamples: number;
    hysteresisM: number;
    maxVerticalAccuracyM: number;
    maxCorrectionAgeSec: number;
  };
  display: {
    terrainOpacity: number;
    labelSize: number;
    cameraSensitivity: number;
    nearClipM: number;
    farClipM: number;
    lowPerformanceMode: boolean;
    fullscreenStartup: boolean;
  };
  connectivity: {
    telemetryProvider: 'MOCK' | 'WEBSOCKET';
    webSocketUrl: string;
    masterControlEndpoint: string;
    ntripCaster: string;
    ntripMountpoint: string;
    retryIntervalSec: number;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  machine: KOMATSU_PC1250_GEOMETRY,
  guidance: {
    gradeToleranceM: 0.05,
    warningToleranceM: 0.2,
    extremeDeviationM: 0.35,
    smoothingSamples: 4,
    hysteresisM: 0.02,
    maxVerticalAccuracyM: 0.05,
    maxCorrectionAgeSec: 3,
  },
  display: {
    terrainOpacity: 0.84,
    labelSize: 14,
    cameraSensitivity: 1,
    nearClipM: 0.5,
    farClipM: 1200,
    lowPerformanceMode: false,
    fullscreenStartup: false,
  },
  connectivity: {
    telemetryProvider: 'MOCK',
    webSocketUrl: 'ws://127.0.0.1:8080/telemetry',
    masterControlEndpoint: 'http://master-control.local/api',
    ntripCaster: 'ntrip.mine.local:2101',
    ntripMountpoint: 'PIT-A-RTCM3',
    retryIntervalSec: 10,
  },
};

type SettingsState = {
  settings: AppSettings;
  updateSection: <K extends keyof AppSettings>(section: K, values: Partial<AppSettings[K]>) => void;
  resetSettings: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSection: (section, values) =>
        set((state) => ({
          settings: { ...state.settings, [section]: { ...state.settings[section], ...values } },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'pamasense-settings-v1' },
  ),
);
