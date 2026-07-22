import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-[76px] shrink-0 items-center border-b border-slate-300 bg-white px-6">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-pama-blue">
          {eyebrow}
        </div>
        <h1 className="mt-0.5 text-xl font-black text-pama-navy">{title}</h1>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
