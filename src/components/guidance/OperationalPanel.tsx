import { CloudUpload, RefreshCw } from 'lucide-react';
import { deviationColors } from '../../features/guidance/deviation';
import { useCutFillWorker } from '../../hooks/useCutFillWorker';
import { useDesignStore } from '../../stores/designStore';

const legend = [
  { label: '> +0.20 m', color: deviationColors.extremeUnderdig, meaning: 'Extreme underdig' },
  { label: '+0.05 to +0.20 m', color: deviationColors.underdig, meaning: 'Underdig' },
  { label: '-0.05 to +0.05 m', color: deviationColors.onGrade, meaning: 'On grade' },
  { label: '-0.20 to -0.05 m', color: deviationColors.overdig, meaning: 'Overdig' },
  { label: '< -0.20 m', color: deviationColors.extremeOverdig, meaning: 'Extreme overdig' },
];

export function OperationalPanel() {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const syncProgress = useDesignStore((state) => state.syncProgress);
  const pendingPoints = useDesignStore((state) => state.pendingPoints);
  const lastUpload = useDesignStore((state) => state.lastUpload);
  const retrySync = useDesignStore((state) => state.retrySync);
  const cutFill = useCutFillWorker(design, actual);

  return (
    <section
      className="grid min-h-0 grid-cols-[1.06fr_0.9fr_1.1fr] border-t border-slate-400 bg-white"
      aria-label="Operational summaries"
    >
      <div className="min-w-0 border-r border-slate-300">
        <div className="panel-heading">
          Design vs actual legend <span>Δ Z</span>
        </div>
        <div className="grid grid-cols-5 gap-1 p-3">
          {legend.map((item) => (
            <div key={item.label} className="min-w-0 text-center">
              <div className="h-3 w-full" style={{ background: item.color }} />
              <div className="mt-1 min-h-5 font-mono text-[8px] font-bold leading-3 text-slate-700">
                {item.label}
              </div>
              <div className="truncate text-[9px] text-slate-500">{item.meaning}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 border-r border-slate-300">
        <div className="panel-heading">
          Cut and fill <span>{cutFill?.confidencePercent ?? 0}% confidence</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-500">CUT</div>
            <div className="font-mono text-lg font-black text-pama-orange">
              {cutFill?.cutM3.toFixed(0) ?? '—'}
            </div>
            <div className="text-[9px] text-slate-500">m³</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500">FILL</div>
            <div className="font-mono text-lg font-black text-pama-info">
              {cutFill?.fillM3.toFixed(0) ?? '—'}
            </div>
            <div className="text-[9px] text-slate-500">m³</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500">NET</div>
            <div className="font-mono text-lg font-black text-slate-800">
              {cutFill?.netM3.toFixed(0) ?? '—'}
            </div>
            <div className="text-[9px] text-slate-500">m³</div>
          </div>
        </div>
        <div className="px-3 text-[9px] text-slate-500">
          Updated {new Date(actual.updatedAt).toLocaleTimeString()} ·{' '}
          {cutFill?.comparedTriangles ?? 0} triangles
        </div>
      </div>
      <div className="min-w-0">
        <div className="panel-heading">
          Live topography update <CloudUpload size={13} />
        </div>
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>MASTER CONTROL SYNC</span>
            <span>{syncProgress}%</span>
          </div>
          <div className="mt-1 h-2 border border-slate-300 bg-slate-100">
            <div
              className="h-full bg-pama-blue transition-[width]"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 text-[10px]">
            <div>
              <span className="text-slate-500">Last upload</span>
              <div className="font-bold">{new Date(lastUpload).toLocaleTimeString()}</div>
            </div>
            <div>
              <span className="text-slate-500">Offline queue</span>
              <div className="font-bold">{pendingPoints} terrain points</div>
            </div>
          </div>
        </div>
        <button
          className="mx-3 mt-2 inline-flex items-center gap-2 text-[10px] font-bold text-pama-blue disabled:text-slate-400"
          onClick={retrySync}
          disabled={syncProgress > 0 && syncProgress < 100}
        >
          <RefreshCw size={12} /> {syncProgress === 100 ? 'UPLOAD RETRY / CHECK' : 'SYNCHRONIZING…'}
        </button>
      </div>
    </section>
  );
}
