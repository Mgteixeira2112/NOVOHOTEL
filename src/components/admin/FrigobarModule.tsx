import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, PackageCheck, RefreshCw, ShoppingCart, Warehouse } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import {
  frigobarCore,
  type MinibarRestockSource,
  type MinibarRoomSnapshot,
} from '../../frigobar-core';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const operationKey = (prefix: string) =>
  `${prefix}:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export const FrigobarModule: React.FC = () => {
  const { hotelConfig, rooms, reservations, guests } = useHotel();
  const hotelId = hotelConfig.id || '';
  const activeReservations = useMemo(
    () => reservations.filter(item => item.status === 'checkin_realizado' && item.quarto_id),
    [reservations],
  );

  const [roomId, setRoomId] = useState('');
  const [snapshot, setSnapshot] = useState<MinibarRoomSnapshot | null>(null);
  const [sources, setSources] = useState<MinibarRestockSource[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!roomId && activeReservations[0]?.quarto_id) setRoomId(activeReservations[0].quarto_id);
    if (roomId && !activeReservations.some(item => item.quarto_id === roomId)) {
      setRoomId(activeReservations[0]?.quarto_id || '');
    }
  }, [activeReservations, roomId]);

  const load = useCallback(async () => {
    if (!hotelId || !roomId) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [roomSnapshot, restockSources] = await Promise.all([
        frigobarCore.getRoomSnapshot(hotelId, roomId),
        frigobarCore.listRestockSources(hotelId),
      ]);
      setSnapshot(roomSnapshot);
      setSources(restockSources);
      setSourceId(current => current && restockSources.some(source => source.id === current)
        ? current
        : restockSources[0]?.id || '');
    } catch (err) {
      setSnapshot(null);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o frigobar do quarto.');
    } finally {
      setLoading(false);
    }
  }, [hotelId, roomId]);

  useEffect(() => { void load(); }, [load]);

  const consume = async (productId: string) => {
    if (!hotelId || !roomId || busyKey) return;
    setBusyKey(`consume:${productId}`);
    setError('');
    setNotice('');
    try {
      const result = await frigobarCore.registerConsumption({
        hotelId,
        roomId,
        productId,
        quantity: 1,
        idempotencyKey: operationKey('minibar-consume'),
      });
      setNotice(`Consumo lançado no Folio: ${money(result.total)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o consumo.');
    } finally {
      setBusyKey('');
    }
  };

  const restock = async (productId: string, quantity: number) => {
    if (!hotelId || !roomId || !sourceId || quantity <= 0 || busyKey) return;
    setBusyKey(`restock:${productId}`);
    setError('');
    setNotice('');
    try {
      await frigobarCore.restock({
        hotelId,
        roomId,
        productId,
        quantity,
        fromLocationId: sourceId,
        idempotencyKey: operationKey('minibar-restock'),
      });
      setNotice(`${quantity} unidade(s) reposta(s) no frigobar sem gerar cobrança.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível repor o frigobar.');
    } finally {
      setBusyKey('');
    }
  };

  const reservation = activeReservations.find(item => item.quarto_id === roomId);
  const room = rooms.find(item => item.id === roomId);
  const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : undefined;

  return (
    <div className="space-y-5 p-1">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><PackageCheck className="h-5 w-5" /></span>
            <div>
              <h1 className="text-lg font-black text-slate-900">Frigobar operacional</h1>
              <p className="text-xs text-slate-500">Supabase · Inventory Core · cobrança via Financial Engine</p>
            </div>
          </div>
          <div className="flex min-w-0 gap-2">
            <select value={roomId} onChange={event => setRoomId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 lg:min-w-72">
              <option value="">Selecione uma hospedagem ativa</option>
              {activeReservations.map(item => {
                const itemRoom = rooms.find(candidate => candidate.id === item.quarto_id);
                const itemGuest = guests.find(candidate => candidate.id === item.hospede_id);
                return <option key={item.id} value={item.quarto_id}>Q. {itemRoom?.numero || '—'} · {itemGuest?.nome || item.codigo || item.id}</option>;
              })}
            </select>
            <button type="button" onClick={() => void load()} disabled={loading || !roomId} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40" title="Atualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {!hotelId && <div className="rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-800">O hotel ativo ainda não possui ID Supabase disponível. Sincronize a configuração antes de operar o Frigobar.</div>}
      {!activeReservations.length && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Nenhuma hospedagem ativa para operação de Frigobar.</div>}
      {error && <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
      {notice && <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{notice}</div>}

      {snapshot && (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
              <p className="text-[10px] font-black uppercase text-slate-400">Hospedagem</p>
              <div className="mt-2 flex items-center gap-2"><BedDouble className="h-4 w-4 text-cyan-700" /><strong className="text-sm text-slate-900">Quarto {room?.numero || snapshot.roomNumber}</strong></div>
              <p className="mt-1 text-xs text-slate-500">{guest?.nome || 'Hóspede ativo'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Unidades no quarto</p><strong className="mt-2 block text-2xl text-slate-900">{snapshot.totalUnits}</strong></div>
            <div className={`rounded-2xl p-4 ${snapshot.needsRestock ? 'bg-amber-50' : 'bg-emerald-50'}`}><p className="text-[10px] font-black uppercase text-slate-500">Reposição</p><strong className="mt-2 block text-2xl text-slate-900">{snapshot.missingUnits}</strong><span className="text-[10px] text-slate-500">unidades faltantes</span></div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div><h2 className="text-sm font-black text-slate-900">Estoque do quarto</h2><p className="text-[10px] text-slate-400">Consumo baixa estoque e lança no Folio na mesma transação.</p></div>
              <div className="flex items-center gap-2"><Warehouse className="h-4 w-4 text-slate-500" /><select value={sourceId} onChange={event => setSourceId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700"><option value="">Fonte de reposição</option>{sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {snapshot.items.map(item => (
                <article key={item.productId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><strong className="text-xs text-slate-900">{item.productName}</strong><p className="mt-1 text-[10px] text-slate-500">Venda {money(item.salePrice)} · atual {item.quantity} / meta {item.targetQuantity}</p></div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black ${item.missingQuantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{item.missingQuantity > 0 ? `FALTAM ${item.missingQuantity}` : 'OK'}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => void consume(item.productId)} disabled={item.quantity <= 0 || Boolean(busyKey)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40"><ShoppingCart className="h-3 w-3" /> CONSUMIR 1</button>
                    <button type="button" onClick={() => void restock(item.productId, item.missingQuantity)} disabled={!sourceId || item.missingQuantity <= 0 || Boolean(busyKey)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40"><Warehouse className="h-3 w-3" /> REPOR {item.missingQuantity || ''}</button>
                  </div>
                </article>
              ))}
              {!snapshot.items.length && <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500 lg:col-span-2">Nenhum produto configurado para o frigobar deste quarto.</div>}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
