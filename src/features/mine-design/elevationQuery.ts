import type { TerrainDesign, Triangle } from './designTypes';

const EPSILON = 1e-8;

export function interpolateTriangleElevation(
  vertices: TerrainDesign['vertices'],
  triangle: Triangle,
  x: number,
  z: number,
): number | null {
  const a = vertices[triangle[0]];
  const b = vertices[triangle[1]];
  const c = vertices[triangle[2]];
  if (!a || !b || !c) return null;

  const denominator = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
  if (Math.abs(denominator) < EPSILON) return null;

  const w1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / denominator;
  const w2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / denominator;
  const w3 = 1 - w1 - w2;

  if (w1 < -EPSILON || w2 < -EPSILON || w3 < -EPSILON) return null;
  return w1 * a[1] + w2 * b[1] + w3 * c[1];
}

export function getDesignElevation(
  design: TerrainDesign | null,
  x: number,
  z: number,
): number | null {
  if (!design) return null;
  for (const triangle of design.triangles) {
    const elevation = interpolateTriangleElevation(design.vertices, triangle, x, z);
    if (elevation !== null) return elevation;
  }
  return null;
}
