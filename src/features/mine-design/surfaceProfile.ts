import { getDesignElevation } from './elevationQuery';
import type { ActualTerrain, TerrainDesign } from './designTypes';

export type SurfaceProfilePoint = {
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

export type SurfaceProfileOptions = {
  targetNorthM?: number;
  centerEastM?: number;
  halfWidthM?: number;
  sampleCount?: number;
};

/**
 * Samples a continuous East-West transect with barycentric interpolation.
 * A local window is used by Topography so a bucket-sized excavation remains
 * legible even when the full design spans hundreds of metres.
 */
export function buildSurfaceElevationProfile(
  design: TerrainDesign | null,
  actual: ActualTerrain,
  options: SurfaceProfileOptions = {},
): SurfaceProfilePoint[] {
  if (!design || design.vertices.length < 2 || actual.vertices.length < 2) return [];

  const actualAsDesign: TerrainDesign = {
    ...design,
    vertices: actual.vertices,
    triangles: actual.triangles,
  };
  const eastCoordinates = design.vertices.map((vertex) => vertex[0]);
  const northCoordinates = design.vertices.map((vertex) => vertex[2]);
  const minimumEastM = Math.min(...eastCoordinates);
  const maximumEastM = Math.max(...eastCoordinates);
  const minimumNorthM = Math.min(...northCoordinates);
  const maximumNorthM = Math.max(...northCoordinates);
  const targetNorthM = Math.min(maximumNorthM, Math.max(minimumNorthM, options.targetNorthM ?? 0));
  const centerEastM = Math.min(
    maximumEastM,
    Math.max(minimumEastM, options.centerEastM ?? (minimumEastM + maximumEastM) / 2),
  );
  const defaultHalfWidthM = (maximumEastM - minimumEastM) / 2;
  const halfWidthM = Math.max(1, options.halfWidthM ?? defaultHalfWidthM);
  const startEastM = Math.max(minimumEastM, centerEastM - halfWidthM);
  const endEastM = Math.min(maximumEastM, centerEastM + halfWidthM);
  const sampleCount = Math.min(241, Math.max(2, Math.round(options.sampleCount ?? 121)));
  const profile: SurfaceProfilePoint[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = index / (sampleCount - 1);
    const eastM = startEastM + ratio * (endEastM - startEastM);
    const designElevationM = getDesignElevation(design, eastM, targetNorthM);
    const actualElevationM = getDesignElevation(actualAsDesign, eastM, targetNorthM);
    if (designElevationM === null || actualElevationM === null) continue;

    profile.push({
      stationM: eastM - startEastM,
      eastM,
      northM: targetNorthM,
      designElevationM,
      actualElevationM,
      deviationM: actualElevationM - designElevationM,
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
