import { useMemo, useState, type MouseEvent } from 'react';
import { Crosshair } from 'lucide-react';
import { SITE_ORIGIN } from '../../config/site';
import type { GuidanceResult } from '../../features/guidance/guidanceTypes';
import { getDesignElevation } from '../../features/mine-design/elevationQuery';
import type { MachineTelemetry } from '../../features/telemetry/telemetrySchema';
import { useDesignStore } from '../../stores/designStore';

type Inspection = {
  x: number;
  z: number;
  design: number | null;
  actual: number | null;
};

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 600;
const toSvgX = (x: number) => ((x + 300) / 600) * VIEW_WIDTH;
const toSvgY = (z: number) => VIEW_HEIGHT - ((z + 250) / 500) * VIEW_HEIGHT;

export function PlanView({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const actualAsDesign = useMemo(
    () => (design ? { ...design, vertices: actual.vertices, triangles: actual.triangles } : null),
    [actual.triangles, actual.vertices, design],
  );
  const machineX = telemetry.gnss.east - SITE_ORIGIN.east;
  const machineZ = telemetry.gnss.north - SITE_ORIGIN.north;
  const bucketX = guidance.bucketTip[0] - SITE_ORIGIN.east;
  const bucketZ = guidance.bucketTip[2] - SITE_ORIGIN.north;
  const heading = telemetry.gnss.headingDeg;

  const inspect = (event: MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * VIEW_WIDTH;
    const svgY = ((event.clientY - bounds.top) / bounds.height) * VIEW_HEIGHT;
    const x = (svgX / VIEW_WIDTH) * 600 - 300;
    const z = ((VIEW_HEIGHT - svgY) / VIEW_HEIGHT) * 500 - 250;
    setInspection({
      x,
      z,
      design: getDesignElevation(design, x, z),
      actual: getDesignElevation(actualAsDesign, x, z),
    });
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#eef0e8]" data-testid="plan-view">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-full w-full"
        onClick={inspect}
        role="img"
        aria-label="Plan view mine map"
      >
        <defs>
          <pattern id="smallGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#c7cec9" strokeWidth="0.7" />
          </pattern>
          <pattern id="grid" width="150" height="150" patternUnits="userSpaceOnUse">
            <rect width="150" height="150" fill="url(#smallGrid)" />
            <path d="M 150 0 L 0 0 0 150" fill="none" stroke="#91a09b" strokeWidth="1.2" />
          </pattern>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0a2a66" />
          </marker>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#grid)" />
        {[95, 135, 175, 215, 255, 300].map((radius, index) => (
          <ellipse
            key={radius}
            cx="450"
            cy="300"
            rx={radius * 1.28}
            ry={radius * 0.88}
            fill="none"
            stroke={index % 2 ? '#7d8f75' : '#687c64'}
            strokeWidth={index % 2 ? 1.1 : 1.8}
            strokeDasharray={index % 2 ? '5 4' : undefined}
          />
        ))}
        <path
          d="M 48 195 C 220 215, 315 240, 445 233 S 690 205, 875 185"
          fill="none"
          stroke="#d1b46f"
          strokeWidth="33"
        />
        <path
          d="M 48 195 C 220 215, 315 240, 445 233 S 690 205, 875 185"
          fill="none"
          stroke="#f0dcaa"
          strokeWidth="25"
          strokeDasharray="18 8"
        />
        <polygon
          points={`${toSvgX(-72)},${toSvgY(-70)} ${toSvgX(94)},${toSvgY(-66)} ${toSvgX(112)},${toSvgY(52)} ${toSvgX(-80)},${toSvgY(66)}`}
          fill="#ffc92818"
          stroke="#cf9f00"
          strokeWidth="3"
          strokeDasharray="9 5"
        />
        <polygon
          points={`${toSvgX(70)},${toSvgY(-42)} ${toSvgX(104)},${toSvgY(-40)} ${toSvgX(104)},${toSvgY(-8)} ${toSvgX(72)},${toSvgY(-10)}`}
          fill="#d6454530"
          stroke="#d64545"
          strokeWidth="3"
        />
        <text
          x={toSvgX(86)}
          y={toSvgY(-23)}
          textAnchor="middle"
          fill="#a32929"
          fontSize="12"
          fontWeight="800"
        >
          NO-GO
        </text>
        <g transform={`translate(${toSvgX(machineX)}, ${toSvgY(machineZ)}) rotate(${heading})`}>
          <circle r="15" fill="#ffc928" stroke="#0a2a66" strokeWidth="4" />
          <path d="M 0 -31 L -9 -8 L 9 -8 Z" fill="#0a2a66" />
          <line x1="-12" y1="8" x2="12" y2="8" stroke="#0a2a66" strokeWidth="3" />
        </g>
        <line
          x1={toSvgX(machineX)}
          y1={toSvgY(machineZ)}
          x2={toSvgX(bucketX)}
          y2={toSvgY(bucketZ)}
          stroke="#294483"
          strokeWidth="3"
          markerEnd="url(#arrow)"
        />
        <g transform={`translate(${toSvgX(bucketX)}, ${toSvgY(bucketZ)})`}>
          <circle r="8" fill="#ffffff" stroke="#d64545" strokeWidth="4" />
          <line x1="-13" y1="0" x2="13" y2="0" stroke="#d64545" strokeWidth="2" />
          <line x1="0" y1="-13" x2="0" y2="13" stroke="#d64545" strokeWidth="2" />
        </g>
        {inspection && (
          <g transform={`translate(${toSvgX(inspection.x)}, ${toSvgY(inspection.z)})`}>
            <circle r="6" fill="#ffffff" stroke="#2d85c7" strokeWidth="3" />
          </g>
        )}
        <g transform="translate(835 48)">
          <text x="0" y="-18" textAnchor="middle" fill="#0a2a66" fontSize="16" fontWeight="900">
            N
          </text>
          <path d="M 0 28 L 0 -8" stroke="#0a2a66" strokeWidth="4" markerEnd="url(#arrow)" />
        </g>
        <g transform="translate(42 545)">
          <path
            d="M 0 12 L 150 12 M 0 3 L 0 18 M 150 3 L 150 18"
            stroke="#2d3138"
            strokeWidth="3"
          />
          <text x="75" y="0" textAnchor="middle" fontSize="12" fontWeight="700">
            100 m
          </text>
        </g>
      </svg>
      <div className="absolute left-3 top-3 border border-slate-600 bg-white/95 px-3 py-2 font-mono text-[11px] text-slate-700">
        <div className="flex items-center gap-2 font-sans font-bold text-pama-navy">
          <Crosshair size={13} /> CLICK MAP TO INSPECT
        </div>
        {inspection ? (
          <dl className="mt-2 grid grid-cols-[80px_1fr] gap-x-3 gap-y-0.5">
            <dt>East</dt>
            <dd>{(SITE_ORIGIN.east + inspection.x).toFixed(3)}</dd>
            <dt>North</dt>
            <dd>{(SITE_ORIGIN.north + inspection.z).toFixed(3)}</dd>
            <dt>Design</dt>
            <dd>{inspection.design?.toFixed(2) ?? 'N/A'} m</dd>
            <dt>Actual</dt>
            <dd>{inspection.actual?.toFixed(2) ?? 'N/A'} m</dd>
            <dt>Deviation</dt>
            <dd>
              {inspection.design !== null && inspection.actual !== null
                ? `${(inspection.actual - inspection.design).toFixed(2)} m`
                : 'N/A'}
            </dd>
          </dl>
        ) : (
          <div className="mt-1 text-slate-500">UTM 48S / MSL</div>
        )}
      </div>
      <div className="absolute bottom-3 right-3 border border-slate-500 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700">
        EX-021 · Heading {heading.toFixed(1)}°
      </div>
    </div>
  );
}
