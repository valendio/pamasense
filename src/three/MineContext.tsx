import { Edges, Line } from '@react-three/drei';

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

export function MineContext({ lowPerformance }: { lowPerformance: boolean }) {
  return (
    <group>
      <Line
        points={[
          [-250, 139, 92],
          [-120, 133, 91],
          [20, 127, 88],
          [170, 136, 86],
          [270, 145, 82],
        ]}
        color="#d8c596"
        lineWidth={lowPerformance ? 5 : 8}
      />
      {!lowPerformance && (
        <>
          <HaulTruck position={[-115, 134, 91]} rotation={-0.04} />
          <HaulTruck position={[188, 137, 86]} rotation={Math.PI} />
        </>
      )}
    </group>
  );
}
