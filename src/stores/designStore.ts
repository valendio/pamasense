import { create } from 'zustand';
import { createDemoTerrain } from '../features/mine-design/demoTerrain';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';
import { applyBucketExcavation, type ExcavationEvent } from '../features/mine-design/excavation';
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
  lastExcavation: ExcavationEvent | null;
  setDesign: (design: TerrainDesign) => Promise<void>;
  clearDesign: () => void;
  resetActual: () => void;
  excavateActualTerrain: (
    eastM: number,
    northM: number,
    bucketElevationM: number,
  ) => ExcavationEvent | null;
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
  lastExcavation: null,
  setDesign: async (design) => {
    await saveDesign(design);
    set({ design });
  },
  clearDesign: () => set({ design: null }),
  resetActual: () =>
    set({
      actual: structuredClone(get().initialActual),
      pendingPoints: 0,
      lastExcavation: null,
      syncProgress: 100,
    }),
  excavateActualTerrain: (eastM, northM, bucketElevationM) => {
    const now = new Date().toISOString();
    const result = applyBucketExcavation(get().actual, eastM, northM, bucketElevationM, now);
    if (!result.event) return null;
    set({
      actual: result.terrain,
      lastExcavation: result.event,
      pendingPoints: get().pendingPoints + result.event.affectedPoints,
      syncProgress: 0,
    });
    void queueSynchronization({
      type: 'TERRAIN',
      payload: {
        centerEastM: eastM,
        centerNorthM: northM,
        bucketElevationM,
        radiusM: result.event.radiusM,
        affectedPoints: result.event.affectedPoints,
        maximumCutM: result.event.maximumCutM,
        timestamp: now,
      },
    });
    return result.event;
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
