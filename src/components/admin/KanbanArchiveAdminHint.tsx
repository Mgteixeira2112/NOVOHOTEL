import React from 'react';
import { ArchiveRestore } from 'lucide-react';

export const KanbanArchiveAdminHint: React.FC = () => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-center gap-2">
    <ArchiveRestore className="w-4 h-4 shrink-0" />
    Cards concluídos permanecem cinco minutos na última coluna e depois são arquivados automaticamente. A gestão pode consultá-los e restaurá-los pela auditoria.
  </div>
);
