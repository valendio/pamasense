import { Activity, Compass, Cpu, Map, Settings, Wifi } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTelemetryStore } from '../../stores/telemetryStore';

const navigation = [
  { to: '/', label: 'Guidance', icon: Compass, end: true },
  { to: '/design', label: 'Design', icon: Map },
  { to: '/topography', label: 'Topography', icon: Activity },
  { to: '/status', label: 'Status', icon: Cpu },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const online = useTelemetryStore((state) => state.telemetry?.network.online ?? false);
  return (
    <aside className="flex w-[178px] shrink-0 flex-col border-r border-slate-300 bg-[#132f63] text-white">
      <nav className="py-2" aria-label="Primary navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex h-[54px] items-center gap-3 border-b border-white/5 px-5 text-sm font-semibold transition-colors hover:bg-white/10 ${
                isActive
                  ? 'bg-white/10 text-white before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-pama-yellow'
                  : 'text-blue-100'
              }`
            }
          >
            <Icon size={19} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/15 bg-[#0b2452] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">
          Selected machine
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-black">EX-021</span>
          <span className={`status-dot ${online ? 'bg-pama-green' : 'bg-pama-red'}`} />
        </div>
        <div className="text-xs text-blue-100">Komatsu PC1250</div>
        <div className="my-3 h-px bg-white/10" />
        <dl className="space-y-2 text-[11px]">
          <div>
            <dt className="text-blue-300">OPERATOR</dt>
            <dd className="font-semibold text-white">A. Pratama</dd>
          </div>
          <div>
            <dt className="text-blue-300">WORK AREA</dt>
            <dd className="font-semibold text-white">Pit A South / B04</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-blue-100">
          <Wifi size={12} /> Cabin link {online ? 'online' : 'offline'}
        </div>
      </div>
    </aside>
  );
}
