import { useMemo } from 'react';
import { BufferAttribute, BufferGeometry, Color, DoubleSide } from 'three';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';
import { deviationColor } from '../features/guidance/deviation';

function createGeometry(
  vertices: TerrainDesign['vertices'],
  triangles: TerrainDesign['triangles'],
  colors?: string[],
) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(vertices.flatMap((vertex) => vertex));
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setIndex(triangles.flat());
  if (colors) {
    const colorArray = new Float32Array(
      colors.flatMap((value) => {
        const color = new Color(value);
        return [color.r, color.g, color.b];
      }),
    );
    geometry.setAttribute('color', new BufferAttribute(colorArray, 3));
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function DesignSurface({
  design,
  opacity,
  wireframe,
}: {
  design: TerrainDesign;
  opacity: number;
  wireframe: boolean;
}) {
  const geometry = useMemo(
    () => createGeometry(design.vertices, design.triangles),
    [design.triangles, design.vertices],
  );
  return (
    <mesh geometry={geometry} position={[0, 0.055, 0]} receiveShadow frustumCulled>
      <meshStandardMaterial
        color="#9ec1cf"
        transparent
        opacity={opacity}
        wireframe={wireframe}
        roughness={0.92}
        metalness={0}
        side={DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

export function ActualSurface({
  actual,
  design,
  showHeatmap,
  opacity,
}: {
  actual: ActualTerrain;
  design: TerrainDesign;
  showHeatmap: boolean;
  opacity: number;
}) {
  const colors = useMemo(
    () =>
      actual.vertices.map((vertex, index) =>
        deviationColor(vertex[1] - (design.vertices[index]?.[1] ?? vertex[1])),
      ),
    [actual.vertices, design.vertices],
  );
  const geometry = useMemo(
    () => createGeometry(actual.vertices, actual.triangles, showHeatmap ? colors : undefined),
    [actual.triangles, actual.vertices, colors, showHeatmap],
  );
  return (
    <mesh geometry={geometry} receiveShadow frustumCulled>
      <meshStandardMaterial
        color={showHeatmap ? '#ffffff' : '#9b8f73'}
        vertexColors={showHeatmap}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={1}
        side={DoubleSide}
      />
    </mesh>
  );
}
