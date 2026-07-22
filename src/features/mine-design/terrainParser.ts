import { z } from 'zod';
import type { TerrainDesign, Triangle } from './designTypes';
import { SITE_ORIGIN } from '../../config/site';

const vectorSchema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const triangleSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
]);

export const terrainJsonSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    coordinateSystem: z.string().min(1),
    verticalDatum: z.string().min(1),
    vertices: z.array(vectorSchema).min(3),
    triangles: z.array(triangleSchema).min(1),
    effectiveDate: z.string().optional(),
    originEast: z.number().finite().optional(),
    originNorth: z.number().finite().optional(),
  })
  .superRefine((value, context) => {
    value.triangles.forEach((triangle, triangleIndex) => {
      triangle.forEach((vertexIndex) => {
        if (vertexIndex >= value.vertices.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Triangle ${triangleIndex} references missing vertex ${vertexIndex}`,
            path: ['triangles', triangleIndex],
          });
        }
      });
    });
  });

export type DesignImportResult =
  | { success: true; design: TerrainDesign; warnings: string[] }
  | { success: false; errors: string[] };

export function parseTerrainJson(text: string, fileName = 'import.json'): DesignImportResult {
  try {
    const parsed: unknown = JSON.parse(text);
    const result = terrainJsonSchema.safeParse(parsed);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    }
    return {
      success: true,
      warnings: [],
      design: {
        id: `design-${Date.now()}`,
        ...result.data,
        importedAt: new Date().toISOString(),
        effectiveDate: result.data.effectiveDate ?? new Date().toISOString().slice(0, 10),
        originEast: result.data.originEast ?? SITE_ORIGIN.east,
        originNorth: result.data.originNorth ?? SITE_ORIGIN.north,
        name: result.data.name || fileName.replace(/\.json$/i, ''),
      },
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Invalid JSON file'],
    };
  }
}

type CsvPoint = { east: number; north: number; elevation: number };

export function parseTerrainCsv(text: string, fileName = 'import.csv'): DesignImportResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 4)
    return { success: false, errors: ['CSV requires a header and at least 3 points'] };
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const eastIndex = headers.indexOf('east');
  const northIndex = headers.indexOf('north');
  const elevationIndex = headers.indexOf('elevation');
  if ([eastIndex, northIndex, elevationIndex].includes(-1)) {
    return { success: false, errors: ['CSV headers must include east,north,elevation'] };
  }

  const points: CsvPoint[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((line, index) => {
    if (!line.trim()) return;
    const cells = line.split(',').map(Number);
    const point = {
      east: cells[eastIndex],
      north: cells[northIndex],
      elevation: cells[elevationIndex],
    };
    if (Object.values(point).some((value) => !Number.isFinite(value))) {
      errors.push(`Line ${index + 2}: coordinates must be numeric`);
    } else {
      points.push(point);
    }
  });
  if (errors.length) return { success: false, errors };
  if (points.length < 3)
    return { success: false, errors: ['CSV requires at least 3 valid points'] };

  const minEast = Math.min(...points.map((point) => point.east));
  const minNorth = Math.min(...points.map((point) => point.north));
  const eastValues = [...new Set(points.map((point) => point.east))].sort((a, b) => a - b);
  const northValues = [...new Set(points.map((point) => point.north))].sort((a, b) => a - b);
  const pointIndex = new Map(points.map((point, index) => [`${point.east}|${point.north}`, index]));
  const triangles: Triangle[] = [];
  for (let row = 0; row < northValues.length - 1; row += 1) {
    for (let col = 0; col < eastValues.length - 1; col += 1) {
      const a = pointIndex.get(`${eastValues[col]}|${northValues[row]}`);
      const b = pointIndex.get(`${eastValues[col + 1]}|${northValues[row]}`);
      const c = pointIndex.get(`${eastValues[col]}|${northValues[row + 1]}`);
      const d = pointIndex.get(`${eastValues[col + 1]}|${northValues[row + 1]}`);
      if (a !== undefined && b !== undefined && c !== undefined && d !== undefined) {
        triangles.push([a, c, b], [b, c, d]);
      }
    }
  }
  if (!triangles.length) {
    for (let index = 1; index < points.length - 1; index += 1)
      triangles.push([0, index, index + 1]);
  }

  return {
    success: true,
    warnings:
      eastValues.length * northValues.length === points.length
        ? []
        : ['Unstructured CSV was triangulated as a fan; verify the imported surface.'],
    design: {
      id: `design-${Date.now()}`,
      name: fileName.replace(/\.csv$/i, ''),
      version: `CSV-${new Date().toISOString().slice(0, 10)}`,
      coordinateSystem: 'Local grid (source coordinates retained in metadata)',
      verticalDatum: 'MSL',
      originEast: minEast,
      originNorth: minNorth,
      vertices: points.map((point) => [
        point.east - minEast,
        point.elevation,
        point.north - minNorth,
      ]),
      triangles,
      importedAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString().slice(0, 10),
    },
  };
}

export async function parseDesignFile(file: File): Promise<DesignImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'json') return parseTerrainJson(await file.text(), file.name);
  if (extension === 'csv') return parseTerrainCsv(await file.text(), file.name);
  return {
    success: false,
    errors: [
      `${extension?.toUpperCase() || 'Unknown'} import is a visual/adapter placeholder. Use JSON or CSV for terrain queries.`,
    ],
  };
}
