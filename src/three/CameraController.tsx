import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SITE_ORIGIN } from '../config/site';
import type { GuidanceResult } from '../features/guidance/guidanceTypes';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';

const defaultPosition = new Vector3(54, 148, 46);

export function CameraController({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const interacting = useRef(false);
  const { camera } = useThree();
  const cameraMode = useUiStore((state) => state.cameraMode);
  const autoTracking = useUiStore((state) => state.autoTracking);
  const resetToken = useUiStore((state) => state.resetCameraToken);
  const sensitivity = useSettingsStore((state) => state.settings.display.cameraSensitivity);
  const machine = new Vector3(
    telemetry.gnss.east - SITE_ORIGIN.east,
    telemetry.gnss.elevation + 3,
    telemetry.gnss.north - SITE_ORIGIN.north,
  );
  const bucket = new Vector3(
    guidance.bucketTip[0] - SITE_ORIGIN.east,
    guidance.bucketTip[1],
    guidance.bucketTip[2] - SITE_ORIGIN.north,
  );

  useEffect(() => {
    camera.position.copy(defaultPosition);
    controlsRef.current?.target.set(12, 124, -12);
    controlsRef.current?.update();
  }, [camera, resetToken]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const alpha = 1 - Math.exp(-delta * 2.4);
    if (cameraMode === 'TOP') {
      camera.position.lerp(new Vector3(machine.x, machine.y + 135, machine.z + 0.01), alpha);
      controls.target.lerp(machine, alpha);
    } else if (cameraMode === 'MACHINE') {
      camera.position.lerp(new Vector3(machine.x + 42, machine.y + 28, machine.z + 42), alpha);
      controls.target.lerp(machine, alpha);
    } else if (cameraMode === 'BUCKET') {
      camera.position.lerp(new Vector3(bucket.x + 20, bucket.y + 14, bucket.z + 20), alpha);
      controls.target.lerp(bucket, alpha);
    } else if (cameraMode === 'OPERATOR') {
      const heading = (telemetry.gnss.headingDeg * Math.PI) / 180;
      const operator = machine.clone().add(new Vector3(-2.4, 4.4, -1.5));
      camera.position.lerp(operator, alpha);
      controls.target.lerp(
        operator.clone().add(new Vector3(Math.sin(heading) * 22, -3, Math.cos(heading) * 22)),
        alpha,
      );
    } else if (autoTracking && !interacting.current) {
      controls.target.lerp(machine, alpha * 0.42);
    }
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={8}
      maxDistance={520}
      maxPolarAngle={Math.PI * 0.495}
      enableDamping
      dampingFactor={0.08}
      screenSpacePanning
      rotateSpeed={sensitivity}
      panSpeed={sensitivity}
      zoomSpeed={sensitivity}
      onStart={() => {
        interacting.current = true;
      }}
      onEnd={() => {
        interacting.current = false;
      }}
    />
  );
}
