import { create } from 'zustand';

export type ViewMode = '3D' | 'PLAN' | 'SECTION';
export type CameraMode = 'ORBIT' | 'MACHINE' | 'BUCKET' | 'OPERATOR' | 'TOP';

type UiState = {
  viewMode: ViewMode;
  cameraMode: CameraMode;
  autoTracking: boolean;
  showDesign: boolean;
  showActual: boolean;
  showHeatmap: boolean;
  showBoundaries: boolean;
  designWireframe: boolean;
  resetCameraToken: number;
  notificationOpen: boolean;
  setViewMode: (mode: ViewMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggle: (
    key:
      | 'autoTracking'
      | 'showDesign'
      | 'showActual'
      | 'showHeatmap'
      | 'showBoundaries'
      | 'designWireframe',
  ) => void;
  resetCamera: () => void;
  setNotificationOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  viewMode: '3D',
  cameraMode: 'ORBIT',
  autoTracking: true,
  showDesign: true,
  showActual: true,
  showHeatmap: true,
  showBoundaries: true,
  designWireframe: false,
  resetCameraToken: 0,
  notificationOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  toggle: (key) => set((state) => ({ [key]: !state[key] })),
  resetCamera: () => set((state) => ({ resetCameraToken: state.resetCameraToken + 1 })),
  setNotificationOpen: (notificationOpen) => set({ notificationOpen }),
}));
