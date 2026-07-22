import { Bell, Maximize, Minimize, Radio, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useAlarmStore } from '../../stores/alarmStore';
import { useTelemetryStore } from '../../stores/telemetryStore';
import { useLocalTime } from '../../hooks/useLocalTime';
import { StatusPill } from '../common/StatusPill';

export function TopBar() {
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const alarms = useAlarmStore((state) => state.alarms);
  const acknowledgeAll = useAlarmStore((state) => state.acknowledgeAll);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const now = useLocalTime();
  const unread = alarms.filter((alarm) => !alarm.acknowledged).length;

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    setFullscreen(Boolean(document.fullscreenElement));
  };

  return (
    <header className="relative z-40 flex h-[58px] shrink-0 items-center border-b-4 border-pama-yellow bg-pama-navy text-white">
      <div className="flex h-full w-[178px] shrink-0 items-center border-r border-white/15 px-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center bg-pama-yellow text-sm font-black italic text-pama-navy">
              P
            </span>
            <span className="text-[20px] font-black tracking-tight">
              PAMA<span className="text-pama-yellow">Sense</span>
            </span>
          </div>
        </div>
      </div>
      <div className="min-w-[280px] flex-1 px-5">
        <div className="text-[10px] font-semibold tracking-[0.19em] text-blue-200">
          REAL-TIME PRECISION MACHINE GUIDANCE
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-white/70">
          <Radio size={12} /> EX-021 / Pit A South
        </div>
      </div>
      <div className="flex h-full items-center gap-5 border-l border-white/10 px-5">
        <StatusPill
          label="GNSS-RTK"
          value={
            telemetry?.gnss.solution === 'RTK_FIX'
              ? 'FIX'
              : (telemetry?.gnss.solution.replace('_', ' ') ?? 'WAIT')
          }
          tone={
            telemetry?.gnss.solution === 'RTK_FIX' ? 'healthy' : telemetry ? 'critical' : 'unknown'
          }
        />
        <StatusPill
          label="IMU"
          value={telemetry?.imu.health ?? 'WAIT'}
          tone={telemetry?.imu.health === 'OK' ? 'healthy' : telemetry ? 'critical' : 'unknown'}
        />
        <StatusPill
          label="NETWORK"
          value={telemetry?.network.online ? 'ONLINE' : 'OFFLINE'}
          tone={telemetry?.network.online ? 'healthy' : telemetry ? 'critical' : 'unknown'}
        />
        {!telemetry?.network.online && (
          <WifiOff size={16} className="text-pama-red" aria-label="Network offline" />
        )}
        <div className="border-l border-white/15 pl-5 text-right font-mono">
          <div className="text-[10px] text-white/55">LOCAL TIME</div>
          <div className="text-base font-bold tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>
        <button
          className="relative grid h-10 w-10 place-items-center hover:bg-white/10"
          onClick={() => setAlarmOpen((value) => !value)}
          aria-label={`${unread} unacknowledged alarms`}
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pama-red px-1 text-[9px] font-bold">
              {unread}
            </span>
          )}
        </button>
        <button
          className="grid h-10 w-10 place-items-center hover:bg-white/10"
          onClick={() => void toggleFullscreen()}
          aria-label="Toggle fullscreen"
        >
          {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
        </button>
      </div>
      {alarmOpen && (
        <div className="absolute right-12 top-[54px] z-50 w-[410px] border border-slate-400 bg-white text-slate-800">
          <div className="flex h-11 items-center justify-between border-b border-slate-300 bg-slate-100 px-4">
            <span className="text-xs font-bold uppercase tracking-wider">Alarm center</span>
            <button className="text-xs font-bold text-pama-blue" onClick={acknowledgeAll}>
              Acknowledge all
            </button>
          </div>
          <div className="max-h-72 overflow-auto">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black ${alarm.severity === 'CRITICAL' ? 'text-pama-red' : alarm.severity === 'WARNING' ? 'text-pama-orange' : 'text-pama-info'}`}
                  >
                    {alarm.severity} · {alarm.title}
                  </span>
                  {!alarm.acknowledged && <span className="h-2 w-2 rounded-full bg-pama-red" />}
                </div>
                <p className="mt-1 text-xs text-slate-600">{alarm.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
