import { Edges } from '@react-three/drei';
import { memo } from 'react';
import type { MachineGeometry } from '../features/machine/machineGeometry';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';
import { SITE_ORIGIN } from '../config/site';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function BoxPart({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.08} />
      <Edges color="#20252b" threshold={18} />
    </mesh>
  );
}

function CylinderJoint({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.48, 0.48, 1.2, 16]} />
      <meshStandardMaterial color="#2b3036" roughness={0.8} />
    </mesh>
  );
}

export const ExcavatorModel = memo(function ExcavatorModel({
  telemetry,
  geometry,
  lowPerformance,
}: {
  telemetry: MachineTelemetry;
  geometry: MachineGeometry;
  lowPerformance: boolean;
}) {
  const localX = telemetry.gnss.east - SITE_ORIGIN.east;
  const localZ = telemetry.gnss.north - SITE_ORIGIN.north;
  const boom = telemetry.imu.boomAngleDeg;
  const arm = telemetry.imu.armAngleDeg;
  const bucket = telemetry.imu.bucketAngleDeg;

  return (
    <group
      name="ExcavatorRoot"
      position={[localX, telemetry.gnss.elevation, localZ]}
      rotation={[0, toRadians(telemetry.gnss.headingDeg - 90), 0]}
    >
      <group rotation={[toRadians(telemetry.gnss.rollDeg), 0, toRadians(telemetry.gnss.pitchDeg)]}>
        <group name="Undercarriage">
          <BoxPart position={[0, 0.65, -1.65]} scale={[5.8, 0.75, 0.9]} color="#24282c" />
          <BoxPart position={[0, 0.65, 1.65]} scale={[5.8, 0.75, 0.9]} color="#24282c" />
          <BoxPart position={[0, 1.0, 0]} scale={[4.4, 0.55, 3.0]} color="#34383d" />
          {!lowPerformance &&
            Array.from({ length: 6 }).map((_, index) => (
              <group key={index}>
                <mesh
                  position={[-2.3 + index * 0.92, 0.64, -2.15]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.38, 0.38, 0.18, 12]} />
                  <meshStandardMaterial color="#111417" />
                </mesh>
                <mesh
                  position={[-2.3 + index * 0.92, 0.64, 2.15]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.38, 0.38, 0.18, 12]} />
                  <meshStandardMaterial color="#111417" />
                </mesh>
              </group>
            ))}
        </group>
        <group name="UpperStructure" position={[0, 1.45, 0]}>
          <BoxPart position={[-0.7, 1.2, 0]} scale={[4.5, 2.3, 3.8]} color="#f2b318" />
          <BoxPart position={[-2.25, 2.4, -1.15]} scale={[1.6, 2.0, 1.5]} color="#ffc928" />
          <BoxPart position={[-2.55, 2.55, -1.22]} scale={[1.18, 1.28, 1.38]} color="#263c4a" />
          <BoxPart position={[0.55, 2.15, 1.45]} scale={[2.2, 0.85, 0.25]} color="#22262b" />
          <mesh position={[-2.45, 4.04, -1.75]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color="#d8dee5" metalness={0.65} />
          </mesh>
          <mesh position={[-2.45, 4.68, -1.75]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#f3f5f7" />
          </mesh>
          <mesh position={[-2.45, 4.04, 0.65]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color="#d8dee5" metalness={0.65} />
          </mesh>
          <mesh position={[-2.45, 4.68, 0.65]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#f3f5f7" />
          </mesh>
          <group
            name="BoomPivot"
            position={geometry.boomPivotOffsetM}
            rotation={[0, 0, toRadians(boom)]}
          >
            <CylinderJoint />
            <group name="Boom">
              <BoxPart
                position={[geometry.boomLengthM / 2, 0, 0]}
                scale={[geometry.boomLengthM, 0.72, 0.9]}
                color="#ffc928"
              />
              <BoxPart
                position={[geometry.boomLengthM * 0.44, 0.52, 0]}
                scale={[geometry.boomLengthM * 0.76, 0.15, 0.18]}
                color="#d8dee5"
              />
              <group
                name="ArmPivot"
                position={[geometry.boomLengthM, 0, 0]}
                rotation={[0, 0, toRadians(arm)]}
              >
                <CylinderJoint />
                <group name="Arm">
                  <BoxPart
                    position={[geometry.armLengthM / 2, 0, 0]}
                    scale={[geometry.armLengthM, 0.58, 0.72]}
                    color="#f2b318"
                  />
                  <BoxPart
                    position={[geometry.armLengthM * 0.44, -0.46, 0]}
                    scale={[geometry.armLengthM * 0.72, 0.13, 0.16]}
                    color="#cfd6dc"
                  />
                  <group
                    name="BucketPivot"
                    position={[geometry.armLengthM, 0, 0]}
                    rotation={[0, 0, toRadians(bucket)]}
                  >
                    <CylinderJoint />
                    <group name="Bucket">
                      <mesh
                        position={[geometry.bucketLinkLengthM * 0.56, -0.22, 0]}
                        rotation={[0, 0, -0.24]}
                        castShadow
                      >
                        <boxGeometry args={[geometry.bucketLinkLengthM, 1.45, 1.7]} />
                        <meshStandardMaterial color="#d89d19" roughness={0.82} />
                        <Edges color="#292d31" />
                      </mesh>
                      <group name="BucketToothPoint" position={[geometry.bucketLinkLengthM, 0, 0]}>
                        <mesh position={geometry.toothOffsetM} rotation={[0, 0, -0.28]} castShadow>
                          <coneGeometry args={[0.18, 1.2, 4]} />
                          <meshStandardMaterial color="#595f65" roughness={0.8} />
                        </mesh>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
