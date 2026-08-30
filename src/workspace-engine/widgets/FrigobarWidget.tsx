import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, PackageCheck, RefreshCw, ShoppingCart, Warehouse } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { frigobarCore, type MinibarRestockSource, type MinibarRoomSnapshot } from '../../frigobar-core';
import { hotelIdentityService } from '../../services/hotelIdentityService';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const operationKey = (prefix: string) =>
  `${prefix}:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export const FrigobarWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { hotelConfig, rooms, reservations, guests } = useHotel();
  const activeRoomIds = useMemo(
    () => new Set(rooms.filter(room => room.ativo !== false).map(room => room.id)),
    [rooms],
  );
  const activeReservations = useMemo(
    () => reservations.filter(item => item.status === 'checkin_realizado' && item.quarto_id && activeRoomIds.has(item.quarto_id)),
    [reservations, activeRoomIds],
  );

  const [hotelId, setHotelId] = useState(hotelConfig.id || '');
  const [roomId, setRoomId] = useState('');
  const [snapshot, setSnapshot] = useState<MinibarRoomSnapshot | null>(null);
  const [sources, setSources] = useState<MinibarRestockSource[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canConsume = widget.actions?.consumeMinibar !== false && widget.permissions?.edit !== false;
  const canRestock = widget.actions?.restockMinibar !== false && widget.permissions?.edit !== false;

  useEffect(() => {
    let active = true;
    void hotelIdentityService.getActiveHotelId(hotelConfig.id).then(id => {
      if (active) setHotelId(id);
    }).catch(err => {
      if (active) {
        setHotelId('');
        setError(err instanceof Error ? err.message : 'Não foi possível identificar o hotel ativo.');
      }
    });
    return () => { active = false; };
  }, [hotelConfig.id]);

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
    if (!canConsume || !hotelId || !roomId || busyKey) return;
    setBusyKey(`consume:${productId}`);
    setError('');
    setNotice('');
    try {
      const result = await frigobarCore.registerConsumption({
        hotelId,
        roomId,
        productId,
        quantity: 1,
        idempotencyKey: operationKey('workspace-minibar-consume'),
      });
      setNotice(`Consumo registrado e lançado no Folio: ${money(result.total)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o consumo.');
    } finally {
      setBusyKey('');
    }
  };

  const restock = async (productId: string, quantity: number) => {
    if (!canRestock || !hotelId || !roomId || !sourceId || quantity <= 0 || busyKey) return;
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
        idempotencyKey: operationKey('workspace-minibar-restock'),
      });
      setNotice(`${quantity} unidade(s) reposta(s) sem gerar cobrança no Folio.`);
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
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><PackageCheck className="h-4 w-4" /></span>
          <div><h2 className="text-sm font-black text-slate-900">{widget.title || 'Frigobar'}</h2><p className="text-[10px] text-slate-400">Inventory Core · cobrança via Financial Engine</p></div>
        </div>
        <div className="flex min-w-0 gap-2">
          <select value={roomId} onChange={event => setRoomId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 lg:min-w-64">
            <option value="">Selecione uma hospedagem</option>
            {activeReservations.map(item => {
              const itemRoom = rooms.find(candidate => candidate.id === item.quarto_id);
              const itemGuest = guests.find(candidate => candidate.id === item.hospede_id);
              return <option key={item.id} value={item.quarto_id}>Q. {itemRoom?.numero || '—'} · {itemGuest?.nome || item.codigo || item.id}</option>;
            })}
          </select>
          <button type="button" onClick={() => void load()} disabled={loading || !roomId || !hotelId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40" title="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {!activeReservations.length && <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">Nenhuma hospedagem ativa para operação de Frigobar.</div>}
      {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700">{error}</div>}
      {notice && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">{notice}</div>}

      {snapshot && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 lg:col-span-2"><p className="text-[9px] font-black uppercase text-slate-400">Hospedagem</p><div className="mt-1 flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5 text-cyan-700" /><strong className="truncate text-xs text-slate-900">Quarto {room?.numero || snapshot.roomNumber}</strong></div><span className="text-[10px] text-slate-500">{guest?.nome || 'Hóspede ativo'}</span></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Unidades</p><strong className="mt-1 block text-lg text-slate-900">{snapshot.totalUnits}</strong></div>
            <div className={`rounded-xl p-3 ${snapshot.needsRestock ? 'bg-amber-50' : 'bg-emerald-50'}`}><p className="text-[9px] font-black uppercase text-slate-500">Faltando</p><strong className="mt-1 block text-lg text-slate-900">{snapshot.missingUnits}</strong></div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-[11px] font-black text-slate-800">Estoque do quarto</h3><p className="text-[9px] text-slate-400">Consumo reduz estoque e lança no Folio na mesma transação.</p></div>
            {canRestock && <div className="flex items-center gap-2"><Warehouse className="h-3.5 w-3.5 text-slate-500" /><select value={sourceId} onChange={event => setSourceId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700"><option value="">Fonte de reposição</option>{sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>}
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {snapshot.items.map(item => (
              <article key={item.productId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div><strong className="text-[11px] text-slate-900">{item.productName}</strong><p className="mt-1 text-[9px] text-slate-500">{money(item.salePrice)} · atual {item.quantity} / meta {item.targetQuantity}</p></div>
                  <span className={`rounded-full px-2 py-1 text-[8px] font-black ${item.missingQuantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{item.missingQuantity > 0 ? `FALTAM ${item.missingQuantity}` : 'OK'}</span>
                </div>
                {(canConsume || canRestock) && <div className="mt-3 flex gap-2">
                  {canConsume && <button type="button" onClick={() => void consume(item.productId)} disabled={item.quantity <= 0 || Boolean(busyKey)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[9px] font-black text-white disabled:opacity-40"><ShoppingCart className="h-3 w-3" /> CONSUMIR 1</button>}
                  {canRestock && <button type="button" onClick={() => void restock(item.productId, item.missingQuantity)} disabled={!sourceId || item.missingQuantity <= 0 || Boolean(busyKey)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-[9px] font-black text-white disabled:opacity-40"><Warehouse className="h-3 w-3" /> REPOR {item.missingQuantity || ''}</button>}
                </div>}
              </article>
            ))}
            {!snapshot.items.length && <div className="rounded-2xl bg-slate-50 p-6 text-center text-[10px] text-slate-500 lg:col-span-2">Nenhum produto configurado para este frigobar.</div>}
          </div>
        </>
      )}
    </div>
  );
};
