/// <reference lib="webworker" />
import { calculateCutFill } from '../features/mine-design/cutFill';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';

self.addEventListener(
  'message',
  (event: MessageEvent<{ design: TerrainDesign; actual: ActualTerrain }>) => {
    self.postMessage(calculateCutFill(event.data.design, event.data.actual));
  },
);
