import { Edges, Line, RoundedBox } from '@react-three/drei';
import { memo, useMemo } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Quaternion,
  Shape,
  Vector3,
} from 'three';
import { SITE_ORIGIN } from '../config/site';
import type { MachineGeometry } from '../features/machine/machineGeometry';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';

type VectorTuple = [number, number, number];
type ProfileKind = 'BOOM' | 'ARM' | 'BUCKET';

const COLORS = {
  yellow: '#f5b819',
  yellowLight: '#ffc928',
  yellowDark: '#d89500',
  track: '#1b2025',
  frame: '#30363b',
  steel: '#b9c2c9',
  rod: '#e3e9ed',
  glass: '#183b55',
  bucketInside: '#33383c',
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function RoundedPart({
  position,
  size,
  color,
  radius = 0.16,
}: {
  position: VectorTuple;
  size: VectorTuple;
  color: string;
  radius?: number;
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={radius}
      smoothness={5}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.68} metalness={0.12} />
    </RoundedBox>
  );
}

function CylinderBetween({
  start,
  end,
  radius,
  color,
  radialSegments = 24,
}: {
  start: VectorTuple;
  end: VectorTuple;
  radius: number;
  color: string;
  radialSegments?: number;
}) {
  const from = new Vector3(...start);
  const to = new Vector3(...end);
  const direction = to.clone().sub(from);
  const length = direction.length();
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, radialSegments]} />
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.58} />
    </mesh>
  );
}

function HydraulicCylinder({
  start,
  end,
  barrelRadius = 0.18,
}: {
  start: VectorTuple;
  end: VectorTuple;
  barrelRadius?: number;
}) {
  const from = new Vector3(...start);
  const to = new Vector3(...end);
  const barrelEnd = from.clone().lerp(to, 0.64).toArray() as VectorTuple;
  const rodStart = from.clone().lerp(to, 0.48).toArray() as VectorTuple;
  return (
    <group>
      <CylinderBetween
        start={start}
        end={barrelEnd}
        radius={barrelRadius}
        color={COLORS.yellowDark}
      />
      <CylinderBetween start={rodStart} end={end} radius={barrelRadius * 0.53} color={COLORS.rod} />
      <mesh position={start} castShadow>
        <sphereGeometry args={[barrelRadius * 1.22, 18, 12]} />
        <meshStandardMaterial color={COLORS.frame} metalness={0.4} roughness={0.48} />
      </mesh>
      <mesh position={end} castShadow>
        <sphereGeometry args={[barrelRadius * 0.85, 18, 12]} />
        <meshStandardMaterial color={COLORS.frame} metalness={0.4} roughness={0.48} />
      </mesh>
    </group>
  );
}

function JointPin({ radius = 0.48, width = 1.35 }: { radius?: number; width?: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 32]} />
        <meshStandardMaterial color={COLORS.frame} roughness={0.62} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0, width / 2 + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.05, 32]} />
        <meshStandardMaterial color={COLORS.steel} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, -width / 2 - 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.05, 32]} />
        <meshStandardMaterial color={COLORS.steel} roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  );
}

