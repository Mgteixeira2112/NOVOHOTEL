import React, { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarDays, Edit3, LogOut, Mail, MapPin, Phone, Plus, Search, Star, UserPlus, Users, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Hospede } from '../../types';
import { receptionGuestStayService } from '../../modules/recepcao/receptionGuestStayService';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const GUEST_PAGE_SIZE = 12;

type GuestForm = {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  nacionalidade: string;
  notasPreferencias: string;
  vip: boolean;
};

const emptyGuestForm = (): GuestForm => ({
  nome: '',
  documento: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  nacionalidade: 'Brasileiro',
  notasPreferencias: '',
  vip: false,
});

const formFromGuest = (guest: Hospede): GuestForm => ({
  nome: guest.nome || '',
  documento: guest.documento || guest.cpf || '',
  email: guest.email || '',
  telefone: guest.telefone || '',
  dataNascimento: guest.data_nascimento || '',
  endereco: guest.endereco || '',
  cidade: guest.cidade || '',
  estado: guest.estado || '',
  cep: guest.cep || '',
  nacionalidade: guest.nacionalidade || 'Brasileiro',
  notasPreferencias: guest.notas_preferencias || '',
  vip: guest.vip === true,
});

const formatGuestDate = (value?: string) => {
  if (!value) return 'Não informado';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

const GuestField: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="min-w-0 border-b border-slate-100 pb-2">
    <span className="block text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</span>
    <span className="mt-1 block break-words text-[11px] font-bold text-slate-800">{value || 'Não informado'}</span>
  </div>
);

