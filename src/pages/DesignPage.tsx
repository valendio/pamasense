import { CalendarDays, FileInput, Layers3, MapPinned, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ImportDesignDialog } from '../components/guidance/ImportDesignDialog';
import { PageHeader } from '../components/common/PageHeader';
import { Toggle } from '../components/common/Toggle';
import { useDesignStore } from '../stores/designStore';
import { useUiStore } from '../stores/uiStore';

export default function DesignPage() {
  const design = useDesignStore((state) => state.design);
  const clearDesign = useDesignStore((state) => state.clearDesign);
  const showDesign = useUiStore((state) => state.showDesign);
  const designWireframe = useUiStore((state) => state.designWireframe);
  const toggle = useUiStore((state) => state.toggle);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="Mine planning"
        title="Design Surface Management"
        description="Validate, activate, and retain mine plans for offline cabin guidance."
        actions={
          <button className="control-btn control-btn-active" onClick={() => setImportOpen(true)}>
            <FileInput size={16} /> Import Design
          </button>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_0.85fr] gap-4 overflow-auto p-4 scrollbar-thin">
        <section className="panel min-h-[420px]">
          <div className="panel-heading">
            <span>Active design</span>
            <span className="text-pama-green">● CABIN ACTIVE</span>
          </div>
          {design ? (
            <>
              <div className="border-b border-slate-300 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-pama-navy">{design.name}</h2>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-600">
                      {design.version}
                    </p>
                  </div>
                  <span className="border border-pama-green bg-green-50 px-3 py-1 text-xs font-black text-pama-green">
                    VALIDATED
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <MapPinned size={16} className="mb-2 text-pama-blue" />
                    <span className="text-slate-500">Coordinate system</span>
                    <div className="mt-1 font-bold">{design.coordinateSystem}</div>
                  </div>
                  <div>
                    <Layers3 size={16} className="mb-2 text-pama-blue" />
                    <span className="text-slate-500">Vertical datum</span>
                    <div className="mt-1 font-bold">{design.verticalDatum}</div>
                  </div>
                  <div>
                    <CalendarDays size={16} className="mb-2 text-pama-blue" />
                    <span className="text-slate-500">Effective date</span>
                    <div className="mt-1 font-bold">{design.effectiveDate}</div>
                  </div>
                  <div>
                    <Layers3 size={16} className="mb-2 text-pama-blue" />
                    <span className="text-slate-500">Surface data</span>
                    <div className="mt-1 font-bold">
                      {design.vertices.length.toLocaleString()} pts ·{' '}
                      {design.triangles.length.toLocaleString()} tris
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_240px] gap-4 p-5">
                <div className="relative h-72 overflow-hidden border border-slate-400 bg-[#e7e8dc]">
                  <svg
                    className="h-full w-full"
                    viewBox="0 0 700 340"
                    aria-label="Design surface overview"
                  >
                    <rect width="700" height="340" fill="#e7e8dc" />
                    {[45, 75, 108, 145, 184, 228].map((radius, index) => (
                      <ellipse
                        key={radius}
                        cx="350"
                        cy="175"
                        rx={radius * 1.35}
                        ry={radius * 0.78}
                        fill={index === 0 ? '#c4b88c' : 'none'}
                        stroke="#65755f"
                        strokeWidth={index % 2 ? 1.5 : 2.5}
                      />
                    ))}
                    <path
                      d="M 25 112 C 180 122, 270 145, 355 137 S 520 105, 680 98"
                      fill="none"
                      stroke="#d5b76d"
                      strokeWidth="28"
                    />
                    <polygon
                      points="275,142 462,145 474,248 258,246"
                      fill="#ffc92822"
                      stroke="#d5a300"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                    />
                    <text
                      x="365"
                      y="200"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="800"
                      fill="#0a2a66"
                    >
                      ACTIVE WORK FLOOR
                    </text>
                  </svg>
                  <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 font-mono text-[10px]">
                    600 × 500 m · RL 90–155 m
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="field-label">Visibility</div>
                    <Toggle
                      label="Show design surface"
                      checked={showDesign}
                      onChange={() => toggle('showDesign')}
                    />
                  </div>
                  <div>
                    <div className="field-label">Rendering</div>
                    <Toggle
                      label="Wireframe mode"
                      checked={designWireframe}
                      onChange={() => toggle('designWireframe')}
                    />
                  </div>
                  <div className="border-t border-slate-200 pt-4 text-xs text-slate-600">
                    <div className="font-bold text-slate-800">Imported</div>
                    {new Date(design.importedAt).toLocaleString()}
                    <div className="mt-3 font-bold text-slate-800">Storage</div>IndexedDB / offline
                    available
                  </div>
                  <button
                    className="control-btn w-full border-pama-red text-pama-red"
                    onClick={clearDesign}
                  >
                    <Trash2 size={15} /> Deactivate design
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-[420px] place-items-center p-8 text-center">
              <div>
                <Layers3 size={42} className="mx-auto text-slate-400" />
                <h2 className="mt-3 text-lg font-bold text-slate-700">No active mine design</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Guidance is unavailable until a validated surface is imported.
                </p>
                <button
                  className="control-btn control-btn-active mt-5"
                  onClick={() => setImportOpen(true)}
                >
                  Import mine design
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="panel self-start">
          <div className="panel-heading">Version synchronization</div>
          <div className="p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs text-slate-500">Cabin version</div>
                <div className="mt-1 font-mono font-bold">{design?.version ?? 'NONE'}</div>
              </div>
              <span className="text-xs font-black text-pama-green">CURRENT</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs text-slate-500">Master Control</div>
                <div className="mt-1 font-mono font-bold">{design?.version ?? 'UNAVAILABLE'}</div>
              </div>
              <span className="text-xs font-black text-pama-green">CONNECTED</span>
            </div>
            <div className="mt-4 text-xs leading-5 text-slate-600">
              Designs are cryptographically identified by version and import timestamp. The cabin
              retains the latest validated plan when network connectivity is lost.
            </div>
          </div>
        </section>
      </div>
      {importOpen && <ImportDesignDialog onClose={() => setImportOpen(false)} />}
    </div>
  );
}
