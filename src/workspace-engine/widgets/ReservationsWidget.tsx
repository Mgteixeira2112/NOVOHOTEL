import React, { useMemo, useState } from 'react';
import { BedDouble, CalendarDays, Link2, Plus, Search, Unlink, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Quarto, Reserva } from '../../types';
import { receptionGuestStayService } from '../../modules/recepcao/receptionGuestStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const activeReservationStatuses = ['pendente', 'confirmada', 'checkin_realizado'];

type ReservationFilter = 'all' | 'unassigned' | 'upcoming' | 'active' | 'finished' | 'cancelled';

const dateValue = (reservation: Reserva, kind: 'checkin' | 'checkout') =>
  kind === 'checkin' ? reservation.data_checkin || reservation.checkin || '' : reservation.data_checkout || reservation.checkout || '';

const dateBR = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};

const statusLabel: Record<string, string> = {
  pendente: 'Pendente', confirmada: 'Confirmada', checkin_realizado: 'Hospedado', checkout_concluido: 'Finalizada', cancelada: 'Cancelada',
};

const overlaps = (candidate: Reserva, target: Reserva) => {
  const candidateIn = dateValue(candidate, 'checkin');
  const candidateOut = dateValue(candidate, 'checkout');
  const targetIn = dateValue(target, 'checkin');
  const targetOut = dateValue(target, 'checkout');
  return !!candidateIn && !!candidateOut && !!targetIn && !!targetOut && candidateIn < targetOut && candidateOut > targetIn;
};

