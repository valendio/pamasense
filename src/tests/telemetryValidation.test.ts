import { describe, expect, it } from 'vitest';
import { validateTelemetry } from '../features/telemetry/telemetrySchema';
import { createTelemetry } from './fixtures';

describe('telemetry validation', () => {
  it('accepts a complete telemetry payload', () => {
    expect(validateTelemetry(createTelemetry()).success).toBe(true);
  });

  it('rejects malformed messages without throwing', () => {
    expect(validateTelemetry({ timestamp: 'bad', gnss: { east: 'not-a-number' } }).success).toBe(
      false,
    );
    expect(() => validateTelemetry(null)).not.toThrow();
  });
});
