import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deviationColor } from '../../features/guidance/deviation';
import type {
  MiningActivityPoint,
  MiningActivitySummary,
} from '../../features/mine-design/miningActivity';

const signedMeters = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(3)} m`;

export function MiningActivityPanel({
  series,
  summary,
}: {
  series: MiningActivityPoint[];
  summary: MiningActivitySummary;
}) {
  return (
    <section className="panel" data-testid="mining-activity-chart">
      <div className="panel-heading">
        Mining activity
        <span>ROLLING 2 MIN · {summary.activeUnitCount} ACTIVE NOW</span>
      </div>
      <div className="grid grid-cols-4 border-b border-slate-300 bg-white">
        <div className="border-r border-slate-200 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Shoveling units
          </div>
          <div
            className="mt-0.5 font-mono text-lg font-black text-pama-navy"
            data-testid="shoveling-unit-count"
          >
            {summary.shovelingUnitCount}
          </div>
        </div>
        <div className="border-r border-slate-200 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Digging passes
          </div>
          <div
            className="mt-0.5 font-mono text-lg font-black text-pama-info"
            data-testid="digging-pass-count"
          >
            {summary.diggingPasses}
          </div>
        </div>
        <div className="border-r border-slate-200 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Avg actual − design
          </div>
          <div
            className="mt-0.5 font-mono text-lg font-black"
            style={{
              color:
                summary.averageDeviationM === null
                  ? '#64748b'
                  : deviationColor(summary.averageDeviationM),
            }}
          >
            {summary.averageDeviationM === null ? '—' : signedMeters(summary.averageDeviationM)}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Within tolerance
          </div>
          <div className="mt-0.5 font-mono text-lg font-black text-pama-green">
            {summary.withinTolerancePercent.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600">
        <span className="flex items-center gap-2">
          <i className="h-3 w-6 bg-pama-navy" /> Active shoveling units
        </span>
        <span className="flex items-center gap-2">
          <i className="h-[3px] w-6 bg-pama-orange" /> Actual − Design
        </span>
        <span className="ml-auto">Affected terrain points: {summary.affectedPoints}</span>
      </div>
      <div className="relative h-[250px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 10, bottom: 3, left: 0 }}>
            <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestampMs"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10 }}
              tickFormatter={(timestampMs: number) =>
                new Date(timestampMs).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              }
            />
            <YAxis
              yAxisId="units"
              allowDecimals={false}
              domain={[0, (maximum: number) => Math.max(1, Math.ceil(maximum))]}
              tick={{ fontSize: 10 }}
              label={{
                value: 'ACTIVE UNITS',
                angle: -90,
                position: 'insideLeft',
                fontSize: 9,
              }}
            />
            <YAxis
              yAxisId="deviation"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10 }}
              tickFormatter={(value: number) => value.toFixed(2)}
              label={{
                value: 'ACTUAL − DESIGN (m)',
                angle: 90,
                position: 'insideRight',
                fontSize: 9,
              }}
            />
            <Tooltip
              labelFormatter={(timestampMs) => new Date(Number(timestampMs)).toLocaleTimeString()}
              formatter={(value: number, name: string) => [
                name === 'Actual − Design' ? signedMeters(value) : `${value.toFixed(0)} unit`,
                name,
              ]}
              contentStyle={{
                borderRadius: 0,
                border: '1px solid #64748b',
                fontSize: 11,
              }}
            />
            <ReferenceLine yAxisId="deviation" y={0} stroke="#25a56a" strokeDasharray="5 4" />
            <Bar
              yAxisId="units"
              dataKey="activeUnitCount"
              name="Active shoveling units"
              fill="#0a2a66"
              maxBarSize={24}
              isAnimationActive={false}
            />
            <Line
              yAxisId="deviation"
              type="monotone"
              dataKey="averageDeviationM"
              name="Actual − Design"
              stroke="#ef8f2f"
              strokeWidth={2.4}
              dot={{ r: 3, fill: '#ffffff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {!summary.diggingPasses && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="border border-slate-300 bg-white/95 px-4 py-2 text-xs font-bold text-slate-500">
              WAITING FOR BUCKET DIGGING ACTIVITY
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
