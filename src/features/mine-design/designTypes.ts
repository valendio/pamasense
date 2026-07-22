import type { Vector3Tuple } from '../../types/common';

export type Triangle = [number, number, number];

export type TerrainDesign = {
  id: string;
  name: string;
  version: string;
  coordinateSystem: string;
  verticalDatum: string;
  originEast?: number;
  originNorth?: number;
  vertices: Vector3Tuple[];
  triangles: Triangle[];
  importedAt: string;
  effectiveDate: string;
};

export type ActualTerrain = {
  vertices: Vector3Tuple[];
  triangles: Triangle[];
  updatedAt: string;
  pointTimestamps: string[];
};
