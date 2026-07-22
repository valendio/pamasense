export const deviationColors = {
  extremeOverdig: '#D64545',
  overdig: '#EF8F2F',
  onGrade: '#25A56A',
  underdig: '#42A5D9',
  extremeUnderdig: '#153A8A',
} as const;

export function deviationColor(deviationM: number): string {
  if (deviationM < -0.2) return deviationColors.extremeOverdig;
  if (deviationM < -0.05) return deviationColors.overdig;
  if (deviationM <= 0.05) return deviationColors.onGrade;
  if (deviationM <= 0.2) return deviationColors.underdig;
  return deviationColors.extremeUnderdig;
}