function ProfilePart({
  kind,
  length,
  width,
  color,
  detailed,
}: {
  kind: ProfileKind;
  length: number;
  width: number;
  color: string;
  detailed: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    if (kind === 'BOOM') {
      shape.moveTo(-0.32, -0.42);
      shape.lineTo(length * 0.28, -0.52);
      shape.bezierCurveTo(length * 0.4, -0.35, length * 0.47, 0.86, length * 0.62, 0.92);
      shape.lineTo(length * 0.84, 0.56);
      shape.lineTo(length + 0.24, 0.28);
      shape.lineTo(length + 0.2, -0.3);
      shape.lineTo(length * 0.58, -0.12);
      shape.lineTo(length * 0.27, -0.12);
      shape.closePath();
    } else if (kind === 'ARM') {
      shape.moveTo(-0.22, -0.42);
      shape.lineTo(length * 0.18, -0.5);
      shape.bezierCurveTo(length * 0.45, -0.7, length * 0.76, -0.62, length + 0.18, -0.35);
      shape.lineTo(length + 0.18, 0.34);
      shape.lineTo(length * 0.7, 0.25);
      shape.lineTo(length * 0.2, 0.48);
      shape.lineTo(-0.2, 0.38);
      shape.closePath();
    } else {
      shape.moveTo(-0.08, 0.44);
      shape.lineTo(length * 0.26, 0.58);
      shape.bezierCurveTo(length * 0.58, 0.62, length * 0.88, 0.18, length, -0.28);
      shape.lineTo(length, -0.7);
      shape.bezierCurveTo(length * 0.8, -1.16, length * 0.42, -1.18, length * 0.16, -0.72);
      shape.lineTo(-0.06, -0.24);
      shape.closePath();
    }
    const result = new ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelSize: detailed ? 0.075 : 0.035,
      bevelThickness: detailed ? 0.065 : 0.03,
      bevelSegments: detailed ? 4 : 1,
      curveSegments: detailed ? 16 : 6,
      steps: 1,
    });
    result.translate(0, 0, -width / 2);
    result.computeVertexNormals();
    return result;
  }, [detailed, kind, length, width]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.68} metalness={0.1} />
      <Edges color="#34383c" threshold={28} />
    </mesh>
  );
}

const TrackAssembly = memo(function TrackAssembly({
  sideZ,
  detailed,
}: {
  sideZ: number;
  detailed: boolean;
}) {
  const shoeCount = detailed ? 16 : 9;
  return (
    <group position={[0, 0, sideZ]}>
      <RoundedBox
        args={[7.5, 1.62, 0.74]}
        position={[0, 0.82, 0]}
        radius={0.46}
        smoothness={6}
        castShadow
      >
        <meshStandardMaterial color={COLORS.track} roughness={0.94} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[5.45, 0.72, 0.86]} position={[0, 0.88, 0]} radius={0.24} smoothness={4}>
        <meshStandardMaterial color={COLORS.frame} roughness={0.82} metalness={0.18} />
      </RoundedBox>
      {[-2.85, 2.85].map((x) => (
        <group key={x} position={[x, 0.82, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.72, 0.88, 32]} />
            <meshStandardMaterial color="#171a1d" roughness={0.74} metalness={0.22} />
          </mesh>
          <mesh position={[0, 0, sideZ > 0 ? 0.46 : -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.045, 28]} />
            <meshStandardMaterial color={COLORS.yellowDark} roughness={0.55} metalness={0.2} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 6 }, (_, index) => -2.05 + index * 0.82).map((x) => (
        <group key={x} position={[x, 0.68, sideZ > 0 ? 0.45 : -0.45]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.39, 0.39, 0.12, 24]} />
            <meshStandardMaterial color="#0f1215" roughness={0.76} />
          </mesh>
          <mesh position={[0, 0, sideZ > 0 ? 0.07 : -0.07]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 20]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.62} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: shoeCount }, (_, index) => {
        const x = -3.35 + (index / (shoeCount - 1)) * 6.7;
        return (
          <group key={x}>
            <mesh position={[x, 1.67, 0]} castShadow>
              <boxGeometry args={[0.36, 0.12, 1.02]} />
              <meshStandardMaterial color="#292e32" roughness={0.94} metalness={0.12} />
            </mesh>
            <mesh position={[x, -0.03, 0]} castShadow>
              <boxGeometry args={[0.36, 0.12, 1.02]} />
              <meshStandardMaterial color="#292e32" roughness={0.94} metalness={0.12} />
            </mesh>
          </group>
        );
      })}
      {detailed &&
        [-1, 1].flatMap((side) =>
          Array.from({ length: 5 }, (_, index) => {
            const angle = -0.8 + index * 0.4;
            return (
              <mesh
                key={`${side}-${index}`}
                position={[
                  side * (3.48 + Math.cos(angle) * 0.16),
                  0.82 + Math.sin(angle) * 0.72,
                  0,
                ]}
                rotation={[0, 0, side * angle]}
              >
                <boxGeometry args={[0.18, 0.38, 1.02]} />
                <meshStandardMaterial color="#292e32" roughness={0.94} />
              </mesh>
            );
          }),
        )}
    </group>
  );
});

