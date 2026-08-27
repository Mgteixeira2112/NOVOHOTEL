import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { bootstrapLegacyKanbanCards } from '../../services/kanbanLocalBootstrapService';
import { KanbanModule } from './KanbanModule';
import { KanbanAuditPanel } from './KanbanAuditPanel';

export const KanbanWorkspaceModule: React.FC = () => {
  const { currentUser } = useHotel();
  const [kanbanRevision, setKanbanRevision] = useState(0);
  const [bootstrapState, setBootstrapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootstrapMessage, setBootstrapMessage] = useState('Preparando banco operacional…');
  const role = currentUser?.tipo_usuario || '';
  const canManageAudit = role === 'admin' || role === 'gerente';

  const preparePrimaryDatabase = useCallback(async () => {
    setBootstrapState('loading');
    setBootstrapMessage('Verificando tarefas locais antes de carregar o banco principal…');

    const result = await bootstrapLegacyKanbanCards();
    if (!result.available) {
      setBootstrapState('error');
      setBootstrapMessage(
        result.message || 'Não foi possível validar a migração dos cards locais. O quadro não foi carregado para preservar os dados desta sessão.',
      );
      return;
    }

    setBootstrapMessage(
      result.migrated > 0
        ? `${result.migrated} tarefa${result.migrated === 1 ? '' : 's'} local${result.migrated === 1 ? '' : 'is'} preservada${result.migrated === 1 ? '' : 's'} no banco principal.`
        : 'Banco operacional validado.',
    );
    setBootstrapState('ready');
  }, []);

  useEffect(() => {
    void preparePrimaryDatabase();
  }, [preparePrimaryDatabase]);

  if (bootstrapState === 'loading') {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 mx-auto text-slate-500 animate-spin" />
        <h2 className="mt-3 text-sm font-black text-slate-900">Preparando Kanban Operacional</h2>
        <p className="mt-1 text-xs text-slate-500">{bootstrapMessage}</p>
      </div>
    );
  }

  if (bootstrapState === 'error') {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-amber-200 grid place-items-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-amber-950">Proteção de dados do Kanban ativa</h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">{bootstrapMessage}</p>
            <p className="mt-2 text-[11px] text-amber-800">
              Nenhum cache local foi apagado. Tente novamente quando a conexão com o Supabase estiver disponível.
            </p>
            <button
              type="button"
              onClick={() => void preparePrimaryDatabase()}
              className="mt-4 h-9 px-3.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-black inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

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
