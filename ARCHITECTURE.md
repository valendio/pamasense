# PAMASense Architecture

## Runtime pipeline

```text
BX992 / JD2110 / CAN gateway           Deterministic simulator
              \                         /
               TelemetryProvider interface
                          |
                    Zod validation
                          |
              high-frequency telemetry store
                          |
      +-------------------+-------------------+
      |                   |                   |
 forward kinematics   health/alarm gate   sampled event log
      |                   |                   |
 bucket tooth XYZ ---- quality gate       IndexedDB/export
      |
 TIN barycentric design query
      |
 vertical offset + hysteretic classification
      |
 3D / plan / cross-section / metrics / terrain queue
      |
 descending bucket + surface contact
      |
 cosine-falloff excavation of Actual only
```

## Boundaries

- **Acquisition:** `features/telemetry` owns provider lifecycle, schema validation, and connection state. Malformed WebSocket messages are rejected and retained as provider errors; UI rendering never parses transport payloads.
- **Domain:** `features/machine`, `features/mine-design`, and `features/guidance` are framework-independent calculation modules. The `GuidanceEngine` owns only the prior status needed for hysteresis.
- **High-frequency state:** `stores/telemetryStore.ts` receives 20 Hz samples. Components subscribe with narrow Zustand selectors. Normal UI state, settings, designs, alarms, and logs live in separate stores.
- **Rendering:** `three/` maps domain coordinates into Three.js. Terrain geometry is memoized and never rebuilt because an implement angle changed. The excavator hierarchy mirrors its physical joints.
- **Persistent/offline:** `services/indexedDb.ts` stores design versions, sampled logs, pending synchronization items, and alarms. Settings use Zustand's local-storage persistence. The production service worker runtime-caches same-origin assets.
- **Workers:** cut/fill is calculated in `workers/cutFill.worker.ts`; a main-thread fallback preserves functionality when Worker is unavailable. `terrain.worker.ts` is available for bulk heatmap processing as surfaces grow.
- **Topography updates:** `features/mine-design/excavation.ts` applies a compact cosine falloff to
  nearby Actual vertices only. The plan TIN remains immutable. `surfaceProfile.ts` samples a
  bucket-local E–W transect with barycentric interpolation so the new notch is immediately visible.
- **Mining activity:** each accepted excavation records its machine ID and Actual−Design result.
  `miningActivity.ts` aggregates those records into ten-second fleet buckets and rolling compliance
  metrics; units are counted uniquely, so the same shovel is never double-counted within a bucket.

## Guidance evaluation

1. Convert validated telemetry into an `ExcavatorPose`.
2. Multiply world, heading, body, boom, arm, bucket, and tooth transforms.
3. Convert global bucket East/North to local design coordinates using the design origin.
4. Locate the containing TIN triangle and perform barycentric interpolation.
5. Compute `bucket elevation - design elevation`.
6. Reject the result if RTK, accuracy, correction age, IMU, CAN, timestamp, design, or coverage gates fail.
7. Apply grade tolerance and hysteresis, then publish a semantic label plus color.

## Coordinate frames

| Frame     | Axes                          | Notes                        |
| --------- | ----------------------------- | ---------------------------- |
| Mine/grid | East, North, elevation        | UTM values in telemetry/logs |
| Three.js  | X east, Y elevation, Z north  | Local to design origin       |
| Machine   | +X implement direction, +Y up | Yaw offset maps 0° to north  |
| Joint     | local +X link direction       | Rotations are around local Z |

## Performance strategy

- Telemetry motion never regenerates terrain geometry. Actual terrain changes only on a rate-limited
  digging event, while the immutable plan geometry remains stable.
- UI charts and logs run at 1 Hz while the implement model receives 20 Hz samples.
- Cut/fill runs off the main thread.
- Non-guidance pages are route-lazy-loaded.
- Low-performance mode disables shadows/context vehicles, fixes DPR to 1, and removes antialiasing.
- Camera damping and adaptive DPR avoid unnecessary React state updates.
- Operational logs retain 3,000 in-memory samples and persist at 1 Hz rather than 20 Hz indefinitely.

For larger production TINs, add a spatial triangle index (R-tree/BVH), chunked LOD meshes, and streamed worker updates without changing the elevation-query contract.