export const GuestsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { guests, syncFromSupabase } = useHotel();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(GUEST_PAGE_SIZE);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<GuestForm>(emptyGuestForm);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return guests
      .filter(g => !q || [g.nome, g.documento, g.cpf, g.email, g.telefone, g.cidade, g.estado]
        .some(v => String(v || '').toLocaleLowerCase('pt-BR').includes(q)))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [guests, query]);

  const visibleGuests = filtered.slice(0, visibleCount);
  const selectedGuest = selectedGuestId ? guests.find(g => g.id === selectedGuestId) || null : null;
  const editingGuest = editingGuestId ? guests.find(g => g.id === editingGuestId) || null : null;

  useEffect(() => { setVisibleCount(GUEST_PAGE_SIZE); }, [query]);

  const openNew = () => {
    setEditingGuestId(null);
    setForm(emptyGuestForm());
    setError('');
    setEditorOpen(true);
  };

  const openEdit = (guest: Hospede) => {
    setEditingGuestId(guest.id);
    setForm(formFromGuest(guest));
    setError('');
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (editingGuestId) await receptionGuestStayService.updateGuest(editingGuestId, form);
      else await receptionGuestStayService.createGuest(form);
      const synced = await syncFromSupabase();
      if (!synced.success) throw new Error(synced.message || 'Dados salvos, mas a lista não conseguiu atualizar.');
      setEditorOpen(false);
      setEditingGuestId(null);
      setForm(emptyGuestForm());
    } catch (e: any) {
      setError(e?.message || (editingGuestId ? 'Não foi possível atualizar o hóspede.' : 'Não foi possível cadastrar o hóspede.'));
    } finally {
      setSaving(false);
    }
  };

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-black">{widget.title || 'Hóspedes'}</h2>
        <p className="text-[10px] text-slate-400">Cadastro central de hóspedes com ficha e edição no Supabase.</p>
      </div>
      <button type="button" onClick={openNew} className="flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white"><UserPlus className="h-4 w-4" />Novo hóspede</button>
    </div>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="relative block flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar nome, documento, e-mail, telefone ou cidade" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs"/></label>
      <span className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-500">{filtered.length} hóspede(s)</span>
    </div>

    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {visibleGuests.map(g => <article key={g.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => setSelectedGuestId(g.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Users className="h-4 w-4"/></span>
            <div className="min-w-0"><div className="flex items-center gap-1.5"><strong className="block truncate text-[11px] text-slate-900">{g.nome}</strong>{g.vip && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-700">VIP</span>}</div><span className="text-[9px] text-slate-400">{g.documento || g.cpf || 'Sem documento'}</span></div>
          </button>
          <button type="button" onClick={() => openEdit(g)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100" aria-label={`Editar ${g.nome}`}><Edit3 className="h-3.5 w-3.5"/></button>
        </div>
        <button type="button" onClick={() => setSelectedGuestId(g.id)} className="mt-2 block w-full text-left">
          <p className="truncate text-[9px] text-slate-500">{g.telefone || 'Sem telefone'} · {g.email || 'Sem e-mail'}</p>
          {(g.cidade || g.estado) && <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400"><MapPin className="h-3 w-3"/>{[g.cidade, g.estado].filter(Boolean).join('/')}</p>}
        </button>
      </article>)}
      {filtered.length === 0 && <p className="py-6 text-center text-xs text-slate-400 md:col-span-2 xl:col-span-3">Nenhum hóspede encontrado.</p>}
    </div>

    {visibleCount < filtered.length && <div className="mt-4 flex justify-center"><button type="button" onClick={() => setVisibleCount(count => count + GUEST_PAGE_SIZE)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-600 hover:bg-slate-50">Carregar mais ({Math.min(GUEST_PAGE_SIZE, filtered.length - visibleCount)})</button></div>}
    {filtered.length > 0 && <p className="mt-3 text-center text-[9px] font-bold text-slate-400">Exibindo {Math.min(visibleCount, filtered.length)} de {filtered.length}</p>}
    {error && !editorOpen && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</p>}

    {selectedGuest && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedGuestId(null); }}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Users className="h-5 w-5"/></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Ficha do hóspede</p><div className="flex items-center gap-2"><h3 className="truncate text-lg font-black text-slate-950">{selectedGuest.nome}</h3>{selectedGuest.vip && <span className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-700"><Star className="h-3 w-3"/>VIP</span>}</div></div></div>
          <button type="button" onClick={() => setSelectedGuestId(null)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-5">
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <GuestField label="Documento" value={selectedGuest.documento || selectedGuest.cpf}/>
            <GuestField label="Nascimento" value={formatGuestDate(selectedGuest.data_nascimento)}/>
            <GuestField label="E-mail" value={<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400"/>{selectedGuest.email}</span>}/>
            <GuestField label="Telefone" value={<span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400"/>{selectedGuest.telefone}</span>}/>
            <GuestField label="Endereço" value={selectedGuest.endereco}/>
            <GuestField label="CEP" value={selectedGuest.cep}/>
            <GuestField label="Cidade / Estado" value={[selectedGuest.cidade, selectedGuest.estado].filter(Boolean).join(' / ')}/>
            <GuestField label="Nacionalidade" value={selectedGuest.nacionalidade}/>
            <GuestField label="Total de estadias" value={String(selectedGuest.total_estadias ?? 0)}/>
            <GuestField label="Última estadia" value={formatGuestDate(selectedGuest.ultima_estadia)}/>
          </div>
          <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Preferências e observações</p><p className="mt-2 whitespace-pre-wrap text-[11px] font-semibold text-slate-600">{selectedGuest.notas_preferencias || selectedGuest.observacoes || 'Nenhuma preferência registrada.'}</p></section>
          <div className="mt-5 flex justify-end"><button type="button" onClick={() => { setSelectedGuestId(null); openEdit(selectedGuest); }} className="flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black text-white"><Edit3 className="h-4 w-4"/>Editar hóspede</button></div>
        </div>
      </div>
    </div>}

    {editorOpen && <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditorOpen(false); }}>
      <form onSubmit={save} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><p className="text-[9px] font-black uppercase text-blue-600">Cadastro de hóspede</p><h3 className="text-lg font-black">{editingGuest ? 'Editar hóspede' : 'Novo hóspede'}</h3></div><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 disabled:opacity-40"><X className="h-4 w-4"/></button></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <label className="text-[9px] font-black text-slate-500 sm:col-span-2">Nome completo *<input required value={form.nome} onChange={e => setForm(cur => ({ ...cur, nome: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">CPF / Passaporte *<input required value={form.documento} onChange={e => setForm(cur => ({ ...cur, documento: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">Nascimento<input type="date" value={form.dataNascimento} onChange={e => setForm(cur => ({ ...cur, dataNascimento: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">E-mail *<input required type="email" value={form.email} onChange={e => setForm(cur => ({ ...cur, email: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">Telefone *<input required value={form.telefone} onChange={e => setForm(cur => ({ ...cur, telefone: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500 sm:col-span-2">Endereço<input value={form.endereco} onChange={e => setForm(cur => ({ ...cur, endereco: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">Cidade<input value={form.cidade} onChange={e => setForm(cur => ({ ...cur, cidade: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">Estado<input value={form.estado} onChange={e => setForm(cur => ({ ...cur, estado: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">CEP<input value={form.cep} onChange={e => setForm(cur => ({ ...cur, cep: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500">Nacionalidade<input value={form.nacionalidade} onChange={e => setForm(cur => ({ ...cur, nacionalidade: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"/></label>
          <label className="text-[9px] font-black text-slate-500 sm:col-span-2">Preferências e observações<textarea value={form.notasPreferencias} onChange={e => setForm(cur => ({ ...cur, notasPreferencias: e.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs"/></label>
          <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-black text-amber-800 sm:col-span-2"><input type="checkbox" checked={form.vip} onChange={e => setForm(cur => ({ ...cur, vip: e.target.checked }))}/>Marcar hóspede como VIP</label>
          {error && <p className="rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700 sm:col-span-2">{error}</p>}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-5"><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black disabled:opacity-50">Cancelar</button><button disabled={saving} className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Salvando...' : editingGuest ? 'Salvar alterações' : 'Cadastrar'}</button></div>
      </form>
    </div>}
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
