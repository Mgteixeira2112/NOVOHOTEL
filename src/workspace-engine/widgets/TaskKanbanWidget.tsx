import React, { useEffect, useMemo, useState } from 'react';
import { Search, Wifi } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { WorkspaceScope } from '../types';

const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || (card.assigned_to as any)?.nome || 'Sem responsável';

export const TaskKanbanWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const { currentUser } = useHotel();
  const boardId = widget.boardId || 'kanban-default-board';
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(workspace.defaultScope);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === boardId).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === boardId && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar as tarefas.'));
    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (card.board_id === boardId && !card.is_archived) setCards(cur => cur.some(item => item.id === card.id) ? cur : [...cur, card]); },
      onUpdate: card => setCards(cur => card.board_id !== boardId || card.is_archived ? cur.filter(item => item.id !== card.id) : cur.some(item => item.id === card.id) ? cur.map(item => item.id === card.id ? card : item) : [...cur, card]),
      onDelete: card => setCards(cur => cur.filter(item => item.id !== card.id)),
      onStatus: setStatus,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [boardId]);

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards.filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !q || [card.titulo, card.descricao, card.room_number, card.guest_name, assignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [cards, scope, currentUser?.id, search]);

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingId || columnId === card.column_id) return;
    setSavingId(card.id); setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser.id });
      setCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar a tarefa.'); }
    finally { setSavingId(null); }
  };

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h2 className="text-sm font-black">{widget.title || 'Kanban de tarefas'}</h2><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700"><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="mt-1 text-[10px] text-slate-500">Board {boardId}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setScope('mine')} className={`h-8 rounded-xl px-3 text-[10px] font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-8 rounded-xl px-3 text-[10px] font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div></div>
    <label className="relative mb-4 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa, quarto, hóspede ou responsável" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none" /></label>
    {error && <div className="mb-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</div>}
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">{columns.map(column => <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><strong className="text-[10px] font-black uppercase text-slate-600">{column.nome}</strong><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-slate-500">{visibleCards.filter(card => card.column_id === column.id).length}</span></div><div className="space-y-2">{visibleCards.filter(card => card.column_id === column.id).map(card => <article key={card.id} className="rounded-xl border border-slate-200 bg-white p-3"><h3 className="text-xs font-black">{card.titulo}</h3>{card.room_number && <p className="mt-1 text-[9px] font-bold text-amber-700">Quarto {card.room_number}</p>}<p className="mt-2 text-[9px] text-slate-400">{assignedName(card)}</p><select disabled={savingId === card.id} value={card.column_id} onChange={e => void move(card, e.target.value)} className="mt-2 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold disabled:opacity-50">{columns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></article>)}</div></div>)}</div>
  </div>;
};
