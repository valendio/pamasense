type StatusTone = 'healthy' | 'warning' | 'critical' | 'unknown' | 'info';

const tones: Record<StatusTone, string> = {
  healthy: 'bg-pama-green',
  warning: 'bg-pama-orange',
  critical: 'bg-pama-red',
  unknown: 'bg-slate-400',
  info: 'bg-pama-info',
};

export function StatusPill({
  label,
  value,
  tone,
}: {
  label?: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold">
      <span className={`status-dot ${tones[tone]}`} aria-hidden />
      <span className="text-white/65">{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}
