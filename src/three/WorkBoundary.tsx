import { Line } from '@react-three/drei';

const workPolygon: [number, number, number][] = [
  [-72, 120.5, -70],
  [94, 120.8, -66],
  [112, 120.8, 52],
  [-80, 120.4, 66],
  [-72, 120.5, -70],
];

const noGoPolygon: [number, number, number][] = [
  [70, 121.5, -42],
  [104, 121.5, -40],
  [104, 121.5, -8],
  [72, 121.5, -10],
  [70, 121.5, -42],
];

export function WorkBoundary() {
  return (
    <group>
      <Line
        points={workPolygon}
        color="#ffc928"
        lineWidth={2.5}
        dashed
        dashSize={3}
        gapSize={1.5}
      />
      <Line points={noGoPolygon} color="#d64545" lineWidth={3} />
      <mesh position={[87, 121.05, -25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 32]} />
        <meshBasicMaterial color="#d64545" transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  );
}
