import type { TerrainDesign } from './designTypes';

export type ContourSegment = readonly [
  start: readonly [x: number, z: number],
  end: readonly [x: number, z: number],
];

export type TerrainContour = {
  elevation: number;
  segments: ContourSegment[];
};

function intersectEdge(
  a: TerrainDesign['vertices'][number],
  b: TerrainDesign['vertices'][number],
  elevation: number,
): readonly [number, number] | null {
  const aDelta = a[1] - elevation;
  const bDelta = b[1] - elevation;
  if ((aDelta < 0 && bDelta < 0) || (aDelta >= 0 && bDelta >= 0)) return null;
  const ratio = (elevation - a[1]) / (b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * ratio, a[2] + (b[2] - a[2]) * ratio];
}

export function createTerrainContours(
  design: TerrainDesign | null,
  intervalM = 5,
): TerrainContour[] {
  if (!design || design.vertices.length === 0) return [];
  let minimumVertexElevation = Number.POSITIVE_INFINITY;
  let maximumVertexElevation = Number.NEGATIVE_INFINITY;
  for (const vertex of design.vertices) {
    minimumVertexElevation = Math.min(minimumVertexElevation, vertex[1]);
    maximumVertexElevation = Math.max(maximumVertexElevation, vertex[1]);
  }
  const minimum = Math.ceil(minimumVertexElevation / intervalM) * intervalM;
  const maximum = Math.floor(maximumVertexElevation / intervalM) * intervalM;
  const contours = new Map<number, ContourSegment[]>();
  for (let elevation = minimum; elevation <= maximum; elevation += intervalM) {
    contours.set(elevation, []);
  }

  for (const triangle of design.triangles) {
    const a = design.vertices[triangle[0]];
    const b = design.vertices[triangle[1]];
    const c = design.vertices[triangle[2]];
    if (!a || !b || !c) continue;
    const triangleMinimum = Math.min(a[1], b[1], c[1]);
    const triangleMaximum = Math.max(a[1], b[1], c[1]);
    const firstElevation = Math.ceil(triangleMinimum / intervalM) * intervalM;
    for (let elevation = firstElevation; elevation <= triangleMaximum; elevation += intervalM) {
      const intersections = [
        intersectEdge(a, b, elevation),
        intersectEdge(b, c, elevation),
        intersectEdge(c, a, elevation),
      ].filter((point): point is readonly [number, number] => point !== null);
      if (intersections.length >= 2) {
        contours.get(elevation)?.push([intersections[0], intersections[1]]);
      }
    }
  }

  return [...contours.entries()]
    .filter(([, segments]) => segments.length > 0)
    .map(([elevation, segments]) => ({ elevation, segments }));
}
