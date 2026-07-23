import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SITE_ORIGIN } from '../../config/site';
import { classifyDiggingStatus } from '../../features/guidance/classification';
import { deviationColor } from '../../features/guidance/deviation';
import type { GuidanceResult } from '../../features/guidance/guidanceTypes';
import { getDesignElevation } from '../../features/mine-design/elevationQuery';
import type { MachineTelemetry } from '../../features/telemetry/telemetrySchema';
import { useDesignStore } from '../../stores/designStore';
import { useSettingsStore } from '../../stores/settingsStore';

type SectionDirection = 'HEADING' | 'BOOM' | 'EAST_WEST' | 'NORTH_SOUTH';
const WIDTH = 900;
const HEIGHT = 540;
const MARGIN = { left: 62, right: 25, top: 32, bottom: 56 };

export function SectionView({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const gradeToleranceM = useSettingsStore((state) => state.settings.guidance.gradeToleranceM);
  const [direction, setDirection] = useState<SectionDirection>('BOOM');
  const [sectionWidth, setSectionWidth] = useState(120);
  const [pan, setPan] = useState(0);
  const actualAsDesign = useMemo(
    () => (design ? { ...design, vertices: actual.vertices, triangles: actual.triangles } : null),
    [actual.triangles, actual.vertices, design],
  );
  const originEastM = design?.originEast ?? SITE_ORIGIN.east;
  const originNorthM = design?.originNorth ?? SITE_ORIGIN.north;
  const machineX = telemetry.gnss.east - originEastM;
  const machineZ = telemetry.gnss.north - originNorthM;
  const bucketX = guidance.bucketTip[0] - originEastM;
  const bucketZ = guidance.bucketTip[2] - originNorthM;
  const actualElevationAtBucket = getDesignElevation(actualAsDesign, bucketX, bucketZ);
  const surfaceOffsetM =
    guidance.designElevation === null || actualElevationAtBucket === null
      ? null
      : actualElevationAtBucket - guidance.designElevation;
  const surfaceStatus =
    surfaceOffsetM === null
      ? 'UNAVAILABLE'
      : classifyDiggingStatus(surfaceOffsetM, gradeToleranceM);
  const rawAngleDeg =
    direction === 'EAST_WEST' ? 90 : direction === 'NORTH_SOUTH' ? 0 : telemetry.gnss.headingDeg;
  const angleDeg = Math.round(rawAngleDeg * 2) / 2;
  const angle = (angleDeg * Math.PI) / 180;
  const sectionOriginX = Math.round(machineX * 2) / 2;
  const sectionOriginZ = Math.round(machineZ * 2) / 2;

  const data = useMemo(() => {
    return Array.from({ length: 81 }, (_, index) => {
      const distance = pan - sectionWidth / 2 + (index / 80) * sectionWidth;
      const x = sectionOriginX + Math.sin(angle) * distance;
      const z = sectionOriginZ + Math.cos(angle) * distance;
      return {
        distance,
        design: getDesignElevation(design, x, z),
        actual: getDesignElevation(actualAsDesign, x, z),
      };
    });
  }, [actualAsDesign, angle, design, pan, sectionOriginX, sectionOriginZ, sectionWidth]);

  const elevations = data
    .flatMap((point) => [point.design, point.actual])
    .filter((value): value is number => value !== null);
  const minElevation = Math.floor(Math.min(...elevations, guidance.bucketTip[1]) - 3);
  const maxElevation = Math.ceil(Math.max(...elevations, telemetry.gnss.elevation + 15) + 3);
  const xScale = (distance: number) =>
    MARGIN.left +
    ((distance - (pan - sectionWidth / 2)) / sectionWidth) * (WIDTH - MARGIN.left - MARGIN.right);
  const yScale = (elevation: number) =>
    MARGIN.top +
    ((maxElevation - elevation) / (maxElevation - minElevation)) *
      (HEIGHT - MARGIN.top - MARGIN.bottom);
  const linePath = (key: 'design' | 'actual') =>
    data
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'} ${xScale(point.distance).toFixed(1)} ${yScale(point[key] ?? minElevation).toFixed(1)}`,
      )
      .join(' ');
  const bucketDistance =
    (bucketX - machineX) * Math.sin(angle) + (bucketZ - machineZ) * Math.cos(angle);
  const machineScreenX = xScale(0);
  const pivotY = yScale(telemetry.gnss.elevation + 5.7);
  const boomEndX = machineScreenX + Math.cos((telemetry.imu.boomAngleDeg * Math.PI) / 180) * 92;
  const boomEndY = pivotY - Math.sin((telemetry.imu.boomAngleDeg * Math.PI) / 180) * 92;
  const armAngle = ((telemetry.imu.boomAngleDeg + telemetry.imu.armAngleDeg) * Math.PI) / 180;
  const armEndX = boomEndX + Math.cos(armAngle) * 65;
  const armEndY = boomEndY - Math.sin(armAngle) * 65;

  return (
    <div className="relative flex h-full flex-col bg-[#f4f5ef]" data-testid="section-view">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-slate-300 bg-white px-3">
        <label className="text-xs font-bold text-slate-600">SECTION DIRECTION</label>
        <select
          className="h-8 border border-slate-300 bg-white px-2 text-xs font-bold"
          value={direction}
          onChange={(event) => setDirection(event.target.value as SectionDirection)}
        >
          <option value="BOOM">Boom direction</option>
          <option value="HEADING">Machine heading</option>
          <option value="EAST_WEST">East / West</option>
          <option value="NORTH_SOUTH">North / South</option>
        </select>
        <span className="ml-2 text-xs text-slate-500">WIDTH {sectionWidth} m</span>
        <button
          className="control-btn !min-h-8 !px-2"
          onClick={() => setSectionWidth((value) => Math.min(300, value + 20))}
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <button
          className="control-btn !min-h-8 !px-2"
          onClick={() => setSectionWidth((value) => Math.max(40, value - 20))}
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          className="control-btn !min-h-8 !px-2"
          onClick={() => setPan((value) => value - sectionWidth * 0.1)}
          aria-label="Pan left"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className="control-btn !min-h-8 !px-2"
          onClick={() => setPan((value) => value + sectionWidth * 0.1)}
          aria-label="Pan right"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="control-btn !min-h-8 ml-auto"
          onClick={() => {
            setPan(0);
            setSectionWidth(120);
          }}
        >
          Reset section
        </button>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-h-0 flex-1"
        role="img"
        aria-label="Mine cross section"
      >
        <rect width={WIDTH} height={HEIGHT} fill="#f4f5ef" />
        {Array.from({ length: 7 }, (_, index) => {
          const elevation = minElevation + (index / 6) * (maxElevation - minElevation);
          return (
            <g key={elevation}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={yScale(elevation)}
                y2={yScale(elevation)}
                stroke="#cbd2d0"
                strokeWidth="1"
              />
              <text
                x={MARGIN.left - 8}
                y={yScale(elevation) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#5b6468"
              >
                {elevation.toFixed(0)} m
              </text>
            </g>
          );
        })}
        {Array.from({ length: 9 }, (_, index) => {
          const distance = pan - sectionWidth / 2 + (index / 8) * sectionWidth;
          return (
            <g key={distance}>
              <line
                x1={xScale(distance)}
                x2={xScale(distance)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                stroke="#dce1df"
              />
              <text
                x={xScale(distance)}
                y={HEIGHT - 33}
                textAnchor="middle"
                fontSize="11"
                fill="#5b6468"
              >
                {distance.toFixed(0)}
              </text>
            </g>
          );
        })}
        {guidance.designElevation !== null && (
          <rect
            x={MARGIN.left}
            width={WIDTH - MARGIN.left - MARGIN.right}
            y={yScale(guidance.designElevation + 0.05)}
            height={Math.max(
              3,
              yScale(guidance.designElevation - 0.05) - yScale(guidance.designElevation + 0.05),
            )}
            fill="#25a56a"
            opacity="0.18"
          />
        )}
        {data.slice(0, -1).map((point, index) => {
          const next = data[index + 1];
          if (
            point.design === null ||
            point.actual === null ||
            next.design === null ||
            next.actual === null
          )
            return null;
          const meanDeviationM = (point.actual - point.design + next.actual - next.design) / 2;
          return (
            <polygon
              key={`${point.distance}-${next.distance}`}
              points={[
                `${xScale(point.distance)},${yScale(point.actual)}`,
                `${xScale(next.distance)},${yScale(next.actual)}`,
                `${xScale(next.distance)},${yScale(next.design)}`,
                `${xScale(point.distance)},${yScale(point.design)}`,
              ].join(' ')}
              fill={deviationColor(meanDeviationM)}
              opacity="0.2"
            />
          );
        })}
        <path
          d={linePath('design')}
          fill="none"
          stroke="#f2b318"
          strokeWidth="3"
          strokeDasharray="8 4"
        />
        <path d={linePath('actual')} fill="none" stroke="#2d85c7" strokeWidth="3" />
        <line
          x1={machineScreenX}
          y1={yScale(telemetry.gnss.elevation)}
          x2={machineScreenX}
          y2={pivotY}
          stroke="#2d3138"
          strokeWidth="10"
        />
        <line
          x1={machineScreenX}
          y1={pivotY}
          x2={boomEndX}
          y2={boomEndY}
          stroke="#f2b318"
          strokeWidth="10"
        />
        <line
          x1={boomEndX}
          y1={boomEndY}
          x2={armEndX}
          y2={armEndY}
          stroke="#e9ad18"
          strokeWidth="8"
        />
        <line
          x1={armEndX}
          y1={armEndY}
          x2={xScale(bucketDistance)}
          y2={yScale(guidance.bucketTip[1])}
          stroke="#8b6518"
          strokeWidth="7"
        />
        <circle
          cx={xScale(bucketDistance)}
          cy={yScale(guidance.bucketTip[1])}
          r="8"
          fill="#ffffff"
          stroke={
            guidance.status === 'OVERDIG'
              ? '#d64545'
              : guidance.status === 'UNDERDIG'
                ? '#2d85c7'
                : '#25a56a'
          }
          strokeWidth="5"
        />
        {guidance.designElevation !== null && (
          <line
            x1={xScale(bucketDistance)}
            x2={xScale(bucketDistance)}
            y1={yScale(guidance.bucketTip[1])}
            y2={yScale(guidance.designElevation)}
            stroke="#d64545"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}
        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={HEIGHT - MARGIN.bottom}
          y2={HEIGHT - MARGIN.bottom}
          stroke="#344047"
          strokeWidth="2"
        />
        <text
          x={WIDTH / 2}
          y={HEIGHT - 9}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#344047"
        >
          HORIZONTAL DISTANCE FROM MACHINE (m)
        </text>
      </svg>
      <div className="absolute right-4 top-14 border border-slate-400 bg-white/95 px-3 py-2 text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-bold text-pama-gold">— — PLAN DESIGN (YELLOW)</span>
          <span className="font-bold text-pama-info">—— ACTUAL TERRAIN (BLUE)</span>
          <span className="font-bold text-slate-600">▰ DIFFERENCE / DEVIATION</span>
          <span className="font-bold text-pama-charcoal">● BUCKET POSITION</span>
        </div>
        <div className="mt-1">
          Plan <strong>{guidance.designElevation?.toFixed(2) ?? '—'} m</strong> · actual{' '}
          <strong>{actualElevationAtBucket?.toFixed(2) ?? '—'} m</strong> · surface Δ{' '}
          <strong
            style={{ color: surfaceOffsetM === null ? '#64748b' : deviationColor(surfaceOffsetM) }}
          >
            {surfaceOffsetM?.toFixed(2) ?? '—'} m
          </strong>{' '}
          · <strong>{surfaceStatus.replace('_', ' ')}</strong>
        </div>
        <div className="mt-1 text-slate-600">
          Bucket distance <strong>{bucketDistance.toFixed(2)} m</strong> · bucket-to-plan{' '}
          <strong>{guidance.verticalOffset?.toFixed(2) ?? '—'} m</strong>
        </div>
      </div>
    </div>
  );
}
