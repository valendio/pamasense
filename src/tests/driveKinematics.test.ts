import { describe, expect, it } from 'vitest';
import { advanceExcavatorDrive, RELEASED_DRIVE_INPUT } from '../features/machine/driveKinematics';

describe('excavator drive kinematics', () => {
  it('moves north when W is pressed at a zero-degree heading', () => {
    const next = advanceExcavatorDrive(
      { eastM: 0, northM: 0, headingDeg: 0 },
      { ...RELEASED_DRIVE_INPUT, forward: true },
      1,
    );
    expect(next.eastM).toBeCloseTo(0, 5);
    expect(next.northM).toBeCloseTo(5, 5);
  });

  it('moves east when W is pressed at a 90-degree heading', () => {
    const next = advanceExcavatorDrive(
      { eastM: 0, northM: 0, headingDeg: 90 },
      { ...RELEASED_DRIVE_INPUT, forward: true },
      1,
    );
    expect(next.eastM).toBeCloseTo(5, 5);
    expect(next.northM).toBeCloseTo(0, 5);
  });

  it('pivots a tracked machine with A and D and normalizes the heading', () => {
    const left = advanceExcavatorDrive(
      { eastM: 0, northM: 0, headingDeg: 2 },
      { ...RELEASED_DRIVE_INPUT, left: true },
      0.25,
    );
    const right = advanceExcavatorDrive(
      { eastM: 0, northM: 0, headingDeg: 358 },
      { ...RELEASED_DRIVE_INPUT, right: true },
      0.25,
    );
    expect(left.headingDeg).toBe(356);
    expect(right.headingDeg).toBe(4);
  });

  it('cancels opposing travel commands', () => {
    const next = advanceExcavatorDrive(
      { eastM: 12, northM: -8, headingDeg: 40 },
      { ...RELEASED_DRIVE_INPUT, forward: true, reverse: true },
      1,
    );
    expect(next.eastM).toBe(12);
    expect(next.northM).toBe(-8);
  });
});
