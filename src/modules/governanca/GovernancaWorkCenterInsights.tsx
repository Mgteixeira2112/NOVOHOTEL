import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, BedDouble, CheckCircle2, ChevronRight, Clock3, Search, ShieldCheck, Sparkles, UserRound, Wrench, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Quarto, RoomStatus } from '../../types';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { createGovernancaDemand } from './governancaDemandService';
import { GOVERNANCA_STAGES } from './governancaWorkspaceModel';

export type WorkCenterInsightKind = 'maintenance' | 'rooms' | 'alerts';
type RoomFilter = 'all' | 'attention' | 'disponivel' | 'ocupado' | 'limpeza' | 'vistoria' | 'manutencao' | 'bloqueado';

const upsert = (list: KanbanV2Card[], card: KanbanV2Card) =>
  list.some(item => item.id === card.id) ? list.map(item => item.id === card.id ? card : item) : [...list, card];

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const roomStatusLabel = (status?: string | null) => ({
  disponivel: 'Disponível',
  ocupado: 'Ocupado',
  manutencao: 'Manutenção',
  sujo: 'Sujo',
  limpeza: 'Em limpeza',
  em_limpeza: 'Em limpeza',
  vistoria: 'Vistoria',
  aguardando_vistoria: 'Aguardando vistoria',
  inspecionado: 'Inspecionado',
  aprovado: 'Aprovado',
  limpo: 'Limpo',
  bloqueado: 'Bloqueado',
  nao_perturbe: 'Não perturbe',
} as Record<string, string>)[normalize(status)] || status || 'Não informado';

const roomStatusTone = (status?: string | null) => {
  const key = normalize(status);
  if (['disponivel', 'aprovado', 'limpo', 'inspecionado'].includes(key)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['ocupado'].includes(key)) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (['limpeza', 'em_limpeza', 'vistoria', 'aguardando_vistoria', 'sujo'].includes(key)) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (['manutencao', 'bloqueado'].includes(key)) return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
};

const requiresAttention = (room: Quarto) => {
  const operational = normalize(room.status);
  const housekeeping = normalize(room.status_housekeeping || room.status_governanca);
  return ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(operational)
    || ['sujo', 'limpeza', 'em_limpeza', 'aguardando_vistoria', 'bloqueado'].includes(housekeeping);
};

const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : 'Não informado';

