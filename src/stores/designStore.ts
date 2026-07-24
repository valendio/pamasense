import { create } from 'zustand';
import { createDemoTerrain } from '../features/mine-design/demoTerrain';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';
import { applyBucketExcavation } from '../features/mine-design/excavation';
import { getDesignElevation } from '../features/mine-design/elevationQuery';
import type { MiningActivityEvent } from '../features/mine-design/miningActivity';
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
  lastExcavation: MiningActivityEvent | null;
  excavationHistory: MiningActivityEvent[];
  setDesign: (design: TerrainDesign) => Promise<void>;
  clearDesign: () => void;
  resetActual: () => void;
  excavateActualTerrain: (
    machineId: string,
    eastM: number,
    northM: number,
    bucketElevationM: number,
  ) => MiningActivityEvent | null;
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
  excavationHistory: [],
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
      excavationHistory: [],
      syncProgress: 100,
    }),
  excavateActualTerrain: (machineId, eastM, northM, bucketElevationM) => {
    const now = new Date().toISOString();
    const state = get();
    const actualAsDesign = state.design
      ? {
          ...state.design,
          vertices: state.actual.vertices,
          triangles: state.actual.triangles,
        }
      : null;
    const designElevationM = getDesignElevation(state.design, eastM, northM);
    const actualElevationBeforeM = getDesignElevation(actualAsDesign, eastM, northM);
    const result = applyBucketExcavation(state.actual, eastM, northM, bucketElevationM, now);
    if (!result.event) return null;
    const updatedActualAsDesign = state.design
      ? {
          ...state.design,
          vertices: result.terrain.vertices,
          triangles: result.terrain.triangles,
        }
      : null;
    const actualElevationAfterM = getDesignElevation(updatedActualAsDesign, eastM, northM);
    const activityEvent: MiningActivityEvent = {
      ...result.event,
      machineId,
      designElevationM,
      actualElevationBeforeM,
      actualElevationAfterM,
      deviationAfterM:
        designElevationM === null || actualElevationAfterM === null
          ? null
          : actualElevationAfterM - designElevationM,
    };
    set({
      actual: result.terrain,
      lastExcavation: activityEvent,
      excavationHistory: [...state.excavationHistory, activityEvent].slice(-240),
      pendingPoints: state.pendingPoints + result.event.affectedPoints,
      syncProgress: 0,
    });
    void queueSynchronization({
      type: 'TERRAIN',
      payload: {
        machineId,
        centerEastM: eastM,
        centerNorthM: northM,
        bucketElevationM,
        radiusM: result.event.radiusM,
        affectedPoints: result.event.affectedPoints,
        maximumCutM: result.event.maximumCutM,
        designElevationM,
        actualElevationAfterM,
        deviationAfterM: activityEvent.deviationAfterM,
        timestamp: now,
      },
    });
    return activityEvent;
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
