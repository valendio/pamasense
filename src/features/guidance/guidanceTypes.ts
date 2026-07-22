import type { Vector3Tuple } from '../../types/common';

export type DiggingStatus = 'UNDERDIG' | 'ON_GRADE' | 'OVERDIG';
export type GuidanceStatus = DiggingStatus | 'INVALID';

export type GuidanceResult = {
  valid: boolean;
  status: GuidanceStatus;
  reason: string | null;
  bucketTip: Vector3Tuple;
  designElevation: number | null;
  verticalOffset: number | null;
};
