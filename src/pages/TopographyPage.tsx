import { Download, RefreshCw, RotateCcw, UploadCloud } from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { SITE_ORIGIN } from '../config/site';
import { deviationColor } from '../features/guidance/deviation';
import {
  buildSurfaceElevationProfile,
  summarizeSurfaceProfile,
} from '../features/mine-design/surfaceProfile';
import { exportLogsCsv, exportLogsJson } from '../services/exportService';
import { useDesignStore } from '../stores/designStore';
import { useLogStore } from '../stores/logStore';

const signedMeters = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(3)} m`;

export default function TopographyPage() {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const resetActual = useDesignStore((state) => state.resetActual);
  const retrySync = useDesignStore((state) => state.retrySync);
  const pending = useDesignStore((state) => state.pendingPoints);
  const syncProgress = useDesignStore((state) => state.syncProgress);
  const logs = useLogStore((state) => state.logs);
  const latestLog = logs.at(-1);
  const targetNorthM = latestLog
    ? latestLog.bucketNorth - (design?.originNorth ?? SITE_ORIGIN.north)
    : 0;
  const chartData = useMemo(
    () => buildSurfaceElevationProfile(design, actual, targetNorthM),
    [actual, design, targetNorthM],
  );
  const profileSummary = useMemo(() => summarizeSurfaceProfile(chartData), [chartData]);
  const elevationDomain = useMemo<[number, number]>(() => {
    if (!profileSummary) return [115, 130];
    const minimum = Math.min(profileSummary.designMinimumM, profileSummary.actualMinimumM);
    const maximum = Math.max(profileSummary.designMaximumM, profileSummary.actualMaximumM);
    const padding = Math.max(1, (maximum - minimum) * 0.08);
    return [Math.floor(minimum - padding), Math.ceil(maximum + padding)];
  }, [profileSummary]);
  const deviationDomain = useMemo<[number, number]>(() => {
    if (!profileSummary) return [-0.25, 0.25];
    const maximumAbsolute = Math.max(
      0.25,
      Math.abs(profileSummary.minimumDeviationM),
      Math.abs(profileSummary.maximumDeviationM),
    );
    const limit = Math.ceil(maximumAbsolute * 20) / 20;
    return [-limit, limit];
  }, [profileSummary]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="As-built surface"
        title="Live Topography"
        description="Compare design and actual elevations, terrain deltas, queued updates, and operational records."
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
          <section className="panel" data-testid="surface-elevation-profile">
            <div className="panel-heading">
              Design vs actual elevation profile
              <span>
                E–W · N {chartData[0]?.northM.toFixed(1) ?? '—'} m · {chartData.length} samples
              </span>
            </div>
            {profileSummary && (
              <div className="grid grid-cols-4 border-b border-slate-300 bg-white">
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Design elevation
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-black text-pama-gold">
                    {profileSummary.designMinimumM.toFixed(2)}–
                    {profileSummary.designMaximumM.toFixed(2)} m
                  </div>
                </div>
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Actual elevation
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-black text-pama-navy">
                    {profileSummary.actualMinimumM.toFixed(2)}–
                    {profileSummary.actualMaximumM.toFixed(2)} m
                  </div>
                </div>
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Mean Δ
                  </div>
                  <div
                    className="mt-0.5 font-mono text-sm font-black"
                    style={{ color: deviationColor(profileSummary.meanDeviationM) }}
                  >
                    {signedMeters(profileSummary.meanDeviationM)}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Deviation range
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-black text-slate-700">
                    {signedMeters(profileSummary.minimumDeviationM)} /{' '}
                    {signedMeters(profileSummary.maximumDeviationM)}
                  </div>
                </div>
              </div>
            )}
            <div className="h-[320px] p-4">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 6, right: 12, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="stationM"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value: number) => `${value.toFixed(0)}`}
                      label={{
                        value: 'PROFILE STATION (m)',
                        position: 'insideBottom',
                        offset: -2,
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      yAxisId="elevation"
                      domain={elevationDomain}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value: number) => value.toFixed(0)}
                      label={{
                        value: 'ELEVATION (m)',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      yAxisId="deviation"
                      orientation="right"
                      domain={deviationDomain}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value: number) => value.toFixed(2)}
                      label={{ value: 'Δ (m)', angle: 90, position: 'insideRight', fontSize: 9 }}
                    />
                    <Tooltip
                      labelFormatter={(value) => `Station ${Number(value).toFixed(1)} m`}
                      formatter={(value: number, name: string) => [
                        `${value >= 0 && name.startsWith('Δ') ? '+' : ''}${value.toFixed(3)} m`,
                        name,
                      ]}
                      contentStyle={{ borderRadius: 0, border: '1px solid #64748b', fontSize: 12 }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="line"
                      wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                    />
                    <ReferenceLine
                      yAxisId="deviation"
                      y={0}
                      stroke="#64748b"
                      strokeDasharray="5 4"
                    />
                    <Area
                      yAxisId="deviation"
                      type="linear"
                      dataKey="deviationM"
                      name="Δ Actual − Design"
                      stroke="#2d85c7"
                      fill="#d9e2f0"
                      fillOpacity={0.68}
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="elevation"
                      type="linear"
                      dataKey="actualElevationM"
                      name="Actual elevation"
                      stroke="#0a2a66"
                      strokeWidth={2.4}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="elevation"
                      type="linear"
                      dataKey="designElevationM"
                      name="Design elevation"
                      stroke="#d89500"
                      strokeWidth={2.1}
                      strokeDasharray="7 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm font-bold text-slate-500">
                  DESIGN AND ACTUAL SURFACES ARE NOT AVAILABLE FOR COMPARISON
                </div>
              )}
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
