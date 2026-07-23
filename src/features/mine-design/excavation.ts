import type { ActualTerrain } from './designTypes';

export type ExcavationOptions = {
  radiusM: number;
  maximumCutPerPassM: number;
  minimumCutM: number;
};

export type ExcavationEvent = {
  timestamp: string;
  centerEastM: number;
  centerNorthM: number;
  bucketElevationM: number;
  radiusM: number;
  affectedPoints: number;
  maximumCutM: number;
};

export type ExcavationResult = {
  terrain: ActualTerrain;
  event: ExcavationEvent | null;
};

export const DEFAULT_EXCAVATION_OPTIONS: ExcavationOptions = {
  radiusM: 16,
  maximumCutPerPassM: 0.32,
  minimumCutM: 0.004,
};

/**
 * Lowers the surveyed surface around the bucket with a compact cosine kernel.
 * The plan surface is never passed to this function, so a bucket pass cannot
 * accidentally alter the target geometry.
 */
export function applyBucketExcavation(
  terrain: ActualTerrain,
  centerEastM: number,
  centerNorthM: number,
  bucketElevationM: number,
  timestamp: string,
  options: ExcavationOptions = DEFAULT_EXCAVATION_OPTIONS,
): ExcavationResult {
  const radiusSquared = options.radiusM ** 2;
  const vertices = terrain.vertices.slice();
  const pointTimestamps = terrain.pointTimestamps.slice();
  let affectedPoints = 0;
  let maximumCutM = 0;

  terrain.vertices.forEach((vertex, index) => {
    const deltaEastM = vertex[0] - centerEastM;
    const deltaNorthM = vertex[2] - centerNorthM;
    const distanceSquaredM = deltaEastM ** 2 + deltaNorthM ** 2;
    if (distanceSquaredM >= radiusSquared) return;

    const availableCutM = vertex[1] - bucketElevationM;
    if (availableCutM <= options.minimumCutM) return;

    const normalizedDistance = Math.sqrt(distanceSquaredM) / options.radiusM;
    const cosineWeight = (1 + Math.cos(Math.PI * normalizedDistance)) / 2;
    const falloffWeight = cosineWeight ** 2;
    const cutM = Math.min(availableCutM, options.maximumCutPerPassM) * falloffWeight;
    if (cutM <= options.minimumCutM) return;

    vertices[index] = [vertex[0], vertex[1] - cutM, vertex[2]];
    pointTimestamps[index] = timestamp;
    affectedPoints += 1;
    maximumCutM = Math.max(maximumCutM, cutM);
  });

  if (!affectedPoints) return { terrain, event: null };

  return {
    terrain: {
      ...terrain,
      vertices,
      pointTimestamps,
      updatedAt: timestamp,
    },
    event: {
      timestamp,
      centerEastM,
      centerNorthM,
      bucketElevationM,
      radiusM: options.radiusM,
      affectedPoints,
      maximumCutM,
    },
  };
}
