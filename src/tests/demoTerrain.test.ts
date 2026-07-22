import { describe, expect, it } from 'vitest';
import { createTerrainContours } from '../features/mine-design/contours';
import { createDemoTerrain, demoDesignElevation } from '../features/mine-design/demoTerrain';
import { calculateBucketTip } from '../features/machine/forwardKinematics';
import { KOMATSU_PC1250_GEOMETRY } from '../config/machine';

describe('complex mountainous demo terrain', () => {
  it('keeps the calibrated demo pose inside the on-grade band', () => {
    const bucket = calculateBucketTip(
      {
        position: { east: 18, north: -24, elevation: demoDesignElevation(18, -24) + 0.08 },
        headingDeg: 258.2,
        bodyRollDeg: 0.8,
        bodyPitchDeg: -1.1,
        boomAngleDeg: 28,
        armAngleDeg: -78,
        bucketAngleDeg: -50,
      },
      KOMATSU_PC1250_GEOMETRY,
    );
    const offset = bucket[1] - demoDesignElevation(bucket[0], bucket[2]);
    expect(Math.abs(offset)).toBeLessThan(0.05);
  });
  it('creates a dense TIN with a broad mountain elevation range', () => {
    const { design } = createDemoTerrain();
    const elevations = design.vertices.map((vertex) => vertex[1]);
    expect(design.vertices).toHaveLength(61 * 51);
    expect(design.triangles).toHaveLength(60 * 50 * 2);
    expect(Math.max(...elevations) - Math.min(...elevations)).toBeGreaterThan(65);
    expect(Math.max(...elevations)).toBeGreaterThan(180);
  });

  it('keeps the work floor low while rising through multiple benches', () => {
    const floor = demoDesignElevation(0, 0);
    const innerBench = demoDesignElevation(-47, 88);
    const mountain = demoDesignElevation(-265, 210);
    expect(floor).toBeCloseTo(120.2, 1);
    expect(innerBench).toBeGreaterThan(floor + 12);
    expect(mountain).toBeGreaterThan(innerBench + 20);
  });

  it('produces usable five-meter design contours', () => {
    const { design } = createDemoTerrain();
    const contours = createTerrainContours(design, 5);
    expect(contours.length).toBeGreaterThan(12);
    expect(contours.every((contour) => contour.segments.length > 0)).toBe(true);
  });
});
