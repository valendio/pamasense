import { useMemo, useRef } from 'react';
import { GuidanceEngine } from '../features/guidance/guidanceEngine';
import type { GuidanceResult } from '../features/guidance/guidanceTypes';
import { useDesignStore } from '../stores/designStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTelemetryStore } from '../stores/telemetryStore';

const emptyResult: GuidanceResult = {
  valid: false,
  status: 'INVALID',
  reason: 'Waiting for telemetry',
  bucketTip: [0, 0, 0],
  designElevation: null,
  verticalOffset: null,
};

export function useGuidance(): GuidanceResult {
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const design = useDesignStore((state) => state.design);
  const settings = useSettingsStore((state) => state.settings);
  const engine = useRef(new GuidanceEngine());

  return useMemo(() => {
    if (!telemetry) return emptyResult;
    return engine.current.evaluate(telemetry, settings.machine, design, {
      gradeToleranceM: settings.guidance.gradeToleranceM,
      hysteresisM: settings.guidance.hysteresisM,
      qualityLimits: {
        maximumVerticalAccuracyM: settings.guidance.maxVerticalAccuracyM,
        maximumCorrectionAgeSec: settings.guidance.maxCorrectionAgeSec,
        maximumTelemetryAgeMs: 1500,
        minimumGnssQuality: 'RTK_FIX',
      },
    });
  }, [design, settings, telemetry]);
}
