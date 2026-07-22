import type { ConnectionStatus } from '../../types/common';
import type { TelemetryProvider } from './TelemetryProvider';
import { validateTelemetry, type MachineTelemetry } from './telemetrySchema';

export class WebSocketTelemetryProvider implements TelemetryProvider {
  private socket: WebSocket | null = null;
  private listeners = new Set<(data: MachineTelemetry) => void>();
  private status: ConnectionStatus = 'OFFLINE';
  private lastError: string | null = null;

  constructor(private readonly url: string) {}

  connect() {
    return new Promise<void>((resolve, reject) => {
      this.status = 'CONNECTING';
      const socket = new WebSocket(this.url);
      this.socket = socket;
      socket.addEventListener('open', () => {
        this.status = 'ONLINE';
        resolve();
      });
      socket.addEventListener('message', (event) => {
        try {
          const result = validateTelemetry(JSON.parse(String(event.data)));
          if (!result.success) {
            this.lastError = result.error.issues.map((issue) => issue.message).join('; ');
            return;
          }
          for (const listener of this.listeners) listener(result.data);
        } catch (error) {
          this.lastError = error instanceof Error ? error.message : 'Malformed telemetry payload';
        }
      });
      socket.addEventListener('error', () => {
        this.status = 'ERROR';
        reject(new Error(`Unable to connect to telemetry WebSocket at ${this.url}`));
      });
      socket.addEventListener('close', () => {
        this.status = 'OFFLINE';
      });
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.status = 'OFFLINE';
  }

  subscribe(callback: (data: MachineTelemetry) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getConnectionStatus() {
    return this.status;
  }

  getLastError() {
    return this.lastError;
  }
}
