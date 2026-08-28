import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  BedDouble,
  CalendarDays,
  Edit3,
  Info,
  LogIn,
  LogOut,
  Search,
  Snowflake,
  Trash2,
  Tv,
  UserRound,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Hospede, Quarto, Reserva } from '../../types';

interface ReceptionRoomsKanbanProps {
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
  rooms: Quarto[];
  reservations: Reserva[];
  guests: Hospede[];
  savingId?: string | null;
  stayActionId?: string | null;
  title?: string;
  contextLabel?: string;
  showGuest?: boolean;
  showReservationDates?: boolean;
  showRoomType?: boolean;
  showFloor?: boolean;
  showStatus?: boolean;
  allowCheckin?: boolean;
  allowCheckout?: boolean;
  allowTransferRoom?: boolean;
  allowEditRoom?: boolean;
  allowDeleteRoom?: boolean;
  onMove: (card: KanbanV2Card, columnId: string) => void;
  onCheckin: (reservation: Reserva) => void;
  onCheckout: (reservation: Reserva) => void;
  onTransfer: (reservation: Reserva, toRoomId: string) => void;
}

type StatusTheme = {
  label: string;
  chip: string;
  icon: string;
  border: string;
  tint: string;
  action: string;
};

const STATUS_THEME: Record<string, StatusTheme> = {
  'room-col-disponivel': {
    label: 'Disponível', chip: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200', tint: 'bg-emerald-50/35', action: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  'room-col-ocupado': {
    label: 'Ocupado', chip: 'bg-blue-100 text-blue-700', icon: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200', tint: 'bg-blue-50/35', action: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  'room-col-sujo': {
    label: 'Sujo', chip: 'bg-orange-100 text-orange-700', icon: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200', tint: 'bg-orange-50/35', action: 'bg-orange-600 text-white',
  },
  'room-col-limpeza': {
    label: 'Em limpeza', chip: 'bg-cyan-100 text-cyan-700', icon: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-200', tint: 'bg-cyan-50/35', action: 'bg-cyan-600 text-white',
  },
  'room-col-vistoria': {
    label: 'Vistoria', chip: 'bg-violet-100 text-violet-700', icon: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200', tint: 'bg-violet-50/35', action: 'bg-violet-600 text-white',
  },
  'room-col-manutencao': {
    label: 'Manutenção', chip: 'bg-rose-100 text-rose-700', icon: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200', tint: 'bg-rose-50/35', action: 'bg-rose-600 text-white',
  },
  'room-col-bloqueado': {
    label: 'Bloqueado', chip: 'bg-slate-200 text-slate-700', icon: 'bg-slate-200 text-slate-700',
    border: 'border-slate-300', tint: 'bg-slate-50', action: 'bg-slate-700 text-white',
  },
  'room-col-outros': {
    label: 'Outro', chip: 'bg-stone-100 text-stone-700', icon: 'bg-stone-100 text-stone-700',
    border: 'border-stone-200', tint: 'bg-stone-50', action: 'bg-stone-700 text-white',
  },
};

function roomId(card: KanbanV2Card) {
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata as Record<string, unknown> : {};
  return typeof metadata.room_id === 'string' ? metadata.room_id : '';
}

function linkedReservation(room: Quarto, reservations: Reserva[]) {
  const candidates = reservations.filter(reservation =>
    reservation.quarto_id === room.id && ['checkin_realizado', 'confirmada', 'pendente'].includes(reservation.status),
  );
  return candidates.sort((a, b) => {
    const priority = (status: string) => status === 'checkin_realizado' ? 0 : status === 'confirmada' ? 1 : 2;
    const diff = priority(a.status) - priority(b.status);
    if (diff) return diff;
    return String(a.data_checkin || a.checkin || '').localeCompare(String(b.data_checkin || b.checkin || ''));
  })[0] || null;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shortDate(value?: string) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';
}

function fullDate(value?: string) {
  const date = parseDate(value);
  return date ? date.toLocaleString('pt-BR') : value || 'Não informado';
}

