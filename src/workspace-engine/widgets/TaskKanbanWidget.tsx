import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Clock3, Pencil, Search, Tag, Trash2, User as UserIcon, Wifi, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { canPerformKanbanAction, defaultKanbanVisibilityScope } from '../../domain/kanbanAccess';
import { isOperationalSectorId, OperationalSectorId } from '../../domain/operationalSectors';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { subscribeKanbanRealtime } from '../../services/kanbanRealtimeSubscription';
import { fetchUserOperationalSectorsState } from '../../services/userSectorService';
import { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { WorkspaceScope } from '../types';
import { executeKanbanWidgetCardCreatedAutomations } from './kanbanWidgetAutomation';
import { readKanbanWidgetPresentationSettings } from './kanbanWidgetPresentation';

const assignedUserId = (card: KanbanV2Card) => (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';
const assignedName = (card: KanbanV2Card) => (card.assigned_to as any)?.name || (card.assigned_to as any)?.nome || 'Sem responsável';
const formatDateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const priorityLabel = (value?: string | null) => ({ critica: 'CRÍTICA', atencao: 'ATENÇÃO', normal: 'NORMAL' }[String(value || 'normal').toLowerCase()] || String(value || 'normal').toUpperCase());
const departmentLabel = (value?: string | null) => ({ governanca: 'Governança', recepcao: 'Recepção', manutencao: 'Manutenção', cozinha: 'Cozinha', operacao: 'Operação Geral' }[String(value || 'operacao').toLowerCase()] || String(value || 'Operação'));

export const TaskKanbanWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { rooms, users, currentUser } = useHotel();
  const boardId = widget.boardId || 'kanban-default-board';
  const presentation = useMemo(() => readKanbanWidgetPresentationSettings(widget), [widget]);
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<WorkspaceScope>('sector');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [automationNotice, setAutomationNotice] = useState('');
  const [userSectorIds, setUserSectorIds] = useState<OperationalSectorId[]>([]);
  const [responsibleSectorMap, setResponsibleSectorMap] = useState<Record<string, OperationalSectorId[]>>({});
  const [responsibleDirectoryAvailable, setResponsibleDirectoryAvailable] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanV2Card | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formDepartment, setFormDepartment] = useState('operacao');
  const [formUserId, setFormUserId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formColumnId, setFormColumnId] = useState('');

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const hasFullKanbanVisibility = userRole === 'admin' || userRole === 'gerente';
  const actionAccessContext = useMemo(() => ({
    userId: currentUser?.id || '',
    role: userRole,
    sectorIds: hasFullKanbanVisibility ? [] : userSectorIds,
    scope: hasFullKanbanVisibility ? ('all' as const) : defaultKanbanVisibilityScope(userRole),
  }), [currentUser?.id, userRole, hasFullKanbanVisibility, userSectorIds]);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser?.id || hasFullKanbanVisibility) {
      setUserSectorIds([]);
      return () => { cancelled = true; };
    }
    void fetchUserOperationalSectorsState(currentUser.id).then(state => {
      if (!cancelled) setUserSectorIds(state.assignment.sectorIds);
    });
    return () => { cancelled = true; };
  }, [currentUser?.id, hasFullKanbanVisibility]);

  useEffect(() => {
    let cancelled = false;
    const activeUsers = users.filter(user => user.ativo && user.id);
    if (activeUsers.length === 0) {
      setResponsibleSectorMap({});
      setResponsibleDirectoryAvailable(false);
      return () => { cancelled = true; };
    }

    void Promise.all(activeUsers.map(async user => ({
      userId: user.id,
      state: await fetchUserOperationalSectorsState(user.id),
    }))).then(results => {
      if (cancelled) return;
      const directory: Record<string, OperationalSectorId[]> = {};
      let available = false;
      results.forEach(({ userId, state }) => {
        if (!state.available) return;
        available = true;
        directory[userId] = state.assignment.sectorIds;
      });
      setResponsibleSectorMap(directory);
      setResponsibleDirectoryAvailable(available);
    });

    return () => { cancelled = true; };
  }, [users]);

  useEffect(() => {
    let cancelled = false;
    void kanbanV2.load(KANBAN_TENANT_ID).then(result => {
      if (cancelled) return;
      setColumns(result.columns.filter(column => column.board_id === boardId).sort((a, b) => a.ordem - b.ordem));
      setCards(result.cards.filter(card => card.board_id === boardId && !card.is_archived));
    }).catch((e: any) => !cancelled && setError(e?.message || 'Não foi possível carregar as tarefas.'));
    const unsubscribe = subscribeKanbanRealtime(KANBAN_TENANT_ID, {
      onInsert: card => {
        if (card.board_id === boardId && !card.is_archived) setCards(cur => cur.some(item => item.id === card.id) ? cur : [...cur, card]);
        if (card.board_id !== boardId || card.is_archived) return;
        void executeKanbanWidgetCardCreatedAutomations({ widget, card, userId: currentUser?.id }).then(results => {
          if (cancelled || results.length === 0) return;
          const created = results.filter(result => result.status === 'created');
          const errors = results.filter(result => result.status === 'error');
          if (errors.length > 0) setAutomationNotice(`Automação: ${errors[0].message}`);
          else if (created.length > 0) setAutomationNotice(`Automação executada: ${created.map(result => result.message).join(' ')}`);
        });
      },
      onUpdate: card => setCards(cur => card.board_id !== boardId || card.is_archived ? cur.filter(item => item.id !== card.id) : cur.some(item => item.id === card.id) ? cur.map(item => item.id === card.id ? card : item) : [...cur, card]),
      onDelete: card => setCards(cur => cur.filter(item => item.id !== card.id)),
      onStatus: setStatus,
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [boardId, widget, currentUser?.id]);

  const visibleCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return cards.filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !q || [card.titulo, card.descricao, card.room_number, card.guest_name, assignedName(card)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q));
  }, [cards, scope, currentUser?.id, search]);

  const displayedColumns = useMemo(() => {
    if (presentation.visibleColumnIds === undefined) return columns;
    const allowed = new Set(presentation.visibleColumnIds);
    return columns.filter(column => allowed.has(column.id));
  }, [columns, presentation.visibleColumnIds]);

  const responsibleUsers = useMemo(() => {
    const activeUsers = users.filter(user => user.ativo);
    if (!responsibleDirectoryAvailable || !isOperationalSectorId(formDepartment)) return activeUsers;
    return activeUsers
      .filter(user => responsibleSectorMap[user.id]?.includes(formDepartment) || user.id === formUserId)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [users, responsibleDirectoryAvailable, responsibleSectorMap, formDepartment, formUserId]);

  const activeRooms = useMemo(() => rooms
    .filter(room => room.ativo !== false)
    .sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'pt-BR', { numeric: true })), [rooms]);

  const canEdit = (card: KanbanV2Card) => widget.permissions?.edit !== false && canPerformKanbanAction(actionAccessContext, 'edit', card);
  const canMove = (card: KanbanV2Card) => widget.permissions?.move !== false && canPerformKanbanAction(actionAccessContext, 'move', card);
  const canAssign = (card: KanbanV2Card) => widget.permissions?.assign !== false && canPerformKanbanAction(actionAccessContext, 'assign', card);
  const canArchive = (card: KanbanV2Card) => widget.permissions?.archive !== false && canPerformKanbanAction(actionAccessContext, 'delete', card);
  const canDelete = (card: KanbanV2Card) => widget.permissions?.delete !== false && hasFullKanbanVisibility && canPerformKanbanAction(actionAccessContext, 'delete', card);

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (!currentUser?.id || savingId || columnId === card.column_id) return;
    if (!canMove(card)) {
      setError('Seu perfil não possui permissão para alterar o status desta tarefa.');
      return;
    }
    setSavingId(card.id); setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser.id });
      setCards(cur => cur.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar a tarefa.'); }
    finally { setSavingId(null); }
  };

  const openEdit = (card: KanbanV2Card) => {
    if (!canEdit(card)) {
      setError('Você pode visualizar esta tarefa, mas não possui permissão para editá-la.');
      return;
    }
    const assigned = card.assigned_to as any;
    setEditingCard(card);
    setFormTitle(card.titulo);
    setFormDescription(card.descricao || '');
    setFormPriority(card.prioridade || 'normal');
    setFormDepartment(card.departamento || 'operacao');
    setFormUserId((card as any).assigned_user_id || assigned?.id || users.find(user => user.nome === assigned?.name)?.id || '');
    setFormRoomNumber(card.room_number || '');
    setFormColumnId(card.column_id);
  };

  const saveEdit = async () => {
    if (!editingCard || !currentUser?.id || !formTitle.trim() || savingId) return;
    if (!canEdit(editingCard)) {
      setError('Seu perfil não possui permissão para salvar esta alteração.');
      return;
    }

    const selectedUser = users.find(user => user.id === formUserId);
    const assignedPayload = selectedUser ? {
      id: selectedUser.id,
      name: selectedUser.nome,
      email: selectedUser.email,
      avatar_url: selectedUser.avatar_url,
      role: selectedUser.tipo_usuario,
    } : null;

    setSavingId(editingCard.id); setError('');
    try {
      let persisted = await kanbanCardGovernance.updateCard(editingCard, {
        titulo: formTitle.trim(),
        descricao: formDescription.trim() || null,
        prioridade: formPriority,
        departamento: editingCard.departamento || formDepartment,
        assigned_to: canAssign(editingCard) ? assignedPayload : editingCard.assigned_to,
        room_number: formRoomNumber.trim() || null,
        location: formRoomNumber.trim() ? `Quarto ${formRoomNumber.trim()}` : 'Geral',
      }, { userId: currentUser.id });
      if (formColumnId && formColumnId !== persisted.column_id && canMove(persisted)) {
        persisted = await kanbanCardGovernance.moveCard(persisted, formColumnId, { userId: currentUser.id });
      }
      setCards(cur => cur.map(item => item.id === persisted.id ? persisted : item));
      setEditingCard(null);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível editar a tarefa.');
    } finally {
      setSavingId(null);
    }
  };

  const archiveCard = async (card: KanbanV2Card) => {
    if (!currentUser?.id || savingId || !canArchive(card)) {
      setError('Seu perfil não possui permissão para arquivar esta tarefa.');
      return;
    }
    if (!window.confirm('Deseja arquivar esta tarefa? Ela permanecerá disponível para auditoria e restauração.')) return;
    setSavingId(card.id); setError('');
    try {
      await kanbanCardGovernance.softDeleteCard(card, { userId: currentUser.id });
      setCards(cur => cur.filter(item => item.id !== card.id));
      if (editingCard?.id === card.id) setEditingCard(null);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível arquivar a tarefa.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteCard = async (card: KanbanV2Card) => {
    if (!savingId && canDelete(card)) {
      if (!window.confirm(`Excluir permanentemente o card "${card.titulo}"? Esta ação não poderá ser desfeita.`)) return;
      if (!window.confirm('Confirma a exclusão DEFINITIVA? Para manter histórico, prefira Arquivar.')) return;
      setSavingId(card.id); setError('');
      try {
        await kanbanV2.deleteCard(card.id);
        setCards(cur => cur.filter(item => item.id !== card.id));
        if (editingCard?.id === card.id) setEditingCard(null);
      } catch (e: any) {
        setError(e?.message || 'Não foi possível excluir definitivamente a tarefa.');
      } finally {
        setSavingId(null);
      }
      return;
    }
    setError('A exclusão permanente é restrita à administração e gerência.');
  };

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h2 className="text-sm font-black">{widget.title || 'Kanban de tarefas'}</h2><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${status === 'SUBSCRIBED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Wifi className="h-3 w-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div><p className="mt-1 text-[10px] text-slate-500">Board {boardId}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setScope('mine')} className={`h-8 rounded-xl px-3 text-[10px] font-black ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu trabalho</button><button onClick={() => setScope('sector')} className={`h-8 rounded-xl px-3 text-[10px] font-black ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>Meu setor</button></div></div>
    <label className="relative mb-4 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa, quarto, hóspede ou responsável" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none" /></label>
    {error && <div className="mb-3 rounded-xl bg-rose-50 p-2 text-[10px] font-bold text-rose-700">{error}</div>}
    {automationNotice && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[10px] font-bold text-amber-800">{automationNotice}</div>}
    {displayedColumns.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-[10px] font-bold text-slate-500">Nenhuma coluna foi selecionada para exibição neste Widget Kanban.</div> : <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">{displayedColumns.map(column => <div key={column.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><strong className="text-[10px] font-black uppercase text-slate-600">{column.nome}</strong><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-slate-500">{visibleCards.filter(card => card.column_id === column.id).length}</span></div><div className="space-y-3">{visibleCards.filter(card => card.column_id === column.id).map(card => <article key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black text-slate-950">{card.titulo}</h3><span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-600">{priorityLabel(card.prioridade)}</span></div>{card.descricao && <p className="mt-3 text-[11px] leading-5 text-slate-500">{card.descricao}</p>}<div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800"><Tag className="h-3 w-3" />{departmentLabel(card.departamento)}</span>{card.room_number && <span className="rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-bold text-amber-300">Quarto {card.room_number}</span>}<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500"><UserIcon className="h-3 w-3" />{assignedName(card)}</span></div><div className="mt-3 border-t border-slate-100 pt-3 text-[9px] text-slate-400"><div>Criado: <strong>{formatDateTime(card.created_at)}</strong></div><div className="mt-1">Alterado: <strong>{formatDateTime(card.updated_at)}</strong></div></div><select disabled={savingId === card.id || !canMove(card)} value={card.column_id} onChange={e => void move(card, e.target.value)} className="mt-3 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50">{displayedColumns.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">{canEdit(card) && <button onClick={() => openEdit(card)} disabled={savingId === card.id} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-bold text-blue-700 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" />Editar</button>}{canArchive(card) && <button onClick={() => void archiveCard(card)} disabled={savingId === card.id} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-bold text-amber-800 disabled:opacity-50"><Archive className="h-3.5 w-3.5" />Arquivar</button>}{canDelete(card) && <button onClick={() => void deleteCard(card)} disabled={savingId === card.id} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>}</div><div className="mt-3 flex items-center gap-1 text-[9px] text-slate-400"><Clock3 className="h-3.5 w-3.5" /> Atualização em tempo real</div></article>)}</div></div>)}</div>}

    {editingCard && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !savingId) setEditingCard(null); }}><div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4"><div><h3 className="text-xl font-black text-slate-950">Editar Tarefa Operacional</h3><p className="mt-1 text-xs font-semibold text-slate-400">Vinculada a Setor, Responsável e Acomodação</p></div><button onClick={() => !savingId && setEditingCard(null)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><div className="grid gap-4"><label className="text-xs font-black text-slate-700">Título da Tarefa *<input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400" /></label><label className="text-xs font-black text-slate-700">Descrição e Observações<textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={4} placeholder="Detalhes específicos da execução..." className="mt-1.5 w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-400" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-slate-700">Setor / Departamento *<select value={formDepartment} disabled className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 disabled:opacity-100"><option value={formDepartment}>{departmentLabel(formDepartment)}</option></select></label><label className="text-xs font-black text-slate-700">Prioridade<select value={formPriority} onChange={e => setFormPriority(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"><option value="normal">Normal</option><option value="atencao">Atenção</option><option value="critica">Crítica</option></select></label><label className="text-xs font-black text-slate-700">Usuário Responsável<select value={formUserId} onChange={e => setFormUserId(e.target.value)} disabled={!canAssign(editingCard)} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"><option value="">-- Sem responsável --</option>{responsibleUsers.map(user => <option key={user.id} value={user.id}>{user.nome}{user.cargo_titulo ? ` (${user.cargo_titulo})` : user.tipo_usuario ? ` (${user.tipo_usuario})` : ''}</option>)}</select><span className="mt-1.5 block text-[10px] font-medium text-slate-400">Lista filtrada pelos usuários vinculados ao setor selecionado.</span></label><label className="text-xs font-black text-slate-700">Quarto (Acomodação)<select value={formRoomNumber} onChange={e => setFormRoomNumber(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"><option value="">-- Nenhum / Geral --</option>{activeRooms.map(room => <option key={room.id} value={room.numero}>Quarto {room.numero}{room.nome ? ` — ${room.nome}` : ''}</option>)}</select></label></div>{canMove(editingCard) && <label className="text-xs font-black text-slate-700">Coluna (Status no Quadro)<select value={formColumnId} onChange={e => setFormColumnId(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900">{displayedColumns.map(column => <option key={column.id} value={column.id}>{column.nome}</option>)}</select></label>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex gap-2">{canArchive(editingCard) && <button onClick={() => void archiveCard(editingCard)} disabled={Boolean(savingId)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 px-4 text-xs font-black text-amber-800 disabled:opacity-50"><Archive className="h-4 w-4" />Arquivar</button>}{canDelete(editingCard) && <button onClick={() => void deleteCard(editingCard)} disabled={Boolean(savingId)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-black text-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" />Excluir</button>}</div><div className="flex gap-2"><button onClick={() => setEditingCard(null)} disabled={Boolean(savingId)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 disabled:opacity-50">Cancelar</button><button onClick={() => void saveEdit()} disabled={Boolean(savingId) || !formTitle.trim()} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-black text-white disabled:opacity-50">{savingId ? 'Salvando…' : 'Salvar Card'}</button></div></div></div></div>}
  </div>;
};
