# Mine Design Formats

## JSON TIN (fully supported)

Coordinates in `vertices` are `[localEast, elevation, localNorth]` in meters. `originEast` and `originNorth` locate that local surface in the telemetry grid. If omitted, PAMASense uses the configured Pit A site origin (`473200`, `9238700`). Triangle indices are zero-based.

```json
{
  "name": "Pit A Design Surface",
  "version": "2026.07.22-R03",
  "coordinateSystem": "WGS 84 / UTM zone 48S",
  "verticalDatum": "MSL",
  "originEast": 473200,
  "originNorth": 9238700,
  "effectiveDate": "2026-07-22",
  "vertices": [
    [0, 120, 0],
    [10, 121, 0],
    [0, 119, 10]
  ],
  "triangles": [[0, 1, 2]]
}
```

Validation requires a name, version, coordinate system, vertical datum, at least three finite vertices, at least one triangle, and valid triangle indices. Degenerate triangles cannot return an elevation.

## CSV elevation points (fully supported)

```csv
east,north,elevation
473200.0,9238700.0,124.5
473210.0,9238700.0,124.6
473200.0,9238710.0,124.2
473210.0,9238710.0,124.3
```

Headers are case-insensitive. Regular grids are triangulated cell-by-cell. Unstructured points use a documented fan fallback and produce a validation warning; production should replace this fallback with constrained Delaunay triangulation. CSV coordinates are normalized to their minimum East/North, which becomes the design origin.

## Prototype adapters

- **GeoJSON:** accepted by the file chooser as a polygon/boundary adapter target; it is not an elevation surface and currently returns a clear validation message.
- **DXF:** placeholder adapter target for office conversion pipelines.
- **GLTF/GLB:** placeholder visual-reference target; it must not be used for guidance elevation unless paired with a validated TIN.

Imported guidance surfaces are saved to IndexedDB with import and effective timestamps. On startup the newest locally stored design supersedes the deterministic demo plan.

## Elevation query

`getDesignElevation(x, z)` scans for a containing triangle and computes barycentric weights in the East/North plane. Elevation is the weighted value of all three triangle vertices. Points outside all triangles return `null`; guidance then becomes invalid rather than extrapolating.
