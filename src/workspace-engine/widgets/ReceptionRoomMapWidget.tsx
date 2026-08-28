import React, { useEffect, useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { OPERATIONAL_SECTORS } from '../../domain/operationalSectors';
import { supabase } from '../../lib/supabase';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Quarto, Reserva } from '../../types';
import { ReceptionRoomsKanban } from '../../modules/recepcao/ReceptionRoomsKanban';
import { receptionGuestStayService } from '../../modules/recepcao/receptionGuestStayService';
import { RECEPTION_ROOMS_BOARD_ID, receptionRoomKanbanService } from '../../modules/recepcao/receptionRoomKanbanService';
import { receptionStayService } from '../../modules/recepcao/receptionStayService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { readRoomMapWidgetPresentation, roomMapActionEnabled } from './roomMapWidgetPresentation';

const GOVERNANCE_BOARD_ID = 'kanban-board-governanca';
const GOVERNANCE_RELEASED_COLUMN_ID = 'gov-col-liberado';

const dateInput = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [checkinRoom, setCheckinRoom] = useState<Quarto | null>(null);
  const [checkinGuestId, setCheckinGuestId] = useState('');
  const [checkinDate, setCheckinDate] = useState(dateInput(0));
  const [checkoutDate, setCheckoutDate] = useState(dateInput(1));
  const [checkinGuestCount, setCheckinGuestCount] = useState(1);
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

  const startCheckin = (room: Quarto) => {
    setCheckinRoom(room);
    setCheckinGuestId('');
    setCheckinDate(dateInput(0));
    setCheckoutDate(dateInput(1));
    setCheckinGuestCount(1);
    setError('');
  };

  const confirmNewCheckin = async () => {
    if (!checkinRoom || stayActionId) return;
    if (!checkinGuestId) { setError('Selecione um hóspede para iniciar o check-in.'); return; }
    if (!checkinDate || !checkoutDate || checkoutDate <= checkinDate) { setError('A saída prevista deve ser posterior à entrada.'); return; }
    if (checkinGuestCount < 1 || checkinGuestCount > Number(checkinRoom.capacidade || 1)) {
      setError(`A quantidade de hóspedes deve respeitar a capacidade do quarto (${checkinRoom.capacidade || 1}).`);
      return;
    }

    const actionId = `room:${checkinRoom.id}`;
    setStayActionId(actionId);
    setError('');
    try {
      const created = await receptionGuestStayService.createReservationForGuest({
        guestId: checkinGuestId,
        roomId: checkinRoom.id,
        checkin: checkinDate,
        checkout: checkoutDate,
        guests: checkinGuestCount,
        actorUserId: currentUser?.id,
      });
      await receptionStayService.checkin(created.reservation_id, currentUser?.id);
      await refresh();
      setCheckinRoom(null);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível iniciar a hospedagem.');
    } finally {
      setStayActionId(null);
    }
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
      onStartCheckin={startCheckin}
      onCheckout={checkout}
      onTransfer={transfer}
    />

    {checkinRoom && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !stayActionId) setCheckinRoom(null); }}>
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Iniciar hospedagem</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Check-in · Quarto {checkinRoom.numero}</h3>
          <p className="mt-1 text-[11px] text-slate-500">Selecione o hóspede e confirme o período. As liberações de Governança e Manutenção continuam sendo validadas pelo sistema.</p>
        </div>

        <div className="space-y-4 p-5">
          <label className="block text-[10px] font-black uppercase text-slate-500">Hóspede *
            <select value={checkinGuestId} onChange={event => setCheckinGuestId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800">
              <option value="">Selecionar hóspede</option>
              {guests.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(guest => <option key={guest.id} value={guest.id}>{guest.nome} · {guest.documento}</option>)}
            </select>
          </label>

          {guests.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-bold text-amber-800">Nenhum hóspede cadastrado. Cadastre primeiro no Widget Hóspedes.</div>}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] font-black uppercase text-slate-500">Entrada *
              <input type="date" value={checkinDate} onChange={event => setCheckinDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold" />
            </label>
            <label className="text-[10px] font-black uppercase text-slate-500">Saída prevista *
              <input type="date" value={checkoutDate} min={checkinDate} onChange={event => setCheckoutDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold" />
            </label>
          </div>

          <label className="block text-[10px] font-black uppercase text-slate-500">Quantidade de hóspedes
            <input type="number" min={1} max={Number(checkinRoom.capacidade || 1)} value={checkinGuestCount} onChange={event => setCheckinGuestCount(Number(event.target.value))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold" />
            <span className="mt-1 block text-[9px] normal-case text-slate-400">Capacidade máxima: {checkinRoom.capacidade || 1} hóspede(s).</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
          <button type="button" disabled={!!stayActionId} onClick={() => setCheckinRoom(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 disabled:opacity-40">Cancelar</button>
          <button type="button" disabled={!!stayActionId || !checkinGuestId || guests.length === 0} onClick={() => void confirmNewCheckin()} className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-black text-white hover:bg-emerald-700 disabled:bg-emerald-100 disabled:text-emerald-400">{stayActionId ? 'PROCESSANDO...' : 'CONFIRMAR CHECK-IN'}</button>
        </div>
      </div>
    </div>}
  </div>;
};