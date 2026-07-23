import { describe, expect, it } from 'vitest';
import { createDemoTerrain } from '../features/mine-design/demoTerrain';
import { applyBucketExcavation } from '../features/mine-design/excavation';

function vertexIndexAt(eastM: number, northM: number) {
  const column = (eastM + 300) / 10;
  const row = (northM + 250) / 10;
  return row * 61 + column;
}

describe('bucket-local terrain excavation', () => {
  it('lowers several actual points with the deepest cut below the bucket center', () => {
    const { actual } = createDemoTerrain();
    const centerIndex = vertexIndexAt(0, 0);
    const neighborIndex = vertexIndexAt(10, 0);
    const outsideIndex = vertexIndexAt(30, 0);
    const centerBeforeM = actual.vertices[centerIndex][1];
    const neighborBeforeM = actual.vertices[neighborIndex][1];
    const outsideBeforeM = actual.vertices[outsideIndex][1];

    const result = applyBucketExcavation(
      actual,
      0,
      0,
      centerBeforeM - 1,
      '2026-07-23T08:00:00.000Z',
    );

    expect(result.event).not.toBeNull();
    expect(result.event?.affectedPoints).toBeGreaterThan(1);
    const centerCutM = centerBeforeM - result.terrain.vertices[centerIndex][1];
    const neighborCutM = neighborBeforeM - result.terrain.vertices[neighborIndex][1];
    expect(centerCutM).toBeCloseTo(0.32, 5);
    expect(neighborCutM).toBeGreaterThan(0);
    expect(centerCutM).toBeGreaterThan(neighborCutM);
    expect(result.terrain.vertices[outsideIndex][1]).toBe(outsideBeforeM);
  });

  it('never raises actual terrain when the bucket is above the surveyed surface', () => {
    const { actual } = createDemoTerrain();
    const centerIndex = vertexIndexAt(0, 0);
    const result = applyBucketExcavation(
      actual,
      0,
      0,
      actual.vertices[centerIndex][1] + 2,
      '2026-07-23T08:00:00.000Z',
    );
    expect(result.event).toBeNull();
    expect(result.terrain).toBe(actual);
  });

  it('preserves plan geometry because only the actual surface is mutated', () => {
    const { design, actual } = createDemoTerrain();
    const planBefore = structuredClone(design.vertices);
    applyBucketExcavation(actual, 20, -20, 118, '2026-07-23T08:00:00.000Z');
    expect(design.vertices).toEqual(planBefore);
  });
});
