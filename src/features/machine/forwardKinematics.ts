import { Euler, Matrix4, Vector3 } from 'three';
import type { Vector3Tuple } from '../../types/common';
import type { ExcavatorPose, MachineGeometry } from './machineGeometry';

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Calculates the bucket tooth using a homogeneous transform chain. Mine coordinates use
 * east=X, elevation=Y, north=Z. Positive heading rotates clockwise from grid north.
 */
export function calculateBucketTip(pose: ExcavatorPose, geometry: MachineGeometry): Vector3Tuple {
  const world = new Matrix4().makeTranslation(
    pose.position.east,
    pose.position.elevation,
    pose.position.north,
  );
  // The implement is modelled along local +X; offset the Three.js yaw so heading 0° is grid north.
  const heading = new Matrix4().makeRotationY(radians(pose.headingDeg - 90));
  const body = new Matrix4().makeRotationFromEuler(
    new Euler(radians(pose.bodyRollDeg), 0, radians(pose.bodyPitchDeg), 'XYZ'),
  );
  const boomPivot = new Matrix4().makeTranslation(...geometry.boomPivotOffsetM);
  const boomRotation = new Matrix4().makeRotationZ(radians(pose.boomAngleDeg));
  const boomLength = new Matrix4().makeTranslation(geometry.boomLengthM, 0, 0);
  const armRotation = new Matrix4().makeRotationZ(radians(pose.armAngleDeg));
  const armLength = new Matrix4().makeTranslation(geometry.armLengthM, 0, 0);
  const bucketRotation = new Matrix4().makeRotationZ(radians(pose.bucketAngleDeg));
  const bucketLink = new Matrix4().makeTranslation(geometry.bucketLinkLengthM, 0, 0);
  const tooth = new Matrix4().makeTranslation(...geometry.toothOffsetM);

  const transform = world
    .clone()
    .multiply(heading)
    .multiply(body)
    .multiply(boomPivot)
    .multiply(boomRotation)
    .multiply(boomLength)
    .multiply(armRotation)
    .multiply(armLength)
    .multiply(bucketRotation)
    .multiply(bucketLink)
    .multiply(tooth);

  const result = new Vector3().setFromMatrixPosition(transform);
  return [result.x, result.y, result.z];
}

export function poseFromTelemetry(
  telemetry: import('../telemetry/telemetrySchema').MachineTelemetry,
): ExcavatorPose {
  return {
    position: {
      east: telemetry.gnss.east,
      north: telemetry.gnss.north,
      elevation: telemetry.gnss.elevation,
    },
    headingDeg: telemetry.gnss.headingDeg,
    bodyRollDeg: telemetry.gnss.rollDeg,
    bodyPitchDeg: telemetry.gnss.pitchDeg,
    boomAngleDeg: telemetry.imu.boomAngleDeg,
    armAngleDeg: telemetry.imu.armAngleDeg,
    bucketAngleDeg: telemetry.imu.bucketAngleDeg,
  };
}
