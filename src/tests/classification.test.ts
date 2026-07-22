import { describe, expect, it } from 'vitest';
import { classifyDiggingStatus, classifyWithHysteresis } from '../features/guidance/classification';

describe('digging classification', () => {
  it('classifies a bucket above design as underdig', () => {
    expect(classifyDiggingStatus(0.051, 0.05)).toBe('UNDERDIG');
  });

  it('classifies a bucket below design as overdig', () => {
    expect(classifyDiggingStatus(-0.051, 0.05)).toBe('OVERDIG');
  });

  it('keeps the exact tolerance boundary on grade', () => {
    expect(classifyDiggingStatus(0.05, 0.05)).toBe('ON_GRADE');
    expect(classifyDiggingStatus(-0.05, 0.05)).toBe('ON_GRADE');
  });

  it('uses hysteresis to avoid chatter at the threshold', () => {
    expect(classifyWithHysteresis(0.06, 'ON_GRADE', 0.05, 0.07)).toBe('ON_GRADE');
    expect(classifyWithHysteresis(0.071, 'ON_GRADE', 0.05, 0.07)).toBe('UNDERDIG');
    expect(classifyWithHysteresis(0.055, 'UNDERDIG', 0.05, 0.07)).toBe('UNDERDIG');
    expect(classifyWithHysteresis(0.045, 'UNDERDIG', 0.05, 0.07)).toBe('ON_GRADE');
  });
});
