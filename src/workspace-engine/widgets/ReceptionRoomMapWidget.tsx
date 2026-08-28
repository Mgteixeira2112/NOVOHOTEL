import React, { useEffect, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Reserva } from '../../types';
import { ReceptionRoomsKanban } from '../../modules/recepcao/ReceptionRoomsKanban';
import { RECEPTION_ROOMS_BOARD_ID, receptionRoomKanbanService } from '../../modules/recepcao/receptionRoomKanbanService';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

export const ReceptionRoomMapWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { currentUser, reservations, guests, rooms, syncFromSupabase } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stayActionId, setStayActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === RECEPTION_ROOMS_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar os quartos.'));
    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived) setCards(cur => cur.some(item => item.id === card.id) ? cur : [...cur, card]); },
      onUpdate: card => setCards(cur => card.board_id !== RECEPTION_ROOMS_BOARD_ID || card.is_archived ? cur.filter(item => item.id !== card.id) : cur.some(item => item.id === card.id) ? cur.map(item => item.id === card.id ? card : item) : [...cur, card]),
      onDelete: card => setCards(cur => cur.filter(item => item.id !== card.id)),
      onStatus: () => undefined,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const refresh = async () => {
    const synced = await syncFromSupabase();
    if (!synced.success) throw new Error(synced.message || 'Operação salva, mas a tela não conseguiu atualizar.');
  };

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingId || columnId === card.column_id) return;
    if (columnId === 'room-col-ocupado') { setError('Use Check-in para ocupar o quarto.'); return; }
    setSavingId(card.id); setError('');
    try {
      const updated = await receptionRoomKanbanService.moveRoomCard(card, columnId, currentUser.id);
      setCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar o status do quarto.'); }
    finally { setSavingId(null); }
  };

  const checkin = async (reservation: Reserva) => {
    if (stayActionId) return;
    setStayActionId(reservation.id); setError('');
    try { await receptionStayService.checkin(reservation.id, currentUser?.id); await refresh(); }
    catch (e: any) { setError(e?.message || 'Não foi possível realizar o check-in.'); }
    finally { setStayActionId(null); }
  };

  const checkout = async (reservation: Reserva) => {
    if (stayActionId) return;
    if (!window.confirm(`Confirmar check-out da reserva ${reservation.codigo || reservation.id}? O quarto seguirá para A Limpar na Governança.`)) return;
    setStayActionId(reservation.id); setError('');
    try { await receptionStayService.checkout(reservation.id, currentUser?.id); await refresh(); }
    catch (e: any) { setError(e?.message || 'Não foi possível realizar o check-out.'); }
    finally { setStayActionId(null); }
  };

  const transfer = async (reservation: Reserva, toRoomId: string) => {
    if (stayActionId) return;
    const destination = rooms.find(room => room.id === toRoomId);
    if (!destination || !window.confirm(`Transferir ${reservation.codigo || reservation.id} para o Quarto ${destination.numero}?`)) return;
    setStayActionId(reservation.id); setError('');
    try { await receptionStayService.transferRoom(reservation.id, toRoomId, currentUser?.id); await refresh(); }
    catch (e: any) { setError(e?.message || 'Não foi possível trocar o quarto.'); }
    finally { setStayActionId(null); }
  };

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3"><h2 className="text-sm font-black text-slate-900">{widget.title || 'Mapa de quartos'}</h2><p className="mt-1 text-[10px] text-slate-500">Cards permanentes ligados a quartos, reservas e hóspedes.</p></div>
    {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</div>}
    <ReceptionRoomsKanban columns={columns} cards={cards} rooms={rooms} reservations={reservations} guests={guests} savingId={savingId} stayActionId={stayActionId} onMove={move} onCheckin={checkin} onCheckout={checkout} onTransfer={transfer} />
  </div>;
};
