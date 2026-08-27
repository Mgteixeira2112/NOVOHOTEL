import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { KanbanModule } from './KanbanModule';
import { KanbanAuditPanel } from './KanbanAuditPanel';

export const KanbanWorkspaceModule: React.FC = () => {
  const { currentUser } = useHotel();
  const [kanbanRevision, setKanbanRevision] = useState(0);
  const role = currentUser?.tipo_usuario || '';
  const canManageAudit = role === 'admin' || role === 'gerente';

  return (
    <>
      <KanbanModule key={kanbanRevision} />
      {canManageAudit && (
        <KanbanAuditPanel
          onRestored={() => setKanbanRevision(revision => revision + 1)}
        />
      )}
    </>
  );
};
