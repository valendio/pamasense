import type { MachineGeometry } from '../machine/machineGeometry';
import { calculateBucketTip, poseFromTelemetry } from '../machine/forwardKinematics';
import { getDesignElevation } from '../mine-design/elevationQuery';
import type { TerrainDesign } from '../mine-design/designTypes';
import type { MachineTelemetry } from '../telemetry/telemetrySchema';
import { SITE_ORIGIN } from '../../config/site';
import { classifyWithHysteresis } from './classification';
import type { DiggingStatus, GuidanceResult } from './guidanceTypes';
import { getGuidanceQualityFailure, type QualityLimits } from './qualityGate';

export type GuidanceConfiguration = {
  gradeToleranceM: number;
  hysteresisM: number;
  qualityLimits: QualityLimits;
};

export class GuidanceEngine {
  private previousStatus: DiggingStatus | null = null;

  reset() {
    this.previousStatus = null;
  }

  evaluate(
    telemetry: MachineTelemetry,
    geometry: MachineGeometry,
    design: TerrainDesign | null,
    configuration: GuidanceConfiguration,
    nowMs = Date.now(),
  ): GuidanceResult {
    const bucketTip = calculateBucketTip(poseFromTelemetry(telemetry), geometry);
    const qualityFailure = getGuidanceQualityFailure(
      telemetry,
      Boolean(design),
      nowMs,
      configuration.qualityLimits,
    );
    if (qualityFailure) {
      return {
        valid: false,
        status: 'INVALID',
        reason: qualityFailure,
        bucketTip,
        designElevation: null,
        verticalOffset: null,
      };
    }

    const designElevation = getDesignElevation(
      design,
      bucketTip[0] - (design?.originEast ?? SITE_ORIGIN.east),
      bucketTip[2] - (design?.originNorth ?? SITE_ORIGIN.north),
    );
    if (designElevation === null) {
      return {
        valid: false,
        status: 'INVALID',
        reason: 'Bucket is outside the design surface',
        bucketTip,
        designElevation: null,
        verticalOffset: null,
      };
    }

    const verticalOffset = bucketTip[1] - designElevation;
    this.previousStatus = classifyWithHysteresis(
      verticalOffset,
      this.previousStatus,
      configuration.gradeToleranceM,
      configuration.gradeToleranceM + configuration.hysteresisM,
    );
    return {
      valid: true,
      status: this.previousStatus,
      reason: null,
      bucketTip,
      designElevation,
      verticalOffset,
    };
  }
}
