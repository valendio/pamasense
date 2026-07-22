import { SITE_ORIGIN } from '../../config/site';
import type { ActualTerrain, TerrainDesign, Triangle } from './designTypes';

const COLS = 61;
const ROWS = 51;
const WIDTH = 600;
const DEPTH = 500;
const PIT_STRIKE_RAD = (28 * Math.PI) / 180;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function gaussianPeak(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
  height: number,
) {
  const dx = (x - centerX) / radiusX;
  const dz = (z - centerZ) / radiusZ;
  return height * Math.exp(-(dx * dx + dz * dz));
}

function pitCoordinates(x: number, z: number) {
  const cos = Math.cos(PIT_STRIKE_RAD);
  const sin = Math.sin(PIT_STRIKE_RAD);
  const alongStrike = x * cos + z * sin;
  const crossStrike = -x * sin + z * cos;
  const radius = Math.sqrt((alongStrike / 238) ** 2 + (crossStrike / 108) ** 2);
  return { alongStrike, crossStrike, radius };
}

/** Main ramp centerline, kept public so context geometry uses the same design definition. */
export function demoHaulRoadCenterZ(x: number) {
  return x * 0.46 + Math.sin((x + 35) * 0.018) * 18 - 8;
}

/**
 * Synthetic but meter-consistent mine surface inspired by long-strike Indonesian coal pits.
 * The center is a graded coal floor; outside it, six benches blend into four mountain ridges.
 */
export function demoDesignElevation(x: number, z: number): number {
  const { alongStrike, crossStrike, radius } = pitCoordinates(x, z);
  const floorElevation = 120.2 + x * 0.0035 - z * 0.0025;

  const floorRadius = 0.34;
  const benchWidth = 0.145;
  const benchHeight = 7.4;
  const outsideFloor = Math.max(0, radius - floorRadius);
  const rawBenchIndex = Math.floor(outsideFloor / benchWidth);
  const benchIndex = Math.min(6, rawBenchIndex);
  const withinBench = (outsideFloor % benchWidth) / benchWidth;
  const wallRamp = rawBenchIndex < 6 ? smoothstep(0.56, 0.93, withinBench) * benchHeight : 0;
  const terracedPit = floorElevation + benchIndex * benchHeight + wallRamp;

  // Parallel strike ridges reproduce the dense, elongated contour character of the reference.
  const ridgeBand =
    (8 + Math.sin(alongStrike * 0.017) * 2.4) *
    (0.5 + 0.5 * Math.cos(crossStrike * 0.052 + Math.sin(alongStrike * 0.008) * 0.9));
  const mountainMass =
    gaussianPeak(x, z, -250, 192, 128, 105, 34) +
    gaussianPeak(x, z, 238, -188, 138, 112, 39) +
    gaussianPeak(x, z, 250, 182, 118, 92, 25) +
    gaussianPeak(x, z, -225, -202, 120, 90, 23) +
    ridgeBand;
  const mountainBlend = smoothstep(0.98, 1.72, radius);

  const roadDistance = Math.abs(z - demoHaulRoadCenterZ(x));
  const roadCut =
    radius > 0.44 ? smoothstep(13, 3.5, roadDistance) * (2.8 + mountainBlend * 2.2) : 0;

  // Subtle coal-seam relief remains visible in sections without compromising bench geometry.
  const seam =
    radius > 0.42 && radius < 1.12
      ? -1.1 * Math.exp(-(((crossStrike + 34) / 18) ** 2)) * Math.sin(alongStrike * 0.035) ** 2
      : 0;

  return terracedPit + mountainMass * mountainBlend - roadCut + seam;
}

function actualDeviation(x: number, z: number): number {
  const digging = -0.22 * Math.exp(-((x - 32) ** 2 + (z + 18) ** 2) / 2200);
  const windrow = 0.18 * Math.exp(-((x + 62) ** 2 + (z - 12) ** 2) / 1650);
  const dozerPass = 0.09 * Math.exp(-((x - 18) ** 2 + (z - 48) ** 2) / 900);
  return digging + windrow + dozerPass + Math.sin(x * 0.047) * Math.cos(z * 0.041) * 0.045;
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
      id: 'mit-subishi-complex-r04',
      name: 'Pit Mitsubishi — Mountain & Multi-Bench Design',
      version: '2026.07.22-R04',
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
