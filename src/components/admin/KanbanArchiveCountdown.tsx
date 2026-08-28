import React, { useEffect, useState } from 'react';
import { CalendarClock, Clock3, History } from 'lucide-react';
import { getKanbanAutoArchiveRemainingMs } from '../../domain/kanbanArchive';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';

function formatCardDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const KanbanArchiveCountdown: React.FC<{ card: KanbanV2Card; columns: KanbanV2Column[] }> = ({ card, columns }) => {
  const [now, setNow] = useState(() => Date.now());
  const remaining = getKanbanAutoArchiveRemainingMs(card, columns, now);

  useEffect(() => {
    if (remaining === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [remaining === null]);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-1 text-[9px] font-semibold text-slate-400">
        <span className="inline-flex items-center gap-1" title="Data e hora de criação do card"><CalendarClock className="w-3 h-3 shrink-0" /> Criado: <strong className="text-slate-600">{formatCardDateTime(card.created_at)}</strong></span>
        <span className="inline-flex items-center gap-1" title="Data e hora da última alteração do card"><History className="w-3 h-3 shrink-0" /> Alterado: <strong className="text-slate-600">{formatCardDateTime(card.updated_at)}</strong></span>
      </div>
      {remaining !== null && (
        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
          <Clock3 className="w-3 h-3" />
          {remaining === 0 ? 'Arquivamento pendente' : `Arquiva em até ${Math.max(0, Math.ceil(remaining / 60000))} min`}
        </span>
      )}
    </div>
  );
};
