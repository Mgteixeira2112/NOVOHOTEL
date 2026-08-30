import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, Plus, RefreshCw, RotateCcw, WalletCards } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { financialEngine, type FinancialFolioSnapshot, type FinancialPaymentMethod } from '../../financial-engine';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const PAYMENT_METHODS: Array<{ value: FinancialPaymentMethod; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BANK_TRANSFER', label: 'Transferência' },
  { value: 'OTHER', label: 'Outro' },
];

const money = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(value || 0));

const operationKey = (prefix: string) =>
  `${prefix}:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export const StayFinanceWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { reservations, guests, rooms } = useHotel();
  const activeRoomIds = useMemo(
    () => new Set(rooms.filter(room => room.ativo !== false).map(room => room.id)),
    [rooms],
  );
  const activeReservations = useMemo(
    () => reservations.filter(item => item.status === 'checkin_realizado' && item.quarto_id && activeRoomIds.has(item.quarto_id)),
    [reservations, activeRoomIds],
  );
  const [reservationId, setReservationId] = useState('');
  const [stayId, setStayId] = useState<string | null>(null);
  const [folio, setFolio] = useState<FinancialFolioSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FinancialPaymentMethod>('PIX');

  useEffect(() => {
    if (!reservationId && activeReservations[0]) setReservationId(activeReservations[0].id);
    if (reservationId && !activeReservations.some(item => item.id === reservationId)) {
      setReservationId(activeReservations[0]?.id || '');
    }
  }, [activeReservations, reservationId]);

  const selectedReservation = activeReservations.find(item => item.id === reservationId) || null;
  const selectedGuest = selectedReservation ? guests.find(item => item.id === selectedReservation.hospede_id) : null;
  const selectedRoom = selectedReservation ? rooms.find(item => item.id === selectedReservation.quarto_id) : null;

  const load = useCallback(async () => {
    if (!reservationId) {
      setStayId(null);
      setFolio(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resolvedStayId = await receptionStayService.findActiveStayId(reservationId);
      if (!resolvedStayId) throw new Error('Hospedagem financeira ativa ainda não foi localizada para esta reserva.');
      setStayId(resolvedStayId);
      setFolio(await financialEngine.getFolioByStay(resolvedStayId));
    } catch (err) {
      setStayId(null);
      setFolio(null);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o Folio.');
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => { void load(); }, [load]);

  const addCharge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!folio || busy) return;
    const amount = Number(chargeAmount.replace(',', '.'));
    if (!chargeDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Informe descrição e valor válido para o lançamento.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await financialEngine.addCharge({
        folioId: folio.folioId,
        source: 'MANUAL',
        sourceKey: operationKey('manual'),
        description: chargeDescription.trim(),
        quantity: 1,
        unitPrice: amount,
      });
      setChargeDescription(''); setChargeAmount(''); setNotice('Lançamento incluído no Folio.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível incluir o lançamento.');
    } finally { setBusy(false); }
  };

  const receivePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!folio || busy) return;
    const amount = Number(paymentAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido para o pagamento.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await financialEngine.receivePayment({
        folioId: folio.folioId,
        amount,
        method: paymentMethod,
        idempotencyKey: operationKey('payment'),
      });
      setPaymentAmount(''); setNotice('Pagamento registrado no Folio.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o pagamento.');
    } finally { setBusy(false); }
  };

  const voidCharge = async (itemId: string) => {
    if (busy) return;
    const reason = window.prompt('Motivo obrigatório para o estorno deste lançamento:')?.trim();
    if (!reason) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await financialEngine.voidCharge(itemId, reason);
      setNotice('Lançamento estornado sem apagar o histórico.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível estornar o lançamento.');
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><WalletCards className="h-4 w-4" /></span>
          <div><h2 className="text-sm font-black text-slate-900">{widget.title || 'Financeiro da hospedagem'}</h2><p className="text-[10px] text-slate-400">Folio oficial · Financial Engine</p></div>
        </div>
        <div className="flex min-w-0 gap-2">
          <select value={reservationId} onChange={event => setReservationId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 lg:min-w-64">
            <option value="">Selecione uma hospedagem</option>
            {activeReservations.map(reservation => {
              const guest = guests.find(item => item.id === reservation.hospede_id);
              const room = rooms.find(item => item.id === reservation.quarto_id);
              return <option key={reservation.id} value={reservation.id}>Q. {room?.numero || '—'} · {guest?.nome || reservation.codigo || reservation.id}</option>;
            })}
          </select>
          <button type="button" onClick={() => void load()} disabled={loading || !reservationId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40" title="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {!activeReservations.length && <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">Nenhuma hospedagem ativa para movimentação financeira.</div>}
      {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700">{error}</div>}
      {notice && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">{notice}</div>}

      {folio && selectedReservation && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-3 lg:col-span-2"><p className="text-[9px] font-black uppercase text-slate-400">Hospedagem</p><strong className="mt-1 block truncate text-xs text-slate-900">{selectedGuest?.nome || 'Hóspede'}</strong><span className="text-[10px] text-slate-500">Quarto {selectedRoom?.numero || '—'} · {selectedReservation.codigo || reservationId}</span></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Lançamentos</p><strong className="mt-1 block text-base text-slate-900">{money(folio.chargesTotal, folio.currency)}</strong></div>
            <div className="rounded-xl bg-blue-50 p-3"><p className="text-[9px] font-black uppercase text-blue-500">Pago</p><strong className="mt-1 block text-base text-blue-800">{money(folio.paymentsTotal, folio.currency)}</strong></div>
            <div className={`rounded-xl p-3 ${folio.balance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}><p className="text-[9px] font-black uppercase text-slate-500">Saldo</p><strong className="mt-1 block text-base text-slate-900">{money(folio.balance, folio.currency)}</strong></div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
            <section className="rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /><h3 className="text-[11px] font-black text-slate-800">Lançamentos</h3></div>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {folio.items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5"><div className="min-w-0"><strong className="block truncate text-[10px] text-slate-800">{item.description}</strong><span className="text-[9px] text-slate-400">{item.source} · {item.quantity} × {money(item.unitPrice, folio.currency)} · {item.status}</span></div><div className="flex items-center gap-2"><strong className="whitespace-nowrap text-[10px]">{money(item.total, folio.currency)}</strong>{item.status === 'active' && <button type="button" onClick={() => void voidCharge(item.id)} disabled={busy} className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-700 disabled:opacity-40" title="Estornar"><RotateCcw className="h-3 w-3" /></button>}</div></div>)}
                {!folio.items.length && <p className="py-4 text-center text-[10px] text-slate-400">Nenhum lançamento.</p>}
              </div>
              <form onSubmit={addCharge} className="mt-3 grid gap-2 md:grid-cols-[1fr_120px_auto]"><input value={chargeDescription} onChange={e => setChargeDescription(e.target.value)} placeholder="Descrição do lançamento" className="rounded-xl border border-slate-200 px-3 py-2 text-[10px]" /><input value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} inputMode="decimal" placeholder="Valor" className="rounded-xl border border-slate-200 px-3 py-2 text-[10px]" /><button disabled={busy || folio.status !== 'open'} className="flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40"><Plus className="h-3 w-3" /> LANÇAR</button></form>
            </section>

            <section className="rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /><h3 className="text-[11px] font-black text-slate-800">Recebimentos</h3></div>
              <div className="mt-3 max-h-36 space-y-2 overflow-auto">{folio.payments.map(payment => <div key={payment.id} className="flex items-center justify-between rounded-xl bg-blue-50/60 p-2.5"><span className="text-[9px] font-bold text-slate-600">{payment.method} · {payment.status}</span><strong className="text-[10px] text-blue-800">{money(payment.amount, folio.currency)}</strong></div>)}{!folio.payments.length && <p className="py-3 text-center text-[10px] text-slate-400">Nenhum pagamento.</p>}</div>
              <form onSubmit={receivePayment} className="mt-3 space-y-2"><input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} inputMode="decimal" placeholder="Valor a receber" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[10px]" /><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as FinancialPaymentMethod)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px]">{PAYMENT_METHODS.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}</select><button disabled={busy || folio.status !== 'open' || folio.balance <= 0} className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40"><CreditCard className="h-3 w-3" /> REGISTRAR PAGAMENTO</button></form>
              <p className="mt-3 text-[9px] text-slate-400">Folio {folio.status} · Stay {stayId || '—'} · saldo calculado pelo motor financeiro.</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