export const GovernancaWorkCenterInsights: React.FC<{ governanceCards: KanbanV2Card[] }> = ({ governanceCards }) => {
  const {
    rooms,
    reservations,
    guests,
    currentUser,
    updateRoom,
    hasTabAccess,
    getRoleModulePermission,
  } = useHotel();
  const [allCards, setAllCards] = useState<KanbanV2Card[]>([]);
  const [allColumns, setAllColumns] = useState<KanbanV2Column[]>([]);
  const [active, setActive] = useState<WorkCenterInsightKind | null>(null);
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [roomQuery, setRoomQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Quarto | null>(null);
  const [roomActionBusy, setRoomActionBusy] = useState(false);
  const [roomActionMessage, setRoomActionMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setAllCards(result.cards.filter(card => !card.is_archived));
      setAllColumns(result.columns);
    });
    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (!card.is_archived) setAllCards(current => upsert(current, card)); },
      onUpdate: card => setAllCards(current => card.is_archived ? current.filter(item => item.id !== card.id) : upsert(current, card)),
      onDelete: card => setAllCards(current => current.filter(item => item.id !== card.id)),
      onStatus: () => undefined,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    const fresh = rooms.find(room => room.id === selectedRoom.id);
    if (fresh) setSelectedRoom(fresh);
  }, [rooms, selectedRoom?.id]);

  const maintenance = useMemo(() => allCards.filter(card => card.board_id === 'kanban-board-manutencao' || card.departamento === 'manutencao'), [allCards]);
  const maintenanceOpen = maintenance.filter(card => !/resolvido|concluido|finalizado/i.test(card.column_id));
  const roomsAttention = rooms.filter(requiresAttention);
  const urgent = governanceCards.filter(card => ['critica', 'urgente', 'alta'].includes(normalize(card.prioridade)) && card.column_id !== GOVERNANCA_STAGES.done);
  const inspection = governanceCards.filter(card => card.column_id === GOVERNANCA_STAGES.inspection);
  const unassigned = governanceCards.filter(card => !(card as any).assigned_user_id && !(card.assigned_to as any)?.id && card.column_id !== GOVERNANCA_STAGES.done);
  const alertsCount = urgent.length + inspection.length + unassigned.length;
  const columnName = (card: KanbanV2Card) => allColumns.find(column => column.id === card.column_id)?.nome || card.column_id;

  const role = currentUser?.tipo_usuario || 'governanca';
  const roomsPermission = getRoleModulePermission(role, 'rooms');
  const canViewRooms = hasTabAccess(role, 'rooms');
  const canEditRooms = role === 'admin' || role === 'gerente'
    || (roomsPermission ? roomsPermission.granted && roomsPermission.level !== 'readonly' && roomsPermission.level !== 'none' : role === 'governanca');
  const canRequestMaintenance = canEditRooms || role === 'recepcionista';

  const roomCounts = useMemo(() => ({
    total: rooms.length,
    disponivel: rooms.filter(room => normalize(room.status) === 'disponivel').length,
    ocupado: rooms.filter(room => normalize(room.status) === 'ocupado').length,
    limpeza: rooms.filter(room => ['limpeza', 'em_limpeza', 'sujo'].includes(normalize(room.status_housekeeping || room.status_governanca || room.status))).length,
    vistoria: rooms.filter(room => ['vistoria', 'aguardando_vistoria'].includes(normalize(room.status_housekeeping || room.status_governanca || room.status))).length,
    manutencao: rooms.filter(room => normalize(room.status) === 'manutencao').length,
    bloqueado: rooms.filter(room => normalize(room.status) === 'bloqueado').length,
    attention: roomsAttention.length,
  }), [rooms, roomsAttention.length]);

  const filteredRooms = useMemo(() => {
    const query = normalize(roomQuery);
    return rooms.filter(room => {
      if (query && ![room.numero, room.nome, room.descricao, room.status, room.status_governanca, room.status_housekeeping, room.status_manutencao_motivo].filter(Boolean).join(' ').toLowerCase().includes(query)) return false;
      if (roomFilter === 'all') return true;
      if (roomFilter === 'attention') return requiresAttention(room);
      if (roomFilter === 'limpeza') return ['limpeza', 'em_limpeza', 'sujo'].includes(normalize(room.status_housekeeping || room.status_governanca || room.status));
      if (roomFilter === 'vistoria') return ['vistoria', 'aguardando_vistoria'].includes(normalize(room.status_housekeeping || room.status_governanca || room.status));
      return normalize(room.status) === roomFilter;
    });
  }, [rooms, roomFilter, roomQuery]);

  const currentReservationFor = (roomId: string) => reservations.find(reservation => reservation.quarto_id === roomId && ['confirmada', 'checkin_realizado'].includes(reservation.status));
  const guestNameFor = (roomId: string) => {
    const reservation = currentReservationFor(roomId);
    return guests.find(guest => guest.id === reservation?.hospede_id)?.nome || null;
  };
  const maintenanceFor = (room: Quarto) => maintenanceOpen.filter(card => String(card.room_number || '') === String(room.numero));

  const changeHousekeeping = (room: Quarto, status: string) => {
    if (!canEditRooms || roomActionBusy) return;
    setRoomActionBusy(true);
    setRoomActionMessage('');
    try {
      const updates: Partial<Quarto> = { status_governanca: status, status_housekeeping: status };
      if (status === 'aprovado') updates.ultima_limpeza = new Date().toISOString();
      updateRoom(room.id, updates);
      setRoomActionMessage(`Quarto ${room.numero} atualizado para ${roomStatusLabel(status)}.`);
    } finally {
      setRoomActionBusy(false);
    }
  };

  const requestMaintenance = async (room: Quarto) => {
    if (!canRequestMaintenance || roomActionBusy || !currentUser?.id) return;
    const existing = maintenanceFor(room);
    if (existing.length > 0) {
      setRoomActionMessage(`Já existe ${existing.length} chamado(s) de manutenção em aberto para o quarto ${room.numero}.`);
      return;
    }
    setRoomActionBusy(true);
    setRoomActionMessage('');
    try {
      await createGovernancaDemand({
        sector: 'manutencao',
        title: `Verificar quarto ${room.numero}`,
        description: room.status_manutencao_motivo || `Solicitação operacional criada a partir do painel do quarto ${room.numero}.`,
        roomNumber: room.numero,
        priority: 'alta',
        actorUserId: currentUser.id,
      });
      setRoomActionMessage(`Chamado de manutenção criado para o quarto ${room.numero}.`);
    } catch (error: any) {
      setRoomActionMessage(error?.message || 'Não foi possível criar o chamado de manutenção.');
    } finally {
      setRoomActionBusy(false);
    }
  };

  const cards = [
    { kind: 'maintenance' as const, icon: Wrench, label: 'Manutenção', value: maintenanceOpen.length, detail: maintenanceOpen.length ? `${maintenanceOpen.length} chamados em aberto` : 'Sem chamados em aberto' },
    { kind: 'rooms' as const, icon: BedDouble, label: 'Quartos', value: roomsAttention.length, detail: `${rooms.length} cadastrados · ${roomsAttention.length} requerem atenção` },
    { kind: 'alerts' as const, icon: BellRing, label: 'Alertas do setor', value: alertsCount, detail: `${urgent.length} prioridade · ${inspection.length} inspeção · ${unassigned.length} sem responsável` },
  ];

  const roomFilterOptions: Array<{ key: RoomFilter; label: string; count: number }> = [
    { key: 'all', label: 'Todos', count: roomCounts.total },
    { key: 'attention', label: 'Atenção', count: roomCounts.attention },
    { key: 'disponivel', label: 'Disponíveis', count: roomCounts.disponivel },
    { key: 'ocupado', label: 'Ocupados', count: roomCounts.ocupado },
    { key: 'limpeza', label: 'Limpeza', count: roomCounts.limpeza },
    { key: 'vistoria', label: 'Vistoria', count: roomCounts.vistoria },
    { key: 'manutencao', label: 'Manutenção', count: roomCounts.manutencao },
    { key: 'bloqueado', label: 'Bloqueados', count: roomCounts.bloqueado },
  ];

  return <>
    <div className="grid gap-2 sm:grid-cols-3">
      {cards.map(item => <button key={item.kind} onClick={() => setActive(item.kind)} className="group flex min-h-[74px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50/50">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><item.icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="flex items-baseline gap-2"><strong className="text-xs text-slate-800">{item.label}</strong><b className="text-lg text-slate-950">{item.value}</b></span><span className="block truncate text-[10px] text-slate-500">{item.detail}</span></span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-amber-600" />
      </button>)}
    </div>

    {active && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) { setActive(null); setSelectedRoom(null); } }}>
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Central de trabalho · Tempo real</p><h2 className="text-lg font-black">{active === 'maintenance' ? 'Manutenção' : active === 'rooms' ? 'Painel operacional de quartos' : 'Alertas do setor'}</h2></div><button onClick={() => { setActive(null); setSelectedRoom(null); }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button></div>
        <div className="p-5">
          {active === 'maintenance' && <div className="space-y-2">{maintenance.length ? maintenance.map(card => <div key={card.id} className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong className="text-xs">{card.titulo}</strong><p className="mt-1 text-[10px] text-slate-500">{card.room_number ? `Quarto ${card.room_number} · ` : ''}{card.descricao || 'Sem descrição'}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{columnName(card)}</span><span className="text-[10px] font-bold uppercase text-amber-700">{card.prioridade}</span></div>) : <p className="text-sm text-slate-400">Nenhum chamado de manutenção.</p>}</div>}

          {active === 'rooms' && !canViewRooms && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-800"><ShieldCheck className="h-5 w-5" /><strong className="text-sm">Acesso restrito</strong></div><p className="mt-2 text-xs text-amber-700">Seu perfil não possui permissão para visualizar o módulo de quartos.</p></div>}

          {active === 'rooms' && canViewRooms && <div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">{roomFilterOptions.map(option => <button key={option.key} onClick={() => setRoomFilter(option.key)} className={`rounded-2xl border px-3 py-2.5 text-left transition ${roomFilter === option.key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300'}`}><span className="block text-[9px] font-black uppercase tracking-wide opacity-70">{option.label}</span><span className="mt-1 block text-xl font-black">{option.count}</span></button>)}</div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={roomQuery} onChange={event => setRoomQuery(event.target.value)} placeholder="Buscar quarto, status ou observação" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-amber-300" /></label><span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><ShieldCheck className="h-3.5 w-3.5" />Ações conforme permissões de {currentUser?.nome || 'usuário'}</span></div>

            {roomActionMessage && <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">{roomActionMessage}</div>}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredRooms.map(room => {
              const housekeeping = room.status_governanca || room.status_housekeeping;
              const currentGuest = guestNameFor(room.id);
              const openMaintenance = maintenanceFor(room);
              const attention = requiresAttention(room);
              return <button key={room.id} onClick={() => { setSelectedRoom(room); setRoomActionMessage(''); }} className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${attention ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><strong className="text-sm text-slate-950">Quarto {room.numero}</strong>{attention && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}</div><p className="mt-0.5 text-[10px] text-slate-400">{room.nome || `Andar ${room.andar}`}</p></div><span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${roomStatusTone(room.status)}`}>{roomStatusLabel(room.status)}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400">Governança</span><p className="mt-1 truncate font-black text-slate-700">{roomStatusLabel(housekeeping)}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400">Hóspede</span><p className="mt-1 truncate font-black text-slate-700">{currentGuest || '—'}</p></div></div>
                {openMaintenance.length > 0 && <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-2 text-[9px] font-black text-rose-700"><Wrench className="h-3.5 w-3.5" />{openMaintenance.length} chamado(s) de manutenção em aberto</div>}
                <div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-slate-400">Última limpeza: {room.ultima_limpeza ? new Date(room.ultima_limpeza).toLocaleDateString('pt-BR') : 'não informada'}</span><span className="font-black text-amber-700">Abrir operação →</span></div>
              </button>;
            })}</div>
            {filteredRooms.length === 0 && <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center"><BedDouble className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-400">Nenhum quarto encontrado neste filtro.</p></div>}
          </div>}

          {active === 'alerts' && <div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-[10px] font-black uppercase text-rose-600">Prioridade alta</p><p className="mt-1 text-2xl font-black">{urgent.length}</p><div className="mt-3 space-y-2">{urgent.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase text-amber-700">Aguardando inspeção</p><p className="mt-1 text-2xl font-black">{inspection.length}</p><div className="mt-3 space-y-2">{inspection.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-600">Sem responsável</p><p className="mt-1 text-2xl font-black">{unassigned.length}</p><div className="mt-3 space-y-2">{unassigned.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div></div>}
        </div>
      </div>
    </div>}

    {selectedRoom && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedRoom(null); }}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Operação do quarto</p><div className="mt-1 flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">Quarto {selectedRoom.numero}</h3><span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${roomStatusTone(selectedRoom.status)}`}>{roomStatusLabel(selectedRoom.status)}</span></div></div><button onClick={() => setSelectedRoom(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button></div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Governança</p><p className="mt-1 text-xs font-black text-slate-800">{roomStatusLabel(selectedRoom.status_governanca || selectedRoom.status_housekeeping)}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Responsável</p><p className="mt-1 text-xs font-black text-slate-800">{selectedRoom.responsavel_limpeza || 'Não informado'}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Última limpeza</p><p className="mt-1 text-xs font-black text-slate-800">{formatDateTime(selectedRoom.ultima_limpeza)}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Fechadura</p><p className="mt-1 text-xs font-black text-slate-800">{selectedRoom.fechadura_bateria != null ? `${selectedRoom.fechadura_bateria}% bateria` : 'Não informado'}</p></div></div>

          {currentReservationFor(selectedRoom.id) && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-center gap-2 text-blue-700"><UserRound className="h-4 w-4" /><p className="text-[10px] font-black uppercase">Reserva / ocupação atual</p></div><p className="mt-2 text-sm font-black text-slate-900">{guestNameFor(selectedRoom.id) || 'Hóspede não identificado'}</p><p className="mt-1 text-[10px] text-slate-600">Status: {currentReservationFor(selectedRoom.id)?.status} · Check-in: {formatDateTime(currentReservationFor(selectedRoom.id)?.data_checkin || currentReservationFor(selectedRoom.id)?.checkin)} · Check-out: {formatDateTime(currentReservationFor(selectedRoom.id)?.data_checkout || currentReservationFor(selectedRoom.id)?.checkout)}</p></div>}

          {(selectedRoom.status_manutencao_motivo || maintenanceFor(selectedRoom).length > 0) && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-center gap-2 text-rose-700"><Wrench className="h-4 w-4" /><p className="text-[10px] font-black uppercase">Manutenção</p></div>{selectedRoom.status_manutencao_motivo && <p className="mt-2 text-xs font-bold text-slate-800">{selectedRoom.status_manutencao_motivo}</p>}<div className="mt-2 space-y-1">{maintenanceFor(selectedRoom).map(card => <p key={card.id} className="text-[10px] text-slate-600">• {card.titulo} · <strong>{columnName(card)}</strong></p>)}</div></div>}

          {selectedRoom.notas_internas && <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Observações internas</p><p className="mt-2 text-xs text-slate-700">{selectedRoom.notas_internas}</p></div>}

          <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-900">Ações operacionais</p><p className="mt-0.5 text-[10px] text-slate-400">Os comandos disponíveis são determinados pelas permissões do perfil.</p></div><ShieldCheck className="h-5 w-5 text-slate-400" /></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {canEditRooms && <><button disabled={roomActionBusy} onClick={() => changeHousekeeping(selectedRoom, 'em_limpeza')} className="h-9 rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white disabled:opacity-40">Iniciar limpeza</button><button disabled={roomActionBusy} onClick={() => changeHousekeeping(selectedRoom, 'aguardando_vistoria')} className="h-9 rounded-xl bg-amber-400 px-3 text-[10px] font-black text-slate-950 disabled:opacity-40">Enviar para vistoria</button><button disabled={roomActionBusy} onClick={() => changeHousekeeping(selectedRoom, 'aprovado')} className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white disabled:opacity-40"><CheckCircle2 className="h-3.5 w-3.5" />Aprovar limpeza</button></>}
              {canRequestMaintenance && <button disabled={roomActionBusy} onClick={() => void requestMaintenance(selectedRoom)} className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[10px] font-black text-rose-700 disabled:opacity-40"><Wrench className="h-3.5 w-3.5" />Solicitar manutenção</button>}
              {!canEditRooms && !canRequestMaintenance && <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500"><ShieldCheck className="h-3.5 w-3.5" />Visualização somente leitura</span>}
            </div>
            {roomActionMessage && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">{roomActionMessage}</p>}
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" /><p className="text-[10px] font-black uppercase text-slate-500">Leitura operacional</p></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-white p-3"><Sparkles className="h-4 w-4 text-amber-500" /><p className="mt-2 text-[10px] font-bold text-slate-600">Status de Governança atualizado diretamente no cadastro do quarto.</p></div><div className="rounded-xl bg-white p-3"><Wrench className="h-4 w-4 text-rose-500" /><p className="mt-2 text-[10px] font-bold text-slate-600">Chamados de manutenção são vinculados ao número do quarto.</p></div><div className="rounded-xl bg-white p-3"><BellRing className="h-4 w-4 text-blue-500" /><p className="mt-2 text-[10px] font-bold text-slate-600">Reservas e dados operacionais são combinados nesta visão.</p></div></div></div>
        </div>
      </div>
    </div>}
  </>;
};
