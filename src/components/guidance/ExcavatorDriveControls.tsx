import { useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { Navigation } from 'lucide-react';
import type { DriveControlKey } from '../../features/machine/driveKinematics';
import { useTelemetryStore } from '../../stores/telemetryStore';

const CODE_TO_CONTROL: Record<string, DriveControlKey> = {
  KeyW: 'forward',
  KeyS: 'reverse',
  KeyA: 'left',
  KeyD: 'right',
};

const CONTROLS: { control: DriveControlKey; keyLabel: string; action: string }[] = [
  { control: 'forward', keyLabel: 'W', action: 'Forward' },
  { control: 'left', keyLabel: 'A', action: 'Turn left' },
  { control: 'reverse', keyLabel: 'S', action: 'Reverse' },
  { control: 'right', keyLabel: 'D', action: 'Turn right' },
];

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function ExcavatorDriveControls() {
  const driveInput = useTelemetryStore((state) => state.driveInput);
  const setDriveKey = useTelemetryStore((state) => state.setDriveKey);
  const releaseDriveControls = useTelemetryStore((state) => state.releaseDriveControls);

  useEffect(() => {
    const updateKeyboardControl = (event: KeyboardEvent, pressed: boolean) => {
      const control = CODE_TO_CONTROL[event.code];
      if (!control || event.ctrlKey || event.metaKey || event.altKey) return;
      if (pressed && isEditableTarget(event.target)) return;
      event.preventDefault();
      setDriveKey(control, pressed);
    };
    const onKeyDown = (event: KeyboardEvent) => updateKeyboardControl(event, true);
    const onKeyUp = (event: KeyboardEvent) => updateKeyboardControl(event, false);
    const onVisibilityChange = () => {
      if (document.hidden) releaseDriveControls();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseDriveControls);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseDriveControls);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseDriveControls();
    };
  }, [releaseDriveControls, setDriveKey]);

  const press = (control: DriveControlKey) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDriveKey(control, true);
  };
  const release = (control: DriveControlKey) => () => setDriveKey(control, false);

  return (
    <aside
      className="absolute left-3 top-20 z-20 border border-slate-600 bg-slate-950/90 p-2 text-white"
      aria-label="Excavator WASD drive controls"
      data-testid="drive-controls"
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.12em]">
        <Navigation size={12} className="text-pama-yellow" /> TRACK DRIVE · WASD
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-1">
        {CONTROLS.map(({ control, keyLabel, action }, index) => (
          <button
            key={control}
            className={`grid h-9 w-9 place-items-center border text-xs font-black transition-colors ${
              driveInput[control]
                ? 'border-pama-yellow bg-pama-yellow text-pama-navy'
                : 'border-slate-500 bg-slate-800 text-white hover:border-white'
            } ${index === 0 ? 'col-start-2' : index === 1 ? 'col-start-1 row-start-2' : 'row-start-2'}`}
            aria-label={`${action} (${keyLabel})`}
            aria-pressed={driveInput[control]}
            onPointerDown={press(control)}
            onPointerUp={release(control)}
            onPointerCancel={release(control)}
            onLostPointerCapture={release(control)}
          >
            {keyLabel}
          </button>
        ))}
      </div>
      <div className="mt-1.5 text-center text-[9px] font-semibold text-slate-300">
        W/S TRAVEL · A/D STEER
      </div>
    </aside>
  );
}
