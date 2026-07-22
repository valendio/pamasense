# Excavator Calibration

The included Komatsu PC1250 dimensions are approximate demonstration values. Do not use the prototype for production excavation until a survey/calibration team has measured the specific machine and verified results against independent control points.

## Required measurements

1. Establish the machine coordinate frame and a repeatable upper-structure heading zero.
2. Survey the boom pivot relative to the tracked-machine GNSS/body reference.
3. Measure pin-center boom length, arm length, bucket linkage length, and the active tooth offset.
4. Survey both GNSS antenna phase centers and enter the primary lever arm plus baseline.
5. Record sensor zero offsets, sign convention, and usable limits for boom, arm, bucket, body roll, and body pitch.
6. Confirm the design and BX992 use the same horizontal coordinate system, geoid model, and vertical datum.

PAMASense uses meters and degrees. World axes are East/X, elevation/Y, North/Z. Heading is clockwise from grid north. Implement links extend along local +X and rotate around local Z.

## Static calibration procedure

1. Park on a stable surveyed pad with tracks level and hydraulics safely isolated according to site procedure.
2. Survey at least two known bucket-tooth positions spanning the working envelope.
3. Enter measured geometry in **Settings → Machine Geometry**.
4. Apply JD2110/CAN zero offsets in the gateway so the published angles match PAMASense conventions.
5. Compare calculated tooth XYZ with the surveyed positions. Adjust only measured offsets; do not tune link lengths to hide sensor bias.
6. Repeat at low, mid, and high boom; curled and uncurled bucket; left and right upper-structure headings.

## Dynamic validation

- Move each joint independently and verify direction, constraints, and smoothness.
- Rotate the upper structure through at least four headings; the calculated tooth should remain within the project accuracy budget.
- Introduce RTK FLOAT, delayed corrections, stale telemetry, and disconnected IMU/CAN inputs. Every case must produce `GUIDANCE UNAVAILABLE`.
- Compare design elevation at surveyed points with office software using the same TIN triangles.

## Suggested acceptance budget

| Source                         | Target (1σ) |
| ------------------------------ | ----------: |
| GNSS vertical                  |   ≤ 0.025 m |
| Heading/lever-arm contribution |   ≤ 0.015 m |
| Implement angle contribution   |   ≤ 0.025 m |
| Geometry/tooth survey          |   ≤ 0.015 m |
| Surface interpolation          |   ≤ 0.010 m |

Set grade tolerance no tighter than the validated combined system uncertainty and site operating procedure.

## BX992 / JD2110 commissioning

The gateway maps BX992 PVT/dual-antenna heading into the `gnss` block and JD2110/CAN nodes into the `imu` block described in [TELEMETRY_PROTOCOL.md](./TELEMETRY_PROTOCOL.md). Keep raw receiver/sensor diagnostics in gateway logs. PAMASense needs corrected values, health, accuracy, correction age, and a trustworthy unified timestamp—not proprietary packets.
