import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Cloud, CloudOff, Copy, Eye, EyeOff, LayoutTemplate, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { OPERATIONAL_SECTORS, OperationalSectorId } from '../../domain/operationalSectors';
import { getWorkspaceDeviceMode } from '../../workspace-engine/presentation';
import { getAllWorkspaceDefinitions, workspaceRegistry } from '../../workspace-engine/registry';
import { WorkspaceDefinition, WorkspaceWidgetDefinition, WorkspaceWidgetType } from '../../workspace-engine/types';
import { createWorkspaceWidget, getWidgetAvailability, getWidgetCatalogItem, normalizeWorkspaceWidgets, WorkspaceWidgetReadiness, workspaceWidgetCatalog } from '../../workspace-engine/widgetCatalog';
import { createWorkspaceDefinition, defaultBoardForSector, duplicateWorkspaceDefinition, setWorkspaceSectorAndBoard, WORKSPACE_BOARD_OPTIONS } from '../../workspace-engine/workspaceFactory';
import { DEFAULT_WORKSPACE_HOTEL_ID, hydrateWorkspaceOverridesFromSupabase, resetWorkspaceOverride, saveWorkspaceOverride } from '../../workspace-engine/workspaceConfigStore';
import { defaultRoomMapActionsForSector } from '../../workspace-engine/widgets/roomMapWidgetPresentation';
import { KanbanWidgetAutomationEditor } from './KanbanWidgetAutomationEditor';
import { RoomMapWidgetEditor } from './RoomMapWidgetEditor';
import { WorkspaceGeneralPresentationControls } from './WorkspaceGeneralPresentationControls';
import { WorkspacePreviewPanel } from './WorkspacePreviewPanel';
import { WorkspaceWidgetPresentationControls } from './WorkspaceWidgetPresentationControls';

const categoryLabels = { operacao: 'Operação', dados: 'Dados do hotel', equipe: 'Equipe', atalhos: 'Atalhos' } as const;
const readinessLabels: Record<WorkspaceWidgetReadiness, string> = {
  ready: 'Pronto',
  configurable: 'Requer configuração',
  planned: 'Em desenvolvimento',
};
const readinessClasses: Record<WorkspaceWidgetReadiness, string> = {
  ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  configurable: 'bg-amber-100 text-amber-800 border-amber-200',
  planned: 'bg-stone-100 text-stone-600 border-stone-200',
};

