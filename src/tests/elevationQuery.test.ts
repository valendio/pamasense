import { describe, expect, it } from 'vitest';
import {
  getDesignElevation,
  interpolateTriangleElevation,
} from '../features/mine-design/elevationQuery';
import type { TerrainDesign } from '../features/mine-design/designTypes';

const design: TerrainDesign = {
  id: 'test',
  name: 'Test plane',
  version: '1',
  coordinateSystem: 'Local',
  verticalDatum: 'MSL',
  vertices: [
    [0, 100, 0],
    [10, 110, 0],
    [0, 120, 10],
  ],
  triangles: [[0, 1, 2]],
  importedAt: '2026-07-22T00:00:00.000Z',
  effectiveDate: '2026-07-22',
};

describe('design surface elevation', () => {
  it('uses barycentric interpolation inside a TIN triangle', () => {
    expect(interpolateTriangleElevation(design.vertices, [0, 1, 2], 2.5, 2.5)).toBeCloseTo(107.5);
  });

  it('includes triangle boundaries', () => {
    expect(getDesignElevation(design, 5, 0)).toBeCloseTo(105);
  });

  it('returns null outside the design surface', () => {
    expect(getDesignElevation(design, 9, 9)).toBeNull();
  });
});
