import React from 'react';
import { CheckCircle2, ClipboardCheck, Play, Sparkles } from 'lucide-react';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { GOVERNANCA_STAGES, getGovernancaAssignedName } from './governancaWorkspaceModel';

interface GovernancaKanbanBoardProps {
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
  savingId: string | null;
  onMove: (card: KanbanV2Card, columnId: string) => void;
}

const dateTime = (value?: string | null) => !value
  ? '—'
  : new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const GovernancaKanbanBoard: React.FC<GovernancaKanbanBoardProps> = ({ columns, cards, savingId, onMove }) => {
  const orderedColumns = [...columns].sort((a, b) => a.ordem - b.ordem);

  if (orderedColumns.length === 0) {
    return <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center"><Sparkles className="mx-auto h-6 w-6 text-slate-300" /><h3 className="mt-3 text-sm font-black text-slate-700">Quadro do setor não carregado</h3><p className="mt-1 text-xs text-slate-400">As colunas do Kanban serão exibidas aqui assim que o board estiver disponível.</p></div>;
  }

  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {orderedColumns.map(column => {
      const columnCards = cards.filter(card => card.column_id === column.id);
      return <div key={column.id} className="min-h-[220px] rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-3">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Governança</p><h3 className="mt-0.5 text-sm font-black text-slate-800">{column.nome}</h3></div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{columnCards.length}</span>
        </div>
        <div className="space-y-3">
          {columnCards.map(card => <article key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-start justify-between gap-2"><div><h4 className="text-xs font-black text-slate-900">{card.titulo}</h4>{card.room_number && <p className="mt-1 text-[10px] font-black text-amber-700">Quarto {card.room_number}</p>}</div><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-500">{card.prioridade || 'normal'}</span></div>
            {card.descricao && <p className="mt-2 line-clamp-2 text-[10px] text-slate-500">{card.descricao}</p>}
            <div className="mt-3 rounded-xl bg-white p-2.5 text-[9px] text-slate-500"><div className="flex justify-between gap-2"><span>Responsável</span><strong className="truncate text-slate-700">{getGovernancaAssignedName(card) || 'Sem responsável'}</strong></div><div className="mt-1 flex justify-between gap-2"><span>Alterado</span><strong className="text-slate-700">{dateTime(card.updated_at)}</strong></div></div>
            <div className="mt-3">
              {card.column_id === GOVERNANCA_STAGES.pending && <button disabled={savingId === card.id} onClick={() => onMove(card, GOVERNANCA_STAGES.working)} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-[10px] font-black text-white disabled:opacity-40"><Play className="h-3.5 w-3.5" /> Iniciar limpeza</button>}
              {card.column_id === GOVERNANCA_STAGES.working && <button disabled={savingId === card.id} onClick={() => onMove(card, GOVERNANCA_STAGES.inspection)} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-[10px] font-black text-slate-950 disabled:opacity-40"><ClipboardCheck className="h-3.5 w-3.5" /> Enviar para inspeção</button>}
              {card.column_id === GOVERNANCA_STAGES.inspection && <button disabled={savingId === card.id} onClick={() => onMove(card, GOVERNANCA_STAGES.done)} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[10px] font-black text-white disabled:opacity-40"><CheckCircle2 className="h-3.5 w-3.5" /> Liberar quarto</button>}
            </div>
          </article>)}
          {columnCards.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-8 text-center"><p className="text-[10px] font-bold text-slate-400">Nenhuma tarefa nesta etapa</p></div>}
        </div>
      </div>;
    })}
  </section>;
};
