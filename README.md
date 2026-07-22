# PAMASense — Real-Time Precision Machine Guidance

PAMASense is a desktop-first browser application for excavator guidance in open-pit mines. The demo runs entirely locally: it renders a meter-scale mine and an articulated Komatsu PC1250, simulates GNSS-RTK/IMU/CAN telemetry, calculates the bucket tooth through forward kinematics, queries a TIN design surface, and gates underdig/on-grade/overdig guidance on sensor quality.

## Run locally

Requirements: Node.js 20+ and a WebGL 2-capable browser.

```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
```

The development server defaults to `http://localhost:4173`. Install Playwright's local browser once before the first end-to-end run if needed:

```bash
npx playwright install chromium
```

## Demo workflow

1. Open **Guidance**. Telemetry starts automatically at IMU 20 Hz and GNSS 10 Hz.
2. Expand **Demo Telemetry** to pause, change speed, set manual angles, select grade presets, or inject RTK/IMU/network/CAN faults.
3. Switch between **Plan**, **3D**, and **Section** at the bottom.
4. Open **Design** to import a JSON TIN or CSV elevation grid. Valid designs are stored in IndexedDB.
5. Open **Topography** to inspect updates and export sampled operational logs to CSV or JSON.
6. Open **Settings** to calibrate geometry/tolerances and configure the telemetry source.

All visible operational controls are connected. The service worker caches production assets after first load. IndexedDB retains designs, one-hertz logs, terrain synchronization items, and alarm history; calibration/display/connectivity preferences use local storage.

## Real hardware integration

The provider boundary is `src/features/telemetry/TelemetryProvider.ts`.

- `MockTelemetryProvider.ts` is the deterministic cabin demo.
- `WebSocketTelemetryProvider.ts` is the production-facing browser adapter. Select **Live WebSocket** in Settings, set the URL, save, and reload.
- A gateway should translate Trimble BX992 position/heading output and JD2110/CAN implement angles into the schema documented in [TELEMETRY_PROTOCOL.md](./TELEMETRY_PROTOCOL.md). The browser must not connect directly to serial, CAN, or receiver vendor protocols.
- Keep receiver timestamps from the BX992 and sensor timestamps from the JD2110/CAN gateway. The gateway should fuse them or include bounded skew before publishing; PAMASense rejects stale or unreliable data.

Calibration steps and transform conventions are in [CALIBRATION.md](./CALIBRATION.md). System structure and performance boundaries are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Main capabilities

- Three.js mine scene with separate design/actual surfaces and vertex deviation heatmap
- Primitive, hierarchical excavator with boom, arm, bucket, two GNSS antennas, and bucket tooth
- Matrix-chain forward kinematics using configurable geometry
- Barycentric TIN elevation interpolation (not nearest-point lookup)
- Grade tolerance and hysteresis with mandatory sensor-quality gating
- Functional topographic plan inspection and cross-section zoom/pan/direction controls
- JSON/CSV design validation with offline persistence
- Worker-backed cut/fill calculation and runtime-cached production shell
- Alarm center, critical banner, diagnostics, event sampling, and CSV/JSON export
- Adaptive pixel ratio and low-performance rendering mode

## Coordinate convention

World coordinates are meters: `X = East`, `Y = elevation`, `Z = North`. Headings are clockwise from grid north. Rendering uses local coordinates relative to the design origin while telemetry and exported logs retain UTM coordinates.

## Project scripts

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Vite development server                          |
| `npm run typecheck` | Strict TypeScript validation                     |
| `npm run lint`      | ESLint validation                                |
| `npm run test`      | Vitest unit suite                                |
| `npm run test:e2e`  | Ten Playwright operational workflows             |
| `npm run build`     | TypeScript check and optimized production bundle |
| `npm run format`    | Prettier formatting                              |

This prototype uses approximate PC1250 dimensions and must be site-calibrated before operational use.
