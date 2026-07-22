import { Download, RefreshCw, RotateCcw, UploadCloud } from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { deviationColor } from '../features/guidance/deviation';
import { exportLogsCsv, exportLogsJson } from '../services/exportService';
import { useDesignStore } from '../stores/designStore';
import { useLogStore } from '../stores/logStore';

export default function TopographyPage() {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const resetActual = useDesignStore((state) => state.resetActual);
  const retrySync = useDesignStore((state) => state.retrySync);
  const pending = useDesignStore((state) => state.pendingPoints);
  const syncProgress = useDesignStore((state) => state.syncProgress);
  const logs = useLogStore((state) => state.logs);
  const chartData = useMemo(
    () =>
      actual.vertices
        .filter((_, index) => index % 20 === 0)
        .slice(0, 120)
        .map((vertex, index) => ({
          point: index,
          deviation: vertex[1] - (design?.vertices[index * 20]?.[1] ?? vertex[1]),
        })),
    [actual.vertices, design],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="As-built surface"
        title="Live Topography"
        description="Monitor terrain deltas, queued updates, and operational records."
        actions={
          <>
            <button
              className="control-btn"
              onClick={() => exportLogsJson(logs)}
              disabled={!logs.length}
            >
              <Download size={15} /> JSON log
            </button>
            <button
              className="control-btn control-btn-active"
              data-testid="export-csv"
              onClick={() => exportLogsCsv(logs)}
              disabled={!logs.length}
            >
              <Download size={15} /> Export CSV
            </button>
          </>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.4fr)_340px] gap-4 overflow-auto p-4 scrollbar-thin">
        <div className="space-y-4">
          <section className="panel">
            <div className="panel-heading">
              Surface deviation profile{' '}
              <span>{actual.vertices.length.toLocaleString()} points</span>
            </div>
            <div className="h-[280px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="point" tick={{ fontSize: 10 }} />
                  <YAxis unit=" m" domain={[-0.25, 0.25]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(3)} m`, 'Deviation']} />
                  <Area
                    type="monotone"
                    dataKey="deviation"
                    stroke="#294483"
                    fill="#d9e2f0"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              Recent operational log <span>1 Hz sample</span>
            </div>
            <div className="max-h-64 overflow-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-100 text-slate-500">
                  <tr>
                    {['Timestamp', 'Bucket XYZ', 'Design', 'Offset', 'Status', 'GNSS'].map(
                      (header) => (
                        <th
                          key={header}
                          className="border-b border-slate-300 px-3 py-2 font-bold uppercase"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {logs
                    .slice(-40)
                    .reverse()
                    .map((log) => (
                      <tr key={log.timestamp} className="border-b border-slate-200">
                        <td className="px-3 py-2 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {log.bucketEast.toFixed(1)}, {log.bucketNorth.toFixed(1)},{' '}
                          {log.bucketElevation.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {log.designElevation?.toFixed(2) ?? '—'}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold">
                          {log.verticalOffset?.toFixed(2) ?? '—'}
                        </td>
                        <td
                          className="px-3 py-2 font-bold"
                          style={{
                            color:
                              log.verticalOffset === null
                                ? '#64748b'
                                : deviationColor(log.verticalOffset),
                          }}
                        >
                          {log.guidanceStatus}
                        </td>
                        <td className="px-3 py-2">{log.gnssSolution}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <section className="panel">
            <div className="panel-heading">Synchronization</div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">MASTER CONTROL</span>
                <span className="text-xs font-black text-pama-green">ONLINE</span>
              </div>
              <div className="mt-4 h-3 border border-slate-300 bg-slate-100">
                <div className="h-full bg-pama-blue" style={{ width: `${syncProgress}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span>{syncProgress}% synchronized</span>
                <span>{pending} queued</span>
              </div>
              <button className="control-btn control-btn-active mt-5 w-full" onClick={retrySync}>
                <UploadCloud size={16} /> Synchronize now
              </button>
              <button className="control-btn mt-2 w-full" onClick={retrySync}>
                <RefreshCw size={16} /> Retry failed uploads
              </button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">Surface maintenance</div>
            <div className="p-5 text-xs text-slate-600">
              <p>
                Actual terrain points retain their most recent update timestamp. Reset restores the
                deterministic demo survey.
              </p>
              <button
                className="control-btn mt-4 w-full border-pama-red text-pama-red"
                onClick={resetActual}
              >
                <RotateCcw size={16} /> Reset actual surface
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
