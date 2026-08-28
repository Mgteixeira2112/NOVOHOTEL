import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, CalendarDays, LogOut, Search, Settings2, Wifi } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { WorkspaceDefinition, WorkspaceScope } from '../../workspace-engine/types';
import { OperationalWorkCenter } from '../../workspace-engine/OperationalWorkCenter';
import { RoomsModule } from '../../components/admin/RoomsModule';
import { ReceptionKanbanBoard } from './ReceptionKanbanBoard';
import { ReceptionRoomsKanban } from './ReceptionRoomsKanban';
import { RECEPTION_ROOMS_BOARD_ID, receptionRoomKanbanService } from './receptionRoomKanbanService';

const TASK_BOARD_ID = 'kanban-board-recepcao';
type PanelKey = 'arrivals' | 'rooms' | 'alerts' | 'rooms-admin';
const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || (card.assigned_to as any)?.nome || 'Sem responsável';
const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();
const dateKey = (value?: string | null) => String(value || '').slice(0, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const ReceptionWorkspaceShared: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const { currentUser, logout, reservations, guests, rooms } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [roomCards, setRoomCards] = useState<KanbanV2Card[]>([]);
  const [roomColumns, setRoomColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>(definition.defaultScope);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === TASK_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === TASK_BOARD_ID && !card.is_archived));
      setRoomColumns(result.columns.filter(column => column.board_id === RECEPTION_ROOMS_BOARD_ID).sort((a, b) => a.ordem - b.ordem));
      setRoomCards(result.cards.filter(card => card.board_id === RECEPTION_ROOMS_BOARD_ID && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar a Recepção.'));

    const upsertForBoard = (
      boardId: string,
      setter: React.Dispatch<React.SetStateAction<KanbanV2Card[]>>,
      card: KanbanV2Card,
    ) => setter(cur => card.board_id !== boardId || card.is_archived
      ? cur.filter(item => item.id !== card.id)
      : cur.some(item => item.id === card.id)
        ? cur.map(item => item.id === card.id ? card : item)
        : [...cur, card]);

    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => {
        upsertForBoard(TASK_BOARD_ID, setCards, card);
        upsertForBoard(RECEPTION_ROOMS_BOARD_ID, setRoomCards, card);
      },
      onUpdate: card => {
        upsertForBoard(TASK_BOARD_ID, setCards, card);
        upsertForBoard(RECEPTION_ROOMS_BOARD_ID, setRoomCards, card);
      },
      onDelete: card => {
        setCards(cur => cur.filter(item => item.id !== card.id));
        setRoomCards(cur => cur.filter(item => item.id !== card.id));
      },
      onStatus: setStatus,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const today = todayKey();
  const arrivals = useMemo(() => reservations.filter(r => dateKey(r.data_checkin || r.checkin) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const departures = useMemo(() => reservations.filter(r => dateKey(r.data_checkout || r.checkout) === today && !['cancelada', 'checkout_concluido'].includes(r.status)), [reservations, today]);
  const occupied = reservations.filter(r => r.status === 'checkin_realizado').length;
  const roomAlerts = rooms.filter(room => ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(normalize(room.status)) || ['sujo', 'em_limpeza', 'aguardando_vistoria'].includes(normalize(room.status_governanca || room.status_housekeeping)));
  const taskAlerts = cards.filter(card => ['alta', 'critica', 'urgente'].includes(normalize(card.prioridade)) || !assignedUserId(card));

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards.filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !q || [card.titulo, card.descricao, card.room_number, card.guest_name, assignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [cards, scope, currentUser?.id, search]);

  const moveToColumn = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingId || columnId === card.column_id) return;
    setSavingId(card.id); setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser.id });
      setCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar o status.'); }
    finally { setSavingId(null); }
  };

  const moveRoomToColumn = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingRoomId || columnId === card.column_id) return;
    setSavingRoomId(card.id); setError('');
    try {
      const updated = await receptionRoomKanbanService.moveRoomCard(card, columnId, currentUser.id);
      setRoomCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível alterar o status do quarto.');
    } finally {
      setSavingRoomId(null);
    }
  };

  const guestFor = (reservation: any) => guests.find(g => g.id === reservation.hospede_id);
  const roomFor = (reservation: any) => rooms.find(room => room.id === reservation.quarto_id);
  const workItems = [
    { key: 'arrivals' as const, icon: CalendarDays, label: 'Chegadas e saídas', value: arrivals.length + departures.length, detail: `${arrivals.length} chegadas · ${departures.length} saídas` },
    { key: 'rooms' as const, icon: BedDouble, label: 'Quartos', value: roomAlerts.length, detail: `${rooms.length} cadastrados · ${roomAlerts.length} requerem atenção` },
    { key: 'alerts' as const, icon: AlertTriangle, label: 'Alertas da recepção', value: taskAlerts.length, detail: `${taskAlerts.length} tarefas prioritárias ou sem responsável` },
    { key: 'rooms-admin' as const, icon: Settings2, label: 'Administrar quartos', value: rooms.length, detail: 'Cadastrar, editar, excluir, publicar e configurar quartos' },
  ];

  const panelTitle = (key: PanelKey) => {
    if (key === 'arrivals') return 'Chegadas e saídas de hoje';
    if (key === 'rooms') return 'Situação dos quartos';
    if (key === 'rooms-admin') return 'Administração de quartos';
    return 'Alertas da recepção';
  };

  const renderPanel = (key: PanelKey) => {
    if (key === 'rooms-admin') return <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <strong className="font-black">Gestão integrada de acomodações.</strong> Nesta etapa o acesso está disponível para todos os usuários do Workspace da Recepção. A restrição por perfil será adicionada posteriormente sem alterar este módulo.
      </div>
      <RoomsModule />
    </div>;

    if (key === 'arrivals') return <div className="grid gap-4 lg:grid-cols-2">
      <div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Chegadas · {arrivals.length}</h3><div className="space-y-2">{arrivals.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · {r.codigo || r.id}</p><p className="mt-1 text-[10px] text-slate-500">Quarto: {room?.status || '—'} · Governança: {room?.status_governanca || room?.status_housekeeping || '—'}</p></div>; })}{arrivals.length === 0 && <p className="text-xs text-slate-400">Nenhuma chegada prevista.</p>}</div></div>
      <div><h3 className="mb-3 text-xs font-black uppercase text-slate-500">Saídas · {departures.length}</h3><div className="space-y-2">{departures.map(r => { const guest = guestFor(r); const room = roomFor(r); return <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><strong className="text-xs">{guest?.nome || 'Hóspede não identificado'}</strong><p className="mt-1 text-[10px] text-slate-500">Quarto {room?.numero || '—'} · {r.status}</p></div>; })}{departures.length === 0 && <p className="text-xs text-slate-400">Nenhuma saída prevista.</p>}</div></div>
    </div>;

    if (key === 'rooms') return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rooms.map(room => <div key={room.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs">Quarto {room.numero}</strong><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black">{room.status}</span></div><p className="mt-2 text-[10px] text-slate-500">Governança: {room.status_governanca || room.status_housekeeping || 'Não informado'}</p></div>)}</div>;

    return <div className="space-y-2">{taskAlerts.map(card => <div key={card.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs">{card.titulo}</strong><span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">{card.prioridade}</span></div><p className="mt-1 text-[10px] text-slate-500">{assignedName(card)}{card.room_number ? ` · Quarto ${card.room_number}` : ''}</p></div>)}{taskAlerts.length === 0 && <p className="text-xs text-slate-400">Nenhum alerta operacional.</p>}</div>;
  };

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">{definition.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="text-xs text-slate-500">Atendimento, hóspedes, quartos e solicitações em uma única operação.</p></div><button onClick={logout} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600"><LogOut className="h-4 w-4" />Sair</button></div></header>

    <main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <OperationalWorkCenter<PanelKey> sectorName="Recepção" summary={`${occupied} hóspedes no hotel`} items={workItems} activeKey={activePanel} onOpen={setActivePanel} onClose={() => setActivePanel(null)} panelTitle={panelTitle} renderPanel={renderPanel} />

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}

      <ReceptionRoomsKanban
        columns={roomColumns}
        cards={roomCards}
        rooms={rooms}
        reservations={reservations}
        guests={guests}
        savingId={savingRoomId}
        onMove={(card, columnId) => void moveRoomToColumn(card, columnId)}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Recepção · Tarefas</p>
          <h2 className="text-lg font-black text-slate-950">Kanban de tarefas da Recepção</h2>
          <p className="mt-1 text-xs text-slate-500">Solicitações e atendimentos permanecem separados do mapa operacional dos quartos.</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2"><button onClick={() => setScope('mine')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-9 rounded-xl px-3 text-xs font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div><label className="relative block max-w-xl flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar solicitação, quarto, hóspede ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-300" /></label></div>
      </section>

      <ReceptionKanbanBoard
        columns={columns}
        cards={visibleCards}
        currentUserId={currentUser?.id}
        savingId={savingId}
        assignedUserId={assignedUserId}
        assignedName={assignedName}
        onMove={(card, columnId) => void moveToColumn(card, columnId)}
      />
    </main>
  </div>;
};
