import React from 'react';
import { Sparkles, UserRound } from 'lucide-react';
import { ROOM_OPERATIONAL_STATUS, roomOperationalStatusFromCardMetadata } from '../../domain/roomOperationalStatus';
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

const columnTheme = (index: number) => [
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-slate-100 text-slate-700 border-slate-200',
][index] || 'bg-slate-100 text-slate-700 border-slate-200';

export const ReceptionKanbanBoard: React.FC<Props> = ({
  columns,
  cards,
  currentUserId,
  savingId,
  assignedUserId,
  assignedName,
  onMove,
}) => <section className="grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
  {columns.map((column, columnIndex) => {
    const columnCards = cards.filter(card => card.column_id === column.id);
    const theme = columnTheme(columnIndex);
    return <div key={column.id} className="min-h-[250px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${theme}`} />
          <h3 className="truncate text-[10px] font-black uppercase tracking-wide text-slate-800">{column.nome}</h3>
        </div>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-100 px-1 text-[9px] font-black text-slate-500">{columnCards.length}</span>
      </div>

      <div className="space-y-2 p-2">{columnCards.map(card => {
        const assignedId = assignedUserId(card);
        const mine = !!currentUserId && assignedId === currentUserId;
        const roomStatusKey = roomOperationalStatusFromCardMetadata(card.metadata as Record<string, unknown> | undefined);
        const roomStatus = ROOM_OPERATIONAL_STATUS[roomStatusKey];
        return <article key={card.id} className={`rounded-xl border bg-white p-2.5 shadow-sm transition hover:border-blue-300 hover:shadow ${mine ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-[11px] font-black text-slate-900">{card.titulo}</h4>
              <p className="mt-1 truncate text-[9px] font-semibold text-slate-500">{card.room_number ? `Quarto ${card.room_number}` : 'Sem quarto'}{card.guest_name ? ` · ${card.guest_name}` : ''}</p>
            </div>
            <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase ${theme}`}>{card.prioridade || 'normal'}</span>
          </div>

          {card.descricao && <p className="mt-2 line-clamp-2 text-[9px] leading-relaxed text-slate-500">{card.descricao}</p>}

          <div className="mt-2 flex items-center justify-between gap-2 text-[8px] font-semibold text-slate-500">
            <span className="flex min-w-0 items-center gap-1"><UserRound className="h-3 w-3 shrink-0" /><span className="truncate">{assignedName(card)}</span></span>
            <span className="shrink-0">{dateTime(card.updated_at)}</span>
          </div>

          {card.room_number && <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[8px] font-bold uppercase text-slate-400">Quarto</span>
            <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-black ${roomStatus.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full ${roomStatus.dotClass}`} />{roomStatus.label}</span>
          </div>}

          <select disabled={!currentUserId || savingId === card.id} value={card.column_id} onChange={event => onMove(card, event.target.value)}
            className="mt-2 h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[9px] font-bold text-slate-700 outline-none disabled:opacity-50">
            {columns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </article>;
      })}

      {columnCards.length === 0 && <div className="grid min-h-[120px] place-items-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-center">
        <div><Sparkles className="mx-auto h-4 w-4 text-slate-300" /><p className="mt-2 text-[9px] font-bold text-slate-400">Nenhuma solicitação nesta etapa</p></div>
      </div>}
      </div>
    </div>;
  })}
</section>;
