import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, BedDouble, Edit3, LogIn, LogOut, Trash2, UserRound, X } from 'lucide-react';
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
  onMove: (card: KanbanV2Card, columnId: string) => void;
  onCheckin: (reservation: Reserva) => void;
  onCheckout: (reservation: Reserva) => void;
  onTransfer: (reservation: Reserva, toRoomId: string) => void;
}

const STATUS_THEME: Record<string, { card: string; badge: string; accent: string; column: string; header: string }> = {
  'room-col-disponivel': { card: 'border-emerald-300 bg-emerald-50', badge: 'bg-emerald-600 text-white', accent: 'text-emerald-700', column: 'border-emerald-200 bg-emerald-50/45', header: 'bg-emerald-100/80' },
  'room-col-ocupado': { card: 'border-blue-300 bg-blue-50', badge: 'bg-blue-600 text-white', accent: 'text-blue-700', column: 'border-blue-200 bg-blue-50/45', header: 'bg-blue-100/80' },
  'room-col-sujo': { card: 'border-orange-300 bg-orange-50', badge: 'bg-orange-600 text-white', accent: 'text-orange-700', column: 'border-orange-200 bg-orange-50/50', header: 'bg-orange-100/80' },
  'room-col-limpeza': { card: 'border-cyan-300 bg-cyan-50', badge: 'bg-cyan-600 text-white', accent: 'text-cyan-700', column: 'border-cyan-200 bg-cyan-50/50', header: 'bg-cyan-100/80' },
  'room-col-vistoria': { card: 'border-violet-300 bg-violet-50', badge: 'bg-violet-600 text-white', accent: 'text-violet-700', column: 'border-violet-200 bg-violet-50/50', header: 'bg-violet-100/80' },
  'room-col-manutencao': { card: 'border-rose-300 bg-rose-50', badge: 'bg-rose-600 text-white', accent: 'text-rose-700', column: 'border-rose-200 bg-rose-50/50', header: 'bg-rose-100/80' },
  'room-col-bloqueado': { card: 'border-slate-400 bg-slate-100', badge: 'bg-slate-800 text-white', accent: 'text-slate-800', column: 'border-slate-300 bg-slate-100/80', header: 'bg-slate-200/80' },
  'room-col-outros': { card: 'border-stone-300 bg-stone-50', badge: 'bg-stone-600 text-white', accent: 'text-stone-700', column: 'border-stone-200 bg-stone-50', header: 'bg-stone-100' },
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

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
  <span className="block text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</span>
  <span className="mt-1 block break-words text-xs font-semibold text-slate-700">{value || 'Não informado'}</span>
</div>;

export const ReceptionRoomsKanban: React.FC<ReceptionRoomsKanbanProps> = ({
  columns, cards, rooms, reservations, guests, savingId, stayActionId, onMove, onCheckin, onCheckout, onTransfer,
}) => {
  const { roomTypes, updateRoom, deleteRoom } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<Quarto | null>(null);
  const [editingRoom, setEditingRoom] = useState<Quarto | null>(null);
  const [draft, setDraft] = useState<Partial<Quarto>>({});
  const [transferTarget, setTransferTarget] = useState('');

  const cardsWithRooms = useMemo(
    () => cards.filter(card => rooms.some(room => room.id === roomId(card) || String(room.numero) === String(card.room_number))),
    [cards, rooms],
  );

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
    setEditingRoom(null); setSelectedRoom(null);
  };

  const removeRoom = (room: Quarto) => {
    if (!window.confirm(`Excluir definitivamente o Quarto ${room.numero}?`)) return;
    if (!window.confirm(`Confirme novamente a exclusão do Quarto ${room.numero}.`)) return;
    deleteRoom(room.id); setSelectedRoom(null);
  };

  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Mapa operacional · Quartos</p>
          <h2 className="text-lg font-black text-slate-950">Kanban de quartos</h2>
          <p className="mt-1 text-[11px] text-slate-500">O card é fixo por quarto. Reserva associa o hóspede; check-in ocupa; check-out desvincula e envia o quarto à Governança.</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-slate-400">{cardsWithRooms.length} quartos</span>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {columns.map(column => {
          const theme = STATUS_THEME[column.id] || STATUS_THEME['room-col-outros'];
          const columnCards = cardsWithRooms.filter(card => card.column_id === column.id);
          return <div key={column.id} className={`min-w-0 rounded-2xl border ${theme.column}`}>
            <div className={`rounded-t-2xl px-2 py-2 ${theme.header}`}><div className="flex min-w-0 items-center justify-between gap-1">
              <strong className={`min-w-0 truncate text-[9px] font-black uppercase tracking-tight ${theme.accent}`} title={column.nome}>{column.nome}</strong>
              <span className={`grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[9px] font-black ${theme.badge}`}>{columnCards.length}</span>
            </div></div>

            <div className="space-y-2 p-1.5">
              {columnCards.map(card => {
                const room = rooms.find(item => item.id === roomId(card)) || rooms.find(item => String(item.numero) === String(card.room_number));
                if (!room) return null;
                const reservation = linkedReservation(room, reservations);
                const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : null;
                const stay = stayInfo(reservation);
                const busy = savingId === card.id || (!!reservation && stayActionId === reservation.id);
                const checkedIn = reservation?.status === 'checkin_realizado';

                return <article key={card.id} role="button" tabIndex={0}
                  onClick={() => openRoom(room)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openRoom(room); }}
                  className={`cursor-pointer rounded-xl border p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}>
                  <div className="flex items-center justify-between gap-1"><div className="flex min-w-0 items-center gap-1">
                    <BedDouble className={`h-3.5 w-3.5 shrink-0 ${theme.accent}`} /><strong className="truncate text-[11px] font-black text-slate-950">Q. {room.numero}</strong>
                  </div><span className={`h-2 w-2 shrink-0 rounded-full ${theme.badge.split(' ')[0]}`} title={column.nome} /></div>

                  <div className={`mt-1.5 rounded-lg px-1.5 py-1 text-center text-[8px] font-black uppercase ${theme.badge}`}>{column.nome}</div>

                  {guest && reservation ? <div className="mt-2 rounded-lg border border-blue-200 bg-white/80 p-1.5">
                    <div className="flex min-w-0 items-center gap-1 text-[9px] font-black text-blue-900"><UserRound className="h-3 w-3 shrink-0" /><span className="truncate" title={guest.nome}>{guest.nome}</span></div>
                    <div className="mt-1 rounded-md bg-blue-100 px-1 py-0.5 text-center text-[7px] font-black uppercase text-blue-800">{checkedIn ? 'Hospedado' : 'Reservado'}</div>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-[8px] font-bold text-slate-600"><span>IN {shortDate(stay?.checkinValue)}</span><span>OUT {shortDate(stay?.checkoutValue)}</span></div>
                    {stay?.nights && <div className="mt-1 rounded-md bg-blue-50 px-1 py-1 text-center text-[8px] font-black text-blue-800">{stay.nights} noite{stay.nights > 1 ? 's' : ''}</div>}
                  </div> : <div className="mt-2 rounded-lg border border-white/80 bg-white/70 px-1.5 py-2 text-center text-[8px] font-bold text-slate-500">Sem reserva associada</div>}

                  {reservation && <button type="button" disabled={busy}
                    onClick={event => { event.stopPropagation(); checkedIn ? onCheckout(reservation) : onCheckin(reservation); }}
                    className={`mt-2 flex h-7 w-full items-center justify-center gap-1 rounded-lg text-[8px] font-black text-white disabled:opacity-60 ${checkedIn ? 'bg-orange-600' : 'bg-blue-600'}`}>
                    {checkedIn ? <LogOut className="h-3 w-3" /> : <LogIn className="h-3 w-3" />}{checkedIn ? 'Check-out' : 'Check-in'}
                  </button>}

                  <select value={card.column_id} disabled={busy} onClick={event => event.stopPropagation()} onChange={event => onMove(card, event.target.value)}
                    className="mt-2 h-7 w-full min-w-0 rounded-lg border border-white bg-white/90 px-1 text-[8px] font-black text-slate-700 outline-none disabled:opacity-60" aria-label={`Alterar status do quarto ${room.numero}`}>
                    {columns.map(option => <option key={option.id} value={option.id}>{option.nome}</option>)}
                  </select>
                </article>;
              })}
              {columnCards.length === 0 && <div className="grid min-h-[72px] place-items-center rounded-xl border border-dashed border-slate-200 bg-white/55 p-1 text-center text-[8px] text-slate-400">Vazio</div>}
            </div>
          </div>;
        })}
      </div>
    </section>

    {selectedRoom && !editingRoom && (() => {
      const reservation = linkedReservation(selectedRoom, reservations);
      const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : null;
      const roomType = roomTypes.find(type => type.id === selectedRoom.tipo_quarto_id);
      const stay = stayInfo(reservation);
      const card = cardsWithRooms.find(item => roomId(item) === selectedRoom.id || String(item.room_number) === String(selectedRoom.numero));
      const column = columns.find(item => item.id === card?.column_id);
      const theme = STATUS_THEME[column?.id || 'room-col-outros'] || STATUS_THEME['room-col-outros'];
      const checkedIn = reservation?.status === 'checkin_realizado';
      const reservationBusy = !!reservation && stayActionId === reservation.id;
      const availableDestinations = rooms.filter(room => room.id !== selectedRoom.id && String(room.status).toLowerCase() === 'disponivel' && !linkedReservation(room, reservations));

      return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedRoom(null); }}>
        <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className={`sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 ${theme.header}`}>
            <div><p className={`text-[10px] font-black uppercase tracking-wider ${theme.accent}`}>Quarto {selectedRoom.numero} · {column?.nome || selectedRoom.status}</p><h3 className="text-lg font-black text-slate-950">{selectedRoom.nome || roomType?.nome || 'Acomodação'}</h3></div>
            <button type="button" onClick={() => setSelectedRoom(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-5 p-5">
            {guest && reservation ? <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase text-blue-600">{checkedIn ? 'Ocupante atual' : 'Reserva associada ao quarto'}</p><h4 className="text-base font-black text-blue-950">{guest.nome}</h4><p className="mt-1 text-xs text-blue-700">{guest.telefone || 'Sem telefone'} · {guest.email || 'Sem e-mail'} · {reservation.codigo || reservation.id}</p></div>{stay?.nights && <div className="rounded-xl bg-blue-600 px-4 py-2 text-center text-white"><b className="block text-lg">{stay.nights}</b><span className="text-[9px] font-black uppercase">noites</span></div>}</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><Detail label="Check-in" value={fullDate(stay?.checkinValue)} /><Detail label="Check-out" value={fullDate(stay?.checkoutValue)} /></div>
              <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} disabled={reservationBusy} className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-slate-700">
                  <option value="">Trocar para outro quarto...</option>{availableDestinations.map(room => <option key={room.id} value={room.id}>Quarto {room.numero} · {room.nome || ''}</option>)}
                </select>
                <button type="button" disabled={!transferTarget || reservationBusy} onClick={() => transferTarget && onTransfer(reservation, transferTarget)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 text-xs font-black text-blue-700 disabled:opacity-50"><ArrowRightLeft className="h-4 w-4" />Trocar quarto</button>
                <button type="button" disabled={reservationBusy} onClick={() => checkedIn ? onCheckout(reservation) : onCheckin(reservation)} className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white disabled:opacity-50 ${checkedIn ? 'bg-orange-600' : 'bg-blue-600'}`}>{checkedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{checkedIn ? 'Check-out' : 'Check-in'}</button>
              </div>
            </section> : <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">Nenhuma reserva ativa associada a este card. Ao criar uma reserva para este quarto, o hóspede aparecerá aqui automaticamente.</section>}

            <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Status" value={column?.nome || selectedRoom.status} /><Detail label="Tipo" value={roomType?.nome || selectedRoom.tipo_quarto_id} /><Detail label="Andar" value={`${selectedRoom.andar}º andar`} /><Detail label="Capacidade" value={`${selectedRoom.capacidade} hóspede(s)`} />
              <Detail label="Diária" value={money(selectedRoom.valor_diaria ?? selectedRoom.preco_diaria)} /><Detail label="Tamanho" value={selectedRoom.tamanho_m2 ? `${selectedRoom.tamanho_m2} m²` : 'Não informado'} /><Detail label="Vista" value={selectedRoom.vista} /><Detail label="Cama" value={selectedRoom.cama} />
              <Detail label="Governança" value={selectedRoom.status_governanca || selectedRoom.status_housekeeping} /><Detail label="Responsável limpeza" value={selectedRoom.responsavel_limpeza} /><Detail label="Última limpeza" value={fullDate(selectedRoom.ultima_limpeza)} /><Detail label="Bateria fechadura" value={typeof selectedRoom.fechadura_bateria === 'number' ? `${selectedRoom.fechadura_bateria}%` : 'Não informado'} />
              <Detail label="PIN" value={selectedRoom.fechadura_pin} /><Detail label="Fotos" value={String(selectedRoom.fotos?.length || 0)} /><Detail label="Cadastro" value={selectedRoom.ativo ? 'Ativo' : 'Inativo'} /><Detail label="Manutenção" value={selectedRoom.status_manutencao_motivo} />
            </section>

            {selectedRoom.descricao && <section className="rounded-2xl border border-slate-200 p-4"><p className="text-[9px] font-black uppercase text-slate-400">Descrição</p><p className="mt-2 text-xs leading-relaxed text-slate-700">{selectedRoom.descricao}</p></section>}
            {selectedRoom.comodidades?.length > 0 && <section className="rounded-2xl border border-slate-200 p-4"><p className="text-[9px] font-black uppercase text-slate-400">Comodidades</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedRoom.comodidades.map(item => <span key={item} className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">{item}</span>)}</div></section>}
            {selectedRoom.notas_internas && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[9px] font-black uppercase text-amber-600">Notas internas</p><p className="mt-2 text-xs text-amber-900">{selectedRoom.notas_internas}</p></section>}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => openEditor(selectedRoom)} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><Edit3 className="h-4 w-4" />Editar cadastro</button><button type="button" onClick={() => removeRoom(selectedRoom)} className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700"><Trash2 className="h-4 w-4" />Excluir quarto</button></div>
          </div>
        </div>
      </div>;
    })()}

    {editingRoom && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setEditingRoom(null); }}>
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