export const ReservationsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { guests, rooms, reservations, currentUser, syncFromSupabase } = useHotel();
  const [filter, setFilter] = useState<ReservationFilter>('all');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [bindingReservationId, setBindingReservationId] = useState<string | null>(null);
  const [bindingRoomId, setBindingRoomId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ guestId: '', checkin: today(), checkout: tomorrow(), guests: 1 });

  const bindingReservation = bindingReservationId ? reservations.find(item => item.id === bindingReservationId) || null : null;

  const counts = useMemo(() => ({
    all: reservations.length,
    unassigned: reservations.filter(item => ['pendente', 'confirmada'].includes(item.status) && !item.quarto_id).length,
    upcoming: reservations.filter(item => ['pendente', 'confirmada'].includes(item.status)).length,
    active: reservations.filter(item => item.status === 'checkin_realizado').length,
    finished: reservations.filter(item => item.status === 'checkout_concluido').length,
    cancelled: reservations.filter(item => item.status === 'cancelada').length,
  }), [reservations]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return [...reservations]
      .filter(item => {
        if (filter === 'unassigned') return ['pendente', 'confirmada'].includes(item.status) && !item.quarto_id;
        if (filter === 'upcoming') return ['pendente', 'confirmada'].includes(item.status);
        if (filter === 'active') return item.status === 'checkin_realizado';
        if (filter === 'finished') return item.status === 'checkout_concluido';
        if (filter === 'cancelled') return item.status === 'cancelada';
        return true;
      })
      .filter(item => {
        if (!q) return true;
        const guest = guests.find(g => g.id === item.hospede_id);
        const room = rooms.find(r => r.id === item.quarto_id);
        return [item.codigo, item.codigo_reserva, guest?.nome, room?.numero]
          .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q);
      })
      .sort((a, b) => dateValue(a, 'checkin').localeCompare(dateValue(b, 'checkin')));
  }, [reservations, guests, rooms, filter, query]);

  const compatibleRooms = useMemo(() => {
    if (!bindingReservation) return [];
    return rooms.filter(room => {
      if (room.ativo === false || Number(room.capacidade || 1) < Number(bindingReservation.quantidade_hospedes || 1)) return false;
      return !reservations.some(other => other.id !== bindingReservation.id && other.quarto_id === room.id
        && activeReservationStatuses.includes(other.status) && overlaps(other, bindingReservation));
    });
  }, [bindingReservation, rooms, reservations]);

  const sync = async () => {
    const result = await syncFromSupabase();
    if (!result.success) throw new Error(result.message || 'Operação concluída, mas os dados não puderam ser atualizados.');
  };

  const createReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.checkout <= form.checkin) { setError('A saída deve ser posterior à entrada.'); return; }
    setSaving(true); setError('');
    try {
      await receptionGuestStayService.createUnassignedReservation({ ...form, actorUserId: currentUser?.id });
      await sync();
      setCreateOpen(false);
      setForm({ guestId: '', checkin: today(), checkout: tomorrow(), guests: 1 });
      setFilter('unassigned');
    } catch (e: any) { setError(e?.message || 'Não foi possível criar a reserva.'); }
    finally { setSaving(false); }
  };

  const openBinding = (reservation: Reserva) => {
    setBindingReservationId(reservation.id);
    setBindingRoomId(reservation.quarto_id || '');
    setError('');
  };

  const bindRoom = async () => {
    if (!bindingReservation || !bindingRoomId) { setError('Selecione um quarto.'); return; }
    setSaving(true); setError('');
    try {
      await receptionGuestStayService.bindReservationToRoom({ reservationId: bindingReservation.id, roomId: bindingRoomId, actorUserId: currentUser?.id });
      await sync();
      setBindingReservationId(null);
    } catch (e: any) { setError(e?.message || 'Não foi possível vincular o quarto.'); }
    finally { setSaving(false); }
  };

  const unbindRoom = async () => {
    if (!bindingReservation?.quarto_id) return;
    if (!window.confirm('Desvincular o quarto desta reserva? O histórico da reserva será preservado.')) return;
    setSaving(true); setError('');
    try {
      await receptionGuestStayService.unbindReservationFromRoom(bindingReservation.id, currentUser?.id);
      await sync();
      setBindingReservationId(null);
    } catch (e: any) { setError(e?.message || 'Não foi possível desvincular o quarto.'); }
    finally { setSaving(false); }
  };

  const filterButton = (key: ReservationFilter, label: string, count: number) => <button type="button" onClick={() => setFilter(key)}
    className={`h-9 rounded-xl border px-3 text-[10px] font-black ${filter === key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{label} <b>{count}</b></button>;

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Recepção · Reservas</p><h2 className="text-sm font-black text-slate-950">{widget.title || 'Controle de Reservas'}</h2><p className="mt-1 text-[10px] text-slate-400">A reserva existe separadamente; o quarto é vinculado somente quando necessário.</p></div>
      <button type="button" onClick={() => { setCreateOpen(true); setError(''); }} className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3 text-[10px] font-black text-white"><Plus className="h-4 w-4"/>Nova reserva</button>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">{filterButton('all', 'Todas', counts.all)}{filterButton('unassigned', 'Sem quarto', counts.unassigned)}{filterButton('upcoming', 'Próximas', counts.upcoming)}{filterButton('active', 'Hospedadas', counts.active)}{filterButton('finished', 'Finalizadas', counts.finished)}{filterButton('cancelled', 'Canceladas', counts.cancelled)}</div>
    <label className="relative mt-3 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar código, hóspede ou quarto" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs"/></label>

    <div className="mt-3 space-y-2">
      {visible.map(reservation => {
        const guest = guests.find(item => item.id === reservation.hospede_id);
        const room = rooms.find(item => item.id === reservation.quarto_id);
        const canManageRoom = ['pendente', 'confirmada'].includes(reservation.status);
        const historicalRoom = ['checkout_concluido', 'cancelada'].includes(reservation.status);
        return <article key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><strong className="text-[11px] text-slate-950">{reservation.codigo || reservation.codigo_reserva || reservation.id}</strong><span className="rounded-lg bg-white px-2 py-1 text-[8px] font-black uppercase text-slate-600">{statusLabel[reservation.status] || reservation.status}</span>{!reservation.quarto_id && canManageRoom && <span className="rounded-lg bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-700">SEM QUARTO</span>}</div>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-700">{guest?.nome || 'Hóspede não identificado'}</p>
              <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500"><CalendarDays className="h-3 w-3"/>{dateBR(dateValue(reservation, 'checkin'))} → {dateBR(dateValue(reservation, 'checkout'))} · {reservation.quantidade_hospedes || 1} hóspede(s)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {reservation.quarto_id && <span className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[9px] font-black ${historicalRoom ? 'border-slate-200 bg-white text-slate-500' : 'border-blue-100 bg-blue-50 text-blue-700'}`}><BedDouble className="h-3.5 w-3.5"/>{historicalRoom ? 'Quarto da hospedagem' : 'Quarto vinculado'}: {room?.numero || reservation.quarto_id}</span>}
              {canManageRoom && <button type="button" onClick={() => openBinding(reservation)} className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[9px] font-black text-white"><Link2 className="h-3.5 w-3.5"/>{reservation.quarto_id ? 'Gerenciar quarto' : 'Vincular quarto'}</button>}
            </div>
          </div>
        </article>;
      })}
      {visible.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Nenhuma reserva nesta categoria.</p>}
    </div>
    {error && !createOpen && !bindingReservation && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}

    {createOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 p-4"><form onSubmit={createReservation} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase text-blue-600">Reserva independente</p><h3 className="text-lg font-black">Nova reserva</h3><p className="text-[10px] text-slate-400">O quarto será escolhido depois pelo menu da reserva.</p></div><button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400"><X className="h-4 w-4"/></button></div><div className="mt-4 grid gap-3"><label className="text-[9px] font-black text-slate-500">Hóspede *<select required value={form.guestId} onChange={e => setForm(cur => ({ ...cur, guestId: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option value="">Selecionar hóspede</option>{guests.map(g => <option key={g.id} value={g.id}>{g.nome} · {g.documento || g.cpf || 'sem documento'}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-[9px] font-black text-slate-500">Entrada *<input type="date" required value={form.checkin} onChange={e => setForm(cur => ({ ...cur, checkin: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label><label className="text-[9px] font-black text-slate-500">Saída *<input type="date" required value={form.checkout} onChange={e => setForm(cur => ({ ...cur, checkout: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label></div><label className="text-[9px] font-black text-slate-500">Quantidade de hóspedes<input type="number" min={1} required value={form.guests} onChange={e => setForm(cur => ({ ...cur, guests: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label></div>{error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black">Cancelar</button><button disabled={saving} className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Criando...' : 'Criar reserva sem quarto'}</button></div></form></div>}

    {bindingReservation && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase text-blue-600">Vínculo operacional</p><h3 className="text-lg font-black">Quarto da reserva</h3><p className="text-[10px] text-slate-400">{bindingReservation.codigo || bindingReservation.id} · {dateBR(dateValue(bindingReservation, 'checkin'))} → {dateBR(dateValue(bindingReservation, 'checkout'))}</p></div><button type="button" disabled={saving} onClick={() => setBindingReservationId(null)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400"><X className="h-4 w-4"/></button></div><label className="mt-4 block text-[9px] font-black text-slate-500">Quarto compatível<select value={bindingRoomId} onChange={e => setBindingRoomId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option value="">Selecionar quarto</option>{compatibleRooms.map((room: Quarto) => <option key={room.id} value={room.id}>Quarto {room.numero} · capacidade {room.capacidade}</option>)}</select></label><p className="mt-2 text-[9px] text-slate-400">A lista exclui quartos inativos, com capacidade insuficiente ou conflito de período. O banco valida novamente antes de salvar.</p>{error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-between gap-2"><div>{bindingReservation.quarto_id && <button type="button" disabled={saving} onClick={unbindRoom} className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-[10px] font-black text-rose-700 disabled:opacity-50"><Unlink className="h-4 w-4"/>Desvincular</button>}</div><div className="flex gap-2"><button type="button" disabled={saving} onClick={() => setBindingReservationId(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black">Cancelar</button><button type="button" disabled={saving || !bindingRoomId} onClick={bindRoom} className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Salvando...' : bindingReservation.quarto_id ? 'Salvar quarto' : 'Vincular quarto'}</button></div></div></div></div>}
  </div>;
};
