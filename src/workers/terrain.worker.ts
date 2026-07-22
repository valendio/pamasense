/// <reference lib="webworker" />
import { deviationColor } from '../features/guidance/deviation';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';

self.addEventListener(
  'message',
  (event: MessageEvent<{ design: TerrainDesign; actual: ActualTerrain }>) => {
    const colors = event.data.actual.vertices.map((vertex, index) =>
      deviationColor(vertex[1] - event.data.design.vertices[index][1]),
    );
    self.postMessage({ colors });
  },
);
