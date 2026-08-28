import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, CalendarDays, ChevronRight, LogOut, Search, UserRound, Users, Wifi, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { WorkspaceDefinition, WorkspaceScope } from '../../workspace-engine/types';

const BOARD_ID = 'kanban-board-recepcao';
const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || (card.assigned_to as any)?.nome || 'Sem responsável';
const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();
const todayKey = () => new Date().toISOString().slice(0, 10);
const reservationDate = (value?: string | null) => String(value || '').slice(0, 10);
const fmtDate = (value?: string | null) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';

export const ReceptionWorkspace: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout, reservations, guests, rooms } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'arrivals' | 'rooms' | 'alerts' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === BOARD_ID && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar a Recepção.'));
    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (card.board_id === BOARD_ID && !card.is_archived) setCards(cur => cur.some(item => item.id === card.id) ? cur : [...cur, card]); },
      onUpdate: card => setCards(cur => card.board_id !== BOARD_ID || card.is_archived ? cur.filter(item => item.id !== card.id) : cur.some(item => item.id === card.id) ? cur.map(item => item.id === card.id ? card : item) : [...cur, card]),
      onDelete: card => setCards(cur => cur.filter(item => item.id !== card.id)),
      onStatus: setStatus,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const today = todayKey();
  const arrivals = useMemo(() => reservations.filter(r => reservationDate(r.data_checkin || r.checkin) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const departures = useMemo(() => reservations.filter(r => reservationDate(r.data_checkout || r.checkout) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const occupied = reservations.filter(r => r.status === 'checkin_realizado').length;
  const roomAlerts = rooms.filter(room => ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(normalize(room.status)) || ['sujo', 'em_limpeza', 'aguardando_vistoria'].includes(normalize(room.status_governanca || room.status_housekeeping)));
  const taskAlerts = cards.filter(card => ['alta', 'critica', 'urgente'].includes(normalize(card.prioridade)) || !assignedUserId(card));

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards
      .filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !q || [card.titulo, card.descricao, card.room_number, card.guest_name, assignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [cards, scope, currentUser?.id, search]);

  const moveToColumn = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingId || columnId === card.column_id) return;
    setSavingId(card.id); setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser.id });
      setCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar o status.'); }
    finally { setSavingId(null); }
  };

  const guestFor = (reservation: any) => guests.find(g => g.id === reservation.hospede_id);
  const roomFor = (reservation: any) => rooms.find(room => room.id === reservation.quarto_id);
  const widgets = [
    { key: 'arrivals' as const, icon: CalendarDays, label: 'Chegadas e saídas', value: arrivals.length + departures.length, detail: `${arrivals.length} chegadas · ${departures.length} saídas` },
    { key: 'rooms' as const, icon: BedDouble, label: 'Quartos', value: roomAlerts.length, detail: `${rooms.length} cadastrados · ${roomAlerts.length} requerem atenção` },
    { key: 'alerts' as const, icon: AlertTriangle, label: 'Alertas da recepção', value: taskAlerts.length, detail: `${taskAlerts.length} tarefas prioritárias ou sem responsável` },
  ];

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">{definition.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="text-xs text-slate-500">Atendimento, hóspedes, quartos e solicitações em uma única operação.</p></div><button onClick={logout} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600"><LogOut className="h-4 w-4" />Sair</button></div></header>

    <main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Central de trabalho · tempo real</p><h2 className="text-base font-black">Recepção</h2></div><span className="text-[10px] font-bold text-slate-400">{occupied} hóspedes no hotel</span></div><div className="grid gap-2 md:grid-cols-3">{widgets.map(item => <button key={item.key} onClick={() => setActivePanel(item.key)} className="group flex min-h-[78px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><item.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-baseline gap-2"><strong className="text-xs">{item.label}</strong><b className="text-lg">{item.value}</b></span><span className="block truncate text-[10px] text-slate-500">{item.detail}</span></span><ChevronRight className="h-4 w-4 text-slate-300" /></button>)}</div></section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2"><button onClick={() => setScope('mine')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div><label className="relative block max-w-xl flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar solicitação, quarto, hóspede ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-300" /></label></div></section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">{columns.map(column => <div key={column.id} className="rounded-3xl border border-slate-200 bg-white p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-wide text-slate-700">{column.nome}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{visibleCards.filter(card => card.column_id === column.id).length}</span></div><div className="space-y-3">{visibleCards.filter(card => card.column_id === column.id).map(card => { const mine = assignedUserId(card) === currentUser?.id; return <article key={card.id} className={`rounded-2xl border bg-slate-50 p-3 ${mine ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}><div className="mb-2 flex items-start justify-between gap-2"><span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700">Recepção</span>{mine && <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black uppercase text-white">★ Minha tarefa</span>}</div><h3 className="text-xs font-black">{card.titulo}</h3>{card.guest_name && <p className="mt-1 text-[10px] font-bold text-slate-600"><UserRound className="mr-1 inline h-3 w-3" />{card.guest_name}</p>}{card.room_number && <p className="mt-1 text-[10px] font-bold text-blue-700">Quarto {card.room_number}</p>}{card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}<p className="mt-2 text-[10px] text-slate-400">{assignedName(card)}</p><label className="mt-3 block text-[9px] font-black uppercase tracking-wide text-slate-400">Status<select disabled={!currentUser?.id || savingId === card.id} value={card.column_id} onChange={event => void moveToColumn(card, event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold normal-case text-slate-700 disabled:opacity-50">{columns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>{card.metadata?.source_card_id && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[9px] font-bold text-amber-700">Demanda relacionada a outro setor</p>}</article>; })}</div></div>)}</section>
    </main>

    {activePanel && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setActivePanel(null); }}><div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Central de trabalho · Recepção</p><h2 className="text-lg font-black">{activePanel === 'arrivals' ? 'Chegadas e saídas de hoje' : activePanel === 'rooms' ? 'Situação dos quartos' : 'Alertas da recepção'}</h2></div><button onClick={() => setActivePanel(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button></div><div className="p-5">
      {activePanel === 'arrivals' && <div className="grid gap-4 lg:grid-cols-2"><div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Chegadas · {arrivals.length}</h3><div className="space-y-2">{arrivals.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · {r.codigo || r.id}</p></div><span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700">{r.status}</span></div><p className="mt-2 text-[10px] text-slate-500">Check-in {fmtDate(r.data_checkin || r.checkin)} · Quarto: {room?.status || '—'} · Governança: {room?.status_governanca || room?.status_housekeeping || '—'}</p></div>; })}{arrivals.length === 0 && <p className="text-xs text-slate-400">Nenhuma chegada prevista para hoje.</p>}</div></div><div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Saídas · {departures.length}</h3><div className="space-y-2">{departures.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · Checkout {fmtDate(r.data_checkout || r.checkout)} · {r.status}</p></div>; })}{departures.length === 0 && <p className="text-xs text-slate-400">Nenhuma saída prevista para hoje.</p>}</div></div></div>}
      {activePanel === 'rooms' && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rooms.map(room => <div key={room.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><strong className="text-sm">Quarto {room.numero}</strong><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black">{room.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-slate-50 p-2"><span className="text-slate-400">Governança</span><p className="mt-1 font-black">{room.status_governanca || room.status_housekeeping || 'Não informado'}</p></div><div className="rounded-xl bg-slate-50 p-2"><span className="text-slate-400">Responsável</span><p className="mt-1 font-black">{room.responsavel_limpeza || '—'}</p></div></div>{room.status_manutencao_motivo && <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[9px] font-bold text-rose-700">Manutenção: {room.status_manutencao_motivo}</p>}</div>)}</div>}
      {activePanel === 'alerts' && <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase text-amber-700">Quartos que exigem atenção</p><p className="mt-1 text-2xl font-black">{roomAlerts.length}</p><div className="mt-3 space-y-2">{roomAlerts.map(room => <p key={room.id} className="text-[10px] font-bold text-slate-700">Quarto {room.numero} · {room.status_governanca || room.status_housekeeping || room.status}</p>)}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-600">Tarefas prioritárias / sem responsável</p><p className="mt-1 text-2xl font-black">{taskAlerts.length}</p><div className="mt-3 space-y-2">{taskAlerts.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div></div>}
    </div></div></div>}
  </div>;
};
