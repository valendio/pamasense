import { useEffect } from 'react';
import type { DriveControlKey } from '../../features/machine/driveKinematics';
import { useTelemetryStore } from '../../stores/telemetryStore';

const CODE_TO_CONTROL: Record<string, DriveControlKey> = {
  KeyW: 'forward',
  KeyS: 'reverse',
  KeyA: 'right',
  KeyD: 'left',
};

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

  return null;
}
