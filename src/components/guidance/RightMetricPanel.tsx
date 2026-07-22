import { AlertOctagon, CheckCircle2, Navigation, RadioTower } from 'lucide-react';
import type { GuidanceResult } from '../../features/guidance/guidanceTypes';
import type { MachineTelemetry } from '../../features/telemetry/telemetrySchema';

const statusStyles = {
  UNDERDIG: 'bg-pama-info text-white border-[#1f6f9f]',
  ON_GRADE: 'bg-pama-green text-white border-[#167c4c]',
  OVERDIG: 'bg-pama-red text-white border-[#a62828]',
  INVALID: 'bg-slate-600 text-white border-slate-800',
};

function Metric({
  label,
  value,
  unit,
  emphasize = false,
}: {
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`border-b border-slate-200 px-4 ${emphasize ? 'py-3' : 'py-2'}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono font-black tabular-nums text-slate-800 ${emphasize ? 'text-[27px] leading-8' : 'text-lg leading-6'}`}
      >
        {value} {unit && <span className="text-xs font-bold text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function RightMetricPanel({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const offset = guidance.verticalOffset;
  return (
    <aside
      className="panel row-span-2 flex min-h-0 flex-col overflow-auto border-y-0 border-r-0 scrollbar-thin"
      aria-label="Real-time guidance metrics"
    >
      <div className="panel-heading h-10 shrink-0 bg-pama-navy text-white">
        <span>Guidance result</span>
        <Navigation size={14} />
      </div>
      <div
        className={`m-3 border-2 px-3 py-3 text-center ${statusStyles[guidance.status]}`}
        data-testid="guidance-status"
      >
        <div className="flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.17em] opacity-80">
          {guidance.valid ? <CheckCircle2 size={13} /> : <AlertOctagon size={13} />}
          {guidance.valid ? 'OPERATIONAL STATUS' : 'GUIDANCE UNAVAILABLE'}
        </div>
        <div className="mt-1 text-[27px] font-black tracking-wide">
          {guidance.valid ? guidance.status.replace('_', ' ') : 'INVALID'}
        </div>
        {!guidance.valid && (
          <div className="mt-1 text-[11px] font-semibold">Reason: {guidance.reason}</div>
        )}
      </div>
      <Metric
        label="Design elevation"
        value={guidance.designElevation?.toFixed(2) ?? '—'}
        unit="m"
        emphasize
      />
      <Metric
        label="Bucket elevation"
        value={guidance.bucketTip[1].toFixed(2)}
        unit="m"
        emphasize
      />
      <div
        className={`border-b-4 px-4 py-3 ${offset !== null && offset < -0.05 ? 'border-pama-red bg-red-50' : offset !== null && offset > 0.05 ? 'border-pama-info bg-blue-50' : 'border-pama-green bg-green-50'}`}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Vertical offset
        </div>
        <div
          className="mt-0.5 font-mono text-[32px] font-black leading-9 tabular-nums text-slate-900"
          data-testid="vertical-offset"
        >
          {offset === null ? '—' : `${offset >= 0 ? '+' : ''}${offset.toFixed(2)}`}{' '}
          <span className="text-sm text-slate-500">m</span>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b border-slate-200">
        <Metric label="Slope" value="1.2" unit="%" />
        <Metric label="Heading" value={telemetry.gnss.headingDeg.toFixed(0)} unit="°" />
      </div>
      <div className="grid grid-cols-2 border-b border-slate-200">
        <Metric
          label="GNSS accuracy"
          value={(telemetry.gnss.horizontalAccuracyM * 100).toFixed(1)}
          unit="cm"
        />
        <Metric
          label="RTK status"
          value={telemetry.gnss.solution === 'RTK_FIX' ? 'FIX' : 'FLOAT'}
        />
      </div>
      <div className="grid grid-cols-2 border-b border-slate-200">
        <Metric
          label="Correction age"
          value={telemetry.gnss.correctionAgeSec.toFixed(1)}
          unit="s"
        />
        <Metric label="IMU update" value={telemetry.imu.updateRateHz.toFixed(0)} unit="Hz" />
      </div>
      <div className="mt-auto flex items-center gap-2 bg-slate-100 px-4 py-3 text-[11px] font-bold text-slate-600">
        <RadioTower size={14} className="text-pama-blue" /> TELEMETRY LATENCY &lt; 80 ms
      </div>
    </aside>
  );
}
