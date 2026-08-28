import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, DoorClosed, LogOut, Play, Search, Sparkles, User as UserIcon, Users, Wifi, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { KanbanLocalAutomationBridge } from '../../components/admin/KanbanLocalAutomationBridge';
import { WorkspaceDefinition, WorkspaceScope } from '../../workspace-engine/types';
import { normalizeWorkspaceWidgets } from '../../workspace-engine/widgetCatalog';
import { WorkspaceDataWidget, workspaceWidgetSpanClass } from '../../workspace-engine/WorkspaceDataWidget';
import { GovernancaAlertsWidget, GovernancaQuickActionsWidget } from './GovernancaWorkspaceWidgets';
import { GovernancaCardDetailModal } from './GovernancaCardDetailModal';
import { GOVERNANCA_STAGES, getGovernancaAssignedName, getGovernancaAssignedUserId, GovernancaStageFilter } from './governancaWorkspaceModel';

const dateTime = (value?: string | null) => !value ? '—' : new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const isDataWidget = (type: string) => ['rooms-list', 'reservations-list', 'checkins', 'maintenance', 'orders', 'team', 'shortcuts'].includes(type);

export const GovernancaWorkspace: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout } = useHotel();
  const widgets = useMemo(() => normalizeWorkspaceWidgets(definition.widgets), [definition.widgets]);
  const boardId = widgets.find(widget => widget.type === 'kanban-cards')?.boardId || 'kanban-board-governanca';
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<GovernancaStageFilter>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanV2Card | null>(null);
  const [status, setStatus] = useState('CONNECTING');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === boardId).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === boardId && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || `Não foi possível carregar ${definition.name}.`));
    return () => { cancelled = true; };
  }, [boardId, definition.name]);

  useEffect(() => kanbanV2.subscribe(KANBAN_TENANT_ID, {
    onInsert: card => { if (card.board_id === boardId && !card.is_archived) setCards(current => current.some(item => item.id === card.id) ? current : [...current, card]); },
    onUpdate: card => {
      setCards(current => card.board_id !== boardId || card.is_archived ? current.filter(item => item.id !== card.id) : current.some(item => item.id === card.id) ? current.map(item => item.id === card.id ? card : item) : [...current, card]);
      setSelectedCard(current => current?.id === card.id ? card : current);
    },
    onDelete: card => { setCards(current => current.filter(item => item.id !== card.id)); setSelectedCard(current => current?.id === card.id ? null : current); },
    onStatus: setStatus,
  }), [boardId]);

  const visibleCards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const stageColumnId = stageFilter === 'all' ? '' : GOVERNANCA_STAGES[stageFilter];
    return cards
      .filter(card => scope === 'sector' || getGovernancaAssignedUserId(card) === currentUser?.id)
      .filter(card => !stageColumnId || card.column_id === stageColumnId)
      .filter(card => !query || [card.titulo, card.descricao, card.room_number, getGovernancaAssignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(query));
  }, [cards, scope, currentUser?.id, search, stageFilter]);

  const counts = useMemo(() => ({
    pending: cards.filter(card => card.column_id === GOVERNANCA_STAGES.pending).length,
    working: cards.filter(card => card.column_id === GOVERNANCA_STAGES.working).length,
    inspection: cards.filter(card => card.column_id === GOVERNANCA_STAGES.inspection).length,
    done: cards.filter(card => card.column_id === GOVERNANCA_STAGES.done).length,
  }), [cards]);

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (savingId) return;
    setSavingId(card.id);
    setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser?.id });
      setCards(current => current.map(item => item.id === updated.id ? updated : item));
      setSelectedCard(current => current?.id === updated.id ? updated : current);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível atualizar a tarefa.');
    } finally {
      setSavingId(null);
    }
  };

  const stageLabel = (id: string) => columns.find(column => column.id === id)?.nome || 'Tarefa';
  const actionFor = (card: KanbanV2Card) => card.column_id === GOVERNANCA_STAGES.pending
    ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.working); }} className="w-full h-9 rounded-xl bg-slate-950 text-white text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><Play className="w-3.5 h-3.5" /> Iniciar limpeza</button>
    : card.column_id === GOVERNANCA_STAGES.working
      ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.inspection); }} className="w-full h-9 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><ClipboardCheck className="w-3.5 h-3.5" /> Enviar para inspeção</button>
      : card.column_id === GOVERNANCA_STAGES.inspection
        ? <button disabled={savingId === card.id} onClick={event => { event.stopPropagation(); void move(card, GOVERNANCA_STAGES.done); }} className="w-full h-9 rounded-xl bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-40"><CheckCircle2 className="w-3.5 h-3.5" /> Liberar quarto</button>
        : null;

  const showMine = () => { setScope('mine'); setStageFilter('all'); setSearch(''); };
  const showSector = () => { setScope('sector'); setStageFilter('all'); setSearch(''); };
  const filterStage = (stage: GovernancaStageFilter) => { setScope('sector'); setStageFilter(stage); setSearch(''); };
  const secondaryWidgets = widgets.filter(widget => widget.type === 'alerts' || widget.type === 'quick-actions' || isDataWidget(widget.type));
  const kanbanEnabled = widgets.some(widget => widget.type === 'kanban-cards');

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <KanbanLocalAutomationBridge />
    <GovernancaCardDetailModal card={selectedCard} columns={columns} onClose={() => setSelectedCard(null)} />

    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-amber-400 grid place-items-center"><Sparkles className="w-5 h-5" /></div><div><div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl font-black">{definition.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="w-3 h-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="text-xs text-slate-500">{definition.description}</p></div></div>
        <div className="flex items-center gap-3"><div className="hidden sm:block text-right"><p className="text-xs font-black">{currentUser?.nome}</p><p className="text-[10px] text-slate-400">{definition.name}</p></div><button onClick={logout} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button></div>
      </div>
    </header>

    <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-5">
      {widgets.some(widget => widget.type === 'metrics') && <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['A limpar', counts.pending], ['Em limpeza', counts.working], ['Inspeção', counts.inspection], ['Liberados', counts.done]].map(([label, value], index) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex justify-between"><p className="text-[11px] font-bold text-slate-500">{label}</p>{index === 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <DoorClosed className="w-4 h-4 text-slate-300" />}</div><p className="mt-2 text-2xl font-black">{value}</p></div>)}</section>}

      {kanbanEnabled && <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><h2 className="text-base font-black">{widgets.find(widget => widget.type === 'kanban-cards')?.title || 'Central de trabalho'}</h2><p className="text-xs text-slate-500">Clique em qualquer card para abrir todos os detalhes da tarefa.</p></div><div className="flex gap-2"><button onClick={() => setScope('mine')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><UserIcon className="w-3.5 h-3.5" /> Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><Users className="w-3.5 h-3.5" /> Meu setor</button></div></div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center"><label className="relative block max-w-xl flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar quarto, tarefa ou responsável" className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none" /></label>{stageFilter !== 'all' && <button onClick={() => setStageFilter('all')} className="h-10 px-3 rounded-xl border border-amber-200 bg-amber-50 text-xs font-black text-amber-800 flex items-center gap-2"><X className="w-3.5 h-3.5" /> Limpar foco</button>}</div>
      </section>}

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}

      {kanbanEnabled && <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {columns.map(column => {
          const columnCards = visibleCards.filter(card => card.column_id === column.id);
          return <div key={column.id} className="min-h-[360px] rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2.5"><div><p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Governança</p><h3 className="text-xs font-black text-slate-800">{column.nome}</h3></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{columnCards.length}</span></div>
            <div className="space-y-3">{columnCards.map(card => <article key={card.id} role="button" tabIndex={0} onClick={() => setSelectedCard(card)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelectedCard(card); }} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-black uppercase text-slate-400">{stageLabel(card.column_id)}</p><h4 className="mt-1 text-xs font-black text-slate-900">{card.titulo}</h4></div>{card.room_number && <span className="rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-black text-amber-300">Q. {card.room_number}</span>}</div>
              {card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400">Responsável</span><p className="mt-0.5 truncate font-bold text-slate-700">{getGovernancaAssignedName(card) || 'Sem responsável'}</p></div><div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400">Atualizado</span><p className="mt-0.5 font-bold text-slate-700">{dateTime(card.updated_at)}</p></div></div>
              <div className="mt-3 flex items-center justify-between gap-2"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">{card.prioridade || 'normal'}</span><span className="text-[9px] font-bold text-amber-700">Clique para detalhes</span></div>
              {actionFor(card) && <div className="mt-3">{actionFor(card)}</div>}
            </article>)}{columnCards.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center"><Sparkles className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-2 text-[10px] font-bold text-slate-400">Nenhuma tarefa nesta etapa</p></div>}</div>
          </div>;
        })}
      </section>}

      {secondaryWidgets.length > 0 && <section className="grid lg:grid-cols-4 gap-4">{secondaryWidgets.map(widget => <div key={widget.id} className={workspaceWidgetSpanClass(widget.span)}>{widget.type === 'alerts' && <GovernancaAlertsWidget widget={widget} cards={cards} onStageFilter={filterStage} />}{widget.type === 'quick-actions' && <GovernancaQuickActionsWidget widget={widget} onShowMine={showMine} onShowSector={showSector} onStageFilter={filterStage} />}{isDataWidget(widget.type) && <WorkspaceDataWidget widget={widget} />}</div>)}</section>}
    </main>
  </div>;
};
