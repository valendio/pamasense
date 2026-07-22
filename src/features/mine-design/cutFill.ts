import type { ActualTerrain, TerrainDesign } from './designTypes';

export type CutFillResult = {
  cutM3: number;
  fillM3: number;
  netM3: number;
  confidencePercent: number;
  comparedTriangles: number;
};

function triangleAreaXZ(a: number[], b: number[], c: number[]) {
  return Math.abs((a[0] * (b[2] - c[2]) + b[0] * (c[2] - a[2]) + c[0] * (a[2] - b[2])) / 2);
}

export function calculateCutFill(design: TerrainDesign, actual: ActualTerrain): CutFillResult {
  let cutM3 = 0;
  let fillM3 = 0;
  let comparedTriangles = 0;
  const count = Math.min(design.triangles.length, actual.triangles.length);

  for (let index = 0; index < count; index += 1) {
    const triangle = design.triangles[index];
    const designVertices = triangle.map((vertexIndex) => design.vertices[vertexIndex]);
    const actualVertices = triangle.map((vertexIndex) => actual.vertices[vertexIndex]);
    if (designVertices.some((vertex) => !vertex) || actualVertices.some((vertex) => !vertex))
      continue;
    const area = triangleAreaXZ(designVertices[0], designVertices[1], designVertices[2]);
    const averageDeviation =
      triangle.reduce(
        (sum, vertexIndex) =>
          sum + (actual.vertices[vertexIndex][1] - design.vertices[vertexIndex][1]),
        0,
      ) / 3;
    const volume = averageDeviation * area;
    if (volume > 0) cutM3 += volume;
    else fillM3 += Math.abs(volume);
    comparedTriangles += 1;
  }

  return {
    cutM3,
    fillM3,
    netM3: cutM3 - fillM3,
    confidencePercent: count ? Math.round((comparedTriangles / count) * 98) : 0,
    comparedTriangles,
  };
}
