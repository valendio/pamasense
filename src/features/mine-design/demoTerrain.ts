import type { ActualTerrain, TerrainDesign, Triangle } from './designTypes';
import { SITE_ORIGIN } from '../../config/site';

const COLS = 31;
const ROWS = 26;
const WIDTH = 600;
const DEPTH = 500;

export function demoDesignElevation(x: number, z: number): number {
  const radial = Math.sqrt((x * 0.92) ** 2 + (z * 1.08) ** 2);
  const fromFloor = Math.max(0, radial - 92);
  const ring = Math.floor(fromFloor / 46);
  const withinRing = fromFloor % 46;
  const wallRise = Math.min(1, Math.max(0, (withinRing - 27) / 14)) * 6.5;
  const benchRise = ring * 6.5 + wallRise;
  const floorGrade = x * 0.004 - z * 0.002;
  const haulRoadCut = z > 70 && z < 105 && x > -250 + (z - 70) * 1.4 ? -2.2 : 0;
  return 120.2 + benchRise + floorGrade + haulRoadCut;
}

function actualDeviation(x: number, z: number): number {
  const digging = -0.16 * Math.exp(-((x - 32) ** 2 + (z + 18) ** 2) / 2800);
  const windrow = 0.13 * Math.exp(-((x + 62) ** 2 + (z - 12) ** 2) / 1900);
  return digging + windrow + Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.035;
}

export function createDemoTerrain(): { design: TerrainDesign; actual: ActualTerrain } {
  const vertices: TerrainDesign['vertices'] = [];
  const actualVertices: ActualTerrain['vertices'] = [];
  const triangles: Triangle[] = [];
  const now = new Date().toISOString();

  for (let row = 0; row < ROWS; row += 1) {
    const z = -DEPTH / 2 + (row / (ROWS - 1)) * DEPTH;
    for (let col = 0; col < COLS; col += 1) {
      const x = -WIDTH / 2 + (col / (COLS - 1)) * WIDTH;
      const y = demoDesignElevation(x, z);
      vertices.push([x, y, z]);
      actualVertices.push([x, y + actualDeviation(x, z), z]);
    }
  }

  for (let row = 0; row < ROWS - 1; row += 1) {
    for (let col = 0; col < COLS - 1; col += 1) {
      const a = row * COLS + col;
      const b = a + 1;
      const c = a + COLS;
      const d = c + 1;
      triangles.push([a, c, b], [b, c, d]);
    }
  }

  return {
    design: {
      id: 'pit-a-r03',
      name: 'Pit A — RL120 Coal Floor',
      version: '2026.07.22-R03',
      coordinateSystem: 'WGS 84 / UTM zone 48S',
      verticalDatum: 'MSL',
      originEast: SITE_ORIGIN.east,
      originNorth: SITE_ORIGIN.north,
      vertices,
      triangles,
      importedAt: now,
      effectiveDate: '2026-07-22',
    },
    actual: {
      vertices: actualVertices,
      triangles,
      updatedAt: now,
      pointTimestamps: actualVertices.map(() => now),
    },
  };
}
