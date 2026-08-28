import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { supabase } from '../../lib/supabase';
import { Reserva } from '../../types';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

type RoomBlock = {
  id: string;
  quarto_id: string | null;
  data_inicio: string;
  data_fim: string;
  motivo: string;
};

const DAY_MS = 86400000;
const ACTIVE_RESERVATION_STATUSES = ['pendente', 'confirmada', 'checkin_realizado'];

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (value: string, days: number) => isoDate(new Date(`${value}T12:00:00Z`).getTime() + days * DAY_MS > 0
  ? new Date(new Date(`${value}T12:00:00Z`).getTime() + days * DAY_MS)
  : new Date(`${value}T12:00:00Z`));
const dateBR = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
const reservationStart = (reservation: Reserva) => reservation.data_checkin || reservation.checkin || '';
const reservationEnd = (reservation: Reserva) => reservation.data_checkout || reservation.checkout || '';
const containsDay = (start: string, end: string, day: string) => !!start && !!end && start <= day && day < end;

export const OccupancyCalendarWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { rooms, reservations, guests, syncFromSupabase } = useHotel();
  const [startDate, setStartDate] = useState(() => isoDate(new Date()));
  const [daysVisible, setDaysVisible] = useState(14);
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => Array.from({ length: daysVisible }, (_, index) => addDays(startDate, index)), [startDate, daysVisible]);

  const loadBlocks = async () => {
    setLoadingBlocks(true);
    setError('');
    const rangeEnd = addDays(startDate, daysVisible);
    const { data, error: queryError } = await supabase
      .from('bloqueios')
      .select('id,quarto_id,data_inicio,data_fim,motivo')
      .lt('data_inicio', rangeEnd)
      .gt('data_fim', startDate);
    if (queryError) setError(queryError.message || 'Não foi possível carregar os bloqueios do período.');
    else setBlocks((data || []) as RoomBlock[]);
    setLoadingBlocks(false);
  };

  useEffect(() => { void loadBlocks(); }, [startDate, daysVisible]);

  const orderedRooms = useMemo(() => [...rooms].filter(room => room.ativo !== false)
    .sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'pt-BR', { numeric: true })), [rooms]);

  const occupancy = useMemo(() => {
    const result = new Map<string, { reservation?: Reserva; block?: RoomBlock }>();
    for (const room of orderedRooms) {
      for (const day of days) {
        const reservation = reservations.find(item => item.quarto_id === room.id
          && ACTIVE_RESERVATION_STATUSES.includes(item.status)
          && containsDay(reservationStart(item), reservationEnd(item), day));
        const block = blocks.find(item => item.quarto_id === room.id && containsDay(item.data_inicio, item.data_fim, day));
        result.set(`${room.id}:${day}`, { reservation, block });
      }
    }
    return result;
  }, [orderedRooms, days, reservations, blocks]);

  const occupiedCells = [...occupancy.values()].filter(item => item.reservation).length;
  const blockedCells = [...occupancy.values()].filter(item => !item.reservation && item.block).length;
  const totalCells = Math.max(1, orderedRooms.length * days.length);
  const occupancyRate = Math.round((occupiedCells / totalCells) * 100);

  const refreshAll = async () => {
    setError('');
    const sync = await syncFromSupabase();
    if (!sync.success) setError(sync.message || 'Não foi possível atualizar os dados do hotel.');
    await loadBlocks();
  };

  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Recepção · Inventário</p>
        <h2 className="text-sm font-black text-slate-950">{widget.title || 'Calendário de ocupação'}</h2>
        <p className="mt-1 text-[10px] text-slate-400">Reservas e hospedagens bloqueiam o período [check-in, check-out). Bloqueios operacionais aparecem no mesmo calendário.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStartDate(addDays(startDate, -daysVisible))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200"><ChevronLeft className="h-4 w-4"/></button>
        <button type="button" onClick={() => setStartDate(isoDate(new Date()))} className="h-9 rounded-xl border border-slate-200 px-3 text-[10px] font-black">Hoje</button>
        <button type="button" onClick={() => setStartDate(addDays(startDate, daysVisible))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200"><ChevronRight className="h-4 w-4"/></button>
        <select value={daysVisible} onChange={event => setDaysVisible(Number(event.target.value))} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black">
          <option value={7}>7 dias</option><option value={14}>14 dias</option><option value={30}>30 dias</option>
        </select>
        <button type="button" onClick={() => void refreshAll()} className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white"><RefreshCw className={`h-3.5 w-3.5 ${loadingBlocks ? 'animate-spin' : ''}`}/>Atualizar</button>
      </div>
    </div>

    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">Ocupação no período</p><strong className="mt-1 block text-xl text-slate-950">{occupancyRate}%</strong></div>
      <div className="rounded-2xl bg-blue-50 p-3"><p className="text-[8px] font-black uppercase text-blue-500">Diárias reservadas</p><strong className="mt-1 block text-xl text-blue-900">{occupiedCells}</strong></div>
      <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[8px] font-black uppercase text-amber-500">Diárias bloqueadas</p><strong className="mt-1 block text-xl text-amber-900">{blockedCells}</strong></div>
    </div>

    {error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}

    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
      <div className="min-w-max">
        <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `180px repeat(${days.length}, 54px)` }}>
          <div className="sticky left-0 z-20 flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-black uppercase text-slate-500"><CalendarDays className="h-3.5 w-3.5"/>Quarto</div>
          {days.map(day => <div key={day} className="border-r border-slate-100 px-1 py-2 text-center last:border-r-0"><div className="text-[8px] font-black uppercase text-slate-400">{weekday(day)}</div><div className="mt-0.5 text-[9px] font-black text-slate-700">{dateBR(day)}</div></div>)}
        </div>

        {orderedRooms.map(room => <div key={room.id} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: `180px repeat(${days.length}, 54px)` }}>
          <div className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2">
            <div className="text-[10px] font-black text-slate-950">Quarto {room.numero}</div>
            <div className="mt-0.5 max-w-[155px] truncate text-[8px] text-slate-400">{room.cama || room.nome || 'Sem configuração de cama'}</div>
          </div>
          {days.map(day => {
            const cell = occupancy.get(`${room.id}:${day}`);
            const reservation = cell?.reservation;
            const block = cell?.block;
            const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : undefined;
            const label = reservation
              ? `${reservation.codigo || reservation.codigo_reserva || 'Reserva'} · ${guest?.nome || 'Hóspede'} · ${reservation.status}`
              : block ? `Bloqueado · ${block.motivo}` : 'Disponível';
            const className = reservation?.status === 'checkin_realizado'
              ? 'bg-emerald-100 text-emerald-900'
              : reservation ? 'bg-blue-100 text-blue-900'
                : block ? 'bg-amber-100 text-amber-900' : 'bg-white text-slate-300';
            return <div key={day} title={label} className={`grid min-h-[44px] place-items-center border-r border-slate-100 px-1 text-center last:border-r-0 ${className}`}>
              <span className="max-w-[48px] truncate text-[8px] font-black">{reservation ? (guest?.nome?.split(' ')[0] || 'RES') : block ? 'BLOQ' : '·'}</span>
            </div>;
          })}
        </div>)}
        {orderedRooms.length === 0 && <div className="p-8 text-center text-xs text-slate-400">Nenhum quarto ativo encontrado.</div>}
      </div>
    </div>

    <div className="mt-3 flex flex-wrap gap-3 text-[8px] font-bold text-slate-500">
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-blue-100"/>Reserva</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-emerald-100"/>Hospedado</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-amber-100"/>Bloqueado</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded border border-slate-200 bg-white"/>Disponível</span>
    </div>
  </section>;
};
