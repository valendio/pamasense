import { describe, expect, it } from 'vitest';
import { calculateCutFill } from '../features/mine-design/cutFill';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';

const design: TerrainDesign = {
  id: 'd',
  name: 'Flat',
  version: '1',
  coordinateSystem: 'Local',
  verticalDatum: 'MSL',
  vertices: [
    [0, 100, 0],
    [10, 100, 0],
    [0, 100, 10],
  ],
  triangles: [[0, 1, 2]],
  importedAt: '2026-07-22T00:00:00.000Z',
  effectiveDate: '2026-07-22',
};

function actualAt(elevation: number): ActualTerrain {
  return {
    vertices: [
      [0, elevation, 0],
      [10, elevation, 0],
      [0, elevation, 10],
    ],
    triangles: [[0, 1, 2]],
    updatedAt: '2026-07-22T00:00:00.000Z',
    pointTimestamps: ['', '', ''],
  };
}

describe('cut and fill calculation', () => {
  it('calculates material above design as cut', () => {
    const result = calculateCutFill(design, actualAt(101));
    expect(result.cutM3).toBeCloseTo(50);
    expect(result.fillM3).toBe(0);
    expect(result.netM3).toBeCloseTo(50);
  });

  it('calculates material below design as fill', () => {
    const result = calculateCutFill(design, actualAt(98));
    expect(result.cutM3).toBe(0);
    expect(result.fillM3).toBeCloseTo(100);
    expect(result.netM3).toBeCloseTo(-100);
  });
});
