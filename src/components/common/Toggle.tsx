type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  compact?: boolean;
};

export function Toggle({ checked, onChange, label, compact = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`inline-flex items-center gap-2 font-semibold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <span
        aria-hidden
        className={`relative inline-flex ${compact ? 'h-5 w-9' : 'h-6 w-11'} shrink-0 border transition-colors ${
          checked ? 'border-pama-blue bg-pama-blue' : 'border-slate-400 bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 bg-white transition-transform ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${
            checked ? (compact ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  );
}
