import { Check, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../components/common/PageHeader';
import { Toggle } from '../components/common/Toggle';
import { useSettingsStore } from '../stores/settingsStore';

type SettingsForm = {
  boomLengthM: number;
  armLengthM: number;
  bucketLinkLengthM: number;
  toothX: number;
  toothY: number;
  toothZ: number;
  pivotX: number;
  pivotY: number;
  pivotZ: number;
  gnssX: number;
  gnssY: number;
  gnssZ: number;
  antennaBaselineM: number;
  gradeToleranceM: number;
  warningToleranceM: number;
  extremeDeviationM: number;
  smoothingSamples: number;
  hysteresisM: number;
  maxVerticalAccuracyM: number;
  maxCorrectionAgeSec: number;
  terrainOpacity: number;
  labelSize: number;
  cameraSensitivity: number;
  nearClipM: number;
  farClipM: number;
  webSocketUrl: string;
  masterControlEndpoint: string;
  ntripCaster: string;
  ntripMountpoint: string;
  retryIntervalSec: number;
  telemetryProvider: 'MOCK' | 'WEBSOCKET';
};

function NumberField({
  label,
  suffix,
  registration,
  step = 0.01,
}: {
  label: string;
  suffix?: string;
  registration: ReturnType<typeof useForm<SettingsForm>>['register'] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never;
  step?: number;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <span className="relative block">
        <input
          className="field-input pr-10 font-mono"
          type="number"
          step={step}
          {...registration}
        />
        {suffix && (
          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSection = useSettingsStore((state) => state.updateSection);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    defaultValues: {
      boomLengthM: settings.machine.boomLengthM,
      armLengthM: settings.machine.armLengthM,
      bucketLinkLengthM: settings.machine.bucketLinkLengthM,
      toothX: settings.machine.toothOffsetM[0],
      toothY: settings.machine.toothOffsetM[1],
      toothZ: settings.machine.toothOffsetM[2],
      pivotX: settings.machine.boomPivotOffsetM[0],
      pivotY: settings.machine.boomPivotOffsetM[1],
      pivotZ: settings.machine.boomPivotOffsetM[2],
      gnssX: settings.machine.gnssLeverArmM[0],
      gnssY: settings.machine.gnssLeverArmM[1],
      gnssZ: settings.machine.gnssLeverArmM[2],
      antennaBaselineM: settings.machine.antennaBaselineM,
      ...settings.guidance,
      terrainOpacity: settings.display.terrainOpacity,
      labelSize: settings.display.labelSize,
      cameraSensitivity: settings.display.cameraSensitivity,
      nearClipM: settings.display.nearClipM,
      farClipM: settings.display.farClipM,
      ...settings.connectivity,
    },
  });
  useEffect(() => {
    if (saved) {
      const timeout = window.setTimeout(() => setSaved(false), 2200);
      return () => window.clearTimeout(timeout);
    }
  }, [saved]);

  const submit = (values: SettingsForm) => {
    updateSection('machine', {
      boomLengthM: values.boomLengthM,
      armLengthM: values.armLengthM,
      bucketLinkLengthM: values.bucketLinkLengthM,
      toothOffsetM: [values.toothX, values.toothY, values.toothZ],
      boomPivotOffsetM: [values.pivotX, values.pivotY, values.pivotZ],
      gnssLeverArmM: [values.gnssX, values.gnssY, values.gnssZ],
      antennaBaselineM: values.antennaBaselineM,
    });
    updateSection('guidance', {
      gradeToleranceM: values.gradeToleranceM,
      warningToleranceM: values.warningToleranceM,
      extremeDeviationM: values.extremeDeviationM,
      smoothingSamples: values.smoothingSamples,
      hysteresisM: values.hysteresisM,
      maxVerticalAccuracyM: values.maxVerticalAccuracyM,
      maxCorrectionAgeSec: values.maxCorrectionAgeSec,
    });
    updateSection('display', {
      terrainOpacity: values.terrainOpacity,
      labelSize: values.labelSize,
      cameraSensitivity: values.cameraSensitivity,
      nearClipM: values.nearClipM,
      farClipM: values.farClipM,
    });
    updateSection('connectivity', {
      webSocketUrl: values.webSocketUrl,
      masterControlEndpoint: values.masterControlEndpoint,
      ntripCaster: values.ntripCaster,
      ntripMountpoint: values.ntripMountpoint,
      retryIntervalSec: values.retryIntervalSec,
      telemetryProvider: values.telemetryProvider,
    });
    reset(values);
    setSaved(true);
  };
  const restore = () => {
    resetSettings();
    window.setTimeout(() => window.location.reload(), 50);
  };
  const lowPerformance = settings.display.lowPerformanceMode;
  const fullscreenStartup = settings.display.fullscreenStartup;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="Configuration"
        title="System Settings"
        description="Machine calibration, guidance limits, display performance, and connectivity."
        actions={
          <>
            <button className="control-btn" onClick={restore}>
              <RotateCcw size={15} /> Restore defaults
            </button>
            <button
              className="control-btn control-btn-active"
              form="settings-form"
              type="submit"
              disabled={!isDirty}
            >
              <Save size={15} /> Save settings
            </button>
          </>
        }
      />
      <form
        id="settings-form"
        onSubmit={handleSubmit(submit)}
        className="min-h-0 flex-1 overflow-auto p-4 scrollbar-thin"
      >
        <div className="grid grid-cols-2 gap-4">
          <section className="panel">
            <div className="panel-heading">Machine geometry · Komatsu PC1250</div>
            <div className="grid grid-cols-3 gap-4 p-5">
              <NumberField
                label="Boom length"
                suffix="m"
                registration={register('boomLengthM', { valueAsNumber: true, min: 1, max: 30 })}
              />
              <NumberField
                label="Arm length"
                suffix="m"
                registration={register('armLengthM', { valueAsNumber: true, min: 1, max: 20 })}
              />
              <NumberField
                label="Bucket linkage"
                suffix="m"
                registration={register('bucketLinkLengthM', {
                  valueAsNumber: true,
                  min: 0.2,
                  max: 8,
                })}
              />
              <NumberField
                label="Tooth offset X"
                suffix="m"
                registration={register('toothX', { valueAsNumber: true })}
              />
              <NumberField
                label="Tooth offset Y"
                suffix="m"
                registration={register('toothY', { valueAsNumber: true })}
              />
              <NumberField
                label="Tooth offset Z"
                suffix="m"
                registration={register('toothZ', { valueAsNumber: true })}
              />
              <NumberField
                label="Boom pivot X"
                suffix="m"
                registration={register('pivotX', { valueAsNumber: true })}
              />
              <NumberField
                label="Boom pivot Y"
                suffix="m"
                registration={register('pivotY', { valueAsNumber: true })}
              />
              <NumberField
                label="Boom pivot Z"
                suffix="m"
                registration={register('pivotZ', { valueAsNumber: true })}
              />
              <NumberField
                label="GNSS lever X"
                suffix="m"
                registration={register('gnssX', { valueAsNumber: true })}
              />
              <NumberField
                label="GNSS lever Y"
                suffix="m"
                registration={register('gnssY', { valueAsNumber: true })}
              />
              <NumberField
                label="GNSS lever Z"
                suffix="m"
                registration={register('gnssZ', { valueAsNumber: true })}
              />
              <NumberField
                label="Antenna baseline"
                suffix="m"
                registration={register('antennaBaselineM', { valueAsNumber: true, min: 0.2 })}
              />
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">Guidance</div>
            <div className="grid grid-cols-2 gap-4 p-5">
              <NumberField
                label="Grade tolerance"
                suffix="m"
                registration={register('gradeToleranceM', {
                  valueAsNumber: true,
                  min: 0.01,
                  max: 1,
                })}
              />
              <NumberField
                label="Warning tolerance"
                suffix="m"
                registration={register('warningToleranceM', { valueAsNumber: true, min: 0.05 })}
              />
              <NumberField
                label="Extreme threshold"
                suffix="m"
                registration={register('extremeDeviationM', { valueAsNumber: true, min: 0.1 })}
              />
              <NumberField
                label="Status hysteresis"
                suffix="m"
                registration={register('hysteresisM', { valueAsNumber: true, min: 0, max: 0.5 })}
              />
              <NumberField
                label="Offset smoothing"
                suffix="samples"
                step={1}
                registration={register('smoothingSamples', {
                  valueAsNumber: true,
                  min: 1,
                  max: 20,
                })}
              />
              <NumberField
                label="Max vertical accuracy"
                suffix="m"
                registration={register('maxVerticalAccuracyM', { valueAsNumber: true, min: 0.01 })}
              />
              <NumberField
                label="Max correction age"
                suffix="s"
                registration={register('maxCorrectionAgeSec', { valueAsNumber: true, min: 0.2 })}
              />
              {Object.keys(errors).length > 0 && (
                <div className="col-span-2 border border-pama-red bg-red-50 p-3 text-xs font-bold text-pama-red">
                  Correct invalid calibration limits before saving.
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">Display & performance</div>
            <div className="grid grid-cols-3 gap-4 p-5">
              <NumberField
                label="Terrain opacity"
                registration={register('terrainOpacity', { valueAsNumber: true, min: 0.1, max: 1 })}
              />
              <NumberField
                label="Label size"
                suffix="px"
                step={1}
                registration={register('labelSize', { valueAsNumber: true, min: 10, max: 28 })}
              />
              <NumberField
                label="Camera sensitivity"
                registration={register('cameraSensitivity', {
                  valueAsNumber: true,
                  min: 0.2,
                  max: 3,
                })}
              />
              <NumberField
                label="Near clipping plane"
                suffix="m"
                registration={register('nearClipM', { valueAsNumber: true, min: 0.05, max: 10 })}
              />
              <NumberField
                label="Far clipping plane"
                suffix="m"
                step={10}
                registration={register('farClipM', { valueAsNumber: true, min: 100, max: 5000 })}
              />
              <div className="col-span-3 flex gap-8 border-t border-slate-200 pt-4">
                <Toggle
                  label="Low-performance mode"
                  checked={lowPerformance}
                  onChange={() => updateSection('display', { lowPerformanceMode: !lowPerformance })}
                />
                <Toggle
                  label="Fullscreen at startup"
                  checked={fullscreenStartup}
                  onChange={() =>
                    updateSection('display', { fullscreenStartup: !fullscreenStartup })
                  }
                />
                <span className="text-xs font-bold text-slate-500">
                  Metric units (fixed for prototype)
                </span>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">Connectivity</div>
            <div className="grid grid-cols-2 gap-4 p-5">
              <label>
                <span className="field-label">Telemetry provider</span>
                <select className="field-input" {...register('telemetryProvider')}>
                  <option value="MOCK">Built-in simulator</option>
                  <option value="WEBSOCKET">Live WebSocket</option>
                </select>
              </label>
              <NumberField
                label="Retry interval"
                suffix="s"
                step={1}
                registration={register('retryIntervalSec', { valueAsNumber: true, min: 1 })}
              />
              <label className="col-span-2">
                <span className="field-label">WebSocket URL</span>
                <input
                  className="field-input font-mono"
                  {...register('webSocketUrl', { required: true })}
                />
              </label>
              <label className="col-span-2">
                <span className="field-label">Master Control endpoint</span>
                <input
                  className="field-input font-mono"
                  {...register('masterControlEndpoint', { required: true })}
                />
              </label>
              <label>
                <span className="field-label">NTRIP caster</span>
                <input
                  className="field-input font-mono"
                  {...register('ntripCaster', { required: true })}
                />
              </label>
              <label>
                <span className="field-label">NTRIP mountpoint</span>
                <input
                  className="field-input font-mono"
                  {...register('ntripMountpoint', { required: true })}
                />
              </label>
              <div className="col-span-2 border border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                NTRIP credentials are intentionally not stored in this browser prototype. The
                production adapter should use the cabin secure credential service. Provider changes
                take effect after reload.
              </div>
            </div>
          </section>
        </div>
      </form>
      {saved && (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 border border-pama-green bg-white px-4 py-3 text-sm font-bold text-pama-green">
          <Check size={17} /> Settings saved locally
        </div>
      )}
    </div>
  );
}
