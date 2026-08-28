import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, Search, Wifi } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../services/kanbanV2';
import { kanbanCardGovernance } from '../services/kanbanCardGovernanceService';
import { WorkspaceDefinition, WorkspaceScope } from './types';

const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || 'Sem responsável';

export const GenericOperationalWorkspace: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout } = useHotel();
  const boardId = definition.widgets.find(widget => widget.type === 'kanban-cards')?.boardId || 'kanban-default-board';
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
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
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar o Workspace.'));
    return () => { cancelled = true; };
  }, [boardId]);

  useEffect(() => kanbanV2.subscribe(KANBAN_TENANT_ID, {
    onInsert: card => { if (card.board_id === boardId && !card.is_archived) setCards(current => current.some(item => item.id === card.id) ? current : [...current, card]); },
    onUpdate: card => setCards(current => card.board_id !== boardId || card.is_archived ? current.filter(item => item.id !== card.id) : current.some(item => item.id === card.id) ? current.map(item => item.id === card.id ? card : item) : [...current, card]),
    onDelete: card => setCards(current => current.filter(item => item.id !== card.id)),
    onStatus: setStatus,
  }), [boardId]);

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards
      .filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !q || [card.titulo, card.descricao, card.room_number, assignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [cards, scope, currentUser?.id, search]);

  const moveToColumn = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || !columnId || columnId === card.column_id || savingId) return;
    setSavingId(card.id);
    setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser.id });
      setCards(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível alterar o status da tarefa.');
    } finally {
      setSavingId(null);
    }
  };

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6"><div><div className="flex items-center gap-2"><h1 className="text-xl font-black">{definition.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="text-xs text-slate-500">{definition.description}</p></div><button onClick={logout} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600"><LogOut className="h-4 w-4" /> Sair</button></div></header>
    <main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2"><button onClick={() => setScope('mine')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div><label className="relative block max-w-xl flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa, quarto ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none" /></label></div></section>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">{columns.map(column => <div key={column.id} className="rounded-3xl border border-slate-200 bg-white p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-wide text-slate-700">{column.nome}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{visibleCards.filter(card => card.column_id === column.id).length}</span></div><div className="space-y-3">{visibleCards.filter(card => card.column_id === column.id).map(card => <article key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><h3 className="text-xs font-black text-slate-900">{card.titulo}</h3>{card.room_number && <p className="mt-1 text-[10px] font-bold text-amber-700">Quarto {card.room_number}</p>}</div><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-500">{card.prioridade}</span></div>{card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}<p className="mt-2 text-[10px] text-slate-400">{assignedName(card)}</p><label className="mt-3 block text-[9px] font-black uppercase tracking-wide text-slate-400">Status<select disabled={!currentUser?.id || savingId === card.id} value={card.column_id} onChange={event => void moveToColumn(card, event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold normal-case text-slate-700 disabled:opacity-50">{columns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>{card.metadata?.source_card_id && <p className="mt-2 rounded-lg bg-blue-50 px-2 py-1.5 text-[9px] font-bold text-blue-700">Demanda relacionada · alteração de status sincronizada com o setor solicitante</p>}</article>)}</div></div>)}</section>
    </main>
  </div>;
};
