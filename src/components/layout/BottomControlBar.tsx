import {
  Armchair,
  Box,
  Crosshair,
  Eye,
  Focus,
  LocateFixed,
  Map,
  Orbit,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { Toggle } from '../common/Toggle';
import { useUiStore, type ViewMode } from '../../stores/uiStore';

const viewButtons: { mode: ViewMode; label: string; icon: typeof Map }[] = [
  { mode: 'PLAN', label: 'Plan View', icon: Map },
  { mode: '3D', label: '3D View', icon: Box },
  { mode: 'SECTION', label: 'Section View', icon: ScanLine },
];

export function BottomControlBar() {
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const resetCamera = useUiStore((state) => state.resetCamera);
  const toggle = useUiStore((state) => state.toggle);
  const autoTracking = useUiStore((state) => state.autoTracking);
  const showDesign = useUiStore((state) => state.showDesign);
  const showActual = useUiStore((state) => state.showActual);
  const showHeatmap = useUiStore((state) => state.showHeatmap);
  const showBoundaries = useUiStore((state) => state.showBoundaries);

  return (
    <div className="col-span-2 flex min-w-0 items-center border-t border-slate-400 bg-slate-100 px-2">
      <div className="flex h-full border-x border-slate-300">
        {viewButtons.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            className={`control-btn h-full border-y-0 border-l-0 ${viewMode === mode ? 'control-btn-active' : ''}`}
            onClick={() => setViewMode(mode)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <div className="ml-2 flex items-center gap-1">
        <button
          className="control-btn !min-h-9"
          onClick={() => setCameraMode('MACHINE')}
          disabled={viewMode !== '3D'}
        >
          <Focus size={15} /> Center Machine
        </button>
        <button
          className="control-btn !min-h-9"
          onClick={() => {
            setCameraMode('ORBIT');
            resetCamera();
          }}
          disabled={viewMode !== '3D'}
        >
          <RotateCcw size={15} /> Reset Camera
        </button>
        <button
          className="control-btn !min-h-9 !px-2"
          onClick={() => setCameraMode('TOP')}
          disabled={viewMode !== '3D'}
          title="Top-down camera"
        >
          <Orbit size={15} />
        </button>
        <button
          className="control-btn !min-h-9 !px-2"
          onClick={() => setCameraMode('BUCKET')}
          disabled={viewMode !== '3D'}
          title="Bucket-follow camera"
          aria-label="Bucket-follow camera"
        >
          <LocateFixed size={15} />
        </button>
        <button
          className="control-btn !min-h-9 !px-2"
          onClick={() => setCameraMode('OPERATOR')}
          disabled={viewMode !== '3D'}
          title="Operator perspective"
          aria-label="Operator perspective"
        >
          <Armchair size={15} />
        </button>
      </div>
      <div className="ml-auto flex items-center gap-4 px-2">
        <Toggle
          compact
          label="Auto Track"
          checked={autoTracking}
          onChange={() => toggle('autoTracking')}
        />
        <Toggle compact label="Design" checked={showDesign} onChange={() => toggle('showDesign')} />
        <Toggle compact label="Actual" checked={showActual} onChange={() => toggle('showActual')} />
        <Toggle
          compact
          label="Heatmap"
          checked={showHeatmap}
          onChange={() => toggle('showHeatmap')}
        />
        <button
          className={`grid h-9 w-9 place-items-center border ${showBoundaries ? 'border-pama-blue bg-pama-blue text-white' : 'border-slate-300 bg-white text-slate-600'}`}
          onClick={() => toggle('showBoundaries')}
          title="Show boundaries"
        >
          <Eye size={15} />
        </button>
        <Crosshair size={15} className="text-slate-400" />
      </div>
    </div>
  );
}
