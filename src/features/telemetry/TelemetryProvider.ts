import type { ConnectionStatus } from '../../types/common';
import type { MachineTelemetry } from './telemetrySchema';

export interface TelemetryProvider {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(callback: (data: MachineTelemetry) => void): () => void;
  getConnectionStatus(): ConnectionStatus;
}
