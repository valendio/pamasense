import type { Vector3Tuple } from '../../types/common';

export type MachineGeometry = {
  boomLengthM: number;
  armLengthM: number;
  bucketLinkLengthM: number;
  toothOffsetM: Vector3Tuple;
  boomPivotOffsetM: Vector3Tuple;
  gnssLeverArmM: Vector3Tuple;
  antennaBaselineM: number;
};

export type ExcavatorPose = {
  position: { east: number; north: number; elevation: number };
  headingDeg: number;
  bodyRollDeg: number;
  bodyPitchDeg: number;
  boomAngleDeg: number;
  armAngleDeg: number;
  bucketAngleDeg: number;
};
