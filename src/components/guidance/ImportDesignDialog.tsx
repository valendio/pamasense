import { AlertCircle, CheckCircle2, FileUp, Upload } from 'lucide-react';
import { useState } from 'react';
import {
  parseDesignFile,
  parseTerrainJson,
  type DesignImportResult,
} from '../../features/mine-design/terrainParser';
import { useDesignStore } from '../../stores/designStore';
import { Modal } from '../common/Modal';

const SAMPLE = JSON.stringify(
  {
    name: 'Cabin Validation Surface',
    version: '2026.07.22-R04-DEMO',
    coordinateSystem: 'UTM 48S (local scene offsets)',
    verticalDatum: 'MSL',
    effectiveDate: '2026-07-22',
    vertices: [
      [-100, 120.5, -100],
      [100, 121.3, -100],
      [-100, 119.9, 100],
      [100, 120.7, 100],
    ],
    triangles: [
      [0, 2, 1],
      [1, 2, 3],
    ],
  },
  null,
  2,
);

export function ImportDesignDialog({ onClose }: { onClose: () => void }) {
  const setDesign = useDesignStore((state) => state.setDesign);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<DesignImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResult(await parseDesignFile(file));
    setImported(false);
  };
  const loadSample = () => {
    setFileName('cabin-validation-surface.json');
    setResult(parseTerrainJson(SAMPLE, 'cabin-validation-surface.json'));
    setImported(false);
  };
  const commit = async () => {
    if (!result?.success) return;
    setBusy(true);
    await setDesign(result.design);
    setBusy(false);
    setImported(true);
  };

  return (
    <Modal title="Import mine design" onClose={onClose}>
      <div className="p-5">
        <div className="grid grid-cols-[1fr_190px] gap-5">
          <label className="grid min-h-36 cursor-pointer place-items-center border-2 border-dashed border-slate-400 bg-slate-50 p-4 text-center hover:border-pama-blue">
            <input
              type="file"
              accept=".json,.csv,.geojson,.dxf,.gltf,.glb"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <span>
              <FileUp size={28} className="mx-auto text-pama-blue" />
              <span className="mt-2 block text-sm font-bold text-slate-700">
                Select design file
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                JSON and CSV terrain import · GeoJSON/DXF/GLTF adapters recognized
              </span>
            </span>
          </label>
          <div className="border border-slate-300 bg-slate-50 p-3 text-xs">
            <div className="font-bold text-pama-navy">Prototype formats</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>JSON — full TIN support</li>
              <li>CSV — point triangulation</li>
              <li>GeoJSON — polygon adapter</li>
              <li>DXF — placeholder adapter</li>
              <li>GLB — visual reference</li>
            </ul>
            <button className="control-btn mt-3 w-full !min-h-8 !text-xs" onClick={loadSample}>
              Load valid sample
            </button>
          </div>
        </div>
        {fileName && (
          <div className="mt-4 border border-slate-300">
            <div className="flex items-center justify-between bg-slate-100 px-3 py-2 text-xs font-bold">
              <span>{fileName}</span>
              <span>{result?.success ? 'VALID' : 'VALIDATION FAILED'}</span>
            </div>
            {result?.success ? (
              <div className="grid grid-cols-3 gap-x-5 gap-y-3 p-4 text-xs">
                <div>
                  <span className="text-slate-500">Name</span>
                  <div className="font-bold">{result.design.name}</div>
                </div>
                <div>
                  <span className="text-slate-500">Version</span>
                  <div className="font-bold">{result.design.version}</div>
                </div>
                <div>
                  <span className="text-slate-500">Coordinate system</span>
                  <div className="font-bold">{result.design.coordinateSystem}</div>
                </div>
                <div>
                  <span className="text-slate-500">Vertical datum</span>
                  <div className="font-bold">{result.design.verticalDatum}</div>
                </div>
                <div>
                  <span className="text-slate-500">Points</span>
                  <div className="font-mono font-bold">{result.design.vertices.length}</div>
                </div>
                <div>
                  <span className="text-slate-500">Triangles</span>
                  <div className="font-mono font-bold">{result.design.triangles.length}</div>
                </div>
                {result.warnings.map((warning) => (
                  <div key={warning} className="col-span-3 flex gap-2 text-pama-orange">
                    <AlertCircle size={14} /> {warning}
                  </div>
                ))}
              </div>
            ) : result ? (
              <div className="p-4 text-xs text-pama-red">
                {result.errors.map((error) => (
                  <div key={error} className="flex gap-2 py-1">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
        {imported && (
          <div className="mt-3 flex items-center gap-2 border border-pama-green bg-green-50 px-3 py-2 text-xs font-bold text-pama-green">
            <CheckCircle2 size={15} /> Design stored offline and activated.
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className="control-btn" onClick={onClose}>
            {imported ? 'Close' : 'Cancel'}
          </button>
          <button
            className="control-btn control-btn-active"
            disabled={!result?.success || busy || imported}
            onClick={() => void commit()}
          >
            <Upload size={15} /> {busy ? 'Importing…' : imported ? 'Imported' : 'Import & activate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
