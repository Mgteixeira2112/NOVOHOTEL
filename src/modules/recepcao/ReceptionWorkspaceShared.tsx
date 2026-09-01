import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, BedDouble, Bell, CalendarDays, ClipboardList, Home, LogOut, Search, Settings, Settings2, UsersRound, WalletCards, Wifi } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { Reserva } from '../../types';
import { WorkspaceDefinition, WorkspaceScope } from '../../workspace-engine/types';
import { RoomsModule } from '../../components/admin/RoomsModule';
import { ReceptionKanbanBoard } from './ReceptionKanbanBoard';
import { ReceptionRoomsKanban } from './ReceptionRoomsKanban';
import { RECEPTION_ROOMS_BOARD_ID, receptionRoomKanbanService } from './receptionRoomKanbanService';
import { receptionStayService } from './receptionStayService';

const TASK_BOARD_ID = 'kanban-board-recepcao';
type PanelKey = 'arrivals' | 'rooms' | 'alerts' | 'rooms-admin';
const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || (card.assigned_to as any)?.nome || 'Sem responsável';
const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();
const dateKey = (value?: string | null) => String(value || '').slice(0, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const ReceptionWorkspaceShared: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout, reservations, guests, rooms, syncFromSupabase } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [roomCards, setRoomCards] = useState<KanbanV2Card[]>([]);
  const [roomColumns, setRoomColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [stayActionId, setStayActionId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === TASK_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === TASK_BOARD_ID && !card.is_archived));
      setRoomColumns(result.columns.filter(column => column.board_id === RECEPTION_ROOMS_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setRoomCards(result.cards.filter(card => card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar a Recepção.'));

    const upsertForBoard = (boardId: string, setter: React.Dispatch<React.SetStateAction<KanbanV2Card[]>>, card: KanbanV2Card) => setter(cur => card.board_id !== boardId || card.is_archived
      ? cur.filter(item => item.id !== card.id)
      : cur.some(item => item.id === card.id)
        ? cur.map(item => item.id === card.id ? card : item)
        : [...cur, card]);

    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { upsertForBoard(TASK_BOARD_ID, setCards, card); upsertForBoard(RECEPTION_ROOMS_BOARD_ID, setRoomCards, card); },
      onUpdate: card => { upsertForBoard(TASK_BOARD_ID, setCards, card); upsertForBoard(RECEPTION_ROOMS_BOARD_ID, setRoomCards, card); },
      onDelete: card => { setCards(cur => cur.filter(item => item.id !== card.id)); setRoomCards(cur => cur.filter(item => item.id !== card.id)); },
      onStatus: setStatus,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const today = todayKey();
  const arrivals = useMemo(() => reservations.filter(r => dateKey(r.data_checkin || r.checkin) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const departures = useMemo(() => reservations.filter(r => dateKey(r.data_checkout || r.checkout) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const occupied = reservations.filter(r => r.status === 'checkin_realizado').length;
  const roomAlerts = rooms.filter(room => ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(normalize(room.status)) || ['sujo', 'em_limpeza', 'aguardando_vistoria'].includes(normalize(room.status_governanca || room.status_housekeeping)));
  const taskAlerts = cards.filter(card => ['alta', 'critica', 'urgente'].includes(normalize(card.prioridade)) || !assignedUserId(card));

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards.filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
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

  const moveRoomToColumn = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingRoomId || columnId === card.column_id) return;
    if (columnId === 'room-col-ocupado') {
      setError('Use o botão Check-in para ocupar o quarto.');
      return;
    }
    setSavingRoomId(card.id); setError('');
    try {
      const updated = await receptionRoomKanbanService.moveRoomCard(card, columnId, currentUser.id);
      setRoomCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar o status do quarto.'); }
    finally { setSavingRoomId(null); }
  };

  const refreshAfterStayAction = async () => {
    const synced = await syncFromSupabase();
    if (!synced.success) throw new Error(synced.message || 'A operação foi salva, mas a tela não conseguiu atualizar.');
  };

  const checkinReservation = async (reservation: Reserva) => {
    if (stayActionId) return;
    setStayActionId(reservation.id); setError('');
    try {
      await receptionStayService.checkin(reservation.id, currentUser?.id);
      await refreshAfterStayAction();
    } catch (e: any) { setError(e?.message || 'Não foi possível realizar o check-in.'); }
    finally { setStayActionId(null); }
  };

  const checkoutReservation = async (reservation: Reserva) => {
    if (stayActionId) return;
    if (!window.confirm(`Confirmar check-out da reserva ${reservation.codigo || reservation.id}? O hóspede será desvinculado e o quarto seguirá para A Limpar na Governança.`)) return;
    setStayActionId(reservation.id); setError('');
    try {
      await receptionStayService.checkout(reservation.id, currentUser?.id);
      await refreshAfterStayAction();
    } catch (e: any) { setError(e?.message || 'Não foi possível realizar o check-out.'); }
    finally { setStayActionId(null); }
  };

  const transferReservation = async (reservation: Reserva, toRoomId: string) => {
    if (stayActionId) return;
    const destination = rooms.find(room => room.id === toRoomId);
    if (!destination || !window.confirm(`Transferir ${reservation.codigo || reservation.id} para o Quarto ${destination.numero}? O histórico da hospedagem será preservado.`)) return;
    setStayActionId(reservation.id); setError('');
    try {
      await receptionStayService.transferRoom(reservation.id, toRoomId, currentUser?.id);
      await refreshAfterStayAction();
    } catch (e: any) { setError(e?.message || 'Não foi possível trocar o quarto.'); }
    finally { setStayActionId(null); }
  };

  const guestFor = (reservation: any) => guests.find(g => g.id === reservation.hospede_id);
  const roomFor = (reservation: any) => rooms.find(room => room.id === reservation.quarto_id);
  const panelTitle = (key: PanelKey) => key === 'arrivals' ? 'Chegadas e saídas de hoje' : key === 'rooms' ? 'Situação dos quartos' : key === 'rooms-admin' ? 'Administração de quartos' : 'Alertas da recepção';

  const renderPanel = (key: PanelKey) => {
    if (key === 'rooms-admin') return <div className="space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"><strong className="font-black">Gestão integrada de acomodações.</strong> Nesta etapa o acesso está disponível para todos os usuários do Workspace da Recepção. A restrição por perfil será adicionada posteriormente sem alterar este módulo.</div><RoomsModule /></div>;
    if (key === 'arrivals') return <div className="grid gap-4 lg:grid-cols-2">
      <div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Chegadas · {arrivals.length}</h3><div className="space-y-2">{arrivals.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · {r.codigo || r.id}</p><p className="mt-1 text-[10px] text-slate-500">Quarto: {room?.status || '—'} · Governança: {room?.status_governanca || room?.status_housekeeping || '—'}</p></div>; })}{arrivals.length === 0 && <p className="text-xs text-slate-400">Nenhuma chegada prevista.</p>}</div></div>
      <div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Saídas · {departures.length}</h3><div className="space-y-2">{departures.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · {r.status}</p></div>; })}{departures.length === 0 && <p className="text-xs text-slate-400">Nenhuma saída prevista.</p>}</div></div>
    </div>;
    if (key === 'rooms') return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rooms.map(room => <div key={room.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs">Quarto {room.numero}</strong><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black">{room.status}</span></div><p className="mt-2 text-[10px] text-slate-500">Governança: {room.status_governanca || room.status_housekeeping || 'Não informado'}</p></div>)}</div>;
    return <div className="space-y-2">{taskAlerts.map(card => <div key={card.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs">{card.titulo}</strong><span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">{card.prioridade}</span></div><p className="mt-1 text-[10px] text-slate-500">{assignedName(card)}{card.room_number ? ` · Quarto ${card.room_number}` : ''}</p></div>)}{taskAlerts.length === 0 && <p className="text-xs text-slate-400">Nenhum alerta operacional.</p>}</div>;
  };

  const metrics = [
    { label: 'Reservas', value: reservations.length, detail: `${arrivals.length} chegada${arrivals.length === 1 ? '' : 's'} hoje`, icon: CalendarDays, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
    { label: 'Check-ins hoje', value: arrivals.length, detail: occupied ? `${occupied} hospedado${occupied === 1 ? '' : 's'}` : 'Nenhum hóspede hospedado', icon: BedDouble, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Quartos disponíveis', value: rooms.filter(room => normalize(room.status) === 'disponivel').length, detail: `de ${rooms.length} quartos`, icon: BedDouble, tone: 'text-violet-700 bg-violet-50 border-violet-100' },
    { label: 'Hóspedes', value: guests.length, detail: `${occupied} hospedado${occupied === 1 ? '' : 's'}`, icon: Settings2, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Alertas', value: roomAlerts.length + taskAlerts.length, detail: taskAlerts.length ? 'Requer atenção' : 'Operação estável', icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50 border-rose-100' },
    { label: 'Tarefas', value: cards.length, detail: taskAlerts.length ? `${taskAlerts.length} prioritária(s)` : 'Sem urgências', icon: CalendarDays, tone: 'text-orange-700 bg-orange-50 border-orange-100' },
  ];
  const dashboardTasks = visibleCards.slice(0, 4);
  const dashboardAlerts = taskAlerts.slice(0, 3);
  const recentActivities = [...cards].sort((a, b) => String((b as any).updated_at || (b as any).created_at || '').localeCompare(String((a as any).updated_at || (a as any).created_at || ''))).slice(0, 4);
  const navItems = [
    { label: 'Recepção', icon: Home, panel: null }, { label: 'Reservas', icon: CalendarDays, panel: 'arrivals' as PanelKey },
    { label: 'Hóspedes', icon: UsersRound, panel: 'arrivals' as PanelKey }, { label: 'Quartos', icon: BedDouble, panel: 'rooms' as PanelKey },
    { label: 'Governança', icon: ClipboardList, panel: 'alerts' as PanelKey }, { label: 'Tarefas', icon: ClipboardList, panel: 'rooms-admin' as PanelKey },
    { label: 'Relatórios', icon: BarChart3, panel: 'rooms-admin' as PanelKey }, { label: 'Financeiro', icon: WalletCards, panel: 'rooms-admin' as PanelKey },
    { label: 'Configurações', icon: Settings, panel: 'rooms-admin' as PanelKey },
  ];
  const userName = currentUser?.nome || 'Usuário';

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1720px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-lg font-black text-amber-700">H</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">{definition.name}</h1><span className="hidden rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700 sm:inline">Workspace</span></div><p className="truncate text-[11px] text-slate-500">Atendimento, hóspedes, quartos e solicitações em tempo real.</p></div></div><div className="flex items-center gap-2 sm:gap-3"><div className="hidden text-right md:block"><p className="text-[10px] font-semibold text-slate-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p><p className="text-base font-black tabular-nums">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p></div><span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 lg:inline-flex"><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Online' : 'Sincronizando'}</span><button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><Bell className="h-4 w-4" /></button><div className="hidden rounded-xl border border-slate-200 px-3 py-2 sm:block"><p className="max-w-28 truncate text-[10px] font-black text-slate-800">{userName}</p><p className="text-[9px] text-slate-500">Recepção</p></div><button onClick={logout} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sair</span></button></div></div></header>

    <div className="mx-auto grid max-w-[1720px] grid-cols-1 lg:grid-cols-[184px_minmax(0,1fr)]">
      <aside className="hidden min-h-[calc(100vh-65px)] border-r border-slate-200 bg-white p-3 lg:block">
        <div className="space-y-1">{navItems.map(item => { const Icon = item.icon; const selected = item.panel === activePanel || (!activePanel && item.panel === null); return <button key={item.label} type="button" onClick={() => setActivePanel(item.panel)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${selected ? 'bg-amber-50 text-amber-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className={`h-4 w-4 ${selected ? 'text-amber-600' : 'text-slate-400'}`} />{item.label}</button>; })}</div>
        <div className="mt-8 border-t border-slate-100 pt-4 text-center text-[9px] font-bold text-slate-400">Dados atualizados em tempo real</div>
      </aside>
      <main className="space-y-4 p-4 sm:p-6">
      {activePanel ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Recepção</p><h2 className="text-lg font-black">{panelTitle(activePanel)}</h2></div><button onClick={() => setActivePanel(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Voltar ao painel</button></div>{renderPanel(activePanel)}</section> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(metric => { const Icon = metric.icon; return <button type="button" key={metric.label} onClick={() => metric.label === 'Alertas' ? setActivePanel('alerts') : metric.label === 'Quartos disponíveis' ? setActivePanel('rooms') : setActivePanel('arrivals')} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${metric.tone}`}><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/70"><Icon className="h-4 w-4" /></span><span className="text-2xl font-black">{metric.value}</span></div><p className="mt-3 text-xs font-black text-slate-800">{metric.label}</p><p className="mt-1 text-[10px] font-medium text-slate-500">{metric.detail}</p></button>; })}</section>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,.8fr)]"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><ReceptionRoomsKanban
        columns={roomColumns}
        cards={roomCards}
        rooms={rooms}
        reservations={reservations}
        guests={guests}
        savingId={savingRoomId}
        stayActionId={stayActionId}
        onMove={(card, columnId) => void moveRoomToColumn(card, columnId)}
        onCheckin={reservation => void checkinReservation(reservation)}
        onCheckout={reservation => void checkoutReservation(reservation)}
        onTransfer={(reservation, toRoomId) => void transferReservation(reservation, toRoomId)}
        title="Mapa de quartos"
        contextLabel="Recepção"
        compact
        showReservationDates={false}
      /></div><div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Próximas chegadas</h2><button onClick={() => setActivePanel('arrivals')} className="text-[10px] font-black text-blue-700">Ver todas</button></div><div className="space-y-3">{arrivals.slice(0,5).map(r => <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs"><div><strong>{guestFor(r)?.nome || 'Hóspede'}</strong><p className="mt-1 text-[10px] text-slate-500">{r.codigo || 'Reserva'}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{roomFor(r)?.numero || '—'}</span></div>)}{arrivals.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nenhuma chegada prevista.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Saídas</h2><button onClick={() => setActivePanel('arrivals')} className="text-[10px] font-black text-blue-700">Ver todas</button></div><div className="space-y-3">{departures.slice(0,5).map(r => <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs"><div><strong>{guestFor(r)?.nome || 'Hóspede'}</strong><p className="mt-1 text-[10px] text-slate-500">Check-out hoje</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{roomFor(r)?.numero || '—'}</span></div>)}{departures.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nenhuma saída prevista.</p>}</div></section></div></section>

      <section className="grid gap-4 xl:grid-cols-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Tarefas do dia</h2><span className="text-[10px] font-black text-blue-700">{visibleCards.length} abertas</span></div><div className="space-y-2">{dashboardTasks.map(card => <button type="button" key={card.id} onClick={() => setScope('sector')} className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left"><span className="min-w-0 truncate text-[11px] font-bold text-slate-700">{card.titulo}</span><span className="shrink-0 rounded-md bg-white px-2 py-1 text-[8px] font-black text-slate-500">{card.prioridade || 'normal'}</span></button>)}{dashboardTasks.length === 0 && <p className="py-5 text-center text-xs text-slate-400">Nenhuma tarefa aberta.</p>}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Alertas ativos</h2><button onClick={() => setActivePanel('alerts')} className="text-[10px] font-black text-blue-700">Ver todos</button></div><div className="space-y-2">{dashboardAlerts.map(card => <button type="button" key={card.id} onClick={() => setActivePanel('alerts')} className="w-full rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-left"><p className="truncate text-[11px] font-black text-rose-800">{card.titulo}</p><p className="mt-1 truncate text-[9px] font-semibold text-rose-600">{card.room_number ? `Quarto ${card.room_number} · ` : ''}{assignedName(card)}</p></button>)}{dashboardAlerts.length === 0 && <p className="py-5 text-center text-xs text-emerald-600">Nenhum alerta crítico.</p>}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Resumo do dia</h2><span className="text-[10px] font-black text-slate-400">Hoje</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[9px] font-black text-emerald-700">CHECK-INS</p><p className="mt-1 text-xl font-black text-emerald-900">{arrivals.length}</p></div><div className="rounded-xl bg-orange-50 p-3"><p className="text-[9px] font-black text-orange-700">CHECK-OUTS</p><p className="mt-1 text-xl font-black text-orange-900">{departures.length}</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-[9px] font-black text-blue-700">OCUPAÇÃO</p><p className="mt-1 text-xl font-black text-blue-900">{rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}%</p></div><div className="rounded-xl bg-violet-50 p-3"><p className="text-[9px] font-black text-violet-700">QUARTOS</p><p className="mt-1 text-xl font-black text-violet-900">{rooms.length}</p></div></div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Atividades recentes</h2><span className="text-[10px] font-black text-blue-700">Ao vivo</span></div><div className="space-y-2">{recentActivities.map(card => <div key={card.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">{String(card.titulo || '?').slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-[10px] font-black text-slate-700">{card.titulo}</p><p className="truncate text-[9px] text-slate-400">{assignedName(card)}</p></div></div>)}{recentActivities.length === 0 && <p className="py-5 text-center text-xs text-slate-400">Sem atividades recentes.</p>}</div></section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4"><div className="mb-3"><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Recepção · Tarefas</p><h2 className="text-lg font-black text-slate-950">Kanban de tarefas da Recepção</h2><p className="mt-1 text-xs text-slate-500">Solicitações e atendimentos permanecem separados do mapa operacional dos quartos.</p></div><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2"><button onClick={() => setScope('mine')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div><label className="relative block max-w-xl flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar solicitação, quarto, hóspede ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-300" /></label></div></section>

      <ReceptionKanbanBoard columns={columns} cards={visibleCards} currentUserId={currentUser?.id} savingId={savingId} assignedUserId={assignedUserId} assignedName={assignedName} onMove={(card, columnId) => void moveToColumn(card, columnId)} />
      </>}</main></div>
  </div>;
};
