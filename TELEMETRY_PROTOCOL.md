# Telemetry Protocol

## Transport

The production browser consumes UTF-8 JSON messages over WebSocket. Default configuration is `ws://127.0.0.1:8080/telemetry`. A cabin gateway owns serial/CAN/vendor-protocol access, time synchronization, reconnect backoff, and conversion to this stable contract.

IMU/implement samples should be published at 20 Hz and GNSS values refreshed at 10 Hz. Sending a unified message at 20 Hz is recommended; repeated GNSS fields may retain the most recent receiver solution. Use ISO 8601 UTC timestamps.

## Payload

```json
{
  "timestamp": "2026-07-22T07:35:12.120Z",
  "machineId": "EX-021",
  "gnss": {
    "east": 473221.427,
    "north": 9238744.118,
    "elevation": 126.832,
    "headingDeg": 258.2,
    "rollDeg": 0.8,
    "pitchDeg": -1.1,
    "solution": "RTK_FIX",
    "horizontalAccuracyM": 0.012,
    "verticalAccuracyM": 0.024,
    "correctionAgeSec": 0.7,
    "satelliteCount": 22,
    "headingAccuracyDeg": 0.06
  },
  "imu": {
    "boomAngleDeg": 32.4,
    "armAngleDeg": -67.8,
    "bucketAngleDeg": -41.2,
    "updateRateHz": 20,
    "health": "OK"
  },
  "machine": {
    "engineRunning": true,
    "hydraulicPressureBar": 281,
    "canStatus": "OK"
  },
  "network": {
    "online": true,
    "signalStrengthPercent": 78,
    "masterControlConnected": true
  }
}
```

## Enumerations

- GNSS solution: `RTK_FIX`, `RTK_FLOAT`, `DGPS`, `SPS`, `LOST`
- IMU health: `OK`, `DEGRADED`, `FAULT`, `OFFLINE`
- CAN status: `OK`, `DEGRADED`, `ERROR`, `OFFLINE`

Unknown fields are tolerated by Zod's object parsing, but every documented field is required. Invalid types, missing fields, non-finite coordinates, and unknown enumeration values reject the complete message without crashing the active UI.

## BX992 and JD2110 replacement point

Implement the vendor bridge outside the browser:

1. Decode BX992 PVT/heading/quality messages into the `gnss` object. Preserve ellipsoidal-to-MSL correction in the gateway and publish only the configured site datum.
2. Decode JD2110/body IMU and CAN angle nodes into degrees in the calibrated sign convention.
3. Align timestamps to the gateway monotonic/UTC clock and reject samples with excessive cross-sensor skew.
4. Publish the JSON contract to the configured WebSocket endpoint.
5. Select `WEBSOCKET` in PAMASense Settings and reload.

The live implementation is `src/features/telemetry/WebSocketTelemetryProvider.ts`. TLS (`wss://`) and gateway authentication should be used outside a trusted isolated cabin network.

## Quality gate defaults

Guidance becomes invalid when solution is not RTK FIX, vertical accuracy is above 0.05 m, correction age is above 3 s, telemetry age is above 1.5 s, implement IMU is not OK, or CAN is not OK. Settings can tighten site-specific limits.
