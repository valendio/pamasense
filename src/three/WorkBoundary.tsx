import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { NO_GO_POLYGON_XZ, WORK_POLYGON_XZ } from '../config/mineGeometry';
import { getDesignElevation } from '../features/mine-design/elevationQuery';
import { useDesignStore } from '../stores/designStore';

export function WorkBoundary() {
  const design = useDesignStore((state) => state.design);
  const workPolygon = useMemo(() => {
    const points = WORK_POLYGON_XZ.map(
      ([x, z]) => [x, (getDesignElevation(design, x, z) ?? 120) + 0.42, z] as const,
    );
    return [...points, points[0]];
  }, [design]);
  const noGoPolygon = useMemo(() => {
    const points = NO_GO_POLYGON_XZ.map(
      ([x, z]) => [x, (getDesignElevation(design, x, z) ?? 120) + 0.48, z] as const,
    );
    return [...points, points[0]];
  }, [design]);
  const noGoCenterY = getDesignElevation(design, 92, -20) ?? 120;

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
      <mesh position={[92, noGoCenterY + 0.32, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#d64545" transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  );
}
