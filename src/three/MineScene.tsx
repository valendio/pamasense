import { Grid, Html, Line } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { SITE_ORIGIN } from '../config/site';
import type { GuidanceResult } from '../features/guidance/guidanceTypes';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';
import { useDesignStore } from '../stores/designStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { CameraController } from './CameraController';
import { ExcavatorModel } from './ExcavatorModel';
import { MineContext } from './MineContext';
import { ActualSurface, DesignSurface, TerrainContourLines } from './TerrainMesh';
import { WorkBoundary } from './WorkBoundary';

function SceneContent({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const design = useDesignStore((state) => state.design);
  const actual = useDesignStore((state) => state.actual);
  const settings = useSettingsStore((state) => state.settings);
  const showDesign = useUiStore((state) => state.showDesign);
  const showActual = useUiStore((state) => state.showActual);
  const showHeatmap = useUiStore((state) => state.showHeatmap);
  const showBoundaries = useUiStore((state) => state.showBoundaries);
  const designWireframe = useUiStore((state) => state.designWireframe);
  const bucketLocal: [number, number, number] = [
    guidance.bucketTip[0] - SITE_ORIGIN.east,
    guidance.bucketTip[1],
    guidance.bucketTip[2] - SITE_ORIGIN.north,
  ];
  const targetY = guidance.designElevation ?? 120;
  const statusColor =
    guidance.status === 'OVERDIG'
      ? '#d64545'
      : guidance.status === 'UNDERDIG'
        ? '#2d85c7'
        : guidance.status === 'ON_GRADE'
          ? '#25a56a'
          : '#a7afbd';

  return (
    <>
      <color attach="background" args={['#aab9bd']} />
      <fog attach="fog" args={['#aab9bd', 220, 650]} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#eaf3ff', '#675c49', 1.5]} />
      <directionalLight
        position={[90, 240, 75]}
        intensity={2.3}
        castShadow={!settings.display.lowPerformanceMode}
        shadow-mapSize={[1024, 1024]}
      />
      {showActual && design && (
        <ActualSurface
          actual={actual}
          design={design}
          showHeatmap={showHeatmap}
          opacity={settings.display.terrainOpacity}
        />
      )}
      {showDesign && design && (
        <DesignSurface
          design={design}
          opacity={showActual ? 0.2 : 0.82}
          wireframe={designWireframe || showActual}
        />
      )}
      {showDesign && design && <TerrainContourLines design={design} />}
      <Grid
        position={[0, 119.82, 0]}
        args={[600, 500]}
        cellSize={10}
        cellThickness={0.45}
        cellColor="#596a73"
        sectionSize={50}
        sectionThickness={1.1}
        sectionColor="#294483"
        fadeDistance={420}
        fadeStrength={1}
      />
      {showBoundaries && <WorkBoundary />}
      <MineContext lowPerformance={settings.display.lowPerformanceMode} design={design} />
      <ExcavatorModel
        telemetry={telemetry}
        geometry={settings.machine}
        lowPerformance={settings.display.lowPerformanceMode}
      />
      <mesh position={bucketLocal}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshBasicMaterial color={statusColor} depthTest={false} />
      </mesh>
      <Line
        points={[bucketLocal, [bucketLocal[0], targetY, bucketLocal[2]]]}
        color={statusColor}
        lineWidth={2}
        dashed
        dashSize={0.8}
        gapSize={0.4}
      />
      <mesh position={[bucketLocal[0], targetY, bucketLocal[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 32]} />
        <meshBasicMaterial color="#ffc928" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <Html
        position={[bucketLocal[0], bucketLocal[1] + 2.2, bucketLocal[2]]}
        center
        distanceFactor={80}
        zIndexRange={[20, 0]}
      >
        <div className="whitespace-nowrap border border-slate-700 bg-white/95 px-2 py-1 font-mono text-[11px] font-bold text-slate-800">
          TOOTH {guidance.bucketTip[1].toFixed(2)} m
        </div>
      </Html>
      <CameraController telemetry={telemetry} guidance={guidance} />
    </>
  );
}

export function MineScene({
  telemetry,
  guidance,
}: {
  telemetry: MachineTelemetry;
  guidance: GuidanceResult;
}) {
  const display = useSettingsStore((state) => state.settings.display);
  const lowPerformance = display.lowPerformanceMode;
  return (
    <div className="relative h-full w-full bg-[#aab9bd]" data-testid="three-view">
      <Canvas
        className="three-canvas"
        camera={{
          position: [54, 148, 46],
          fov: 44,
          near: display.nearClipM,
          far: display.farClipM,
        }}
        dpr={lowPerformance ? 1 : [1, 1.5]}
        gl={{ antialias: !lowPerformance, powerPreference: 'high-performance' }}
        shadows={!lowPerformance}
      >
        <Suspense fallback={null}>
          <SceneContent telemetry={telemetry} guidance={guidance} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 border border-slate-700 bg-slate-900/80 px-2 py-1 font-mono text-[10px] text-white">
        UTM 48S · MSL
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-end gap-2 text-[10px] font-bold text-white">
        <span className="block h-2 w-20 border-x-2 border-b-2 border-white" /> 50 m
      </div>
      <div className="pointer-events-none absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-slate-900/55 text-xs font-black text-white">
        <span className="absolute -top-1 text-pama-yellow">N</span>
        <span className="mt-3 text-lg">↑</span>
      </div>
    </div>
  );
}
