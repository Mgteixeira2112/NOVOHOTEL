import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, BedDouble, ChevronRight, Wrench, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { GOVERNANCA_STAGES } from './governancaWorkspaceModel';

export type WorkCenterInsightKind = 'maintenance' | 'rooms' | 'alerts';

const upsert = (list: KanbanV2Card[], card: KanbanV2Card) =>
  list.some(item => item.id === card.id) ? list.map(item => item.id === card.id ? card : item) : [...list, card];

const roomStatusLabel = (status?: string) => ({
  disponivel: 'Disponível', ocupado: 'Ocupado', manutencao: 'Manutenção', sujo: 'Sujo', limpeza: 'Em limpeza', vistoria: 'Vistoria', bloqueado: 'Bloqueado',
} as Record<string, string>)[status || ''] || status || 'Não informado';

export const GovernancaWorkCenterInsights: React.FC<{ governanceCards: KanbanV2Card[] }> = ({ governanceCards }) => {
  const { rooms } = useHotel();
  const [allCards, setAllCards] = useState<KanbanV2Card[]>([]);
  const [allColumns, setAllColumns] = useState<KanbanV2Column[]>([]);
  const [active, setActive] = useState<WorkCenterInsightKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setAllCards(result.cards.filter(card => !card.is_archived));
      setAllColumns(result.columns);
    });
    const unsubscribe = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => { if (!card.is_archived) setAllCards(current => upsert(current, card)); },
      onUpdate: card => setAllCards(current => card.is_archived ? current.filter(item => item.id !== card.id) : upsert(current, card)),
      onDelete: card => setAllCards(current => current.filter(item => item.id !== card.id)),
      onStatus: () => undefined,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const maintenance = useMemo(() => allCards.filter(card => card.board_id === 'kanban-board-manutencao' || card.departamento === 'manutencao'), [allCards]);
  const maintenanceOpen = maintenance.filter(card => !/resolvido|concluido|finalizado/i.test(card.column_id));
  const roomsAttention = rooms.filter(room => ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(String(room.status).toLowerCase()) || ['sujo', 'limpeza', 'em_limpeza', 'aguardando_vistoria', 'bloqueado'].includes(String(room.status_housekeeping || room.status_governanca || '').toLowerCase()));
  const urgent = governanceCards.filter(card => ['critica', 'urgente', 'alta'].includes(String(card.prioridade).toLowerCase()) && card.column_id !== GOVERNANCA_STAGES.done);
  const inspection = governanceCards.filter(card => card.column_id === GOVERNANCA_STAGES.inspection);
  const unassigned = governanceCards.filter(card => !(card as any).assigned_user_id && !(card.assigned_to as any)?.id && card.column_id !== GOVERNANCA_STAGES.done);
  const alertsCount = urgent.length + inspection.length + unassigned.length;
  const columnName = (card: KanbanV2Card) => allColumns.find(column => column.id === card.column_id)?.nome || card.column_id;

  const cards = [
    { kind: 'maintenance' as const, icon: Wrench, label: 'Manutenção', value: maintenanceOpen.length, detail: maintenanceOpen.length ? `${maintenanceOpen.length} chamados em aberto` : 'Sem chamados em aberto' },
    { kind: 'rooms' as const, icon: BedDouble, label: 'Quartos', value: roomsAttention.length, detail: `${rooms.length} cadastrados · ${roomsAttention.length} requerem atenção` },
    { kind: 'alerts' as const, icon: BellRing, label: 'Alertas do setor', value: alertsCount, detail: `${urgent.length} prioridade · ${inspection.length} inspeção · ${unassigned.length} sem responsável` },
  ];

  return <>
    <div className="grid gap-2 sm:grid-cols-3">
      {cards.map(item => <button key={item.kind} onClick={() => setActive(item.kind)} className="group flex min-h-[74px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50/50">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><item.icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="flex items-baseline gap-2"><strong className="text-xs text-slate-800">{item.label}</strong><b className="text-lg text-slate-950">{item.value}</b></span><span className="block truncate text-[10px] text-slate-500">{item.detail}</span></span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-amber-600" />
      </button>)}
    </div>

    {active && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setActive(null); }}>
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Central de trabalho · Tempo real</p><h2 className="text-lg font-black">{active === 'maintenance' ? 'Manutenção' : active === 'rooms' ? 'Lista de quartos' : 'Alertas do setor'}</h2></div><button onClick={() => setActive(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button></div>
        <div className="p-5">
          {active === 'maintenance' && <div className="space-y-2">{maintenance.length ? maintenance.map(card => <div key={card.id} className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong className="text-xs">{card.titulo}</strong><p className="mt-1 text-[10px] text-slate-500">{card.room_number ? `Quarto ${card.room_number} · ` : ''}{card.descricao || 'Sem descrição'}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{columnName(card)}</span><span className="text-[10px] font-bold uppercase text-amber-700">{card.prioridade}</span></div>) : <p className="text-sm text-slate-400">Nenhum chamado de manutenção.</p>}</div>}
          {active === 'rooms' && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rooms.map(room => <div key={room.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between"><strong className="text-xs">Quarto {room.numero}</strong><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black">{roomStatusLabel(room.status)}</span></div><p className="mt-2 text-[10px] text-slate-500">Governança: {roomStatusLabel(room.status_governanca || room.status_housekeeping)}</p>{room.status_manutencao_motivo && <p className="mt-1 text-[10px] font-bold text-rose-600">{room.status_manutencao_motivo}</p>}<p className="mt-1 text-[10px] text-slate-400">Última limpeza: {room.ultima_limpeza ? new Date(room.ultima_limpeza).toLocaleString('pt-BR') : 'não informada'}</p></div>)}</div>}
          {active === 'alerts' && <div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-[10px] font-black uppercase text-rose-600">Prioridade alta</p><p className="mt-1 text-2xl font-black">{urgent.length}</p><div className="mt-3 space-y-2">{urgent.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase text-amber-700">Aguardando inspeção</p><p className="mt-1 text-2xl font-black">{inspection.length}</p><div className="mt-3 space-y-2">{inspection.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-600">Sem responsável</p><p className="mt-1 text-2xl font-black">{unassigned.length}</p><div className="mt-3 space-y-2">{unassigned.map(card => <p key={card.id} className="text-[10px] font-bold text-slate-700">{card.room_number ? `Q. ${card.room_number} · ` : ''}{card.titulo}</p>)}</div></div></div>}
        </div>
      </div>
    </div>}
  </>;
};