const UpperStructureBody = memo(function UpperStructureBody({ detailed }: { detailed: boolean }) {
  return (
    <group>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[2.05, 2.05, 0.46, 48]} />
        <meshStandardMaterial color={COLORS.frame} roughness={0.64} metalness={0.25} />
      </mesh>
      <RoundedPart
        position={[-0.75, 2.43, 0.25]}
        size={[5.35, 1.75, 4.15]}
        color={COLORS.yellowDark}
        radius={0.34}
      />
      <RoundedPart
        position={[-2.25, 2.55, 0.4]}
        size={[2.25, 2.05, 3.8]}
        color={COLORS.yellow}
        radius={0.62}
      />
      <RoundedPart
        position={[-0.55, 3.38, 1.28]}
        size={[2.7, 1.1, 1.26]}
        color={COLORS.yellow}
        radius={0.22}
      />
      <RoundedPart
        position={[0.42, 3.52, -1.28]}
        size={[2.34, 2.72, 2.22]}
        color={COLORS.yellowLight}
        radius={0.2}
      />
      <mesh position={[1.61, 3.66, -1.28]} castShadow>
        <boxGeometry args={[0.065, 1.78, 1.72]} />
        <meshStandardMaterial
          color={COLORS.glass}
          transparent
          opacity={0.78}
          roughness={0.16}
          metalness={0.18}
        />
      </mesh>
      <mesh position={[0.48, 3.72, -2.41]} castShadow>
        <boxGeometry args={[1.66, 1.7, 0.06]} />
        <meshStandardMaterial
          color={COLORS.glass}
          transparent
          opacity={0.76}
          roughness={0.16}
          metalness={0.18}
        />
      </mesh>
      <mesh position={[-0.53, 3.72, -2.4]} castShadow>
        <boxGeometry args={[0.34, 1.7, 0.065]} />
        <meshStandardMaterial color="#20272c" roughness={0.55} />
      </mesh>
      <RoundedPart
        position={[0.42, 5.0, -1.28]}
        size={[2.55, 0.22, 2.38]}
        color={COLORS.yellowDark}
        radius={0.1}
      />
      <mesh position={[1.75, 4.75, -1.9]}>
        <boxGeometry args={[0.12, 0.2, 0.38]} />
        <meshStandardMaterial color="#fff4c4" emissive="#ffd65a" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-1.45, 3.62, 2.24]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[1.12, 0.08, 1.84]} />
        <meshStandardMaterial color="#343a3e" roughness={0.76} />
      </mesh>
      {detailed &&
        Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[-1.45, 3.16 + index * 0.15, 2.29]}>
            <boxGeometry args={[1.72, 0.055, 0.07]} />
            <meshStandardMaterial color="#15191c" roughness={0.8} />
          </mesh>
        ))}
      <mesh position={[-2.48, 4.42, 1.25]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 1.9, 28]} />
        <meshStandardMaterial color="#353a3e" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[-2.48, 5.38, 1.25]} castShadow>
        <cylinderGeometry args={[0.25, 0.14, 0.18, 28]} />
        <meshStandardMaterial color="#21262a" />
      </mesh>
      {detailed && (
        <>
          <Line
            points={[
              [-2.55, 4.25, -2.08],
              [-2.55, 5.1, -2.08],
              [1.0, 5.1, -2.08],
            ]}
            color="#d8dee3"
            lineWidth={1.3}
          />
          <Line
            points={[
              [-2.55, 4.25, 2.08],
              [-2.55, 4.9, 2.08],
              [-0.4, 4.9, 2.08],
            ]}
            color="#d8dee3"
            lineWidth={1.3}
          />
          {[-1.9, -1.1, -0.3, 0.5].map((x) => (
            <CylinderBetween
              key={x}
              start={[x, 4.6, -2.08]}
              end={[x, 5.1, -2.08]}
              radius={0.025}
              color={COLORS.steel}
              radialSegments={12}
            />
          ))}
        </>
      )}
      {[
        { name: 'GNSSAntenna1', position: [-1.55, 5.46, -1.18] as VectorTuple },
        { name: 'GNSSAntenna2', position: [-1.55, 5.46, 1.22] as VectorTuple },
      ].map((antenna) => (
        <group key={antenna.name} name={antenna.name} position={antenna.position}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.7, 16]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.14, 32]} />
            <meshStandardMaterial color="#f5f7f8" roughness={0.38} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

