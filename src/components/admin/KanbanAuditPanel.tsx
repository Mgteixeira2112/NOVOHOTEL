import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Clock3,
  History,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KanbanCardAuditEvent, kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { KanbanV2Card } from '../../services/kanbanV2';
import { getOperationalSectorLabel } from '../../domain/operationalSectors';

interface KanbanAuditPanelProps { onRestored?: () => void | Promise<void>; }

const EVENT_LABELS: Record<string, string> = {
  created: 'Criado', updated: 'Editado', moved: 'Status alterado', assigned: 'Responsável alterado',
  completed: 'Concluído', reopened: 'Reaberto', deleted: 'Arquivado', restored: 'Restaurado',
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
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('todos');
  const [responsible, setResponsible] = useState('todos');
  const [room, setRoom] = useState('todos');

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
    if (!archivedResult.available) setMessage('Não foi possível consultar os cards arquivados no Supabase neste momento.');
    else if (!eventsResult.available) setMessage(eventsResult.message || 'O histórico detalhado ainda não está disponível no banco.');
    setLoading(false);
  }, [canManageAudit]);

  useEffect(() => { if (canManageAudit) void loadAudit(); }, [canManageAudit, loadAudit]);

  const actorNames = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => map.set(user.id, user.nome));
    return map;
  }, [users]);

  const filteredArchivedCards = useMemo(() => archivedCards.filter(card => {
    const assigned = card.assigned_to as any;
    const assignedId = (card as any).assigned_user_id || assigned?.id || '';
    const assignedName = assigned?.name || '';
    if (sector !== 'todos' && (card.departamento || 'operacao') !== sector) return false;
    if (responsible !== 'todos') {
      if (responsible === 'sem_responsavel') {
        if (assignedId || assignedName) return false;
      } else if (assignedId !== responsible && assignedName !== responsible) return false;
    }
    if (room !== 'todos') {
      if (room === 'sem_quarto') { if (card.room_number) return false; }
      else if (card.room_number !== room) return false;
    }
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (query) {
      const haystack = [card.titulo, card.descricao, card.room_number, card.departamento, assignedName].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      if (!haystack.includes(query)) return false;
    }
    return true;
  }), [archivedCards, search, sector, responsible, room]);

  const archivedRooms = useMemo(() => Array.from(new Set(archivedCards.map(card => card.room_number).filter(Boolean) as string[])).sort(), [archivedCards]);

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
    } finally { setRestoringId(null); }
  };

  const clearArchiveFilters = () => { setSearch(''); setSector('todos'); setResponsible('todos'); setRoom('todos'); };
  const hasArchiveFilters = Boolean(search.trim() || sector !== 'todos' || responsible !== 'todos' || room !== 'todos');

  return (
    <section id="kanban-admin-archive" className="max-w-[1800px] mx-auto mt-5 rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-6">
      <button type="button" onClick={() => setExpanded(value => !value)} className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-300 grid place-items-center shrink-0"><ShieldCheck className="w-5 h-5" /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap"><h2 className="font-black text-sm text-slate-950">Arquivo e Auditoria do Kanban</h2><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">Gestão</span>{archivedCards.length > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">{archivedCards.length} arquivado{archivedCards.length === 1 ? '' : 's'}</span>}</div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">Consulte cards arquivados manualmente ou automaticamente, filtre e restaure quando necessário.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">{loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}{expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}</div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap gap-2 items-center">
            <label className="relative min-w-[220px] flex-1"><Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nos cards arquivados" className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none" /></label>
            <select value={sector} onChange={e => setSector(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"><option value="todos">Todos os setores</option><option value="operacao">Operação Geral</option><option value="governanca">Governança</option><option value="recepcao">Recepção</option><option value="manutencao">Manutenção</option><option value="cozinha">Cozinha</option></select>
            <select value={responsible} onChange={e => setResponsible(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"><option value="todos">Todos os responsáveis</option><option value="sem_responsavel">Sem responsável</option>{users.filter(u => u.ativo).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>
            <select value={room} onChange={e => setRoom(e.target.value)} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"><option value="todos">Todas as acomodações</option><option value="sem_quarto">Sem acomodação</option>{archivedRooms.map(number => <option key={number} value={number}>Quarto {number}</option>)}</select>
            {hasArchiveFilters && <button type="button" onClick={clearArchiveFilters} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600">Limpar filtros</button>}
            <button type="button" onClick={() => void loadAudit()} disabled={loading} className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
          </div>

          {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">{message}</div>}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ArchiveRestore className="w-4 h-4 text-slate-600" /><h3 className="text-xs font-black text-slate-900">Cards arquivados</h3></div><span className="text-[10px] font-bold text-slate-400">{filteredArchivedCards.length} exibido{filteredArchivedCards.length === 1 ? '' : 's'}</span></div>
              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                {!archiveAvailable ? <div className="p-5 text-xs text-slate-500 text-center">Consulta de arquivados indisponível.</div> : filteredArchivedCards.length === 0 ? <div className="p-6 text-center"><ArchiveRestore className="w-6 h-6 mx-auto text-slate-300 mb-2" /><p className="text-xs font-bold text-slate-600">Nenhum card encontrado</p><p className="text-[11px] text-slate-400 mt-1">Ajuste os filtros ou aguarde novos arquivamentos.</p></div> : filteredArchivedCards.map(card => {
                  const extended = card as any;
                  const assigned = card.assigned_to as any;
                  const autoArchived = events.some(event => event.card_id === card.id && event.source === 'auto_archive');
                  return <div key={card.id} className="p-4 flex items-start gap-3"><div className="min-w-0 flex-1"><div className="font-bold text-xs text-slate-900 break-words">{card.titulo}</div><div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-500"><span>{getOperationalSectorLabel(card.departamento)}</span>{assigned?.name && <span>{assigned.name}</span>}{card.room_number && <span>Quarto {card.room_number}</span>}<span>{formatDateTime(extended.deleted_at || card.updated_at)}</span><span className={`font-black ${autoArchived ? 'text-violet-700' : 'text-amber-700'}`}>{autoArchived ? 'Automático' : 'Manual'}</span></div></div><button type="button" onClick={() => void handleRestore(card)} disabled={Boolean(restoringId)} className="shrink-0 h-8 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1.5 disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" />{restoringId === card.id ? 'Restaurando…' : 'Restaurar'}</button></div>;
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><History className="w-4 h-4 text-slate-600" /><h3 className="text-xs font-black text-slate-900">Linha do tempo</h3></div><span className="text-[10px] font-bold text-slate-400">Últimos {Math.min(events.length, 60)} eventos</span></div>
              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                {!eventsAvailable ? <div className="p-6 text-center"><History className="w-6 h-6 mx-auto text-slate-300 mb-2" /><p className="text-xs font-bold text-slate-600">Histórico detalhado indisponível</p></div> : events.length === 0 ? <div className="p-6 text-xs text-slate-500 text-center">Nenhum evento de auditoria registrado ainda.</div> : events.map(event => {
                  const actorName = event.user_id ? actorNames.get(event.user_id) : null;
                  return <div key={event.id} className="p-4 flex items-start gap-3"><div className="w-7 h-7 rounded-xl bg-slate-100 grid place-items-center shrink-0"><History className="w-3.5 h-3.5 text-slate-500" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-black uppercase tracking-wide text-slate-700">{EVENT_LABELS[event.event_type] || event.event_type}</span><span className="text-xs font-bold text-slate-900 truncate">{eventTitle(event)}</span>{event.source === 'auto_archive' && <span className="text-[9px] font-black rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5">Automático</span>}</div><div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-400"><span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> {formatDateTime(event.created_at)}</span><span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {actorName || event.user_id || 'Sistema'}</span></div></div></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
