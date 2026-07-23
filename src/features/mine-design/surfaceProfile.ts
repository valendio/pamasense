import { getDesignElevation } from './elevationQuery';
import type { ActualTerrain, TerrainDesign } from './designTypes';

export type SurfaceProfilePoint = {
  sourceIndex: number;
  stationM: number;
  eastM: number;
  northM: number;
  designElevationM: number;
  actualElevationM: number;
  deviationM: number;
};

export type SurfaceProfileSummary = {
  designMinimumM: number;
  designMaximumM: number;
  actualMinimumM: number;
  actualMaximumM: number;
  meanDeviationM: number;
  minimumDeviationM: number;
  maximumDeviationM: number;
};

function downsampleIndices(indices: number[], maximumPoints: number) {
  if (indices.length <= maximumPoints) return indices;
  return Array.from({ length: maximumPoints }, (_, sampleIndex) => {
    const ratio = sampleIndex / (maximumPoints - 1);
    return indices[Math.round(ratio * (indices.length - 1))];
  });
}

/** Builds an East-West elevation transect at the design row nearest the requested Northing. */
export function buildSurfaceElevationProfile(
  design: TerrainDesign | null,
  actual: ActualTerrain,
  targetNorthM = 0,
  maximumPoints = 180,
): SurfaceProfilePoint[] {
  if (!design || design.vertices.length < 2 || actual.vertices.length < 2) return [];

  let nearestNorthM = design.vertices[0][2];
  let nearestDistanceM = Math.abs(nearestNorthM - targetNorthM);
  for (const vertex of design.vertices) {
    const distanceM = Math.abs(vertex[2] - targetNorthM);
    if (distanceM < nearestDistanceM) {
      nearestNorthM = vertex[2];
      nearestDistanceM = distanceM;
    }
  }

  let rowIndices = design.vertices
    .map((vertex, index) => ({ index, distanceM: Math.abs(vertex[2] - nearestNorthM) }))
    .filter(({ distanceM }) => distanceM < 0.001)
    .map(({ index }) => index);

  // Irregular TINs may not have a repeated Northing. Use the closest points as a stable fallback.
  if (rowIndices.length < 8) {
    rowIndices = design.vertices
      .map((vertex, index) => ({ index, distanceM: Math.abs(vertex[2] - targetNorthM) }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, Math.min(maximumPoints, design.vertices.length))
      .map(({ index }) => index);
  }

  rowIndices.sort((a, b) => design.vertices[a][0] - design.vertices[b][0]);
  rowIndices = downsampleIndices(rowIndices, maximumPoints);

  const actualAsDesign: TerrainDesign = {
    ...design,
    vertices: actual.vertices,
    triangles: actual.triangles,
  };
  let stationM = 0;
  let previous: TerrainDesign['vertices'][number] | null = null;
  const profile: SurfaceProfilePoint[] = [];

  for (const sourceIndex of rowIndices) {
    const designVertex = design.vertices[sourceIndex];
    if (!designVertex) continue;
    if (previous) {
      stationM += Math.hypot(designVertex[0] - previous[0], designVertex[2] - previous[2]);
    }
    previous = designVertex;

    const indexedActual = actual.vertices[sourceIndex];
    const indexedActualMatches =
      indexedActual &&
      Math.abs(indexedActual[0] - designVertex[0]) < 0.001 &&
      Math.abs(indexedActual[2] - designVertex[2]) < 0.001;
    const actualElevationM = indexedActualMatches
      ? indexedActual[1]
      : getDesignElevation(actualAsDesign, designVertex[0], designVertex[2]);
    if (actualElevationM === null) continue;

    profile.push({
      sourceIndex,
      stationM,
      eastM: designVertex[0],
      northM: designVertex[2],
      designElevationM: designVertex[1],
      actualElevationM,
      deviationM: actualElevationM - designVertex[1],
    });
  }

  return profile;
}

export function summarizeSurfaceProfile(
  profile: SurfaceProfilePoint[],
): SurfaceProfileSummary | null {
  if (!profile.length) return null;
  const designElevations = profile.map((point) => point.designElevationM);
  const actualElevations = profile.map((point) => point.actualElevationM);
  const deviations = profile.map((point) => point.deviationM);
  return {
    designMinimumM: Math.min(...designElevations),
    designMaximumM: Math.max(...designElevations),
    actualMinimumM: Math.min(...actualElevations),
    actualMaximumM: Math.max(...actualElevations),
    meanDeviationM:
      deviations.reduce((total, deviation) => total + deviation, 0) / deviations.length,
    minimumDeviationM: Math.min(...deviations),
    maximumDeviationM: Math.max(...deviations),
  };
}
