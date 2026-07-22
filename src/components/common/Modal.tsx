import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
  width = 'max-w-2xl',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className={`w-full ${width} border border-slate-500 bg-white`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex h-12 items-center justify-between border-b border-slate-300 bg-pama-navy px-4 text-white">
          <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
          <button
            className="grid h-9 w-9 place-items-center hover:bg-white/10"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
