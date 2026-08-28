import React, { useMemo, useState } from 'react';
import { BedDouble, CalendarDays, LogOut, Plus, Search, UserPlus, Users } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { receptionGuestStayService } from '../../modules/recepcao/receptionGuestStayService';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export const GuestsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { guests, syncFromSupabase } = useHotel();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', documento: '', email: '', telefone: '', dataNascimento: '', cidade: '', estado: '' });
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter(g => !q || [g.nome, g.documento, g.email, g.telefone].some(v => String(v || '').toLowerCase().includes(q)));
  }, [guests, query]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await receptionGuestStayService.createGuest(form);
      await syncFromSupabase();
      setOpen(false);
      setForm({ nome: '', documento: '', email: '', telefone: '', dataNascimento: '', cidade: '', estado: '' });
    } catch (e: any) { setError(e?.message || 'Não foi possível cadastrar o hóspede.'); }
    finally { setSaving(false); }
  };

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black">{widget.title || 'Hóspedes'}</h2><p className="text-[10px] text-slate-400">Cadastro central para reservas e hospedagens.</p></div><button onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white"><UserPlus className="h-4 w-4" />Novo hóspede</button></div>
    <label className="relative mt-3 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar nome, documento, e-mail ou telefone" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs"/></label>
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, 12).map(g => <div key={g.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-700"><Users className="h-4 w-4"/></span><div className="min-w-0"><strong className="block truncate text-[11px] text-slate-900">{g.nome}</strong><span className="text-[9px] text-slate-400">{g.documento}</span></div></div><p className="mt-2 truncate text-[9px] text-slate-500">{g.telefone} · {g.email}</p></div>)}{filtered.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nenhum hóspede encontrado.</p>}</div>
    {error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}
    {open && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/65 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase text-blue-600">Cadastro de hóspede</p><h3 className="text-lg font-black">Novo hóspede</h3></div><button type="button" onClick={() => setOpen(false)} className="text-slate-400">✕</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[
      ['nome','Nome completo','text'],['documento','CPF / Passaporte','text'],['email','E-mail','email'],['telefone','Telefone','text'],['dataNascimento','Nascimento','date'],['cidade','Cidade','text'],['estado','Estado','text']
    ].map(([key,label,type]) => <label key={key} className="text-[9px] font-black text-slate-500">{label}<input required={['nome','documento','email','telefone'].includes(key)} type={type} value={(form as any)[key]} onChange={e => setForm(cur => ({ ...cur, [key]: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>)}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black">Cancelar</button><button disabled={saving} className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Cadastrar'}</button></div></form></div>}
  </div>;
};

export const ReservationsListWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { guests, rooms, reservations, currentUser, syncFromSupabase } = useHotel();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ guestId: '', roomId: '', checkin: today(), checkout: tomorrow(), guests: 1 });
  const active = reservations.filter(r => !['cancelada','checkout_concluido'].includes(r.status));
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await receptionGuestStayService.createReservationForGuest({ ...form, actorUserId: currentUser?.id }); await syncFromSupabase(); setOpen(false); } catch (e: any) { setError(e?.message || 'Não foi possível vincular o hóspede ao quarto.'); } finally { setSaving(false); } };
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black">{widget.title || 'Reservas e vínculos'}</h2><p className="text-[10px] text-slate-400">Hóspede + período + quarto.</p></div><button onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3 text-[10px] font-black text-white"><Plus className="h-4 w-4"/>Vincular hóspede</button></div><div className="mt-3 space-y-2">{active.slice(0, 10).map(r => { const g = guests.find(x => x.id === r.hospede_id); const room = rooms.find(x => x.id === r.quarto_id); return <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><strong className="block truncate text-[10px]">{g?.nome || 'Hóspede não identificado'}</strong><span className="text-[9px] text-slate-400">{r.codigo} · {r.checkin} → {r.checkout}</span></div><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black text-blue-700">Q. {room?.numero || '—'}</span></div>; })}</div>{error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}
    {open && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/65 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"><h3 className="text-lg font-black">Vincular hóspede ao quarto</h3><p className="text-[10px] text-slate-400">Cria uma reserva confirmada usando o hóspede já cadastrado.</p><div className="mt-4 grid gap-3"><label className="text-[9px] font-black text-slate-500">Hóspede<select required value={form.guestId} onChange={e => setForm(cur => ({ ...cur, guestId: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option value="">Selecionar</option>{guests.map(g => <option key={g.id} value={g.id}>{g.nome} · {g.documento}</option>)}</select></label><label className="text-[9px] font-black text-slate-500">Quarto<select required value={form.roomId} onChange={e => setForm(cur => ({ ...cur, roomId: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option value="">Selecionar</option>{rooms.filter(r => r.ativo !== false).map(r => <option key={r.id} value={r.id}>Quarto {r.numero} · {r.nome}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-[9px] font-black text-slate-500">Check-in<input type="date" required value={form.checkin} onChange={e => setForm(cur => ({ ...cur, checkin: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label><label className="text-[9px] font-black text-slate-500">Check-out<input type="date" required value={form.checkout} onChange={e => setForm(cur => ({ ...cur, checkout: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label></div><label className="text-[9px] font-black text-slate-500">Quantidade de hóspedes<input type="number" min={1} value={form.guests} onChange={e => setForm(cur => ({ ...cur, guests: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-4 text-xs font-black">Cancelar</button><button disabled={saving} className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Vinculando...' : 'Criar reserva'}</button></div></form></div>}
  </div>;
};

export const ActiveStaysWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { reservations, guests, rooms, currentUser, syncFromSupabase } = useHotel();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const active = reservations.filter(r => r.status === 'checkin_realizado');
  const checkout = async (id: string) => { if (!window.confirm('Confirmar check-out desta hospedagem?')) return; setBusy(id); setError(''); try { await receptionStayService.checkout(id, currentUser?.id); await syncFromSupabase(); } catch (e: any) { setError(e?.message || 'Não foi possível realizar o check-out.'); } finally { setBusy(null); } };
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-blue-600"/><div><h2 className="text-sm font-black">{widget.title || 'Hóspedes hospedados'}</h2><p className="text-[10px] text-slate-400">{active.length} hospedagem(ns) ativa(s)</p></div></div><div className="mt-3 grid gap-2 md:grid-cols-2">{active.map(r => { const g=guests.find(x=>x.id===r.hospede_id); const room=rooms.find(x=>x.id===r.quarto_id); return <div key={r.id} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-[11px]">{g?.nome || 'Hóspede'}</strong><p className="mt-1 text-[9px] text-slate-500"><CalendarDays className="mr-1 inline h-3 w-3"/>{r.checkin} → {r.checkout}</p></div><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black text-blue-700">Q. {room?.numero || '—'}</span></div><button disabled={busy===r.id} onClick={() => checkout(r.id)} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-rose-50 text-[9px] font-black text-rose-700 disabled:opacity-50"><LogOut className="h-3.5 w-3.5"/>CHECK-OUT</button></div>; })}{active.length===0 && <p className="py-6 text-center text-xs text-slate-400">Nenhuma hospedagem ativa.</p>}</div>{error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}</div>;
};
