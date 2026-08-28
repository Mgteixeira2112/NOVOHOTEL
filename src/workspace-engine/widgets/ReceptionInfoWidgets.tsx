import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, LogIn, LogOut } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const dateKey = (value?: string | null) => String(value || '').slice(0, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);
const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const ReservationList: React.FC<WorkspaceWidgetRuntimeContext & { mode: 'arrivals' | 'departures' }> = ({ widget, mode }) => {
  const { reservations, guests, rooms, currentUser, syncFromSupabase } = useHotel();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const today = todayKey();
  const items = useMemo(() => reservations.filter(reservation => {
    const value = mode === 'arrivals' ? reservation.data_checkin || reservation.checkin : reservation.data_checkout || reservation.checkout;
    if (dateKey(value) !== today || ['cancelada', 'checkout_concluido'].includes(reservation.status)) return false;
    return mode === 'arrivals' ? ['confirmada','pendente'].includes(reservation.status) : reservation.status === 'checkin_realizado';
  }), [reservations, mode, today]);
  const Icon = mode === 'arrivals' ? LogIn : LogOut;
  const execute = async (id: string) => {
    if (mode === 'departures' && !window.confirm('Confirmar check-out desta hospedagem?')) return;
    setBusy(id); setError('');
    try {
      if (mode === 'arrivals') await receptionStayService.checkin(id, currentUser?.id);
      else await receptionStayService.checkout(id, currentUser?.id);
      await syncFromSupabase();
    } catch (e: any) { setError(e?.message || `Não foi possível realizar o ${mode === 'arrivals' ? 'check-in' : 'check-out'}.`); }
    finally { setBusy(null); }
  };
  return <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-700"><Icon className="h-4 w-4" /></span><div><h2 className="text-xs font-black">{widget.title || (mode === 'arrivals' ? 'Chegadas' : 'Saídas')}</h2><p className="text-[9px] text-slate-400">Hoje</p></div></div><strong className="text-xl font-black">{items.length}</strong></div><div className="mt-3 space-y-2">{items.slice(0, 6).map(reservation => { const guest = guests.find(item => item.id === reservation.hospede_id); const room = rooms.find(item => item.id === reservation.quarto_id); return <div key={reservation.id} className="rounded-xl bg-slate-50 p-2.5"><div className="flex items-center justify-between gap-2"><strong className="truncate text-[10px]">{guest?.nome || 'Hóspede não identificado'}</strong><span className="text-[9px] font-bold text-amber-700">Q. {room?.numero || '—'}</span></div><p className="mt-1 text-[9px] text-slate-400">{reservation.codigo || reservation.id} · {reservation.status}</p><button disabled={busy === reservation.id} onClick={() => execute(reservation.id)} className={`mt-2 flex h-7 w-full items-center justify-center gap-1 rounded-lg text-[9px] font-black disabled:opacity-50 ${mode === 'arrivals' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><Icon className="h-3 w-3" />{mode === 'arrivals' ? 'CHECK-IN' : 'CHECK-OUT'}</button></div>; })}{items.length === 0 && <p className="py-5 text-center text-[10px] text-slate-400">Nenhum registro previsto.</p>}</div>{error && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[9px] font-bold text-rose-700">{error}</p>}</div>;
};

export const ArrivalsWidget: React.FC<WorkspaceWidgetRuntimeContext> = props => <ReservationList {...props} mode="arrivals" />;
export const DeparturesWidget: React.FC<WorkspaceWidgetRuntimeContext> = props => <ReservationList {...props} mode="departures" />;

export const ReceptionAlertsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { rooms } = useHotel();
  const alerts = rooms.filter(room => ['manutencao','sujo','limpeza','vistoria','bloqueado'].includes(normalize(room.status)) || ['sujo','em_limpeza','aguardando_vistoria'].includes(normalize(room.status_governanca || room.status_housekeeping)));
  return <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-700"><AlertTriangle className="h-4 w-4" /></span><div><h2 className="text-xs font-black">{widget.title || 'Alertas'}</h2><p className="text-[9px] text-slate-400">Quartos que exigem atenção</p></div></div><strong className="text-xl font-black">{alerts.length}</strong></div><div className="mt-3 flex flex-wrap gap-2">{alerts.slice(0, 10).map(room => <span key={room.id} className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-700">Q. {room.numero} · {room.status}</span>)}{alerts.length === 0 && <span className="text-[10px] text-slate-400">Operação sem alertas de quarto.</span>}</div></div>;
};

export const ReceptionSummaryWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { rooms, reservations } = useHotel();
  const occupied = reservations.filter(item => item.status === 'checkin_realizado').length;
  const available = rooms.filter(item => normalize(item.status) === 'disponivel').length;
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-600" /><h2 className="text-xs font-black">{widget.title || 'Resumo operacional'}</h2></div><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3"><strong className="text-lg font-black">{rooms.length}</strong><p className="text-[9px] text-slate-400">Quartos</p></div><div className="rounded-xl bg-emerald-50 p-3"><strong className="text-lg font-black text-emerald-700">{available}</strong><p className="text-[9px] text-slate-400">Disponíveis</p></div><div className="rounded-xl bg-blue-50 p-3"><strong className="text-lg font-black text-blue-700">{occupied}</strong><p className="text-[9px] text-slate-400">Hospedados</p></div></div></div>;
};
