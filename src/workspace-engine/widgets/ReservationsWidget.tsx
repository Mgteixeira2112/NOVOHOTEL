import React, { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarDays, Plus, Search, Users, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Reserva } from '../../types';
import { AvailableRoom, receptionGuestStayService } from '../../modules/recepcao/receptionGuestStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { localDateKey, tomorrowLocalDateKey } from './localDate';

type ReservationFilter = 'all' | 'upcoming' | 'active' | 'finished' | 'cancelled';

type ReservationForm = {
  guestId: string;
  checkin: string;
  checkout: string;
  guests: number;
  bedScheme: string;
  roomId: string;
};

const emptyForm = (): ReservationForm => ({
  guestId: '',
  checkin: localDateKey(),
  checkout: tomorrowLocalDateKey(),
  guests: 1,
  bedScheme: '',
  roomId: '',
});

const dateValue = (reservation: Reserva, kind: 'checkin' | 'checkout') =>
  kind === 'checkin'
    ? reservation.data_checkin || reservation.checkin || ''
    : reservation.data_checkout || reservation.checkout || '';

const dateBR = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  checkin_realizado: 'Hospedado',
  checkout_concluido: 'Finalizada',
  cancelada: 'Cancelada',
};

export const ReservationsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { guests, rooms, reservations, currentUser, syncFromSupabase } = useHotel();
  const [filter, setFilter] = useState<ReservationFilter>('all');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [form, setForm] = useState<ReservationForm>(emptyForm);

  const counts = useMemo(() => ({
    all: reservations.length,
    upcoming: reservations.filter(item => ['pendente', 'confirmada'].includes(item.status)).length,
    active: reservations.filter(item => item.status === 'checkin_realizado').length,
    finished: reservations.filter(item => item.status === 'checkout_concluido').length,
    cancelled: reservations.filter(item => item.status === 'cancelada').length,
  }), [reservations]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return [...reservations]
      .filter(item => {
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
        return [item.codigo, item.codigo_reserva, guest?.nome, room?.numero, room?.cama]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(q);
      })
      .sort((a, b) => dateValue(a, 'checkin').localeCompare(dateValue(b, 'checkin')));
  }, [reservations, guests, rooms, filter, query]);

  const bedSchemes = useMemo(() => Array.from(new Set(
    rooms
      .filter(room => room.ativo !== false && Number(room.capacidade || 0) >= form.guests && room.cama?.trim())
      .map(room => room.cama!.trim()),
  )).sort((a, b) => a.localeCompare(b, 'pt-BR')), [rooms, form.guests]);

  useEffect(() => {
    if (!createOpen || !form.bedScheme || !form.checkin || !form.checkout || form.checkout <= form.checkin || form.guests < 1) {
      setAvailableRooms([]);
      setLoadingAvailability(false);
      setAvailabilityError('');
      return;
    }

    let cancelled = false;
    setLoadingAvailability(true);
    setAvailabilityError('');

    const timer = window.setTimeout(async () => {
      try {
        const data = await receptionGuestStayService.findAvailableRooms({
          checkin: form.checkin,
          checkout: form.checkout,
          guests: form.guests,
          bedScheme: form.bedScheme,
        });
        if (!cancelled) setAvailableRooms(data);
      } catch (e: any) {
        if (!cancelled) {
          setAvailableRooms([]);
          setAvailabilityError(e?.message || 'Não foi possível consultar a disponibilidade do período.');
        }
      } finally {
        if (!cancelled) setLoadingAvailability(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [createOpen, form.bedScheme, form.checkin, form.checkout, form.guests]);

  const updateForm = (patch: Partial<ReservationForm>, resetRoom = false) => {
    setForm(current => ({ ...current, ...patch, ...(resetRoom ? { roomId: '' } : {}) }));
  };

  const createReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.checkout <= form.checkin) {
      setError('A saída deve ser posterior à entrada.');
      return;
    }
    if (!form.bedScheme) {
      setError('Selecione o esquema de camas necessário para esta reserva.');
      return;
    }
    if (!form.roomId || !availableRooms.some(room => room.room_id === form.roomId)) {
      setError('Selecione um quarto compatível e disponível retornado pelo motor de disponibilidade.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await receptionGuestStayService.createReservationWithRoom({
        guestId: form.guestId,
        roomId: form.roomId,
        checkin: form.checkin,
        checkout: form.checkout,
        guests: form.guests,
        bedScheme: form.bedScheme,
        actorUserId: currentUser?.id,
      });
      const result = await syncFromSupabase();
      if (!result.success) throw new Error(result.message || 'Reserva criada, mas os dados não puderam ser atualizados.');
      setCreateOpen(false);
      setForm(emptyForm());
      setAvailableRooms([]);
      setFilter('upcoming');
    } catch (e: any) {
      setError(e?.message || 'Não foi possível criar a reserva.');
      try {
        const refreshed = await receptionGuestStayService.findAvailableRooms({
          checkin: form.checkin,
          checkout: form.checkout,
          guests: form.guests,
          bedScheme: form.bedScheme,
        });
        setAvailableRooms(refreshed);
        if (!refreshed.some(room => room.room_id === form.roomId)) updateForm({}, true);
      } catch {
        // A mensagem da criação é prioritária; a próxima alteração de formulário refaz a consulta.
      }
    } finally {
      setSaving(false);
    }
  };

  const filterButton = (key: ReservationFilter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`h-9 rounded-xl border px-3 text-[10px] font-black ${filter === key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
    >
      {label} <b>{count}</b>
    </button>
  );

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Recepção · Reservas</p>
        <h2 className="text-sm font-black text-slate-950">{widget.title || 'Controle de Reservas'}</h2>
        <p className="mt-1 text-[10px] text-slate-400">A disponibilidade vem do Supabase e considera período, reservas ativas, bloqueios, capacidade e camas.</p>
      </div>
      <button type="button" onClick={() => { setCreateOpen(true); setError(''); setAvailabilityError(''); setForm(emptyForm()); }} className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3 text-[10px] font-black text-white">
        <Plus className="h-4 w-4"/>Nova reserva
      </button>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {filterButton('all', 'Todas', counts.all)}
      {filterButton('upcoming', 'Próximas', counts.upcoming)}
      {filterButton('active', 'Hospedadas', counts.active)}
      {filterButton('finished', 'Finalizadas', counts.finished)}
      {filterButton('cancelled', 'Canceladas', counts.cancelled)}
    </div>

    <label className="relative mt-3 block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar código, hóspede, quarto ou cama" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs"/>
    </label>

    <div className="mt-3 space-y-2">
      {visible.map(reservation => {
        const guest = guests.find(item => item.id === reservation.hospede_id);
        const room = rooms.find(item => item.id === reservation.quarto_id);
        const historicalRoom = ['checkout_concluido', 'cancelada'].includes(reservation.status);
        return <article key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-[11px] text-slate-950">{reservation.codigo || reservation.codigo_reserva || reservation.id}</strong>
                <span className="rounded-lg bg-white px-2 py-1 text-[8px] font-black uppercase text-slate-600">{statusLabel[reservation.status] || reservation.status}</span>
              </div>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-700">{guest?.nome || 'Hóspede não identificado'}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                <CalendarDays className="h-3 w-3"/>{dateBR(dateValue(reservation, 'checkin'))} → {dateBR(dateValue(reservation, 'checkout'))}
                <span>·</span><Users className="h-3 w-3"/>{reservation.quantidade_hospedes || 1} hóspede(s)
              </p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${historicalRoom ? 'border-slate-200 bg-white text-slate-500' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
              <p className="flex items-center gap-1.5 text-[9px] font-black"><BedDouble className="h-3.5 w-3.5"/>{historicalRoom ? 'Quarto da hospedagem' : 'Quarto reservado'}: {room?.numero || reservation.quarto_id || '—'}</p>
              <p className="mt-0.5 text-[8px] font-bold">{room?.cama || 'Esquema de camas não informado'}</p>
            </div>
          </div>
        </article>;
      })}
      {visible.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Nenhuma reserva nesta categoria.</p>}
    </div>

    {createOpen && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 p-4">
      <form onSubmit={createReservation} className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase text-blue-600">Reserva com inventário protegido</p>
            <h3 className="text-lg font-black">Nova reserva</h3>
            <p className="text-[10px] text-slate-400">O quarto só aparece se estiver livre no período e compatível com a composição da hospedagem.</p>
          </div>
          <button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400"><X className="h-4 w-4"/></button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-[9px] font-black text-slate-500">Hóspede *
            <select required value={form.guestId} onChange={e => updateForm({ guestId: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs">
              <option value="">Selecionar hóspede</option>
              {guests.map(g => <option key={g.id} value={g.id}>{g.nome} · {g.documento || g.cpf || 'sem documento'}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[9px] font-black text-slate-500">Entrada *
              <input type="date" required value={form.checkin} onChange={e => updateForm({ checkin: e.target.value }, true)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/>
            </label>
            <label className="text-[9px] font-black text-slate-500">Saída *
              <input type="date" required value={form.checkout} onChange={e => updateForm({ checkout: e.target.value }, true)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/>
            </label>
          </div>

          <label className="text-[9px] font-black text-slate-500">Quantidade de hóspedes *
            <input type="number" min={1} required value={form.guests} onChange={e => updateForm({ guests: Math.max(1, Number(e.target.value)), bedScheme: '' }, true)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/>
          </label>

          <label className="text-[9px] font-black text-slate-500">Esquema de camas *
            <select required value={form.bedScheme} onChange={e => updateForm({ bedScheme: e.target.value }, true)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs">
              <option value="">Selecionar esquema</option>
              {bedSchemes.map(scheme => <option key={scheme} value={scheme}>{scheme}</option>)}
            </select>
          </label>

          <label className="text-[9px] font-black text-slate-500">Quarto compatível e disponível *
            <select required disabled={!form.bedScheme || loadingAvailability || availableRooms.length === 0} value={form.roomId} onChange={e => updateForm({ roomId: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs disabled:bg-slate-100">
              <option value="">{!form.bedScheme ? 'Escolha primeiro o esquema de camas' : loadingAvailability ? 'Consultando disponibilidade...' : availableRooms.length === 0 ? 'Nenhum quarto disponível para esta composição' : 'Selecionar quarto'}</option>
              {availableRooms.map(room => <option key={room.room_id} value={room.room_id}>Quarto {room.numero} · {room.cama || 'sem cama informada'} · capacidade {room.capacidade}</option>)}
            </select>
          </label>

          {form.bedScheme && !availabilityError && <p className={`rounded-xl p-2 text-[9px] font-bold ${loadingAvailability ? 'bg-slate-50 text-slate-500' : availableRooms.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {loadingAvailability
              ? 'Consultando reservas e bloqueios no Supabase...'
              : availableRooms.length > 0
                ? `${availableRooms.length} quarto(s) realmente disponível(is) para ${form.guests} hóspede(s), ${form.bedScheme} e o período informado.`
                : `Não há quarto livre que combine ${form.guests} hóspede(s), ${form.bedScheme} e o período informado.`}
          </p>}
          {availabilityError && <p className="rounded-xl bg-rose-50 p-2 text-[9px] font-bold text-rose-700">{availabilityError}</p>}
        </div>

        {error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black">Cancelar</button>
          <button disabled={saving || loadingAvailability || !form.roomId} className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Criando...' : 'Criar reserva'}</button>
        </div>
      </form>
    </div>}
  </div>;
};