function stayInfo(reservation: Reserva | null) {
  if (!reservation) return null;
  const checkinValue = reservation.data_checkin || reservation.checkin;
  const checkoutValue = reservation.data_checkout || reservation.checkout;
  const checkin = parseDate(checkinValue);
  const checkout = parseDate(checkoutValue);
  if (!checkin || !checkout) return { nights: null, currentDay: null, checkinValue, checkoutValue };
  const dayMs = 86_400_000;
  const nights = Math.max(1, Math.ceil((checkout.getTime() - checkin.getTime()) / dayMs));
  const now = new Date();
  const currentDay = Math.min(nights, Math.max(1, Math.floor((now.getTime() - checkin.getTime()) / dayMs) + 1));
  return { nights, currentDay, checkinValue, checkoutValue };
}

function money(value?: number) {
  return typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Não informado';
}

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="min-w-0 border-b border-slate-100 pb-2">
    <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <span className="mt-0.5 block truncate text-[11px] font-black text-slate-800" title={typeof value === 'string' ? value : undefined}>{value || 'Não informado'}</span>
  </div>
);

export const ReceptionRoomsKanban: React.FC<ReceptionRoomsKanbanProps> = ({
  columns, cards, rooms, reservations, guests, savingId, stayActionId,
  title = 'Quartos, reservas e hospedagens', contextLabel = 'Recepção · Mapa de quartos',
  showGuest = true, showReservationDates = true, showRoomType = true, showFloor = true, showStatus = true,
  allowCheckin = true, allowCheckout = true, allowTransferRoom = true, allowEditRoom = true, allowDeleteRoom = true,
  onMove, onCheckin, onCheckout, onTransfer,
}) => {
  const { roomTypes, updateRoom, deleteRoom } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<Quarto | null>(null);
  const [editingRoom, setEditingRoom] = useState<Quarto | null>(null);
  const [draft, setDraft] = useState<Partial<Quarto>>({});
  const [transferTarget, setTransferTarget] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const cardsWithRooms = useMemo(
    () => cards.filter(card => rooms.some(room => room.id === roomId(card) || String(room.numero) === String(card.room_number))),
    [cards, rooms],
  );

  const roomRows = useMemo(() => rooms.map(room => {
    const card = cardsWithRooms.find(item => roomId(item) === room.id || String(item.room_number) === String(room.numero));
    if (!card) return null;
    const reservation = linkedReservation(room, reservations);
    const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : null;
    const column = columns.find(item => item.id === card.column_id);
    return { room, card, reservation, guest, column };
  }).filter(Boolean) as Array<{ room: Quarto; card: KanbanV2Card; reservation: Reserva | null; guest: Hospede | undefined; column: KanbanV2Column | undefined }>, [rooms, cardsWithRooms, reservations, guests, columns]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return roomRows.filter(row => statusFilter === 'all' || row.card.column_id === statusFilter)
      .filter(row => !q || [row.room.numero, row.room.nome, row.guest?.nome, row.reservation?.codigo]
        .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [roomRows, query, statusFilter]);

  const summary = useMemo(() => ({
    all: roomRows.length,
    reserved: roomRows.filter(row => row.reservation && row.reservation.status !== 'checkin_realizado').length,
  }), [roomRows]);

  const openRoom = (room: Quarto) => { setTransferTarget(''); setSelectedRoom(room); };
  const openEditor = (room: Quarto) => { setEditingRoom(room); setDraft({ ...room }); };

  const saveRoom = () => {
    if (!editingRoom) return;
    const dailyRate = Number(draft.valor_diaria ?? draft.preco_diaria ?? editingRoom.valor_diaria ?? editingRoom.preco_diaria ?? 0);
    updateRoom(editingRoom.id, {
      ...draft,
      numero: String(draft.numero || editingRoom.numero).trim(),
      nome: String(draft.nome || '').trim(),
      andar: Number(draft.andar ?? editingRoom.andar),
      capacidade: Number(draft.capacidade ?? editingRoom.capacidade),
      valor_diaria: dailyRate,
      preco_diaria: dailyRate,
    });
    setEditingRoom(null);
    setSelectedRoom(null);
  };

  const removeRoom = (room: Quarto) => {
    if (!window.confirm(`Excluir definitivamente o Quarto ${room.numero}?`)) return;
    if (!window.confirm(`Confirme novamente a exclusão do Quarto ${room.numero}.`)) return;
    deleteRoom(room.id);
    setSelectedRoom(null);
  };

  const filterButton = (key: string, label: string, count: number, className: string) => (
    <button type="button" onClick={() => setStatusFilter(key)}
      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition ${statusFilter === key ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : className}`}>
      <span>{label}</span><b className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] text-current">{count}</b>
    </button>
  );

  const selectedRow = selectedRoom ? roomRows.find(row => row.room.id === selectedRoom.id) : null;

  return <>
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">{contextLabel}</p>
            <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-[11px] text-slate-500">Cards permanentes: o quarto continua no mapa e apenas seus vínculos e estados mudam.</p>
          </div>
          <label className="relative block w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar quarto, hóspede ou reserva"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none focus:border-blue-300 focus:bg-white" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filterButton('all', 'Todos os quartos', summary.all, 'border-slate-200 bg-white text-slate-700')}
          {columns.map(column => filterButton(column.id, column.nome, roomRows.filter(row => row.card.column_id === column.id).length, 'border-slate-200 bg-white text-slate-700'))}
          {(showGuest || showReservationDates) && <div className="flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[10px] font-black text-amber-700"><CalendarDays className="h-3.5 w-3.5" />Reservados <b>{summary.reserved}</b></div>}
        </div>
      </div>

      <div className={`grid gap-0 ${selectedRow ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
        <div className="p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleRows.map(({ room, card, reservation, guest }) => {
              const theme = STATUS_THEME[card.column_id] || STATUS_THEME['room-col-outros'];
              const checkedIn = reservation?.status === 'checkin_realizado';
              const busy = savingId === card.id || (!!reservation && stayActionId === reservation.id);
              const roomType = roomTypes.find(type => type.id === room.tipo_quarto_id);
              const isReserved = !!reservation && !checkedIn;
              const subtitle = [showRoomType ? (roomType?.nome || room.nome || 'Acomodação') : '', showFloor ? `Andar ${room.andar}` : ''].filter(Boolean).join(' · ');
              const canPrimaryAction = !!reservation && (checkedIn ? allowCheckout : allowCheckin);

              return <article key={card.id} role="button" tabIndex={0} onClick={() => openRoom(room)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openRoom(room); }}
                className={`group min-h-[154px] cursor-pointer rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.border} ${selectedRoom?.id === room.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${theme.icon}`}><BedDouble className="h-4 w-4" /></span>
                    <div className="min-w-0"><strong className="block text-lg font-black leading-none text-slate-950">{room.numero}</strong>{subtitle && <span className="mt-1 block truncate text-[10px] font-semibold text-slate-500">{subtitle}</span>}</div>
                  </div>
                  {showStatus && <span className={`shrink-0 rounded-md px-2 py-1 text-[8px] font-black uppercase ${isReserved ? 'bg-amber-100 text-amber-700' : theme.chip}`}>{isReserved ? 'Reservado' : theme.label}</span>}
                </div>

                {(showGuest || showReservationDates) && <div className="mt-3 min-h-[38px] border-t border-slate-100 pt-2">
                  {guest && reservation ? <>{showGuest && <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-black text-slate-800"><UserRound className="h-3 w-3 shrink-0 text-slate-400" /><span className="truncate">{guest.nome}</span></div>}{showReservationDates && <div className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold text-slate-500"><CalendarDays className="h-3 w-3" />{shortDate(reservation.data_checkin || reservation.checkin)} → {shortDate(reservation.data_checkout || reservation.checkout)}</div>}</> : <div className="text-[9px] font-semibold text-slate-400">Sem hóspede associado</div>}
                </div>}

                <div className="mt-2 flex items-center gap-2">
                  {canPrimaryAction && reservation && <button type="button" disabled={busy} onClick={event => { event.stopPropagation(); checkedIn ? onCheckout(reservation) : onCheckin(reservation); }}
                    className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[9px] font-black transition disabled:opacity-50 ${checkedIn ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : isReserved ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {checkedIn ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}{checkedIn ? 'CHECK-OUT' : 'CHECK-IN'}<ArrowRight className="h-3.5 w-3.5" />
                  </button>}
                  <button type="button" onClick={event => { event.stopPropagation(); openRoom(room); }} className={`${canPrimaryAction ? 'grid h-8 w-8' : 'flex h-8 flex-1'} place-items-center items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[9px] font-black text-slate-500 hover:bg-slate-50`} aria-label={`Detalhes do quarto ${room.numero}`}><Info className="h-3.5 w-3.5" />{!canPrimaryAction && <span>DETALHES</span>}</button>
                </div>
              </article>;
            })}
          </div>

          {visibleRows.length === 0 && <div className="grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-400">Nenhum quarto corresponde aos filtros.</div>}
          <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400"><BedDouble className="h-3.5 w-3.5" />{visibleRows.length} de {roomRows.length} quartos exibidos</div>
        </div>

        {selectedRow && (() => {
          const { room, card, reservation, guest, column } = selectedRow;
          const theme = STATUS_THEME[card.column_id] || STATUS_THEME['room-col-outros'];
          const checkedIn = reservation?.status === 'checkin_realizado';
          const reservationBusy = !!reservation && stayActionId === reservation.id;
          const stay = stayInfo(reservation);
          const roomType = roomTypes.find(type => type.id === room.tipo_quarto_id);
          const availableDestinations = rooms.filter(item => item.id !== room.id && String(item.status).toLowerCase() === 'disponivel' && !linkedReservation(item, reservations));

          return <aside className="border-t border-slate-200 bg-white p-4 xl:border-l xl:border-t-0">
            <div className="xl:sticky xl:top-24">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-full ${theme.icon}`}><BedDouble className="h-5 w-5" /></span><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detalhes do quarto</p><h3 className="text-xl font-black text-slate-950">Quarto {room.numero}</h3><p className="text-[10px] font-semibold text-slate-500">{roomType?.nome || room.nome} · {room.andar}º andar</p></div></div>
                <button type="button" onClick={() => setSelectedRoom(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>

              {showStatus && <div className="mt-4 flex items-center gap-2"><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${theme.chip}`}>{column?.nome || theme.label}</span>{reservation && <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">{checkedIn ? 'Hospedado' : 'Reserva ativa'}</span>}</div>}

              <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-500"><span className="grid place-items-center"><Wifi className="h-4 w-4" /></span><span className="grid place-items-center"><Snowflake className="h-4 w-4" /></span><span className="grid place-items-center"><Tv className="h-4 w-4" /></span><span className="flex items-center justify-center gap-1"><Users className="h-4 w-4" /><b className="text-[10px]">{room.capacidade}</b></span></div>

              {(allowCheckin || allowCheckout) && <div className="mt-4 grid grid-cols-2 gap-2">
                {allowCheckin && <button type="button" disabled={!reservation || checkedIn || reservationBusy} onClick={() => reservation && onCheckin(reservation)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[10px] font-black text-white transition hover:bg-emerald-700 disabled:bg-emerald-50 disabled:text-emerald-300"><LogIn className="h-4 w-4" />CHECK-IN</button>}
                {allowCheckout && <button type="button" disabled={!reservation || !checkedIn || reservationBusy} onClick={() => reservation && onCheckout(reservation)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 text-[10px] font-black text-white transition hover:bg-rose-700 disabled:bg-rose-50 disabled:text-rose-300"><LogOut className="h-4 w-4" />CHECK-OUT</button>}
              </div>}

              <section className="mt-5"><p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-700">Informações do quarto</p><div className="grid grid-cols-2 gap-x-4 gap-y-2"><Detail label="Categoria" value={roomType?.nome || room.tipo_quarto_id} /><Detail label="Andar" value={`${room.andar}º andar`} /><Detail label="Capacidade" value={`${room.capacidade} hóspede(s)`} /><Detail label="Diária" value={money(room.valor_diaria ?? room.preco_diaria)} /><Detail label="Vista" value={room.vista} /><Detail label="Cama" value={room.cama} /></div></section>

              <section className="mt-5 rounded-2xl border border-slate-200 p-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Hospedagem atual</p>
                {guest && reservation ? <div className="mt-2"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-blue-500" /><strong className="text-sm text-slate-900">{guest.nome}</strong></div><p className="mt-1 text-[10px] text-slate-500">{guest.telefone || 'Sem telefone'} · {guest.email || 'Sem e-mail'}</p><div className="mt-3 grid grid-cols-2 gap-2"><Detail label="Check-in" value={fullDate(stay?.checkinValue)} /><Detail label="Check-out" value={fullDate(stay?.checkoutValue)} /></div></div> : <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[10px] font-semibold text-slate-500">Sem hóspede associado. O quarto permanece disponível para receber uma reserva.</div>}
              </section>

              {allowTransferRoom && reservation && <section className="mt-4 rounded-2xl border border-slate-200 p-3"><div className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-blue-500" /><p className="text-[10px] font-black uppercase text-slate-700">Trocar quarto</p></div><div className="mt-2 flex gap-2"><select value={transferTarget} onChange={event => setTransferTarget(event.target.value)} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-2 text-[10px] font-bold"><option value="">Selecionar destino</option>{availableDestinations.map(item => <option key={item.id} value={item.id}>Quarto {item.numero} · {item.nome}</option>)}</select><button type="button" disabled={!transferTarget || reservationBusy} onClick={() => transferTarget && onTransfer(reservation, transferTarget)} className="h-9 rounded-xl bg-blue-600 px-3 text-[9px] font-black text-white disabled:opacity-40">Transferir</button></div></section>}

              {showStatus && <section className="mt-4"><p className="mb-2 text-[10px] font-black uppercase text-slate-700">Status operacional</p><select value={card.column_id} disabled={savingId === card.id} onChange={event => onMove(card, event.target.value)} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700">{columns.map(option => <option key={option.id} value={option.id}>{option.nome}</option>)}</select></section>}

              {(allowEditRoom || allowDeleteRoom) && <div className="mt-5 flex gap-2 border-t border-slate-200 pt-4">{allowEditRoom && <button type="button" onClick={() => openEditor(room)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[9px] font-black text-slate-600 hover:bg-slate-50"><Edit3 className="h-3.5 w-3.5" />Editar quarto</button>}{allowDeleteRoom && <button type="button" onClick={() => removeRoom(room)} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[9px] font-black text-rose-700"><Trash2 className="h-3.5 w-3.5" />Excluir</button>}</div>}
            </div>
          </aside>;
        })()}
      </div>
    </section>

    {allowEditRoom && editingRoom && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setEditingRoom(null); }}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><p className="text-[10px] font-black uppercase text-blue-600">Editar quarto</p><h3 className="text-lg font-black">Quarto {editingRoom.numero}</h3></div><button type="button" onClick={() => setEditingRoom(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <label className="text-[10px] font-black text-slate-500">Número<input value={String(draft.numero ?? '')} onChange={e => setDraft(cur => ({ ...cur, numero: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Nome<input value={String(draft.nome ?? '')} onChange={e => setDraft(cur => ({ ...cur, nome: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Tipo<select value={String(draft.tipo_quarto_id ?? '')} onChange={e => setDraft(cur => ({ ...cur, tipo_quarto_id: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold">{roomTypes.map(type => <option key={type.id} value={type.id}>{type.nome}</option>)}</select></label>
          <label className="text-[10px] font-black text-slate-500">Andar<input type="number" value={Number(draft.andar ?? 0)} onChange={e => setDraft(cur => ({ ...cur, andar: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Capacidade<input type="number" value={Number(draft.capacidade ?? 0)} onChange={e => setDraft(cur => ({ ...cur, capacidade: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Diária<input type="number" step="0.01" value={Number(draft.valor_diaria ?? draft.preco_diaria ?? 0)} onChange={e => setDraft(cur => ({ ...cur, valor_diaria: Number(e.target.value), preco_diaria: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Vista<input value={String(draft.vista ?? '')} onChange={e => setDraft(cur => ({ ...cur, vista: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="text-[10px] font-black text-slate-500">Cama<input value={String(draft.cama ?? '')} onChange={e => setDraft(cur => ({ ...cur, cama: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold" /></label>
          <label className="sm:col-span-2 text-[10px] font-black text-slate-500">Descrição<textarea value={String(draft.descricao ?? '')} onChange={e => setDraft(cur => ({ ...cur, descricao: e.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold" /></label>
          <label className="sm:col-span-2 text-[10px] font-black text-slate-500">Notas internas<textarea value={String(draft.notas_internas ?? '')} onChange={e => setDraft(cur => ({ ...cur, notas_internas: e.target.value }))} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold" /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-5"><button type="button" onClick={() => setEditingRoom(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600">Cancelar</button><button type="button" onClick={saveRoom} className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white">Salvar alterações</button></div>
      </div>
    </div>}
  </>;
};