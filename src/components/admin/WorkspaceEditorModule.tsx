import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Cloud, CloudOff, Eye, EyeOff, LayoutTemplate, RotateCcw, Save } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { workspaceRegistry } from '../../workspace-engine/registry';
import { WorkspaceDefinition, WorkspaceWidgetDefinition, WorkspaceWidgetSpan } from '../../workspace-engine/types';
import { getWidgetCatalogItem, normalizeWorkspaceWidgets } from '../../workspace-engine/widgetCatalog';
import { DEFAULT_WORKSPACE_HOTEL_ID, hydrateWorkspaceOverridesFromSupabase, loadWorkspaceOverrides, resetWorkspaceOverride, saveWorkspaceOverride } from '../../workspace-engine/workspaceConfigStore';

const spanOptions: WorkspaceWidgetSpan[] = [1, 2, 3, 4, 'full'];

export const WorkspaceEditorModule: React.FC = () => {
  const { hotelConfig, currentUser } = useHotel();
  const hotelId = hotelConfig?.id || DEFAULT_WORKSPACE_HOTEL_ID;
  const buildDefinitions = () => {
    const overrides = loadWorkspaceOverrides(hotelId);
    return workspaceRegistry.map(base => overrides[base.id] ? { ...base, ...overrides[base.id] } : base);
  };
  const initial = useMemo(() => buildDefinitions(), [hotelId]);
  const [definitions, setDefinitions] = useState<WorkspaceDefinition[]>(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncSource, setSyncSource] = useState<'supabase' | 'local' | 'loading'>('loading');
  const selected = definitions.find(item => item.id === selectedId);

  useEffect(() => {
    let cancelled = false;
    setSyncSource('loading');
    void hydrateWorkspaceOverridesFromSupabase(hotelId).then(result => {
      if (cancelled) return;
      setDefinitions(buildDefinitions());
      setSyncSource(result.source);
    });
    return () => { cancelled = true; };
  }, [hotelId]);

  const updateSelected = (patch: Partial<WorkspaceDefinition>) => setDefinitions(current => current.map(item => item.id === selectedId ? { ...item, ...patch } : item));
  const updateWidget = (widgetId: string, patch: Partial<WorkspaceWidgetDefinition>) => selected && updateSelected({ widgets: selected.widgets.map(widget => widget.id === widgetId ? { ...widget, ...patch } : widget) });
  const moveWidget = (widgetId: string, direction: -1 | 1) => {
    if (!selected) return;
    const widgets = [...selected.widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const index = widgets.findIndex(widget => widget.id === widgetId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= widgets.length) return;
    [widgets[index], widgets[target]] = [widgets[target], widgets[index]];
    updateSelected({ widgets: widgets.map((widget, order) => ({ ...widget, order: (order + 1) * 10 })) });
  };
  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    const result = await saveWorkspaceOverride({ ...selected, widgets: normalizeWorkspaceWidgets(selected.widgets) }, { hotelId, userId: currentUser?.id });
    setSyncSource(result.persisted ? 'supabase' : 'local');
    setMessage(result.persisted ? 'Workspace salvo no hotel e sincronizado com o Supabase.' : 'Workspace salvo localmente. O Supabase não respondeu; a configuração continuará disponível neste dispositivo.');
    setSaving(false);
  };
  const reset = async () => {
    if (!selected || saving) return;
    setSaving(true);
    const result = await resetWorkspaceOverride(selected.id, hotelId);
    const base = workspaceRegistry.find(item => item.id === selected.id);
    if (base) setDefinitions(current => current.map(item => item.id === selected.id ? base : item));
    setSyncSource(result.persisted ? 'supabase' : 'local');
    setMessage(result.persisted ? 'Configuração do hotel removida; o Workspace voltou ao padrão.' : 'Configuração local restaurada; não foi possível remover a versão remota agora.');
    setSaving(false);
  };

  if (!selected) return <div className="rounded-3xl border border-stone-200 bg-white p-8">Nenhum Workspace registrado.</div>;

  return <div className="space-y-5">
    <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-amber-600" /><h2 className="text-lg font-black">Editor de Workspaces</h2></div><p className="mt-1 text-xs text-stone-500">Personalize a composição operacional por hotel sem alterar o motor Kanban.</p><div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-stone-500"><span>Hotel: {hotelId}</span><span>•</span>{syncSource === 'supabase' ? <span className="inline-flex items-center gap-1 text-emerald-700"><Cloud className="w-3.5 h-3.5" /> Sincronizado</span> : syncSource === 'local' ? <span className="inline-flex items-center gap-1 text-amber-700"><CloudOff className="w-3.5 h-3.5" /> Fallback local</span> : <span>Carregando configuração…</span>}</div></div><div className="flex gap-2"><button disabled={saving} onClick={() => void reset()} className="h-10 px-4 rounded-xl border border-stone-200 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Restaurar</button><button disabled={saving} onClick={() => void save()} className="h-10 px-4 rounded-xl bg-stone-950 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Salvando…' : 'Salvar'}</button></div></div>{message && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">{message}</div>}</div>
    <div className="grid lg:grid-cols-[260px_1fr] gap-5"><aside className="rounded-3xl border border-stone-200 bg-white p-3 h-fit">{definitions.map(item => <button key={item.id} onClick={() => { setSelectedId(item.id); setMessage(''); }} className={`w-full text-left rounded-2xl p-3 transition ${selectedId === item.id ? 'bg-stone-950 text-white' : 'hover:bg-stone-100'}`}><p className="text-xs font-black">{item.name}</p><p className={`mt-1 text-[10px] ${selectedId === item.id ? 'text-stone-300' : 'text-stone-500'}`}>{item.sectors.join(', ')}</p></button>)}</aside>
      <section className="space-y-4"><div className="rounded-3xl border border-stone-200 bg-white p-5 grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold text-stone-600">Nome<input value={selected.name} onChange={e => updateSelected({ name: e.target.value })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 font-medium text-stone-900" /></label><label className="text-xs font-bold text-stone-600">Visão inicial<select value={selected.defaultScope} onChange={e => updateSelected({ defaultScope: e.target.value as WorkspaceDefinition['defaultScope'] })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 bg-white text-stone-900"><option value="mine">Meu trabalho</option><option value="sector">Meu setor</option></select></label><label className="sm:col-span-2 text-xs font-bold text-stone-600">Descrição<input value={selected.description} onChange={e => updateSelected({ description: e.target.value })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 font-medium text-stone-900" /></label></div>
        <div className="space-y-3">{[...selected.widgets].sort((a,b)=>(a.order??0)-(b.order??0)).map(widget => { const catalog = getWidgetCatalogItem(widget.type); return <div key={widget.id} className={`rounded-3xl border bg-white p-4 sm:p-5 ${widget.enabled === false ? 'border-stone-200 opacity-65' : 'border-amber-200 shadow-sm'}`}><div className="flex flex-col xl:flex-row xl:items-center gap-4"><div className="flex-1"><div className="flex items-center gap-2"><span className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-black uppercase text-stone-600">{catalog?.label || widget.type}</span><strong className="text-sm">{widget.title || widget.id}</strong></div><p className="mt-1 text-[10px] text-stone-400">{widget.id}{widget.boardId ? ` • ${widget.boardId}` : ''}</p></div><div className="flex flex-wrap items-center gap-2"><select value={String(widget.span ?? catalog?.defaultSpan ?? 'full')} onChange={e => updateWidget(widget.id, { span: e.target.value === 'full' ? 'full' : Number(e.target.value) as WorkspaceWidgetSpan })} className="h-9 rounded-xl border border-stone-200 bg-white px-2 text-xs font-bold">{spanOptions.map(span => <option key={String(span)} value={String(span)}>Largura {span === 'full' ? 'total' : span}</option>)}</select><button onClick={() => moveWidget(widget.id, -1)} className="h-9 w-9 grid place-items-center rounded-xl border border-stone-200"><ArrowUp className="w-4 h-4" /></button><button onClick={() => moveWidget(widget.id, 1)} className="h-9 w-9 grid place-items-center rounded-xl border border-stone-200"><ArrowDown className="w-4 h-4" /></button><button onClick={() => updateWidget(widget.id, { enabled: widget.enabled === false })} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-2 ${widget.enabled === false ? 'bg-stone-100 text-stone-600' : 'bg-emerald-100 text-emerald-800'}`}>{widget.enabled === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{widget.enabled === false ? 'Desativado' : 'Ativo'}</button></div></div></div>; })}</div>
      </section></div>
  </div>;
};
