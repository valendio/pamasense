import { Download, RefreshCw, RotateCcw, UploadCloud } from 'lucide-react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { SITE_ORIGIN } from '../config/site';
import { classifyDiggingStatus } from '../features/guidance/classification';
import { deviationColor } from '../features/guidance/deviation';
import { getDesignElevation } from '../features/mine-design/elevationQuery';
import {
  buildSurfaceElevationProfile,
  summarizeSurfaceProfile,
  type SurfaceProfilePoint,
} from '../features/mine-design/surfaceProfile';
import { calculateMiningActivity } from '../features/mine-design/miningActivity';
import { useGuidance } from '../hooks/useGuidance';
import { exportLogsCsv, exportLogsJson } from '../services/exportService';
import { useDesignStore } from '../stores/designStore';
import { useLogStore } from '../stores/logStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import { MiningActivityPanel } from '../components/guidance/MiningActivityPanel';

const signedMeters = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(3)} m`;

type ProfileChartPoint = SurfaceProfilePoint & {
  differenceStatus: 'UNDERDIG' | 'ON_GRADE' | 'OVERDIG';
};

type ChartAxisScale = {
  scale?: (value: number) => number;
};

function DifferenceBand({
  data,
  toleranceM,
  xAxisMap,
  yAxisMap,
}: {
  data: ProfileChartPoint[];
  toleranceM: number;
  xAxisMap?: Record<string, ChartAxisScale>;
  yAxisMap?: Record<string, ChartAxisScale>;
}) {
  const xScale = xAxisMap?.['0']?.scale;
  const yScale = yAxisMap?.elevation?.scale;
  if (!xScale || !yScale) return null;

  return (
    <g aria-label="Actual versus plan difference shading">
      {data.slice(0, -1).map((point, index) => {
        const next = data[index + 1];
        const meanDeviationM = (point.deviationM + next.deviationM) / 2;
        const fill =
          Math.abs(meanDeviationM) <= toleranceM
            ? '#25a56a'
            : meanDeviationM > 0
              ? '#ef8f2f'
              : '#d64545';
        return (
          <polygon
            key={`${point.stationM}-${next.stationM}`}
            points={[
              `${xScale(point.stationM)},${yScale(point.actualElevationM)}`,
              `${xScale(next.stationM)},${yScale(next.actualElevationM)}`,
              `${xScale(next.stationM)},${yScale(next.designElevationM)}`,
              `${xScale(point.stationM)},${yScale(point.designElevationM)}`,
            ].join(' ')}
            fill={fill}
            opacity={0.3}
          />
        );
      })}
    </g>
  );
}

function ProfileTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ProfileChartPoint }>;
}) {
  const point = payload?.find((entry) => entry.payload)?.payload;
  if (!active || !point) return null;
  return (
    <div className="border border-slate-500 bg-white p-3 text-[11px]">
      <div className="font-black text-slate-700">STATION {point.stationM.toFixed(1)} m</div>
      <div className="mt-1 font-mono text-slate-500">
        E {point.eastM.toFixed(1)} · N {point.northM.toFixed(1)}
      </div>
      <div className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
        <span>Plan Design</span>
        <strong className="text-right text-pama-gold">{point.designElevationM.toFixed(3)} m</strong>
        <span>Actual Terrain</span>
        <strong className="text-right text-pama-info">{point.actualElevationM.toFixed(3)} m</strong>
        <span>Difference</span>
        <strong className="text-right" style={{ color: deviationColor(point.deviationM) }}>
          {signedMeters(point.deviationM)}
        </strong>
        <span>Status</span>
        <strong className="text-right" style={{ color: deviationColor(point.deviationM) }}>
          {point.differenceStatus.replace('_', ' ')}
        </strong>
      </div>
    </div>
  );
}

export default function TopographyPage() {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const resetActual = useDesignStore((state) => state.resetActual);
  const retrySync = useDesignStore((state) => state.retrySync);
  const pending = useDesignStore((state) => state.pendingPoints);
  const syncProgress = useDesignStore((state) => state.syncProgress);
  const lastExcavation = useDesignStore((state) => state.lastExcavation);
  const excavationHistory = useDesignStore((state) => state.excavationHistory);
  const logs = useLogStore((state) => state.logs);
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const gradeToleranceM = useSettingsStore((state) => state.settings.guidance.gradeToleranceM);
  const guidance = useGuidance();
  const latestLog = logs.at(-1);
  const siteOriginEast = design?.originEast ?? SITE_ORIGIN.east;
  const siteOriginNorth = design?.originNorth ?? SITE_ORIGIN.north;
  const bucketEastM = telemetry
    ? guidance.bucketTip[0] - siteOriginEast
    : latestLog
      ? latestLog.bucketEast - siteOriginEast
      : 0;
  const bucketNorthM = telemetry
    ? guidance.bucketTip[2] - siteOriginNorth
    : latestLog
      ? latestLog.bucketNorth - siteOriginNorth
      : 0;
  const profileCenterEastM = Math.round(bucketEastM);
  const profileNorthM = Math.round(bucketNorthM);
  const profile = useMemo(
    () =>
      buildSurfaceElevationProfile(design, actual, {
        targetNorthM: profileNorthM,
        centerEastM: profileCenterEastM,
        halfWidthM: 35,
        sampleCount: 101,
      }),
    [actual, design, profileCenterEastM, profileNorthM],
  );
  const chartData = useMemo(
    () =>
      profile.map((point): ProfileChartPoint => {
        const differenceStatus = classifyDiggingStatus(point.deviationM, gradeToleranceM);
        return {
          ...point,
          differenceStatus,
        };
      }),
    [gradeToleranceM, profile],
  );
  const profileSummary = useMemo(() => summarizeSurfaceProfile(chartData), [chartData]);
  const actualAsDesign = useMemo(
    () => (design ? { ...design, vertices: actual.vertices, triangles: actual.triangles } : null),
    [actual.triangles, actual.vertices, design],
  );
  const planElevationAtBucket = getDesignElevation(design, bucketEastM, bucketNorthM);
  const actualElevationAtBucket = getDesignElevation(actualAsDesign, bucketEastM, bucketNorthM);
  const surfaceOffsetM =
    planElevationAtBucket === null || actualElevationAtBucket === null
      ? null
      : actualElevationAtBucket - planElevationAtBucket;
  const surfaceStatus =
    surfaceOffsetM === null
      ? 'UNAVAILABLE'
      : classifyDiggingStatus(surfaceOffsetM, gradeToleranceM);
  const bucketStationM = chartData.length ? bucketEastM - chartData[0].eastM : null;
  const elevationDomain = useMemo<[number, number]>(() => {
    if (!profileSummary) return [115, 130];
    const minimum = Math.min(profileSummary.designMinimumM, profileSummary.actualMinimumM);
    const maximum = Math.max(profileSummary.designMaximumM, profileSummary.actualMaximumM);
    const padding = Math.max(0.2, (maximum - minimum) * 0.18);
    return [minimum - padding, maximum + padding];
  }, [profileSummary]);
  const telemetryTimestampMs = telemetry ? new Date(telemetry.timestamp).getTime() : Date.now();
  const activityNowMs =
    Math.ceil(
      (Number.isFinite(telemetryTimestampMs) ? telemetryTimestampMs : Date.now()) / 10_000,
    ) * 10_000;
  const miningActivity = useMemo(
    () => calculateMiningActivity(excavationHistory, gradeToleranceM, activityNowMs),
    [activityNowMs, excavationHistory, gradeToleranceM],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="As-built surface"
        title="Live Topography"
        description="Bucket-local comparison of the fixed plan design and the evolving actual mine surface."
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
              Bucket-local surface section
              <span>
                E–W · N {chartData[0]?.northM.toFixed(1) ?? '—'} m · ±35 m · {chartData.length}{' '}
                samples
              </span>
            </div>
            {profileSummary && surfaceOffsetM !== null && (
              <div className="grid grid-cols-4 border-b border-slate-300 bg-white">
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Plan elevation
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-black text-pama-gold">
                    {planElevationAtBucket?.toFixed(2)} m
                  </div>
                </div>
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Actual elevation
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-black text-pama-info">
                    {actualElevationAtBucket?.toFixed(2)} m
                  </div>
                </div>
                <div className="border-r border-slate-200 px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Vertical offset
                  </div>
                  <div
                    className="mt-0.5 font-mono text-sm font-black"
                    style={{ color: deviationColor(surfaceOffsetM) }}
                  >
                    {signedMeters(surfaceOffsetM)}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Surface status
                  </div>
                  <div
                    className="mt-0.5 text-sm font-black"
                    data-testid="topography-surface-status"
                    style={{ color: deviationColor(surfaceOffsetM) }}
                  >
                    {surfaceStatus.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600">
              <span className="flex items-center gap-2">
                <i className="h-[3px] w-7 bg-pama-gold" /> Plan Design (Yellow)
              </span>
              <span className="flex items-center gap-2">
                <i className="h-[3px] w-7 bg-pama-info" /> Actual Terrain (Blue)
              </span>
              <span className="flex items-center gap-2">
                <i className="flex h-3 w-7 overflow-hidden border border-slate-300">
                  <b className="h-full flex-1 bg-pama-green/50" />
                  <b className="h-full flex-1 bg-pama-orange/50" />
                  <b className="h-full flex-1 bg-pama-red/50" />
                </i>
                Difference / Deviation
              </span>
              <span className="flex items-center gap-2">
                <i className="h-3 w-3 rounded-full border-[3px] border-pama-charcoal bg-white" />
                Bucket Position
              </span>
              <span className="ml-auto normal-case tracking-normal text-slate-500">
                Δ = Actual − Plan · + underdig · − overdig
              </span>
            </div>
            <div className="h-[330px] p-4">
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
                      tickFormatter={(value: number) =>
                        value.toFixed(elevationDomain[1] - elevationDomain[0] < 5 ? 2 : 1)
                      }
                      label={{
                        value: 'ELEVATION (m)',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 9,
                      }}
                    />
                    <Tooltip content={<ProfileTooltip />} />
                    <Customized
                      component={<DifferenceBand data={chartData} toleranceM={gradeToleranceM} />}
                    />
                    <Line
                      yAxisId="elevation"
                      type="monotone"
                      dataKey="actualElevationM"
                      name="Actual Terrain (Blue)"
                      stroke="#2d85c7"
                      strokeWidth={2.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="elevation"
                      type="monotone"
                      dataKey="designElevationM"
                      name="Plan Design (Yellow)"
                      stroke="#f2b318"
                      strokeWidth={2.6}
                      strokeDasharray="7 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                    {bucketStationM !== null && (
                      <ReferenceLine
                        yAxisId="elevation"
                        x={bucketStationM}
                        stroke="#2d3138"
                        strokeDasharray="3 3"
                      />
                    )}
                    {bucketStationM !== null && actualElevationAtBucket !== null && (
                      <ReferenceDot
                        yAxisId="elevation"
                        x={bucketStationM}
                        y={actualElevationAtBucket}
                        r={6}
                        fill="#ffffff"
                        stroke="#2d3138"
                        strokeWidth={3}
                        label={{
                          value: 'BUCKET',
                          position: 'top',
                          fill: '#2d3138',
                          fontSize: 9,
                          fontWeight: 800,
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm font-bold text-slate-500">
                  DESIGN AND ACTUAL SURFACES ARE NOT AVAILABLE FOR COMPARISON
                </div>
              )}
            </div>
          </section>
          <MiningActivityPanel series={miningActivity.series} summary={miningActivity.summary} />
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
          <section className="panel" data-testid="last-excavation">
            <div className="panel-heading">
              Last bucket activity
              <span>{lastExcavation ? 'ACTUAL UPDATED' : 'MONITORING'}</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-200 text-xs">
              <div className="bg-white p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Bucket tip
                </div>
                <div className="mt-1 font-mono font-black text-slate-800">
                  {telemetry ? `${guidance.bucketTip[1].toFixed(2)} m` : '—'}
                </div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Grade tolerance
                </div>
                <div className="mt-1 font-mono font-black text-pama-green">
                  ±{gradeToleranceM.toFixed(2)} m
                </div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Affected points
                </div>
                <div
                  className="mt-1 font-mono font-black text-pama-info"
                  data-testid="affected-points"
                >
                  {lastExcavation?.affectedPoints ?? 0}
                </div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Maximum local cut
                </div>
                <div className="mt-1 font-mono font-black text-pama-red">
                  {lastExcavation ? `-${lastExcavation.maximumCutM.toFixed(3)} m` : '—'}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
              {lastExcavation
                ? `${new Date(lastExcavation.timestamp).toLocaleTimeString()} · E ${lastExcavation.centerEastM.toFixed(1)} · N ${lastExcavation.centerNorthM.toFixed(1)} · ${lastExcavation.radiusM.toFixed(0)} m falloff`
                : 'Actual terrain changes only when a descending bucket intersects the surveyed surface.'}
            </div>
          </section>
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
