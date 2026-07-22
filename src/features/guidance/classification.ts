import type { DiggingStatus } from './guidanceTypes';

export const DEFAULT_GRADE_TOLERANCE_M = 0.05;

export function classifyDiggingStatus(
  offset: number,
  tolerance = DEFAULT_GRADE_TOLERANCE_M,
): DiggingStatus {
  if (offset > tolerance) return 'UNDERDIG';
  if (offset < -tolerance) return 'OVERDIG';
  return 'ON_GRADE';
}

export function classifyWithHysteresis(
  offset: number,
  previous: DiggingStatus | null,
  enterTolerance: number,
  exitTolerance: number,
): DiggingStatus {
  if (!previous) return classifyDiggingStatus(offset, enterTolerance);

  if (previous === 'UNDERDIG' && offset > enterTolerance) return 'UNDERDIG';
  if (previous === 'UNDERDIG' && offset >= -exitTolerance && offset <= enterTolerance)
    return 'ON_GRADE';
  if (previous === 'OVERDIG' && offset < -enterTolerance) return 'OVERDIG';
  if (previous === 'OVERDIG' && offset <= exitTolerance && offset >= -enterTolerance)
    return 'ON_GRADE';
  if (previous === 'ON_GRADE') {
    if (offset > exitTolerance) return 'UNDERDIG';
    if (offset < -exitTolerance) return 'OVERDIG';
    return 'ON_GRADE';
  }
  return classifyDiggingStatus(offset, enterTolerance);
}
