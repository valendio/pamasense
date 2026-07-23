import { describe, expect, it } from 'vitest';
import { createDemoTerrain } from '../features/mine-design/demoTerrain';
import {
  buildSurfaceElevationProfile,
  summarizeSurfaceProfile,
} from '../features/mine-design/surfaceProfile';

describe('surface elevation profile', () => {
  it('pairs design and actual elevations along a coherent East-West transect', () => {
    const { design, actual } = createDemoTerrain();
    const profile = buildSurfaceElevationProfile(design, actual, 0);
    expect(profile).toHaveLength(61);
    expect(profile[0].stationM).toBe(0);
    expect(profile.at(-1)?.stationM).toBeCloseTo(600, 5);
    expect(profile.every((point) => Number.isFinite(point.deviationM))).toBe(true);
    expect(profile.some((point) => Math.abs(point.deviationM) > 0.01)).toBe(true);
  });

  it('reports the elevation and deviation ranges used by the chart axes', () => {
    const { design, actual } = createDemoTerrain();
    const summary = summarizeSurfaceProfile(buildSurfaceElevationProfile(design, actual, -20));
    expect(summary).not.toBeNull();
    expect(summary?.designMaximumM).toBeGreaterThan(summary?.designMinimumM ?? 0);
    expect(summary?.actualMaximumM).toBeGreaterThan(summary?.actualMinimumM ?? 0);
    expect(summary?.minimumDeviationM).toBeLessThan(summary?.maximumDeviationM ?? 0);
  });

  it('returns an empty profile when a surface is unavailable', () => {
    const { actual } = createDemoTerrain();
    expect(buildSurfaceElevationProfile(null, actual)).toEqual([]);
    expect(summarizeSurfaceProfile([])).toBeNull();
  });
});
