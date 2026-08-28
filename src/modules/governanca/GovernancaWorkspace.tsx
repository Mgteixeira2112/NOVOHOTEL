import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, ClipboardCheck, Grid3X3, LogOut, Play, Plus, Search, Sparkles, User as UserIcon, Users, Wifi, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { canPerformKanbanAction, defaultKanbanVisibilityScope } from '../../domain/kanbanAccess';
import { KanbanLocalAutomationBridge } from '../../components/admin/KanbanLocalAutomationBridge';
import { WorkspaceDefinition, WorkspaceScope, WorkspaceWidgetDefinition } from '../../workspace-engine/types';
import { normalizeWorkspaceWidgets } from '../../workspace-engine/widgetCatalog';
import { WorkspaceDataWidget } from '../../workspace-engine/WorkspaceDataWidget';
import { GovernancaAlertsWidget, GovernancaQuickActionsWidget } from './GovernancaWorkspaceWidgets';
import { GovernancaCardDetailModal } from './GovernancaCardDetailModal';
import { GovernancaDemandModal, GovernancaDemandDraft } from './GovernancaDemandModal';
import { GovernancaWorkCenterInsights } from './GovernancaWorkCenterInsights';
import { GovernancaKanbanBoard } from './GovernancaKanbanBoard';
import { subscribeRelatedDemands } from './relatedDemandRealtimeService';
import { createGovernancaDemand, GOVERNANCA_DEMAND_TARGETS } from './governancaDemandService';
import { GOVERNANCA_STAGES, getGovernancaAssignedName, getGovernancaAssignedUserId, GovernancaStageFilter } from './governancaWorkspaceModel';

const isDataWidget = (type: string) => ['rooms-list', 'reservations-list', 'checkins', 'maintenance', 'orders', 'team', 'shortcuts'].includes(type);
const sourceCardId = (card: KanbanV2Card) => typeof card.metadata?.source_card_id === 'string' ? card.metadata.source_card_id : '';
const widgetShortcutLabel = (widget: WorkspaceWidgetDefinition) => widget.title || ({ alerts: 'Alertas', 'quick-actions': 'Ações rápidas', 'rooms-list': 'Quartos', 'reservations-list': 'Reservas', checkins: 'Check-ins', maintenance: 'Manutenção', orders: 'Pedidos', team: 'Equipe', shortcuts: 'Atalhos' } as Record<string, string>)[widget.type] || widget.type;

