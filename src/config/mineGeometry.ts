export type HorizontalPoint = readonly [east: number, north: number];

export const WORK_POLYGON_XZ: HorizontalPoint[] = [
  [-126, -82],
  [-82, -118],
  [-12, -108],
  [74, -78],
  [128, -30],
  [116, 42],
  [48, 78],
  [-46, 72],
  [-112, 28],
];

export const NO_GO_POLYGON_XZ: HorizontalPoint[] = [
  [72, -42],
  [108, -38],
  [112, -4],
  [76, 2],
];
