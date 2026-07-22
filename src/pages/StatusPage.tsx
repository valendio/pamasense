import {
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Radio,
  Router,
  Satellite,
  Server,
  Thermometer,
  Wifi,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import type { MachineTelemetry } from '../features/telemetry/telemetrySchema';
import { useLocalTime } from '../hooks/useLocalTime';
import { useTelemetryStore } from '../stores/telemetryStore';

function StatusRow({
  label,
  value,
  status = 'normal',
}: {
  label: string;
  value: string;
  status?: 'normal' | 'good' | 'warning' | 'critical';
}) {
  const color =
    status === 'good'
      ? 'text-pama-green'
      : status === 'warning'
        ? 'text-pama-orange'
        : status === 'critical'
          ? 'text-pama-red'
          : 'text-slate-800';
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatusCard({
  title,
  icon: Icon,
  health,
  children,
}: {
  title: string;
  icon: typeof Satellite;
  health: 'OK' | 'DEGRADED' | 'FAULT';
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="flex h-12 items-center border-b border-slate-300 bg-slate-100 px-4">
        <Icon size={18} className="mr-3 text-pama-blue" />
        <h2 className="text-sm font-black text-pama-navy">{title}</h2>
        <span
          className={`ml-auto text-xs font-black ${health === 'OK' ? 'text-pama-green' : health === 'DEGRADED' ? 'text-pama-orange' : 'text-pama-red'}`}
        >
          ● {health}
        </span>
      </div>
      <div className="px-4 pb-2">{children}</div>
    </section>
  );
}

function GnssCard({ telemetry }: { telemetry: MachineTelemetry }) {
  return (
    <StatusCard
      title="GNSS / RTK"
      icon={Satellite}
      health={telemetry.gnss.solution === 'RTK_FIX' ? 'OK' : 'FAULT'}
    >
      <StatusRow
        label="RTK solution"
        value={telemetry.gnss.solution}
        status={telemetry.gnss.solution === 'RTK_FIX' ? 'good' : 'critical'}
      />
      <StatusRow label="Satellite count" value={`${telemetry.gnss.satelliteCount}`} />
      <StatusRow
        label="Horizontal accuracy"
        value={`${(telemetry.gnss.horizontalAccuracyM * 100).toFixed(1)} cm`}
        status="good"
      />
      <StatusRow
        label="Vertical accuracy"
        value={`${(telemetry.gnss.verticalAccuracyM * 100).toFixed(1)} cm`}
        status="good"
      />
      <StatusRow
        label="Heading accuracy"
        value={`${telemetry.gnss.headingAccuracyDeg.toFixed(2)}°`}
      />
      <StatusRow label="Correction source" value="NTRIP / ID-MINE-03" />
      <StatusRow label="Correction age" value={`${telemetry.gnss.correctionAgeSec.toFixed(1)} s`} />
      <StatusRow label="Antenna baseline" value="2.400 m" />
    </StatusCard>
  );
}

function ImuCard({ telemetry }: { telemetry: MachineTelemetry }) {
  return (
    <StatusCard
      title="IMU / IMPLEMENT"
      icon={Gauge}
      health={telemetry.imu.health === 'OK' ? 'OK' : 'FAULT'}
    >
      <StatusRow
        label="Body sensor"
        value={telemetry.imu.health}
        status={telemetry.imu.health === 'OK' ? 'good' : 'critical'}
      />
      <StatusRow
        label="Boom sensor"
        value={`${telemetry.imu.boomAngleDeg.toFixed(2)}° / OK`}
        status="good"
      />
      <StatusRow
        label="Arm sensor"
        value={`${telemetry.imu.armAngleDeg.toFixed(2)}° / OK`}
        status="good"
      />
      <StatusRow
        label="Bucket sensor"
        value={`${telemetry.imu.bucketAngleDeg.toFixed(2)}° / OK`}
        status="good"
      />
      <StatusRow label="Update rate" value={`${telemetry.imu.updateRateHz} Hz`} />
      <StatusRow label="Body node ID" value="0x21" />
      <StatusRow
        label="CAN status"
        value={telemetry.machine.canStatus}
        status={telemetry.machine.canStatus === 'OK' ? 'good' : 'critical'}
      />
      <StatusRow label="Last data" value={new Date(telemetry.timestamp).toLocaleTimeString()} />
    </StatusCard>
  );
}

export default function StatusPage() {
  const telemetry = useTelemetryStore((state) => state.telemetry);
  const now = useLocalTime();
  if (!telemetry)
    return (
      <div className="grid h-full place-items-center text-sm font-bold">
        WAITING FOR STATUS TELEMETRY…
      </div>
    );
  const uptimeHours = 7 + now.getMinutes() / 60;
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <PageHeader
        eyebrow="Diagnostics"
        title="Machine Health & Connectivity"
        description="Live health from positioning, implement, network, and cabin-computer subsystems."
      />
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-4 overflow-auto p-4 scrollbar-thin">
        <GnssCard telemetry={telemetry} />
        <ImuCard telemetry={telemetry} />
        <StatusCard
          title="NETWORK"
          icon={Router}
          health={telemetry.network.online ? 'OK' : 'FAULT'}
        >
          <StatusRow
            label="Cabin router"
            value={telemetry.network.online ? 'ONLINE' : 'OFFLINE'}
            status={telemetry.network.online ? 'good' : 'critical'}
          />
          <StatusRow
            label="Signal strength"
            value={`${telemetry.network.signalStrengthPercent}%`}
          />
          <StatusRow
            label="NTRIP connection"
            value={telemetry.network.online ? 'CONNECTED' : 'DISCONNECTED'}
            status={telemetry.network.online ? 'good' : 'critical'}
          />
          <StatusRow label="Radio correction" value="STANDBY" />
          <StatusRow
            label="Master Control"
            value={telemetry.network.masterControlConnected ? 'CONNECTED' : 'QUEUED'}
            status={telemetry.network.masterControlConnected ? 'good' : 'warning'}
          />
          <StatusRow label="Latency" value={telemetry.network.online ? '42 ms' : '—'} />
          <div className="mt-4 flex items-center gap-2 border border-slate-300 bg-slate-50 p-3 text-xs">
            <Wifi size={16} className="text-pama-blue" /> LTE-MINE-05 / 10.23.4.21
          </div>
        </StatusCard>
        <StatusCard title="CABIN COMPUTER" icon={Cpu} health="OK">
          <StatusRow label="Hardware" value="TREK-773" />
          <StatusRow
            label="CPU usage"
            value={`${(34 + Math.sin(now.getSeconds() / 8) * 5).toFixed(0)}%`}
            status="good"
          />
          <StatusRow label="RAM usage" value="3.8 / 8.0 GB" />
          <StatusRow label="Application" value="PAMASense 0.1.0" />
          <StatusRow label="Uptime" value={`${uptimeHours.toFixed(1)} h`} />
          <StatusRow label="Local storage" value="18.4 / 64 GB" />
          <StatusRow label="GPU renderer" value="WebGL 2 / OK" status="good" />
          <StatusRow label="Cabin temperature" value="41°C" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500">
            <div className="border border-slate-300 p-2">
              <HardDrive size={15} className="mx-auto mb-1 text-pama-blue" />
              SSD OK
            </div>
            <div className="border border-slate-300 p-2">
              <Thermometer size={15} className="mx-auto mb-1 text-pama-blue" />
              TEMP OK
            </div>
            <div className="border border-slate-300 p-2">
              <Database size={15} className="mx-auto mb-1 text-pama-blue" />
              DB OK
            </div>
          </div>
        </StatusCard>
      </div>
      <footer className="flex h-10 shrink-0 items-center gap-6 border-t border-slate-300 bg-white px-5 text-[11px] font-bold text-slate-600">
        <span className="flex items-center gap-2">
          <Server size={13} /> Master Control mc-pit-a-01
        </span>
        <span className="flex items-center gap-2">
          <Radio size={13} /> Telemetry 20 Hz
        </span>
        <span className="ml-auto">Last health scan {now.toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