function Tooth({ position, named = false }: { position: VectorTuple; named?: boolean }) {
  const content = (
    <mesh position={[-0.47, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
      <coneGeometry args={[0.18, 0.94, 16]} />
      <meshStandardMaterial color="#626a70" roughness={0.64} metalness={0.28} />
    </mesh>
  );
  return named ? (
    <group name="BucketToothPoint" position={position}>
      {content}
    </group>
  ) : (
    <group position={position}>{content}</group>
  );
}

function BucketShell({ length, width }: { length: number; width: number }) {
  const geometry = useMemo(() => {
    const profile: [number, number][] = [
      [0.32, 0.36],
      [length * 0.32, 0.56],
      [length * 0.61, 0.34],
      [length * 0.84, 0.02],
      [length, -0.34],
      [length * 0.98, -0.67],
      [length * 0.82, -0.92],
    ];
    const positions: number[] = [];
    for (let index = 0; index < profile.length - 1; index += 1) {
      const current = profile[index];
      const next = profile[index + 1];
      positions.push(
        current[0],
        current[1],
        -width / 2,
        current[0],
        current[1],
        width / 2,
        next[0],
        next[1],
        -width / 2,
        next[0],
        next[1],
        -width / 2,
        current[0],
        current[1],
        width / 2,
        next[0],
        next[1],
        width / 2,
      );
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(positions, 3));
    result.computeVertexNormals();
    result.computeBoundingSphere();
    return result;
  }, [length, width]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={COLORS.yellowDark}
        roughness={0.72}
        metalness={0.12}
        side={DoubleSide}
      />
    </mesh>
  );
}

function BucketAssembly({ geometry, detailed }: { geometry: MachineGeometry; detailed: boolean }) {
  const tipX = geometry.bucketLinkLengthM + geometry.toothOffsetM[0];
  const tipY = geometry.toothOffsetM[1];
  const bucketLength = tipX - 0.52;
  const width = 2.72;
  return (
    <group name="Bucket">
      <BucketShell length={bucketLength} width={width - 0.18} />
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * (width / 2 - 0.08)]}>
          <ProfilePart
            kind="BUCKET"
            length={bucketLength}
            width={0.16}
            color={COLORS.yellowDark}
            detailed={detailed}
          />
          {detailed && (
            <Line
              points={[
                [0.28, 0.25, side * 0.1],
                [bucketLength * 0.54, 0.34, side * 0.1],
                [bucketLength * 0.9, -0.38, side * 0.1],
              ]}
              color="#6a5321"
              lineWidth={1.2}
            />
          )}
        </group>
      ))}
      <mesh position={[tipX - 0.54, tipY + 0.05, 0]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.64, 0.2, width + 0.22]} />
        <meshStandardMaterial color="#565d62" roughness={0.68} metalness={0.25} />
      </mesh>
      {[-1.02, -0.51, 0.51, 1.02].map((z) => (
        <Tooth key={z} position={[tipX, tipY, z]} />
      ))}
      <Tooth
        named
        position={[
          geometry.bucketLinkLengthM + geometry.toothOffsetM[0],
          geometry.toothOffsetM[1],
          geometry.toothOffsetM[2],
        ]}
      />
      {detailed && (
        <>
          <mesh position={[0.65, 0.22, width / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.55} roughness={0.38} />
          </mesh>
          <mesh position={[0.65, 0.22, -width / 2 - 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.55} roughness={0.38} />
          </mesh>
        </>
      )}
    </group>
  );
}

