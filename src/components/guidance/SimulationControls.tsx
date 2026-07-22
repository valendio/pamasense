import {
  AlertTriangle,
  ChevronDown,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import type { MachineTelemetry } from '../../features/telemetry/telemetrySchema';
import { useTelemetryStore } from '../../stores/telemetryStore';

function AngleSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-[10px] font-bold text-slate-600">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(1)}°</span>
      </span>
      <input
        className="mt-1 w-full accent-pama-blue"
        type="range"
        min={min}
        max={max}
        step="0.5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function SimulationControls({ telemetry }: { telemetry: MachineTelemetry }) {
  const running = useTelemetryStore((state) => state.simulationRunning);
  const speed = useTelemetryStore((state) => state.speed);
  const faults = useTelemetryStore((state) => state.faults);
  const setRunning = useTelemetryStore((state) => state.setSimulationRunning);
  const setSpeed = useTelemetryStore((state) => state.setSpeed);
  const reset = useTelemetryStore((state) => state.reset);
  const toggleFault = useTelemetryStore((state) => state.toggleFault);
  const setManualAngles = useTelemetryStore((state) => state.setManualAngles);
  const setDiggingScenario = useTelemetryStore((state) => state.setDiggingScenario);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [angles, setAngles] = useState(() => ({
    boomAngleDeg: telemetry.imu.boomAngleDeg,
    armAngleDeg: telemetry.imu.armAngleDeg,
    bucketAngleDeg: telemetry.imu.bucketAngleDeg,
  }));

  const updateAngle = (key: keyof typeof angles, value: number) => {
    const next = { ...angles, [key]: value };
    setAngles(next);
    if (manual) setManualAngles(next);
  };
  const toggleManual = () => {
    const next = !manual;
    setManual(next);
    if (next) {
      const current = {
        boomAngleDeg: telemetry.imu.boomAngleDeg,
        armAngleDeg: telemetry.imu.armAngleDeg,
        bucketAngleDeg: telemetry.imu.bucketAngleDeg,
      };
      setAngles(current);
      setManualAngles(current);
    } else setManualAngles(null);
  };

  return (
    <div className="absolute right-3 top-3 z-20 w-[292px] border border-slate-600 bg-white/95">
      <button
        className="flex h-10 w-full items-center justify-between bg-slate-900/90 px-3 text-xs font-bold text-white"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2">
          <Gauge size={14} className="text-pama-yellow" /> DEMO TELEMETRY
        </span>
        <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="p-3">
          <div className="flex gap-1">
            <button
              className={`control-btn flex-1 !min-h-8 !px-2 ${running ? 'control-btn-active' : ''}`}
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button className="control-btn !min-h-8 !px-2" onClick={reset}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {(
              [
                { label: 'Slow', value: 0.4 },
                { label: 'Normal', value: 1 },
                { label: 'Fast', value: 2.5 },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                className={`control-btn !min-h-8 !px-1 !text-xs ${speed === item.value ? 'control-btn-active' : ''}`}
                onClick={() => setSpeed(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1" aria-label="Grade scenarios">
            {(['UNDERDIG', 'ON_GRADE', 'OVERDIG'] as const).map((scenario) => (
              <button
                key={scenario}
                className="h-8 border border-slate-300 bg-slate-50 text-[9px] font-black text-slate-700 hover:border-pama-blue"
                onClick={() => {
                  setDiggingScenario(scenario);
                  setManual(false);
                }}
              >
                {scenario.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            className={`mt-2 flex h-8 w-full items-center justify-center gap-2 border text-xs font-bold ${manual ? 'border-pama-blue bg-blue-50 text-pama-blue' : 'border-slate-300 text-slate-700'}`}
            onClick={toggleManual}
          >
            <SlidersHorizontal size={13} /> Manual pose {manual ? 'ON' : 'OFF'}
          </button>
          {manual && (
            <div className="mt-3 space-y-2">
              <AngleSlider
                label="BOOM"
                value={angles.boomAngleDeg}
                min={-25}
                max={70}
                onChange={(value) => updateAngle('boomAngleDeg', value)}
              />
              <AngleSlider
                label="ARM"
                value={angles.armAngleDeg}
                min={-150}
                max={15}
                onChange={(value) => updateAngle('armAngleDeg', value)}
              />
              <AngleSlider
                label="BUCKET"
                value={angles.bucketAngleDeg}
                min={-160}
                max={50}
                onChange={(value) => updateAngle('bucketAngleDeg', value)}
              />
            </div>
          )}
          <div className="mt-3 border-t border-slate-200 pt-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <AlertTriangle size={12} /> FAULT INJECTION
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(['rtk', 'imu', 'network', 'can'] as const).map((fault) => (
                <button
                  key={fault}
                  className={`h-8 border text-[10px] font-black uppercase ${faults[fault] ? 'border-pama-red bg-red-50 text-pama-red' : 'border-slate-300 text-slate-600'}`}
                  onClick={() => toggleFault(fault)}
                >
                  SIM {fault} {faults[fault] ? 'FAULT' : 'OK'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