export const GovernancaWorkspace: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout } = useHotel();
  const widgets = useMemo(() => normalizeWorkspaceWidgets(definition.widgets), [definition.widgets]);
  const boardId = widgets.find(widget => widget.type === 'kanban-cards')?.boardId || 'kanban-board-governanca';
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [allColumns, setAllColumns] = useState<KanbanV2Column[]>([]);
  const [relatedDemands, setRelatedDemands] = useState<KanbanV2Card[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<GovernancaStageFilter>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanV2Card | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<WorkspaceWidgetDefinition | null>(null);
  const [demandOpen, setDemandOpen] = useState(false);
  const [demandSourceCard, setDemandSourceCard] = useState<KanbanV2Card | null>(null);
  const [demandSaving, setDemandSaving] = useState(false);
  const [status, setStatus] = useState('CONNECTING');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setAllColumns(result.columns);
      setColumns(result.columns.filter(column => column.board_id === boardId).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === boardId && !card.is_archived));
      setRelatedDemands(result.cards.filter(card => !!sourceCardId(card) && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || `Não foi possível carregar ${definition.name}.`));
    return () => { cancelled = true; };
  }, [boardId, definition.name]);

  useEffect(() => kanbanV2.subscribe(KANBAN_TENANT_ID, {
    onInsert: card => { if (card.board_id === boardId && !card.is_archived) setCards(current => current.some(item => item.id === card.id) ? current : [...current, card]); },
    onUpdate: card => { setCards(current => card.board_id !== boardId || card.is_archived ? current.filter(item => item.id !== card.id) : current.some(item => item.id === card.id) ? current.map(item => item.id === card.id ? card : item) : [...current, card]); setSelectedCard(current => current?.id === card.id ? card : current); },
    onDelete: card => { setCards(current => current.filter(item => item.id !== card.id)); setSelectedCard(current => current?.id === card.id ? null : current); },
    onStatus: setStatus,
  }), [boardId]);

  useEffect(() => subscribeRelatedDemands({ onUpsert: card => setRelatedDemands(current => current.some(item => item.id === card.id) ? current.map(item => item.id === card.id ? card : item) : [...current, card]), onDelete: cardId => setRelatedDemands(current => current.filter(item => item.id !== cardId)) }), []);

  const visibleCards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const stageColumnId = stageFilter === 'all' ? '' : GOVERNANCA_STAGES[stageFilter];
    return cards.filter(card => scope === 'sector' || getGovernancaAssignedUserId(card) === currentUser?.id).filter(card => !stageColumnId || card.column_id === stageColumnId).filter(card => !query || [card.titulo, card.descricao, card.room_number, getGovernancaAssignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(query));
  }, [cards, scope, currentUser?.id, search, stageFilter]);

  const role = currentUser?.tipo_usuario || 'governanca';
  const actionContext = useMemo(() => ({ userId: currentUser?.id || '', role, sectorIds: ['governanca'] as const, scope: defaultKanbanVisibilityScope(role) }), [currentUser?.id, role]);
  const selectedPermissions = useMemo(() => ({ edit: !!selectedCard && canPerformKanbanAction(actionContext, 'edit', selectedCard), move: !!selectedCard && canPerformKanbanAction(actionContext, 'move', selectedCard), archive: !!selectedCard && canPerformKanbanAction(actionContext, 'delete', selectedCard), permanentDelete: !!selectedCard && (role === 'admin' || role === 'gerente') && canPerformKanbanAction(actionContext, 'delete', selectedCard) }), [selectedCard, actionContext, role]);

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (savingId || !canPerformKanbanAction(actionContext, 'move', card)) return;
    setSavingId(card.id); setError('');
    try { const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser?.id }); setCards(current => current.map(item => item.id === updated.id ? updated : item)); setSelectedCard(current => current?.id === updated.id ? updated : current); }
    catch (e: any) { setError(e?.message || 'Não foi possível atualizar a tarefa.'); }
    finally { setSavingId(null); }
  };
  const saveSelected = async (updates: Partial<KanbanV2Card>) => {
    if (!selectedCard || savingId || !canPerformKanbanAction(actionContext, 'edit', selectedCard)) return;
    setSavingId(selectedCard.id); setError('');
    try { const updated = await kanbanCardGovernance.updateCard(selectedCard, updates, { userId: currentUser?.id }); setCards(current => current.map(item => item.id === updated.id ? updated : item)); setSelectedCard(updated); }
    catch (e: any) { setError(e?.message || 'Não foi possível editar a tarefa.'); throw e; }
    finally { setSavingId(null); }
  };
  const archiveSelected = async () => {
    if (!selectedCard || savingId || !canPerformKanbanAction(actionContext, 'delete', selectedCard)) return;
    const card = selectedCard; setSavingId(card.id); setError('');
    try { await kanbanCardGovernance.softDeleteCard(card, { userId: currentUser?.id }); setCards(current => current.filter(item => item.id !== card.id)); setSelectedCard(null); }
    catch (e: any) { setError(e?.message || 'Não foi possível arquivar a tarefa.'); throw e; }
    finally { setSavingId(null); }
  };
  const permanentlyDeleteSelected = async () => {
    if (!selectedCard || savingId || (role !== 'admin' && role !== 'gerente') || !canPerformKanbanAction(actionContext, 'delete', selectedCard)) return;
    const card = selectedCard; setSavingId(card.id); setError('');
    try { await kanbanV2.deleteCard(card.id); setCards(current => current.filter(item => item.id !== card.id)); setSelectedCard(null); }
    catch (e: any) { setError(e?.message || 'Não foi possível excluir definitivamente a tarefa.'); throw e; }
    finally { setSavingId(null); }
  };

  const openGovernanceDemand = () => { setDemandSourceCard(null); setDemandOpen(true); };
  const openDerivedDemand = (card: KanbanV2Card) => { setDemandSourceCard(card); setDemandOpen(true); };
  const createDemand = async (draft: GovernancaDemandDraft) => {
    if (demandSaving || !currentUser?.id) return;
    setDemandSaving(true); setError('');
    try { const created = await createGovernancaDemand({ ...draft, sourceCard: demandSourceCard, actorUserId: currentUser.id }); if (created.board_id === boardId && !created.is_archived) setCards(current => current.some(item => item.id === created.id) ? current : [...current, created]); if (sourceCardId(created)) setRelatedDemands(current => current.some(item => item.id === created.id) ? current.map(item => item.id === created.id ? created : item) : [...current, created]); setDemandOpen(false); setDemandSourceCard(null); }
    catch (e: any) { setError(e?.message || 'Não foi possível criar a demanda.'); throw e; }
    finally { setDemandSaving(false); }
  };

  const stageLabel = (id: string) => columns.find(column => column.id === id)?.nome || 'Tarefa';
  const demandStatusLabel = (card: KanbanV2Card) => allColumns.find(column => column.id === card.column_id)?.nome || card.column_id;
  const demandSectorLabel = (card: KanbanV2Card) => { const sector = card.metadata?.target_sector; return typeof sector === 'string' && sector in GOVERNANCA_DEMAND_TARGETS ? GOVERNANCA_DEMAND_TARGETS[sector as keyof typeof GOVERNANCA_DEMAND_TARGETS].label : card.departamento || 'Outro setor'; };
  const demandsFor = (cardId: string) => relatedDemands.filter(demand => sourceCardId(demand) === cardId);
  const actionFor = (card: KanbanV2Card) => card.column_id === GOVERNANCA_STAGES.pending ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.working); }} className="w-full h-9 rounded-xl bg-slate-950 text-white text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><Play className="w-3.5 h-3.5" /> Iniciar limpeza</button> : card.column_id === GOVERNANCA_STAGES.working ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.inspection); }} className="w-full h-9 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><ClipboardCheck className="w-3.5 h-3.5" /> Enviar para inspeção</button> : card.column_id === GOVERNANCA_STAGES.inspection ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.done); }} className="w-full h-9 rounded-xl bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><CheckCircle2 className="w-3.5 h-3.5" /> Liberar quarto</button> : null;

  const showMine = () => { setScope('mine'); setStageFilter('all'); setSearch(''); };
  const showSector = () => { setScope('sector'); setStageFilter('all'); setSearch(''); };
  const filterStage = (stage: GovernancaStageFilter) => { setScope('sector'); setStageFilter(stage); setSearch(''); setActiveShortcut(null); };
  const shortcutWidgets = widgets.filter(widget => widget.type !== 'kanban-cards' && widget.type !== 'metrics');
  const kanbanEnabled = widgets.some(widget => widget.type === 'kanban-cards');

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <KanbanLocalAutomationBridge />
    <GovernancaCardDetailModal card={selectedCard} columns={columns} permissions={selectedPermissions} busy={!!savingId} onClose={() => setSelectedCard(null)} onSave={saveSelected} onMove={columnId => selectedCard ? move(selectedCard, columnId) : Promise.resolve()} onArchive={archiveSelected} onPermanentDelete={permanentlyDeleteSelected} />
    <GovernancaDemandModal open={demandOpen} sourceCard={demandSourceCard} governanceOnly={!demandSourceCard} busy={demandSaving} onClose={() => { if (!demandSaving) { setDemandOpen(false); setDemandSourceCard(null); } }} onCreate={createDemand} />
    {activeShortcut && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setActiveShortcut(null); }}><div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Atalho do Workspace</p><h2 className="text-lg font-black text-slate-950">{widgetShortcutLabel(activeShortcut)}</h2></div><button onClick={() => setActiveShortcut(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"><X className="h-4 w-4" /></button></div>{activeShortcut.type === 'alerts' && <GovernancaAlertsWidget widget={activeShortcut} cards={cards} onStageFilter={filterStage} />}{activeShortcut.type === 'quick-actions' && <GovernancaQuickActionsWidget widget={activeShortcut} onShowMine={() => { showMine(); setActiveShortcut(null); }} onShowSector={() => { showSector(); setActiveShortcut(null); }} onStageFilter={filterStage} />}{isDataWidget(activeShortcut.type) && <WorkspaceDataWidget widget={activeShortcut} />}</div></div>}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20"><div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-amber-400 grid place-items-center"><Sparkles className="w-5 h-5" /></div><div><div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl font-black">{definition.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="w-3 h-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="text-xs text-slate-500">{definition.description}</p></div></div><div className="flex items-center gap-3"><div className="hidden sm:block text-right"><p className="text-xs font-black">{currentUser?.nome}</p><p className="text-[10px] text-slate-400">{definition.name}</p></div><button onClick={logout} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button></div></div></header>
    <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-5">
      {kanbanEnabled && <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3"><div><h2 className="text-base font-black">{widgets.find(widget => widget.type === 'kanban-cards')?.title || 'Central de trabalho'}</h2><p className="text-xs text-slate-500">Operação, dados em tempo real e atalhos concentrados neste painel.</p></div><div className="flex flex-wrap justify-end gap-2"><button onClick={openGovernanceDemand} title="Criar demanda para a Governança" className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300"><Plus className="w-4 h-4" /></button><button onClick={() => setScope('mine')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><UserIcon className="w-3.5 h-3.5" /> Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><Users className="w-3.5 h-3.5" /> Meu setor</button>{shortcutWidgets.map(widget => <button key={widget.id} onClick={() => setActiveShortcut(widget)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 flex items-center gap-1.5 hover:border-amber-300 hover:bg-amber-50"><Grid3X3 className="w-3.5 h-3.5" /> {widgetShortcutLabel(widget)}</button>)}</div></div><div className="mt-4"><GovernancaWorkCenterInsights governanceCards={cards} /></div><div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center"><label className="relative block max-w-xl flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar quarto, tarefa ou responsável" className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none" /></label>{stageFilter !== 'all' && <button onClick={() => setStageFilter('all')} className="h-10 px-3 rounded-xl border border-amber-200 bg-amber-50 text-xs font-black text-amber-800 flex items-center gap-2"><X className="w-3.5 h-3.5" /> Limpar foco</button>}{shortcutWidgets.length > 0 && <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><BellRing className="w-3.5 h-3.5" /> {shortcutWidgets.length} atalhos ativos</span>}</div></section>}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
      {kanbanEnabled && <GovernancaKanbanBoard columns={columns} cards={visibleCards} currentUserId={currentUser?.id} stageLabel={stageLabel} demandsFor={demandsFor} demandSectorLabel={demandSectorLabel} demandStatusLabel={demandStatusLabel} actionFor={actionFor} onOpenCard={setSelectedCard} onCreateRelated={openDerivedDemand} />}
    </main>
  </div>;
};
