import React from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

type Shortcut = { id?: string; label?: string; url?: string; description?: string };

const safeUrl = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('/') || url.startsWith('#')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch { return null; }
};

export const ShortcutsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const configured = Array.isArray(widget.settings?.shortcuts) ? widget.settings?.shortcuts as Shortcut[] : [];
  const shortcuts = configured.flatMap((item, index) => {
    const url = safeUrl(item.url);
    if (!url || !item.label) return [];
    return [{ ...item, id: item.id || `shortcut-${index}`, url }];
  });

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" data-shortcuts-widget>
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700"><Link2 className="h-4 w-4" /></span><div><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Atalhos</p><h2 className="text-sm font-black text-slate-900">{widget.title || 'Atalhos'}</h2></div></div>
    {shortcuts.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{shortcuts.map(item => <a key={item.id} href={item.url} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-amber-300" target={item.url.startsWith('http') ? '_blank' : undefined} rel={item.url.startsWith('http') ? 'noreferrer' : undefined}><span className="min-w-0 flex-1"><strong className="block truncate text-[11px] text-slate-900">{item.label}</strong>{item.description && <span className="block truncate text-[9px] text-slate-500">{item.description}</span>}</span><ExternalLink className="h-3.5 w-3.5 text-slate-400" /></a>)}</div> : <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-[10px] text-slate-500">Nenhum atalho configurado neste Workspace.</div>}
  </div>;
};
