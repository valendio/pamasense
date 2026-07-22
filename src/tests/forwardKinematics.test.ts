import { describe, expect, it } from 'vitest';
import { calculateBucketTip } from '../features/machine/forwardKinematics';
import type { ExcavatorPose, MachineGeometry } from '../features/machine/machineGeometry';

const geometry: MachineGeometry = {
  boomLengthM: 2,
  armLengthM: 1,
  bucketLinkLengthM: 0.5,
  toothOffsetM: [0.2, -0.1, 0],
  boomPivotOffsetM: [0, 1, 0],
  gnssLeverArmM: [0, 0, 0],
  antennaBaselineM: 2,
};

const pose: ExcavatorPose = {
  position: { east: 100, north: 200, elevation: 10 },
  headingDeg: 90,
  bodyRollDeg: 0,
  bodyPitchDeg: 0,
  boomAngleDeg: 0,
  armAngleDeg: 0,
  bucketAngleDeg: 0,
};

describe('forward kinematics', () => {
  it('calculates the full bucket-tip transform chain', () => {
    const tip = calculateBucketTip(pose, geometry);
    expect(tip[0]).toBeCloseTo(103.7, 8);
    expect(tip[1]).toBeCloseTo(10.9, 8);
    expect(tip[2]).toBeCloseTo(200, 8);
  });

  it('uses mine heading where zero degrees points grid north', () => {
    const tip = calculateBucketTip({ ...pose, headingDeg: 0 }, geometry);
    expect(tip[0]).toBeCloseTo(100, 8);
    expect(tip[2]).toBeCloseTo(203.7, 8);
  });

  it('propagates boom, arm, and bucket articulation', () => {
    const tip = calculateBucketTip(
      { ...pose, boomAngleDeg: 45, armAngleDeg: -20, bucketAngleDeg: -35 },
      geometry,
    );
    expect(tip.every(Number.isFinite)).toBe(true);
    expect(tip[1]).not.toBeCloseTo(10.9, 2);
  });
});
