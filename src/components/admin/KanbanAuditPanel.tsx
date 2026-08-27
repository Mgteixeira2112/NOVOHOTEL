import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Clock3,
  History,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import {
  KanbanCardAuditEvent,
  kanbanCardGovernance,
} from '../../services/kanbanCardGovernanceService';
import { KanbanV2Card } from '../../services/kanbanV2';
import { getOperationalSectorLabel } from '../../domain/operationalSectors';

interface KanbanAuditPanelProps {
  onRestored?: () => void | Promise<void>;
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Criado',
  updated: 'Editado',
  moved: 'Status alterado',
  assigned: 'Responsável alterado',
  completed: 'Concluído',
  reopened: 'Reaberto',
  deleted: 'Arquivado',
  restored: 'Restaurado',
};

function eventTitle(event: KanbanCardAuditEvent): string {
  const toTitle = event.to_value?.titulo;
  const fromTitle = event.from_value?.titulo;
  if (typeof toTitle === 'string' && toTitle) return toTitle;
  if (typeof fromTitle === 'string' && fromTitle) return fromTitle;
  return `Card ${event.card_id}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const KanbanAuditPanel: React.FC<KanbanAuditPanelProps> = ({ onRestored }) => {
  const { currentUser, users } = useHotel();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [archivedCards, setArchivedCards] = useState<KanbanV2Card[]>([]);
  const [events, setEvents] = useState<KanbanCardAuditEvent[]>([]);
  const [archiveAvailable, setArchiveAvailable] = useState(true);
  const [eventsAvailable, setEventsAvailable] = useState(true);
  const [message, setMessage] = useState('');

  const role = currentUser?.tipo_usuario || '';
  const canManageAudit = role === 'admin' || role === 'gerente';

  const loadAudit = useCallback(async () => {
    if (!canManageAudit) return;
    setLoading(true);
    setMessage('');

    const [archivedResult, eventsResult] = await Promise.all([
      kanbanCardGovernance.fetchArchivedCards(),
      kanbanCardGovernance.fetchAuditEvents(60),
    ]);

    setArchivedCards(archivedResult.data);
    setEvents(eventsResult.data);
    setArchiveAvailable(archivedResult.available);
    setEventsAvailable(eventsResult.available);

    if (!archivedResult.available) {
      setMessage('Não foi possível consultar os cards arquivados no Supabase neste momento.');
    } else if (!eventsResult.available) {
      setMessage(eventsResult.message || 'O histórico detalhado ainda não está disponível no banco.');
    }

    setLoading(false);
  }, [canManageAudit]);

  useEffect(() => {
    if (canManageAudit) void loadAudit();
  }, [canManageAudit, loadAudit]);

  const actorNames = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => map.set(user.id, user.nome));
    return map;
  }, [users]);

  if (!canManageAudit) return null;

  const handleRestore = async (card: KanbanV2Card) => {
    if (restoringId) return;
    if (!confirm(`Restaurar a tarefa "${card.titulo}" para o quadro ativo?`)) return;

    setRestoringId(card.id);
    setMessage('');
    try {
      await kanbanCardGovernance.restoreCard(card, { userId: currentUser?.id });
      await loadAudit();
      await onRestored?.();
    } catch (error: any) {
      setMessage(String(error?.message || error || 'Não foi possível restaurar o card.'));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <section className="max-w-[1800px] mx-auto mt-5 rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-300 grid place-items-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-sm text-slate-950">Auditoria do Kanban</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">
                Gestão
              </span>
              {archivedCards.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                  {archivedCards.length} arquivado{archivedCards.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Histórico de ações, exclusão lógica e restauração de tarefas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-slate-500">
              Operador de auditoria: <strong className="text-slate-800">{currentUser?.nome || 'Gestor'}</strong>
            </div>
            <button
              type="button"
              onClick={() => void loadAudit()}
              disabled={loading}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar auditoria
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArchiveRestore className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-black text-slate-900">Cards arquivados</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Exclusão lógica</span>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {!archiveAvailable ? (
                  <div className="p-5 text-xs text-slate-500 text-center">Consulta de arquivados indisponível.</div>
                ) : archivedCards.length === 0 ? (
                  <div className="p-6 text-center">
                    <ArchiveRestore className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Nenhuma tarefa arquivada</p>
                    <p className="text-[11px] text-slate-400 mt-1">Os cards removidos pela gestão aparecerão aqui.</p>
                  </div>
                ) : archivedCards.map(card => {
                  const extended = card as any;
                  return (
                    <div key={card.id} className="p-4 flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 break-words">{card.titulo}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-500">
                          <span>{getOperationalSectorLabel(card.departamento)}</span>
                          {card.room_number && <span>Quarto {card.room_number}</span>}
                          <span>{formatDateTime(extended.deleted_at || card.updated_at)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestore(card)}
                        disabled={Boolean(restoringId)}
                        className="shrink-0 h-8 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {restoringId === card.id ? 'Restaurando…' : 'Restaurar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-black text-slate-900">Linha do tempo</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Últimos {Math.min(events.length, 60)} eventos</span>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {!eventsAvailable ? (
                  <div className="p-6 text-center">
                    <History className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Histórico detalhado aguardando migration</p>
                    <p className="text-[11px] text-slate-400 mt-1">O Kanban continua funcionando normalmente sem bloquear a operação.</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-6 text-xs text-slate-500 text-center">Nenhum evento de auditoria registrado ainda.</div>
                ) : events.map(event => {
                  const actorName = event.user_id ? actorNames.get(event.user_id) : null;
                  return (
                    <div key={event.id} className="p-4 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 grid place-items-center shrink-0">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wide text-slate-700">
                            {EVENT_LABELS[event.event_type] || event.event_type}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{eventTitle(event)}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3 h-3" /> {formatDateTime(event.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {actorName || event.user_id || 'Sistema'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
