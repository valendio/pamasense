import { describe, expect, it } from 'vitest';
import { parseTerrainCsv, parseTerrainJson } from '../features/mine-design/terrainParser';

describe('mine design validation and import', () => {
  it('validates the documented JSON TIN format', () => {
    const result = parseTerrainJson(
      JSON.stringify({
        name: 'Pit A Design Surface',
        version: '2026.07.22-R03',
        coordinateSystem: 'UTM 48S',
        verticalDatum: 'MSL',
        vertices: [
          [0, 120, 0],
          [10, 121, 0],
          [0, 119, 10],
        ],
        triangles: [[0, 1, 2]],
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.design.triangles).toHaveLength(1);
  });

  it('reports out-of-range triangle indices', () => {
    const result = parseTerrainJson(
      JSON.stringify({
        name: 'Invalid',
        version: '1',
        coordinateSystem: 'Local',
        verticalDatum: 'MSL',
        vertices: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 0, 1],
        ],
        triangles: [[0, 1, 5]],
      }),
    );
    expect(result.success).toBe(false);
  });

  it('imports a regular CSV elevation grid into triangles', () => {
    const result = parseTerrainCsv(
      'east,north,elevation\n100,200,120\n110,200,121\n100,210,119\n110,210,120',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.design.vertices).toHaveLength(4);
      expect(result.design.triangles).toHaveLength(2);
    }
  });
});