export const WorkspaceEditorModule: React.FC = () => {
  const { hotelConfig, currentUser } = useHotel();
  const hotelId = hotelConfig?.id || DEFAULT_WORKSPACE_HOTEL_ID;
  const buildDefinitions = () => getAllWorkspaceDefinitions(hotelId);
  const initial = useMemo(() => buildDefinitions(), [hotelId]);
  const [definitions, setDefinitions] = useState<WorkspaceDefinition[]>(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncSource, setSyncSource] = useState<'supabase' | 'local' | 'loading'>('loading');
  const selected = definitions.find(item => item.id === selectedId);
  const isBaseWorkspace = !!selected && workspaceRegistry.some(item => item.id === selected.id);
  const selectedSector = selected?.sectors[0] || 'operacao';
  const selectedBoard = selected?.widgets.find(widget => widget.type === 'task-kanban')?.boardId || defaultBoardForSector(selectedSector);
  const activeCompatibilityIssues = selected?.widgets.filter(widget => widget.enabled !== false && !getWidgetAvailability(widget.type, selectedSector).allowed) || [];
  const saveBlocked = activeCompatibilityIssues.length > 0;

  useEffect(() => {
    let cancelled = false;
    setSyncSource('loading');
    void hydrateWorkspaceOverridesFromSupabase(hotelId).then(result => {
      if (cancelled) return;
      const next = buildDefinitions();
      setDefinitions(next);
      setSelectedId(current => next.some(item => item.id === current) ? current : (next[0]?.id || ''));
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
  const addWidget = (type: WorkspaceWidgetType) => {
    if (!selected) return;
    const availability = getWidgetAvailability(type, selectedSector);
    if (!availability.allowed) {
      setMessage(availability.reason || 'Este widget não pode ser usado no setor selecionado.');
      return;
    }
    const maxOrder = selected.widgets.reduce((max, widget) => Math.max(max, widget.order ?? 0), 0);
    const created = createWorkspaceWidget(type, { boardId: selectedBoard, order: maxOrder + 10 });
    const widget = type === 'room-map' ? { ...created, actions: defaultRoomMapActionsForSector(selectedSector) } : created;
    updateSelected({ widgets: [...selected.widgets, widget] });
    setMessage(`${getWidgetCatalogItem(type)?.label || type} adicionado. Salve o Workspace para sincronizar.`);
  };
  const removeWidget = (widgetId: string) => {
    if (!selected) return;
    updateSelected({ widgets: selected.widgets.filter(widget => widget.id !== widgetId) });
    setMessage('Widget removido da composição. Salve o Workspace para sincronizar.');
  };
  const persistDefinition = async (definition: WorkspaceDefinition, successMessage: string) => {
    setSaving(true);
    const result = await saveWorkspaceOverride({ ...definition, widgets: normalizeWorkspaceWidgets(definition.widgets) }, { hotelId, userId: currentUser?.id });
    setSyncSource(result.persisted ? 'supabase' : 'local');
    setMessage(result.persisted ? successMessage : 'Alteração salva localmente. O Supabase não respondeu; a configuração continuará disponível neste dispositivo.');
    setSaving(false);
    return result;
  };
  const save = async () => {
    if (!selected || saving || saveBlocked) return;
    await persistDefinition(selected, 'Workspace salvo no hotel e sincronizado com o Supabase.');
  };
  const reset = async () => {
    if (!selected || saving) return;
    setSaving(true);
    const result = await resetWorkspaceOverride(selected.id, hotelId);
    const next = buildDefinitions();
    setDefinitions(next);
    setSelectedId(current => next.some(item => item.id === current) ? current : (next[0]?.id || ''));
    setSyncSource(result.persisted ? 'supabase' : 'local');
    setMessage(result.persisted ? (isBaseWorkspace ? 'Configuração do hotel removida; o Workspace voltou ao padrão.' : 'Workspace personalizado removido.') : 'Alteração local concluída; não foi possível atualizar a versão remota agora.');
    setSaving(false);
  };
  const createNew = async () => {
    if (saving) return;
    const created = createWorkspaceDefinition({ name: 'Novo Workspace', sector: 'recepcao' });
    setDefinitions(current => [created, ...current]);
    setSelectedId(created.id);
    await persistDefinition(created, 'Novo Workspace criado e sincronizado com o hotel.');
  };
  const duplicate = async () => {
    if (!selected || saving) return;
    const copy = duplicateWorkspaceDefinition(selected);
    setDefinitions(current => [copy, ...current]);
    setSelectedId(copy.id);
    await persistDefinition(copy, 'Cópia do Workspace criada e sincronizada.');
  };
  const removeCustom = async () => {
    if (!selected || isBaseWorkspace || saving) return;
    if (typeof window !== 'undefined' && !window.confirm(`Excluir o Workspace "${selected.name}"?`)) return;
    await reset();
  };
  const changeSector = (sector: OperationalSectorId) => selected && setDefinitions(current => current.map(item => item.id === selected.id ? setWorkspaceSectorAndBoard(item, sector) : item));
  const changeBoard = (boardId: string) => selected && setDefinitions(current => current.map(item => item.id === selected.id ? setWorkspaceSectorAndBoard(item, selectedSector, boardId) : item));

  if (!selected) return <div className="rounded-3xl border border-stone-200 bg-white p-8"><button onClick={() => void createNew()} className="rounded-xl bg-stone-950 px-4 py-2 text-xs font-black text-white">Criar primeiro Workspace</button></div>;

  const desktopMode = getWorkspaceDeviceMode(selected, 'desktop');
  const mobileMode = getWorkspaceDeviceMode(selected, 'mobile');
  const kdsMode = getWorkspaceDeviceMode(selected, 'kds');

  return <div className="space-y-5">
    <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-amber-600" /><h2 className="text-lg font-black">Fábrica de Workspaces</h2></div>
          <p className="mt-1 text-xs text-stone-500">Monte ambientes operacionais e controle a apresentação Desktop, Mobile e KDS / TV sem alterar os engines de negócio.</p>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-stone-500"><span>Hotel: {hotelId}</span><span>•</span>{syncSource === 'supabase' ? <span className="inline-flex items-center gap-1 text-emerald-700"><Cloud className="w-3.5 h-3.5" /> Sincronizado</span> : syncSource === 'local' ? <span className="inline-flex items-center gap-1 text-amber-700"><CloudOff className="w-3.5 h-3.5" /> Fallback local</span> : <span>Carregando configuração…</span>}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={saving} onClick={() => void createNew()} className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 text-xs font-black flex items-center gap-2 disabled:opacity-50"><Plus className="w-4 h-4" /> Novo</button>
          <button disabled={saving} onClick={() => void duplicate()} className="h-10 px-4 rounded-xl border border-stone-200 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Copy className="w-4 h-4" /> Duplicar</button>
          <button disabled={saving} onClick={() => void reset()} className="h-10 px-4 rounded-xl border border-stone-200 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> {isBaseWorkspace ? 'Restaurar' : 'Remover'}</button>
          <button disabled={saving || saveBlocked} title={saveBlocked ? 'Corrija ou desative os widgets incompatíveis antes de salvar.' : undefined} onClick={() => void save()} className="h-10 px-4 rounded-xl bg-stone-950 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-4 h-4" /> {saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
      {message && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">{message}</div>}
      {saveBlocked && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-800"><strong className="font-black">Configuração incompatível com {OPERATIONAL_SECTORS.find(sector => sector.id === selectedSector)?.label || selectedSector}.</strong><p className="mt-1 text-[10px] leading-relaxed">{activeCompatibilityIssues.length} widget(s) ativo(s) não podem funcionar neste setor. Remova, desative ou ajuste esses blocos antes de salvar.</p></div>}
    </div>

    <div className="grid lg:grid-cols-[280px_1fr] gap-5">
      <aside className="rounded-3xl border border-stone-200 bg-white p-3 h-fit">
        <div className="mb-2 flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Workspaces</span><span className="rounded-full bg-stone-100 px-2 py-1 text-[9px] font-black text-stone-500">{definitions.length}</span></div>
        {definitions.map(item => <button key={item.id} onClick={() => { setSelectedId(item.id); setMessage(''); }} className={`w-full text-left rounded-2xl p-3 transition ${selectedId === item.id ? 'bg-stone-950 text-white' : 'hover:bg-stone-100'}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-black truncate">{item.name}</p>{!workspaceRegistry.some(base => base.id === item.id) && <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${selectedId === item.id ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-800'}`}>Custom</span>}</div><p className={`mt-1 text-[10px] ${selectedId === item.id ? 'text-stone-300' : 'text-stone-500'}`}>{item.sectors.join(', ')}</p></button>)}
      </aside>

      <section className="space-y-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-bold text-stone-600">Nome<input value={selected.name} onChange={e => updateSelected({ name: e.target.value })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 font-medium text-stone-900" /></label>
          <label className="text-xs font-bold text-stone-600">Visão inicial<select value={selected.defaultScope} onChange={e => updateSelected({ defaultScope: e.target.value as WorkspaceDefinition['defaultScope'] })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 bg-white text-stone-900"><option value="mine">Meu trabalho</option><option value="sector">Meu setor</option></select></label>
          <label className="text-xs font-bold text-stone-600">Setor<select value={selectedSector} onChange={e => changeSector(e.target.value as OperationalSectorId)} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 bg-white text-stone-900">{OPERATIONAL_SECTORS.map(sector => <option key={sector.id} value={sector.id}>{sector.label}</option>)}</select></label>
          <label className="text-xs font-bold text-stone-600">Board operacional<select value={selectedBoard} onChange={e => changeBoard(e.target.value)} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 bg-white text-stone-900">{WORKSPACE_BOARD_OPTIONS.map(board => <option key={board.id} value={board.id} disabled={board.sector !== selectedSector}>{board.label}{board.sector !== selectedSector ? ' — outro setor' : ''}</option>)}</select></label>
          <label className="sm:col-span-2 text-xs font-bold text-stone-600">Descrição<input value={selected.description} onChange={e => updateSelected({ description: e.target.value })} className="mt-2 w-full h-10 rounded-xl border border-stone-200 px-3 font-medium text-stone-900" /></label>
          {!isBaseWorkspace && <div className="sm:col-span-2 flex justify-end"><button disabled={saving} onClick={() => void removeCustom()} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Excluir Workspace personalizado</button></div>}
        </div>

        <WorkspaceGeneralPresentationControls definition={selected} onChange={updateSelected} />
        <WorkspacePreviewPanel definition={selected} />

        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><h3 className="text-sm font-black text-stone-900">Biblioteca de widgets</h3><p className="mt-1 text-[10px] text-stone-500">A disponibilidade abaixo é calculada para o setor selecionado. Combinações sem implementação funcional ficam bloqueadas.</p></div>
            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black"><span className={`rounded-full border px-2 py-1 ${readinessClasses.ready}`}>Pronto</span><span className={`rounded-full border px-2 py-1 ${readinessClasses.configurable}`}>Requer configuração</span><span className={`rounded-full border px-2 py-1 ${readinessClasses.planned}`}>Em desenvolvimento</span></div>
          </div>
          <div className="mt-4 space-y-4">{(['operacao','dados','equipe','atalhos'] as const).map(category => <div key={category}><p className="mb-2 text-[9px] font-black uppercase tracking-widest text-stone-400">{categoryLabels[category]}</p><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">{workspaceWidgetCatalog.filter(item => item.category === category).map(item => {
            const availability = getWidgetAvailability(item.type, selectedSector);
            return <button key={item.type} disabled={!availability.allowed} onClick={() => addWidget(item.type)} title={!availability.allowed ? availability.reason : undefined} className={`group rounded-2xl border p-3 text-left transition ${availability.allowed ? 'border-stone-200 hover:border-amber-300 hover:bg-amber-50' : 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'}`}><div className="flex items-start justify-between gap-2"><div><strong className="text-xs text-stone-800">{item.label}</strong><span className={`mt-1.5 block w-fit rounded-full border px-2 py-0.5 text-[8px] font-black ${readinessClasses[availability.readiness]}`}>{readinessLabels[availability.readiness]}</span></div><Plus className={`w-3.5 h-3.5 mt-0.5 ${availability.allowed ? 'text-stone-400 group-hover:text-amber-700' : 'text-stone-300'}`} /></div><p className="mt-2 text-[10px] leading-relaxed text-stone-500">{item.description}</p>{availability.reason && <p className={`mt-2 text-[9px] font-bold leading-relaxed ${availability.allowed ? 'text-amber-700' : 'text-rose-700'}`}>{availability.allowed ? availability.reason : `Indisponível: ${availability.reason}`}</p>}</button>;
          })}</div></div>)}</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1"><h3 className="text-sm font-black text-stone-900">Composição atual</h3><span className="text-[10px] font-bold text-stone-400">{selected.widgets.length} blocos</span></div>
          {[...selected.widgets].sort((a,b)=>(a.order??0)-(b.order??0)).map(widget => {
            const catalog = getWidgetCatalogItem(widget.type);
            const availability = getWidgetAvailability(widget.type, selectedSector);
            const incompatibleActive = widget.enabled !== false && !availability.allowed;
            return <div key={widget.id} className={`rounded-3xl border bg-white p-4 sm:p-5 ${incompatibleActive ? 'border-rose-300 bg-rose-50/30' : widget.enabled === false ? 'border-stone-200 opacity-65' : 'border-amber-200 shadow-sm'}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-black uppercase text-stone-600">{catalog?.label || widget.type}</span><strong className="text-sm">{widget.title || widget.id}</strong><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${readinessClasses[availability.readiness]}`}>{readinessLabels[availability.readiness]}</span></div>
                    <p className="mt-1 text-[10px] text-stone-400">{widget.id}{widget.boardId ? ` • ${widget.boardId}` : ''}</p>
                    {!availability.allowed && <p className="mt-2 text-[10px] font-bold text-rose-700">Incompatível com o setor atual: {availability.reason}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => moveWidget(widget.id, -1)} className="h-9 w-9 grid place-items-center rounded-xl border border-stone-200"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveWidget(widget.id, 1)} className="h-9 w-9 grid place-items-center rounded-xl border border-stone-200"><ArrowDown className="w-4 h-4" /></button>
                    <button disabled={widget.enabled === false && !availability.allowed} title={widget.enabled === false && !availability.allowed ? 'Este widget não pode ser ativado no setor atual.' : undefined} onClick={() => updateWidget(widget.id, { enabled: widget.enabled === false })} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${widget.enabled === false ? 'bg-stone-100 text-stone-600' : 'bg-emerald-100 text-emerald-800'}`}>{widget.enabled === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{widget.enabled === false ? 'Desativado' : 'Ativo'}</button>
                    <button onClick={() => removeWidget(widget.id)} className="h-9 w-9 grid place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700" title="Remover widget"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <WorkspaceWidgetPresentationControls widget={widget} defaultSpan={catalog?.defaultSpan} desktopMode={desktopMode} mobileMode={mobileMode} kdsMode={kdsMode} onChange={patch => updateWidget(widget.id, patch)} />
              </div>
              {widget.type === 'task-kanban' && <KanbanWidgetAutomationEditor widget={widget} onChange={patch => updateWidget(widget.id, patch)} />}
              {widget.type === 'room-map' && <RoomMapWidgetEditor widget={widget} onChange={patch => updateWidget(widget.id, patch)} />}
            </div>;
          })}
        </div>
      </section>
    </div>
  </div>;
};
