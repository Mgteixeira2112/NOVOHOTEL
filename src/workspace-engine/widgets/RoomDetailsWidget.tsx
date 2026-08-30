import React, { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarDays, CircleUserRound, UsersRound } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { normalizeRoomOperationalStatus, ROOM_OPERATIONAL_STATUS } from '../../domain/roomOperationalStatus';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const reservationDates = (reservation?: { data_checkin?: string; checkin?: string; data_checkout?: string; checkout?: string } | null) => ({
  checkin: reservation?.data_checkin || reservation?.checkin || '',
  checkout: reservation?.data_checkout || reservation?.checkout || '',
});

export const RoomDetailsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { rooms, reservations, guests } = useHotel();
  const configuredRoomId = typeof widget.filters?.roomId === 'string' ? widget.filters.roomId : '';
  const availableRooms = useMemo(() => rooms.filter(room => room.ativo !== false), [rooms]);
  const [roomId, setRoomId] = useState(() => configuredRoomId || availableRooms[0]?.id || '');

  useEffect(() => {
    if (configuredRoomId && availableRooms.some(room => room.id === configuredRoomId)) {
      setRoomId(configuredRoomId);
      return;
    }
    if (!availableRooms.some(room => room.id === roomId)) setRoomId(availableRooms[0]?.id || '');
  }, [availableRooms, configuredRoomId, roomId]);

  const room = availableRooms.find(item => item.id === roomId) || null;
  const reservation = room
    ? reservations.find(item => item.quarto_id === room.id && item.status === 'checkin_realizado') || null
    : null;
  const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) || null : null;
  const dates = reservationDates(reservation);
  const operationalStatus = room
    ? normalizeRoomOperationalStatus(room.status_governanca || room.status_housekeeping || room.status)
    : 'outros';
  const statusMeta = ROOM_OPERATIONAL_STATUS[operationalStatus];

  return (
    <section className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><BedDouble className="h-4 w-4" /></span>
          <div><h2 className="text-sm font-black text-slate-900">{widget.title || 'Detalhes do quarto'}</h2><p className="text-[10px] text-slate-400">Dados oficiais de quarto, hospedagem e hóspede</p></div>
        </div>
        {!configuredRoomId && availableRooms.length > 0 && (
          <select value={roomId} onChange={event => setRoomId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700">
            {availableRooms.slice().sort((a, b) => a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true })).map(item => <option key={item.id} value={item.id}>Quarto {item.numero}</option>)}
          </select>
        )}
      </div>

      {!room && <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">Nenhum quarto ativo disponível para exibição.</div>}

      {room && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
            <div><p className="text-[9px] font-black uppercase text-slate-400">Quarto</p><strong className="text-lg text-slate-900">{room.numero}</strong><span className="ml-2 text-[10px] text-slate-500">Andar {room.andar} · capacidade {room.capacidade}</span></div>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-3"><p className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><CircleUserRound className="h-3 w-3" /> Hóspede atual</p><strong className="mt-1 block text-xs text-slate-900">{guest?.nome || 'Sem hóspede hospedado'}</strong>{guest && <span className="text-[10px] text-slate-500">{guest.telefone || guest.email || guest.documento || 'Cadastro sem contato informado'}</span>}</div>
            <div className="rounded-2xl border border-slate-100 p-3"><p className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><CalendarDays className="h-3 w-3" /> Hospedagem</p><strong className="mt-1 block text-xs text-slate-900">{reservation?.codigo || (reservation ? reservation.id : 'Sem hospedagem ativa')}</strong>{reservation && <span className="text-[10px] text-slate-500">{dates.checkin || '—'} → {dates.checkout || '—'}</span>}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Governança</p><strong className="mt-1 block text-[11px] text-slate-800">{room.status_governanca || room.status_housekeeping || 'Sem status específico'}</strong></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400"><UsersRound className="h-3 w-3" /> Informações</p><strong className="mt-1 block text-[11px] text-slate-800">{room.nome || room.descricao || 'Sem descrição adicional'}</strong>{room.status_manutencao_motivo && <span className="mt-1 block text-[10px] text-rose-600">Manutenção: {room.status_manutencao_motivo}</span>}</div>
          </div>
        </div>
      )}
    </section>
  );
};
