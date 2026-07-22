export type DriveInput = {
  forward: boolean;
  reverse: boolean;
  left: boolean;
  right: boolean;
};

export type DriveControlKey = keyof DriveInput;

export type DrivePose = {
  eastM: number;
  northM: number;
  headingDeg: number;
};

export const RELEASED_DRIVE_INPUT: DriveInput = {
  forward: false,
  reverse: false,
  left: false,
  right: false,
};

const normalizeHeading = (headingDeg: number) => ((headingDeg % 360) + 360) % 360;

export function advanceExcavatorDrive(
  pose: DrivePose,
  input: DriveInput,
  deltaSec: number,
  travelSpeedMps = 5,
  turnRateDegPerSec = 24,
): DrivePose {
  const travelDirection = Number(input.forward) - Number(input.reverse);
  const turnDirection = Number(input.right) - Number(input.left);
  const headingDeg = normalizeHeading(
    pose.headingDeg + turnDirection * turnRateDegPerSec * deltaSec,
  );
  const headingRad = (headingDeg * Math.PI) / 180;
  const distanceM = travelDirection * travelSpeedMps * deltaSec;

  return {
    eastM: pose.eastM + Math.sin(headingRad) * distanceM,
    northM: pose.northM + Math.cos(headingRad) * distanceM,
    headingDeg,
  };
}
