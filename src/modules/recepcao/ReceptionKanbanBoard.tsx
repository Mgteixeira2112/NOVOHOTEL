import React from 'react';
import { Sparkles, UserRound } from 'lucide-react';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';

interface Props {
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
  currentUserId?: string;
  savingId?: string | null;
  assignedUserId: (card: KanbanV2Card) => string;
  assignedName: (card: KanbanV2Card) => string;
  onMove: (card: KanbanV2Card, columnId: string) => void;
}

const dateTime = (value?: string | null) => !value
  ? '—'
  : new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const ReceptionKanbanBoard: React.FC<Props> = ({
  columns,
  cards,
  currentUserId,
  savingId,
  assignedUserId,
  assignedName,
  onMove,
}) => <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
  {columns.map(column => {
    const columnCards = cards.filter(card => card.column_id === column.id);
    return <div key={column.id} className="min-h-[360px] rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">Recepção</p>
          <h3 className="text-xs font-black text-slate-800">{column.nome}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{columnCards.length}</span>
      </div>

      <div className="space-y-3">{columnCards.map(card => {
        const assignedId = assignedUserId(card);
        const mine = !!currentUserId && assignedId === currentUserId;
        return <article key={card.id} className={`rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${mine ? 'border-blue-300 ring-2 ring-blue-300/40' : 'border-slate-200 hover:border-blue-300'}`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700">Recepção</span>
            {mine
              ? <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black uppercase text-white">★ Minha tarefa</span>
              : !assignedId && <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">Sem responsável</span>}
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-400">{column.nome}</p>
              <h4 className="mt-1 text-xs font-black text-slate-900">{card.titulo}</h4>
            </div>
            {card.room_number && <span className="shrink-0 rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-black text-blue-200">Q. {card.room_number}</span>}
          </div>

          {card.guest_name && <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-600"><UserRound className="h-3 w-3" />{card.guest_name}</p>}
          {card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className={`rounded-lg p-2 ${mine ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <span className="text-slate-400">Responsável</span>
              <p className="mt-0.5 truncate font-bold text-slate-700">{assignedName(card)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-slate-400">Atualizado</span>
              <p className="mt-0.5 font-bold text-slate-700">{dateTime(card.updated_at)}</p>
            </div>
          </div>

          <label className="mt-3 block text-[9px] font-black uppercase tracking-wide text-slate-400">Status
            <select
              disabled={!currentUserId || savingId === card.id}
              value={card.column_id}
              onChange={event => onMove(card, event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold normal-case text-slate-700 disabled:opacity-50"
            >
              {columns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
          </label>

          {card.metadata?.source_card_id && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[9px] font-bold text-amber-700">Demanda relacionada a outro setor</p>}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">{card.prioridade || 'normal'}</span>
            <span className="text-[9px] font-bold text-blue-700">Kanban Recepção</span>
          </div>
        </article>;
      })}

      {columnCards.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-slate-300" />
        <p className="mt-2 text-[10px] font-bold text-slate-400">Nenhuma solicitação nesta etapa</p>
      </div>}
      </div>
    </div>;
  })}
</section>;
