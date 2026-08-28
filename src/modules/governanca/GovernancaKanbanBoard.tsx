import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { GovernancaCardIdentity, getGovernancaSectorStyle } from './GovernancaCardIdentity';
import { getGovernancaAssignedName, getGovernancaAssignedUserId } from './governancaWorkspaceModel';

interface Props {
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
  currentUserId?: string;
  stageLabel: (id: string) => string;
  demandsFor: (cardId: string) => KanbanV2Card[];
  demandSectorLabel: (card: KanbanV2Card) => string;
  demandStatusLabel: (card: KanbanV2Card) => string;
  actionFor: (card: KanbanV2Card) => React.ReactNode;
  onOpenCard: (card: KanbanV2Card) => void;
  onCreateRelated: (card: KanbanV2Card) => void;
}

const dateTime = (value?: string | null) => !value ? '—' : new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const GovernancaKanbanBoard: React.FC<Props> = ({ columns, cards, currentUserId, stageLabel, demandsFor, demandSectorLabel, demandStatusLabel, actionFor, onOpenCard, onCreateRelated }) => <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
  {columns.map(column => {
    const columnCards = cards.filter(card => card.column_id === column.id);
    return <div key={column.id} className="min-h-[360px] rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2.5"><div><p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Governança</p><h3 className="text-xs font-black text-slate-800">{column.nome}</h3></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{columnCards.length}</span></div>
      <div className="space-y-3">{columnCards.map(card => {
        const demands = demandsFor(card.id);
        const assignedId = getGovernancaAssignedUserId(card);
        const mine = !!currentUserId && assignedId === currentUserId;
        return <article key={card.id} role="button" tabIndex={0} onClick={() => onOpenCard(card)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpenCard(card); }} className={`cursor-pointer rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${mine ? 'border-amber-300 ring-2 ring-amber-300/50' : 'border-slate-200 hover:border-amber-300'}`}>
          <GovernancaCardIdentity sector={card.departamento || 'governanca'} mine={mine} unassigned={!assignedId} />
          <div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-black uppercase text-slate-400">{stageLabel(card.column_id)}</p><h4 className="mt-1 text-xs font-black text-slate-900">{card.titulo}</h4></div><div className="flex items-center gap-1.5"><button onClick={event => { event.stopPropagation(); onCreateRelated(card); }} title="Criar tarefa relacionada para outro setor" className="grid h-7 w-7 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"><Plus className="h-3.5 w-3.5" /></button>{card.room_number && <span className="rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-black text-amber-300">Q. {card.room_number}</span>}</div></div>
          {card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]"><div className={`rounded-lg p-2 ${mine ? 'bg-amber-50' : 'bg-slate-50'}`}><span className="text-slate-400">Responsável</span><p className="mt-0.5 truncate font-bold text-slate-700">{getGovernancaAssignedName(card) || 'Sem responsável'}</p></div><div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-400">Atualizado</span><p className="mt-0.5 font-bold text-slate-700">{dateTime(card.updated_at)}</p></div></div>
          {demands.length > 0 && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-wide text-blue-600">Demandas relacionadas</p><div className="mt-1.5 space-y-1">{demands.map(demand => { const sector = getGovernancaSectorStyle(typeof demand.metadata?.target_sector === 'string' ? demand.metadata.target_sector : demand.departamento); return <div key={demand.id} className="flex items-center justify-between gap-2 text-[9px]"><span className="flex min-w-0 items-center gap-1.5"><span className={`h-2 w-2 shrink-0 rounded-full ${sector.dot}`} /><span className="truncate font-bold text-slate-700">{demandSectorLabel(demand)} · {demand.titulo}</span></span><span className="shrink-0 rounded-md bg-white px-1.5 py-1 font-black text-blue-700">{demandStatusLabel(demand)}</span></div>; })}</div></div>}
          <div className="mt-3 flex items-center justify-between gap-2"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">{card.prioridade || 'normal'}</span><span className="text-[9px] font-bold text-amber-700">Clique para detalhes e ações</span></div>{actionFor(card) && <div className="mt-3">{actionFor(card)}</div>}
        </article>;
      })}{columnCards.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center"><Sparkles className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-2 text-[10px] font-bold text-slate-400">Nenhuma tarefa nesta etapa</p></div>}</div>
    </div>;
  })}
</section>;
