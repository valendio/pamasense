import { create } from 'zustand';
import { createDemoTerrain } from '../features/mine-design/demoTerrain';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';
import {
  clearPendingSynchronizations,
  getLatestDesign,
  queueSynchronization,
  saveDesign,
} from '../services/indexedDb';

const demo = createDemoTerrain();

type DesignState = {
  design: TerrainDesign | null;
  actual: ActualTerrain;
  initialActual: ActualTerrain;
  syncProgress: number;
  pendingPoints: number;
  lastUpload: string;
  setDesign: (design: TerrainDesign) => Promise<void>;
  clearDesign: () => void;
  resetActual: () => void;
  simulateTerrainUpdate: (x: number, z: number, elevation: number) => void;
  retrySync: () => void;
  hydrate: () => Promise<void>;
};

export const useDesignStore = create<DesignState>((set, get) => ({
  design: demo.design,
  actual: demo.actual,
  initialActual: structuredClone(demo.actual),
  syncProgress: 100,
  pendingPoints: 0,
  lastUpload: new Date().toISOString(),
  setDesign: async (design) => {
    await saveDesign(design);
    set({ design });
  },
  clearDesign: () => set({ design: null }),
  resetActual: () => set({ actual: structuredClone(get().initialActual), pendingPoints: 0 }),
  simulateTerrainUpdate: (x, z, elevation) => {
    const actual = get().actual;
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    actual.vertices.forEach((vertex, index) => {
      const distance = (vertex[0] - x) ** 2 + (vertex[2] - z) ** 2;
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    if (nearestIndex < 0 || nearestDistance > 900) return;
    const now = new Date().toISOString();
    const vertices = actual.vertices.slice();
    vertices[nearestIndex] = [vertices[nearestIndex][0], elevation, vertices[nearestIndex][2]];
    const pointTimestamps = actual.pointTimestamps.slice();
    pointTimestamps[nearestIndex] = now;
    set({
      actual: { ...actual, vertices, pointTimestamps, updatedAt: now },
      pendingPoints: get().pendingPoints + 1,
      syncProgress: 0,
    });
    void queueSynchronization({ type: 'TERRAIN', payload: { x, z, elevation, timestamp: now } });
  },
  retrySync: () => {
    set({ syncProgress: 35 });
    window.setTimeout(() => {
      set({ syncProgress: 100, pendingPoints: 0, lastUpload: new Date().toISOString() });
      void clearPendingSynchronizations();
    }, 700);
  },
  hydrate: async () => {
    const latest = await getLatestDesign();
    if (latest) set({ design: latest });
  },
}));