function ArticulatedImplement({
  geometry,
  boomAngleDeg,
  armAngleDeg,
  bucketAngleDeg,
  detailed,
}: {
  geometry: MachineGeometry;
  boomAngleDeg: number;
  armAngleDeg: number;
  bucketAngleDeg: number;
  detailed: boolean;
}) {
  const boomAngle = toRadians(boomAngleDeg);
  const armAngle = toRadians(armAngleDeg);
  const boomCylinderPoint: VectorTuple = [
    geometry.boomPivotOffsetM[0] + Math.cos(boomAngle) * geometry.boomLengthM * 0.48,
    geometry.boomPivotOffsetM[1] + Math.sin(boomAngle) * geometry.boomLengthM * 0.48 + 0.5,
    0,
  ];
  const stickCylinderEnd: VectorTuple = [
    geometry.boomLengthM + Math.cos(armAngle) * geometry.armLengthM * 0.3,
    Math.sin(armAngle) * geometry.armLengthM * 0.3 + 0.32,
    0,
  ];

  return (
    <group>
      <HydraulicCylinder
        start={[0.15, 2.18, 0.72]}
        end={[boomCylinderPoint[0], boomCylinderPoint[1], 0.72]}
        barrelRadius={0.22}
      />
      <HydraulicCylinder
        start={[0.15, 2.18, -0.72]}
        end={[boomCylinderPoint[0], boomCylinderPoint[1], -0.72]}
        barrelRadius={0.22}
      />
      <group name="BoomPivot" position={geometry.boomPivotOffsetM} rotation={[0, 0, boomAngle]}>
        <JointPin radius={0.5} width={1.65} />
        <group name="Boom">
          <ProfilePart
            kind="BOOM"
            length={geometry.boomLengthM}
            width={1.45}
            color={COLORS.yellowLight}
            detailed={detailed}
          />
          <HydraulicCylinder
            start={[geometry.boomLengthM * 0.28, 0.76, 0]}
            end={stickCylinderEnd}
            barrelRadius={0.17}
          />
          {detailed && (
            <>
              <Line
                points={[
                  [0.3, 0.48, 0.76],
                  [geometry.boomLengthM * 0.48, 1.02, 0.76],
                  [geometry.boomLengthM * 0.92, 0.44, 0.76],
                ]}
                color="#24292d"
                lineWidth={1.15}
              />
              <Line
                points={[
                  [0.3, 0.48, -0.76],
                  [geometry.boomLengthM * 0.48, 1.02, -0.76],
                  [geometry.boomLengthM * 0.92, 0.44, -0.76],
                ]}
                color="#24292d"
                lineWidth={1.15}
              />
            </>
          )}
          <group
            name="ArmPivot"
            position={[geometry.boomLengthM, 0, 0]}
            rotation={[0, 0, armAngle]}
          >
            <JointPin radius={0.43} width={1.42} />
            <group name="Arm">
              <ProfilePart
                kind="ARM"
                length={geometry.armLengthM}
                width={1.16}
                color={COLORS.yellow}
                detailed={detailed}
              />
              <HydraulicCylinder
                start={[geometry.armLengthM * 0.12, 0.45, 0]}
                end={[geometry.armLengthM * 0.86, -0.24, 0]}
                barrelRadius={0.15}
              />
              <group
                name="BucketPivot"
                position={[geometry.armLengthM, 0, 0]}
                rotation={[0, 0, toRadians(bucketAngleDeg)]}
              >
                <JointPin radius={0.36} width={1.5} />
                <BucketAssembly geometry={geometry} detailed={detailed} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
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
  const detailed = !lowPerformance;

  return (
    <group
      name="ExcavatorRoot"
      position={[localX, telemetry.gnss.elevation, localZ]}
      rotation={[0, toRadians(telemetry.gnss.headingDeg - 90), 0]}
    >
      <group rotation={[toRadians(telemetry.gnss.rollDeg), 0, toRadians(telemetry.gnss.pitchDeg)]}>
        <group name="Undercarriage">
          <TrackAssembly sideZ={-2.02} detailed={detailed} />
          <TrackAssembly sideZ={2.02} detailed={detailed} />
          <RoundedPart
            position={[0, 1.12, 0]}
            size={[5.5, 0.54, 3.85]}
            color={COLORS.frame}
            radius={0.2}
          />
        </group>
        <group name="UpperStructure">
          <UpperStructureBody detailed={detailed} />
          <ArticulatedImplement
            geometry={geometry}
            boomAngleDeg={telemetry.imu.boomAngleDeg}
            armAngleDeg={telemetry.imu.armAngleDeg}
            bucketAngleDeg={telemetry.imu.bucketAngleDeg}
            detailed={detailed}
          />
        </group>
      </group>
    </group>
  );
});
