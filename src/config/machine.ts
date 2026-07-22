import type { MachineGeometry } from '../features/machine/machineGeometry';

export const KOMATSU_PC1250_GEOMETRY: MachineGeometry = {
  boomLengthM: 9.8,
  armLengthM: 6.9,
  bucketLinkLengthM: 2.15,
  toothOffsetM: [1.45, -0.72, 0],
  boomPivotOffsetM: [1.15, 4.25, 0],
  gnssLeverArmM: [-1.1, 5.15, 0.85],
  antennaBaselineM: 2.4,
};

export const EXCAVATOR_CONSTRAINTS = {
  boomAngleDeg: [-25, 70] as const,
  armAngleDeg: [-150, 15] as const,
  bucketAngleDeg: [-160, 50] as const,
  upperStructureHeadingDeg: [0, 360] as const,
};
