import React, { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { getKanbanAutoArchiveRemainingMs } from '../../domain/kanbanArchive';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';

export const KanbanArchiveCountdown: React.FC<{ card: KanbanV2Card; columns: KanbanV2Column[] }> = ({ card, columns }) => {
  const [now, setNow] = useState(() => Date.now());
  const remaining = getKanbanAutoArchiveRemainingMs(card, columns, now);

  useEffect(() => {
    if (remaining === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [remaining === null]);

  if (remaining === null) return null;
  const minutes = Math.max(0, Math.ceil(remaining / 60000));

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
      <Clock3 className="w-3 h-3" />
      {remaining === 0 ? 'Arquivamento pendente' : `Arquiva em até ${minutes} min`}
    </span>
  );
};
