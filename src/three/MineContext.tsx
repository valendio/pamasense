import { Edges, Line } from '@react-three/drei';
import { useMemo } from 'react';
import { demoHaulRoadCenterZ } from '../features/mine-design/demoTerrain';
import type { TerrainDesign } from '../features/mine-design/designTypes';
import { getDesignElevation } from '../features/mine-design/elevationQuery';

function HaulTruck({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[5.8, 1.5, 3.2]} />
        <meshStandardMaterial color="#d7a31b" roughness={0.85} />
        <Edges color="#3a3a35" />
      </mesh>
      <mesh position={[-2.2, 2.25, 0]} castShadow>
        <boxGeometry args={[1.6, 1.5, 2.8]} />
        <meshStandardMaterial color="#f2b318" />
      </mesh>
      {[-2.1, 1.8].flatMap((x) =>
        [-1.65, 1.65].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.65, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.65, 0.65, 0.45, 10]} />
            <meshStandardMaterial color="#1f2226" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Dozer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.45, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[3.8, 1.3, 2.8]} />
        <meshStandardMaterial color="#e2a91b" roughness={0.85} />
        <Edges color="#2d3138" />
      </mesh>
      <mesh position={[2.55, 0.55, 0]} castShadow>
        <boxGeometry args={[1.7, 0.24, 4.6]} />
        <meshStandardMaterial color="#555b60" />
      </mesh>
    </group>
  );
}

export function MineContext({
  lowPerformance,
  design,
}: {
  lowPerformance: boolean;
  design: TerrainDesign | null;
}) {
  const roadPoints = useMemo(
    () =>
      Array.from({ length: 59 }, (_, index) => -290 + index * 10).map((x) => {
        const z = demoHaulRoadCenterZ(x);
        const y = (getDesignElevation(design, x, z) ?? 120) + 0.3;
        return [x, y, z] as [number, number, number];
      }),
    [design],
  );
  const truckA = roadPoints[17] ?? [-120, 130, -70];
  const truckB = roadPoints[47] ?? [180, 150, 80];
  const dozerPoint = roadPoints[33] ?? [40, 124, 10];

  return (
    <group>
      <Line points={roadPoints} color="#4c493f" lineWidth={lowPerformance ? 7 : 12} />
      <Line points={roadPoints} color="#c9ae72" lineWidth={lowPerformance ? 4 : 8} />
      <Line points={roadPoints} color="#f5e6b8" lineWidth={1.2} dashed dashSize={5} gapSize={4} />
      {!lowPerformance && (
        <>
          <HaulTruck position={[truckA[0], truckA[1], truckA[2]]} rotation={-0.42} />
          <HaulTruck position={[truckB[0], truckB[1], truckB[2]]} rotation={Math.PI - 0.42} />
          <Dozer position={[dozerPoint[0], dozerPoint[1], dozerPoint[2]]} />
        </>
      )}
    </group>
  );
}
