import React, { useEffect, useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { OPERATIONAL_SECTORS } from '../../domain/operationalSectors';
import { supabase } from '../../lib/supabase';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Reserva } from '../../types';
import { ReceptionRoomsKanban } from '../../modules/recepcao/ReceptionRoomsKanban';
import { RECEPTION_ROOMS_BOARD_ID, receptionRoomKanbanService } from '../../modules/recepcao/receptionRoomKanbanService';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { readRoomMapWidgetPresentation, roomMapActionEnabled } from './roomMapWidgetPresentation';

const GOVERNANCE_BOARD_ID = 'kanban-board-governanca';
const GOVERNANCE_RELEASED_COLUMN_ID = 'gov-col-liberado';

type GovernanceRoomCard = {
  room_id?: string | null;
  column_id?: string | null;
  is_archived?: boolean | null;
};

export const ReceptionRoomMapWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const { currentUser, reservations, guests, rooms, syncFromSupabase } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [governanceReleasedRoomIds, setGovernanceReleasedRoomIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stayActionId, setStayActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const presentation = readRoomMapWidgetPresentation(widget);
  const visibleStatusSet = useMemo(
    () => presentation.visibleStatusIds ? new Set<string>(presentation.visibleStatusIds) : null,
    [presentation.visibleStatusIds],
  );
  const displayedColumns = useMemo(
    () => visibleStatusSet ? columns.filter(column => visibleStatusSet.has(column.id)) : columns,
    [columns, visibleStatusSet],
  );
  const displayedCards = useMemo(
    () => visibleStatusSet ? cards.filter(card => visibleStatusSet.has(card.column_id)) : cards,
    [cards, visibleStatusSet],
  );
  const sectorId = workspace.sectors[0];
  const sectorLabel = OPERATIONAL_SECTORS.find(sector => sector.id === sectorId)?.label || sectorId || 'Operação';

  useEffect(() => {
    let cancelled = false;

    const loadGovernanceReleaseState = async () => {
      const { data, error: governanceError } = await supabase
        .from('kanban_cards')
        .select('room_id,column_id,is_archived')
        .eq('board_id', GOVERNANCE_BOARD_ID)
        .eq('is_archived', false);

      if (cancelled) return;
      if (governanceError) {
        setGovernanceReleasedRoomIds([]);
        setError(current => current || `Não foi possível verificar a liberação da Governança: ${governanceError.message}`);
        return;
      }

      const releasedIds = (data as GovernanceRoomCard[] | null || [])
        .filter(card => card.column_id === GOVERNANCE_RELEASED_COLUMN_ID && typeof card.room_id === 'string' && card.room_id.trim())
        .map(card => card.room_id as string);
      setGovernanceReleasedRoomIds(Array.from(new Set(releasedIds)));
    };

    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === RECEPTION_ROOMS_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar os quartos.'));

    void loadGovernanceReleaseState();

    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived) setCards(cur => cur.some(item => item.id === card.id) ? cur : [...cur, card]); },
      onUpdate: card => setCards(cur => card.board_id !== RECEPTION_ROOMS_BOARD_ID || card.is_archived ? cur.filter(item => item.id !== card.id) : cur.some(item => item.id === card.id) ? cur.map(item => item.id === card.id ? card : item) : [...cur, card]),
      onDelete: card => setCards(cur => cur.filter(item => item.id !== card.id)),
      onStatus: () => undefined,
    });

    const governanceChannel = supabase
      .channel(`room-map-governance-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kanban_cards',
        filter: `board_id=eq.${GOVERNANCE_BOARD_ID}`,
      }, () => { void loadGovernanceReleaseState(); })
      .subscribe();

    return () => {
      cancelled = true;
      unsubscribe();
      void supabase.removeChannel(governanceChannel);
    };
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

  return <div className="space-y-3">
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</div>}
    <ReceptionRoomsKanban
      columns={displayedColumns}
      cards={displayedCards}
      rooms={rooms}
      reservations={reservations}
      guests={guests}
      savingId={savingId}
      stayActionId={stayActionId}
      title={widget.title || 'Mapa de quartos'}
      contextLabel={`${sectorLabel} · Mapa de quartos`}
      showGuest={presentation.showGuest}
      showReservationDates={presentation.showReservationDates}
      showRoomType={presentation.showRoomType}
      showFloor={presentation.showFloor}
      showStatus={presentation.showStatus}
      statusChangeAllowedRoomIds={governanceReleasedRoomIds}
      allowCheckin={roomMapActionEnabled(widget, 'checkin')}
      allowCheckout={roomMapActionEnabled(widget, 'checkout')}
      allowTransferRoom={roomMapActionEnabled(widget, 'transferRoom')}
      allowEditRoom={roomMapActionEnabled(widget, 'editRoom')}
      allowDeleteRoom={roomMapActionEnabled(widget, 'deleteRoom')}
      onMove={move}
      onCheckin={checkin}
      onCheckout={checkout}
      onTransfer={transfer}
    />
  </div>;
};
