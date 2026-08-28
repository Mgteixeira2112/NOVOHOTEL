import React from 'react';
import { ChevronRight, X } from 'lucide-react';

export interface OperationalWorkCenterItem<TKey extends string = string> {
  key: TKey;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: string;
}

interface OperationalWorkCenterProps<TKey extends string> {
  sectorName: string;
  summary?: React.ReactNode;
  items: OperationalWorkCenterItem<TKey>[];
  activeKey: TKey | null;
  onOpen: (key: TKey) => void;
  onClose: () => void;
  panelTitle: (key: TKey) => string;
  renderPanel: (key: TKey) => React.ReactNode;
}

export function OperationalWorkCenter<TKey extends string>({
  sectorName,
  summary,
  items,
  activeKey,
  onOpen,
  onClose,
  panelTitle,
  renderPanel,
}: OperationalWorkCenterProps<TKey>) {
  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Central de trabalho · Tempo real</p>
          <h2 className="text-base font-black text-slate-950">{sectorName}</h2>
        </div>
        {summary && <span className="text-[10px] font-bold text-slate-400">{summary}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {items.map(item => <button
          key={item.key}
          type="button"
          onClick={() => onOpen(item.key)}
          className="group flex min-h-[74px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50/50"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm">
            <item.icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <strong className="text-xs text-slate-800">{item.label}</strong>
              <b className="text-lg text-slate-950">{item.value}</b>
            </span>
            <span className="block truncate text-[10px] text-slate-500">{item.detail}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-amber-600" />
        </button>)}
      </div>
    </section>

    {activeKey && <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Central de trabalho · Tempo real</p>
            <h2 className="text-lg font-black text-slate-950">{panelTitle(activeKey)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{renderPanel(activeKey)}</div>
      </div>
    </div>}
  </>;
}
