import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { BottomControlBar } from '../components/layout/BottomControlBar';
import { OperationalPanel } from '../components/guidance/OperationalPanel';
import { PlanView } from '../components/guidance/PlanView';
import { RightMetricPanel } from '../components/guidance/RightMetricPanel';
import { SectionView } from '../components/guidance/SectionView';
import { SimulationControls } from '../components/guidance/SimulationControls';
import { ExcavatorDriveControls } from '../components/guidance/ExcavatorDriveControls';
import { useGuidance } from '../hooks/useGuidance';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useUiStore } from '../stores/uiStore';
import { MineScene } from '../three/MineScene';
import { useSettingsStore } from '../stores/settingsStore';

export default function GuidancePage() {
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const viewMode = useUiStore((state) => state.viewMode);
  const guidance = useGuidance();
  const isMockTelemetry = useSettingsStore(
    (state) => state.settings.connectivity.telemetryProvider === 'MOCK',
  );

  if (!telemetry) {
    return (
      <div className="grid h-full place-items-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-pama-blue" />
          <div className="mt-3 text-sm font-bold text-pama-navy">
            CONNECTING TO MACHINE TELEMETRY
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_258px] grid-rows-[minmax(0,1fr)_148px_50px] overflow-hidden"
      data-testid="guidance-page"
    >
      <section className="relative min-h-0 min-w-0 border-b border-slate-400 bg-slate-300">
        <output data-testid="bucket-position" className="sr-only">
          {guidance.bucketTip.map((coordinate) => coordinate.toFixed(4)).join(',')}
        </output>
        <output data-testid="telemetry-rate" className="sr-only">
          {telemetry.imu.updateRateHz} Hz
        </output>
        <output data-testid="machine-position" className="sr-only">
          {telemetry.gnss.east.toFixed(4)},{telemetry.gnss.north.toFixed(4)}
        </output>
        <output data-testid="machine-heading" className="sr-only">
          {telemetry.gnss.headingDeg.toFixed(2)}
        </output>
        {viewMode === '3D' && <MineScene telemetry={telemetry} guidance={guidance} />}
        {viewMode === 'PLAN' && <PlanView telemetry={telemetry} guidance={guidance} />}
        {viewMode === 'SECTION' && <SectionView telemetry={telemetry} guidance={guidance} />}
        {viewMode === '3D' && isMockTelemetry && <SimulationControls telemetry={telemetry} />}
        {isMockTelemetry && <ExcavatorDriveControls />}
        {!guidance.valid && (
          <div
            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 border-2 border-pama-red bg-white px-5 py-3 text-sm font-bold text-pama-red"
            role="alert"
          >
            <AlertTriangle size={20} /> GUIDANCE UNAVAILABLE · {guidance.reason}
          </div>
        )}
      </section>
      <RightMetricPanel telemetry={telemetry} guidance={guidance} />
      <OperationalPanel />
      <BottomControlBar />
    </div>
  );
}
