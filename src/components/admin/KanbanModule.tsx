import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  DoorClosed,
  GripVertical,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  User as UserIcon,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Board, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { fetchUserOperationalSectorsState } from '../../services/userSectorService';
import {
  canCreateKanbanCardInSector,
  canPerformKanbanAction,
  defaultKanbanCapabilities,
  defaultKanbanVisibilityScope,
  filterKanbanCardsForUser,
} from '../../domain/kanbanAccess';
import { OperationalSectorId, isOperationalSectorId } from '../../domain/operationalSectors';

const DEPARTMENTS: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badgeBg: string; text: string; border: string }[] = [
  { id: 'operacao', label: 'Operação Geral', icon: Building2, badgeBg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  { id: 'governanca', label: 'Governança', icon: Sparkles, badgeBg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  { id: 'recepcao', label: 'Recepção', icon: BellRing, badgeBg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  { id: 'manutencao', label: 'Manutenção', icon: Wrench, badgeBg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  { id: 'cozinha', label: 'Cozinha', icon: UtensilsCrossed, badgeBg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
];

const getDepartmentMeta = (dept?: string | null) => {
  const normalized = (dept || 'operacao').toLowerCase();
  return DEPARTMENTS.find(d => d.id === normalized) || DEPARTMENTS[0];
};

export const KanbanModule: React.FC = () => {
  const { rooms, users, currentUser } = useHotel();
  const [boards, setBoards] = useState<KanbanV2Board[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [activeBoardId, setActiveBoardId] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [userSectorIds, setUserSectorIds] = useState<OperationalSectorId[]>([]);
  const [visibilityStatus, setVisibilityStatus] = useState<'loading' | 'active' | 'fallback'>('loading');
  const [visibilityMessage, setVisibilityMessage] = useState('');
  const [responsibleSectorMap, setResponsibleSectorMap] = useState<Record<string, OperationalSectorId[]>>({});
  const [responsibleDirectoryAvailable, setResponsibleDirectoryAvailable] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanV2Card | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formDepartment, setFormDepartment] = useState('operacao');
  const [formUserId, setFormUserId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formColumnId, setFormColumnId] = useState('');

  const [filterUser, setFilterUser] = useState<string>('todos');
  const [filterRoom, setFilterRoom] = useState<string>('todos');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await kanbanV2.load(KANBAN_TENANT_ID);
      setBoards(result.boards);
      setColumns(result.columns);
      setCards(result.cards);
      setActiveBoardId(current => result.boards.some(b => b.id === current) ? current : (result.boards[0]?.id || ''));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar o Kanban operacional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const cleanup = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => setCards(current => current.some(c => c.id === card.id) ? current : [...current, card]),
      onUpdate: card => setCards(current => current.map(c => c.id === card.id ? card : c)),
      onDelete: card => setCards(current => current.filter(c => c.id !== card.id)),
      onStatus: next => setStatus(next),
    });
    return cleanup;
  }, []);

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const hasFullKanbanVisibility = userRole === 'admin' || userRole === 'gerente';

  useEffect(() => {
    let cancelled = false;

    if (!currentUser?.id) {
      setUserSectorIds([]);
      setVisibilityStatus('fallback');
      setVisibilityMessage('Usuário atual não identificado. A visão completa foi mantida por segurança operacional.');
      return () => { cancelled = true; };
    }

    if (hasFullKanbanVisibility) {
      setUserSectorIds([]);
      setVisibilityStatus('active');
      setVisibilityMessage('Visão gerencial: todos os setores e responsáveis.');
      return () => { cancelled = true; };
    }

    setVisibilityStatus('loading');
    setVisibilityMessage('Carregando setores autorizados…');

    void fetchUserOperationalSectorsState(currentUser.id).then(state => {
      if (cancelled) return;

      if (state.available && state.assignment.sectorIds.length > 0) {
        setUserSectorIds(state.assignment.sectorIds);
        setVisibilityStatus('active');
        setVisibilityMessage('Visão seletiva ativa: seus setores e cards atribuídos diretamente a você.');
        return;
      }

      setUserSectorIds([]);
      setVisibilityStatus('fallback');
      setVisibilityMessage(
        state.available
          ? 'Nenhum setor foi vinculado ao seu usuário. A visão completa foi mantida temporariamente até a configuração do perfil.'
          : 'A estrutura de setores ainda não está disponível no banco. A visão completa foi mantida temporariamente para não ocultar tarefas.',
      );
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

  const selectiveVisibilityActive = !hasFullKanbanVisibility
    && visibilityStatus === 'active'
    && userSectorIds.length > 0
    && Boolean(currentUser?.id);

  const accessCards = useMemo(() => {
    const activeCards = cards.filter(card => !card.is_archived);
    if (!selectiveVisibilityActive || !currentUser?.id) return activeCards;

    return filterKanbanCardsForUser(activeCards, {
      userId: currentUser.id,
      role: userRole,
      sectorIds: userSectorIds,
      scope: defaultKanbanVisibilityScope(userRole),
    });
  }, [cards, currentUser?.id, selectiveVisibilityActive, userRole, userSectorIds]);

  const visibleBoards = useMemo(() => {
    if (!selectiveVisibilityActive) return boards;

    return boards.filter(board => {
      const boardSector = isOperationalSectorId(board.departamento) ? board.departamento : null;
      const belongsToUserSector = boardSector !== null && userSectorIds.includes(boardSector);
      const hasVisibleAssignedCard = accessCards.some(card => card.board_id === board.id);
      return belongsToUserSector || hasVisibleAssignedCard;
    });
  }, [boards, selectiveVisibilityActive, userSectorIds, accessCards]);

  useEffect(() => {
    if (visibleBoards.length === 0) return;
    if (!visibleBoards.some(board => board.id === activeBoardId)) {
      setActiveBoardId(visibleBoards[0].id);
    }
  }, [visibleBoards, activeBoardId]);

  const activeBoard = visibleBoards.find(b => b.id === activeBoardId) || boards.find(b => b.id === activeBoardId);
  const boardColumns = useMemo(() => columns.filter(c => c.board_id === activeBoardId).sort((a, b) => a.ordem - b.ordem), [columns, activeBoardId]);
  const selectedDepartmentBoard = useMemo(
    () => boards.find(board => board.departamento === formDepartment) || activeBoard,
    [boards, formDepartment, activeBoard],
  );
  const modalColumns = useMemo(
    () => columns.filter(column => column.board_id === selectedDepartmentBoard?.id).sort((a, b) => a.ordem - b.ordem),
    [columns, selectedDepartmentBoard?.id],
  );
  const departmentChanged = Boolean(
    editingCard && (editingCard.departamento || 'operacao') !== formDepartment,
  );
  const responsibleUsers = useMemo(() => {
    const activeUsers = users.filter(user => user.ativo);
    if (!responsibleDirectoryAvailable || !isOperationalSectorId(formDepartment)) return activeUsers;

    return activeUsers
      .filter(user => responsibleSectorMap[user.id]?.includes(formDepartment) || user.id === formUserId)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [users, responsibleDirectoryAvailable, responsibleSectorMap, formDepartment, formUserId]);

  const actionAccessContext = useMemo(() => ({
    userId: currentUser?.id || '',
    role: userRole,
    sectorIds: selectiveVisibilityActive ? userSectorIds : [],
    scope: selectiveVisibilityActive ? defaultKanbanVisibilityScope(userRole) : ('all' as const),
  }), [currentUser?.id, userRole, selectiveVisibilityActive, userSectorIds]);

  const baseCapabilities = useMemo(() => defaultKanbanCapabilities(userRole), [userRole]);
  const canCreateInActiveBoard = canCreateKanbanCardInSector(actionAccessContext, activeBoard?.departamento);
  const canEditModalCard = editingCard
    ? canPerformKanbanAction(actionAccessContext, 'edit', editingCard)
    : canCreateInActiveBoard;
  const canMoveModalCard = editingCard
    ? canPerformKanbanAction(actionAccessContext, 'move', editingCard)
    : canCreateInActiveBoard;
  const canAssignModalCard = editingCard
    ? canPerformKanbanAction(actionAccessContext, 'assign', editingCard)
    : baseCapabilities.assign;
  const canDeleteModalCard = editingCard
    ? canPerformKanbanAction(actionAccessContext, 'delete', editingCard)
    : false;

  const boardCards = useMemo(() => {
    return accessCards
      .filter(c => c.board_id === activeBoardId)
      .filter(c => {
        if (filterUser !== 'todos') {
          const assignedUser = c.assigned_to as any;
          if (filterUser === 'sem_responsavel') {
            if (assignedUser?.id || assignedUser?.name) return false;
          } else if (assignedUser?.id !== filterUser && assignedUser?.name !== filterUser) {
            return false;
          }
        }
        if (filterRoom !== 'todos') {
          if (filterRoom === 'sem_quarto') {
            if (c.room_number) return false;
          } else if (c.room_number !== filterRoom) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.ordem - b.ordem);
  }, [accessCards, activeBoardId, filterUser, filterRoom]);

  const handleDepartmentChange = (department: string) => {
    if (!hasFullKanbanVisibility || !canEditModalCard) return;
    setFormDepartment(department);
    const targetBoard = boards.find(board => board.departamento === department);
    const firstColumn = columns
      .filter(column => column.board_id === targetBoard?.id)
      .sort((a, b) => a.ordem - b.ordem)[0];
    if (firstColumn) setFormColumnId(firstColumn.id);

    if (responsibleDirectoryAvailable && isOperationalSectorId(department) && formUserId) {
      const selectedUserSectors = responsibleSectorMap[formUserId] || [];
      if (!selectedUserSectors.includes(department)) setFormUserId('');
    }
  };

  const handleOpenCreateModal = (targetColId?: string) => {
    if (!canCreateInActiveBoard) {
      setError('Seu perfil não possui permissão para criar tarefas neste setor.');
      return;
    }
    setEditingCard(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('normal');
    setFormDepartment(activeBoard?.departamento || 'operacao');
    setFormUserId(hasFullKanbanVisibility ? '' : (currentUser?.id || ''));
    setFormRoomNumber('');
    setFormColumnId(targetColId || boardColumns[0]?.id || '');
    setModalOpen(true);
  };

  const handleOpenEditModal = (card: KanbanV2Card) => {
    if (!canPerformKanbanAction(actionAccessContext, 'edit', card)) {
      setError('Você pode visualizar esta tarefa, mas não possui permissão para editá-la.');
      return;
    }
    setEditingCard(card);
    setFormTitle(card.titulo);
    setFormDescription(card.descricao || '');
    setFormPriority(card.prioridade || 'normal');
    setFormDepartment(card.departamento || activeBoard?.departamento || 'operacao');
    const assigned = card.assigned_to as any;
    setFormUserId(assigned?.id || (users.find(u => u.nome === assigned?.name)?.id) || '');
    setFormRoomNumber(card.room_number || '');
    setFormColumnId(card.column_id);
    setModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!formTitle.trim() || saving) return;

    const canSave = editingCard
      ? canPerformKanbanAction(actionAccessContext, 'edit', editingCard)
      : canCreateInActiveBoard;
    if (!canSave) {
      setError('Seu perfil não possui permissão para salvar esta alteração.');
      return;
    }

    setSaving(true);
    setError('');

    const targetColumn = modalColumns.some(column => column.id === formColumnId)
      ? formColumnId
      : modalColumns[0]?.id;
    if (!targetColumn) {
      setError('Selecione uma coluna válida para o setor informado.');
      setSaving(false);
      return;
    }

    const selectedUser = users.find(u => u.id === formUserId);
    const assignedPayload = selectedUser ? {
      id: selectedUser.id,
      name: selectedUser.nome,
      email: selectedUser.email,
      avatar_url: selectedUser.avatar_url,
      role: selectedUser.tipo_usuario
    } : null;

    try {
      if (editingCard) {
        const canAssign = canPerformKanbanAction(actionAccessContext, 'assign', editingCard);
        const canMove = canPerformKanbanAction(actionAccessContext, 'move', editingCard);
        const effectiveAssignedPayload = canAssign ? assignedPayload : editingCard.assigned_to;
        const effectiveDepartment = hasFullKanbanVisibility
          ? formDepartment
          : (editingCard.departamento || activeBoard?.departamento || 'operacao');
        const changingDepartment = (editingCard.departamento || 'operacao') !== effectiveDepartment;

        let persisted = await kanbanCardGovernance.updateCard(editingCard, {
          titulo: formTitle.trim(),
          descricao: formDescription.trim() || null,
          prioridade: formPriority,
          departamento: effectiveDepartment,
          assigned_to: effectiveAssignedPayload,
          room_number: formRoomNumber.trim() || null,
          location: formRoomNumber ? `Quarto ${formRoomNumber}` : 'Geral',
        }, { userId: currentUser?.id });

        if (!changingDepartment && canMove && editingCard.column_id !== targetColumn) {
          persisted = await kanbanCardGovernance.moveCard(persisted, targetColumn, { userId: currentUser?.id });
        }

        setCards(prev => prev.map(c => c.id === persisted.id ? persisted : c));
      } else {
        const effectiveDepartment = hasFullKanbanVisibility
          ? formDepartment
          : (activeBoard?.departamento || formDepartment);
        const targetBoard = hasFullKanbanVisibility
          ? selectedDepartmentBoard
          : activeBoard;

        if (!targetBoard) throw new Error('O setor selecionado não possui um quadro operacional configurado.');
        if (!canCreateKanbanCardInSector(actionAccessContext, effectiveDepartment)) {
          throw new Error('Seu perfil não possui permissão para criar tarefas neste setor.');
        }

        const newCard = await kanbanCardGovernance.createCard({
          hotelId: KANBAN_TENANT_ID,
          boardId: targetBoard.id,
          columnId: targetColumn,
          titulo: formTitle.trim(),
          descricao: formDescription.trim() || undefined,
          prioridade: formPriority,
          departamento: effectiveDepartment,
          assigned_to: baseCapabilities.assign ? assignedPayload : (currentUser ? {
            id: currentUser.id,
            name: currentUser.nome,
            email: currentUser.email,
            avatar_url: currentUser.avatar_url,
            role: currentUser.tipo_usuario,
          } : null),
          room_number: formRoomNumber.trim() || undefined,
          location: formRoomNumber ? `Quarto ${formRoomNumber}` : 'Geral',
        }, { userId: currentUser?.id });
        setCards(prev => prev.some(c => c.id === newCard.id) ? prev : [...prev, newCard]);
      }

      setModalOpen(false);
      setEditingCard(null);
    } catch (e: any) {
      setError(e?.message || 'Falha ao salvar o card no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveCard = async (card: KanbanV2Card) => {
    if (!canPerformKanbanAction(actionAccessContext, 'delete', card)) {
      setError('Seu perfil não possui permissão para arquivar esta tarefa.');
      return;
    }
    if (!confirm('Deseja arquivar esta tarefa? Ela deixará o quadro ativo, mas permanecerá disponível para auditoria e restauração.')) return;
    setSaving(true);
    setError('');
    try {
      const archived = await kanbanCardGovernance.softDeleteCard(card, { userId: currentUser?.id });
      setCards(prev => prev.map(c => c.id === archived.id ? archived : c));
      setModalOpen(false);
      setEditingCard(null);
    } catch (e: any) {
      setError(e?.message || 'Falha ao arquivar o card.');
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentDeleteCard = async (card: KanbanV2Card) => {
    if (!hasFullKanbanVisibility || !canPerformKanbanAction(actionAccessContext, 'delete', card)) {
      setError('A exclusão permanente é restrita à administração e gerência.');
      return;
    }
    if (!confirm(`Excluir permanentemente o card "${card.titulo}"? Esta ação não poderá ser desfeita.`)) return;
    if (!confirm('Confirma a exclusão DEFINITIVA? Para manter histórico, prefira Arquivar.')) return;

    setSaving(true);
    setError('');
    try {
      await kanbanV2.deleteCard(card.id);
      setCards(prev => prev.filter(c => c.id !== card.id));
      setModalOpen(false);
      setEditingCard(null);
      window.setTimeout(() => { void load(); }, 700);
    } catch (e: any) {
      setError(e?.message || 'Falha ao excluir definitivamente o card.');
    } finally {
      setSaving(false);
    }
  };

  const moveCard = async (card: KanbanV2Card | undefined, targetColumnId: string) => {
    if (!card || card.column_id === targetColumnId || saving) return;
    if (!canPerformKanbanAction(actionAccessContext, 'move', card)) {
      setError('Seu perfil não possui permissão para alterar o status desta tarefa.');
      setDraggingId(null);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const persisted = await kanbanCardGovernance.moveCard(card, targetColumnId, { userId: currentUser?.id });
      setCards(current => current.map(c => c.id === persisted.id ? persisted : c));
    } catch (e: any) {
      setError(e?.message || 'Falha ao mover card no Supabase.');
    } finally {
      setSaving(false);
      setDraggingId(null);
    }
  };

  const activeCount = boardCards.length;
  const doneCount = boardCards.filter(c => c.completed_at).length;

  return (
    <div className="min-h-full bg-slate-50 -m-4 sm:-m-6 p-4 sm:p-6 space-y-5">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <header className="rounded-3xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white grid place-items-center shadow-xs">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Kanbans Operacionais</h1>
                  <p className="text-xs text-slate-500">Gestão visual de tarefas por Setor, Responsável e Acomodação</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  status === 'SUBSCRIBED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {status === 'SUBSCRIBED' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {status === 'SUBSCRIBED' ? 'Tempo Real Ativo' : 'Sincronizando…'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectiveVisibilityActive || hasFullKanbanVisibility
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <UserIcon className="w-3.5 h-3.5" />
                  {hasFullKanbanVisibility ? 'Visão completa' : selectiveVisibilityActive ? 'Meus setores + atribuídos' : 'Visão temporária completa'}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                <span className="font-bold text-slate-700">{activeCount} tarefas ativas</span>
                <span>•</span>
                <span>{doneCount} concluídas</span>
                <span>•</span>
                <span>Operador: <strong>{currentUser?.nome || 'Usuário'}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="todos">Todos os Responsáveis</option>
                  <option value="sem_responsavel">Sem Responsável</option>
                  {users.filter(u => u.ativo).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <DoorClosed className="w-3.5 h-3.5 text-slate-500" />
                <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="todos">Todas as Acomodações</option>
                  <option value="sem_quarto">Sem Quarto Vinculado</option>
                  {rooms.map(r => <option key={r.id} value={r.numero}>Quarto {r.numero}</option>)}
                </select>
              </div>

              <button onClick={() => void load()} className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 text-slate-700 transition active:scale-95 shadow-xs" title="Recarregar dados">
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>

              <button onClick={() => handleOpenCreateModal()} disabled={!activeBoardId || !boardColumns.length || saving || !canCreateInActiveBoard} className="h-10 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-40" title={canCreateInActiveBoard ? 'Criar nova tarefa' : 'Sem permissão para criar neste setor'}>
                <Plus className="w-4 h-4" /> Novo Card
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-semibold">{error}</div>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {!hasFullKanbanVisibility && visibilityStatus !== 'active' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-3.5 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">{visibilityMessage}</div>
          </div>
        )}

        {visibleBoards.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {visibleBoards.map(board => {
              const deptMeta = getDepartmentMeta(board.departamento);
              const DeptIcon = deptMeta.icon;
              const isActive = activeBoardId === board.id;
              const boardCount = accessCards.filter(c => c.board_id === board.id).length;
              return (
                <button key={board.id} onClick={() => setActiveBoardId(board.id)} className={`shrink-0 px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-xs ${isActive ? 'bg-slate-950 text-white border-slate-950 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <DeptIcon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{board.nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'}`}>{boardCount}</span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500 font-medium shadow-xs">Carregando quadros operacionais em tempo real…</div>
        ) : boardColumns.length === 0 ? (
          <div className="rounded-3xl bg-white border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <h2 className="font-black text-slate-900 text-base">Nenhum quadro configurado</h2>
            <p className="text-xs text-slate-500 mt-1">Não há colunas ativas para o quadro selecionado.</p>
          </div>
        ) : (
          <main className="grid gap-4 overflow-x-auto pb-4 items-start" style={{ gridTemplateColumns: `repeat(${Math.max(boardColumns.length, 1)}, minmax(300px, 1fr))` }}>
            {boardColumns.map(column => {
              const columnCards = boardCards.filter(card => card.column_id === column.id);
              return (
                <section key={column.id} onDragOver={e => { if (baseCapabilities.move) e.preventDefault(); }} onDrop={() => void moveCard(boardCards.find(c => c.id === draggingId), column.id)} className="min-h-[560px] rounded-3xl bg-slate-100/70 border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between px-2 pb-3">
                      <div>
                        <h2 className="font-black text-slate-900 text-sm">{column.nome}</h2>
                        <p className="text-[11px] text-slate-400 font-medium">{columnCards.length} {columnCards.length === 1 ? 'item' : 'itens'}</p>
                      </div>
                      <button onClick={() => handleOpenCreateModal(column.id)} disabled={!canCreateInActiveBoard} className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 grid place-items-center text-slate-700 transition disabled:opacity-35 disabled:cursor-not-allowed" title={canCreateInActiveBoard ? 'Adicionar card nesta coluna' : 'Sem permissão para criar neste setor'}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {columnCards.map(card => {
                        const deptMeta = getDepartmentMeta(card.departamento);
                        const assigned = card.assigned_to as any;
                        const assignedName = assigned?.name || (users.find(u => u.id === assigned?.id)?.nome) || null;
                        const canMoveThisCard = canPerformKanbanAction(actionAccessContext, 'move', card);
                        const canEditThisCard = canPerformKanbanAction(actionAccessContext, 'edit', card);
                        const canArchiveThisCard = canPerformKanbanAction(actionAccessContext, 'delete', card);
                        const canPermanentlyDeleteThisCard = hasFullKanbanVisibility && canArchiveThisCard;

                        return (
                          <article
                            key={card.id}
                            draggable={canMoveThisCard}
                            onDragStart={() => { if (canMoveThisCard) setDraggingId(card.id); }}
                            onDragEnd={() => setDraggingId(null)}
                            onClick={() => handleOpenEditModal(card)}
                            className={`group rounded-2xl border bg-white p-3.5 hover:shadow-md transition duration-150 relative space-y-2.5 ${draggingId === card.id ? 'opacity-40 scale-95' : 'border-slate-200 hover:border-slate-300'} ${canMoveThisCard ? 'cursor-grab active:cursor-grabbing' : canEditThisCard ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <GripVertical className={`w-3.5 h-3.5 mt-1 shrink-0 ${canMoveThisCard ? 'text-slate-300 group-hover:text-slate-500' : 'text-slate-200'}`} />
                                <h3 className="font-bold text-xs text-slate-900 leading-snug break-words">{card.titulo}</h3>
                              </div>
                              <span className={`shrink-0 text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${card.prioridade === 'critica' ? 'bg-rose-100 text-rose-700 border border-rose-200' : card.prioridade === 'atencao' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{card.prioridade}</span>
                            </div>

                            {card.descricao && <p className="text-[11px] text-slate-500 line-clamp-2 pl-5">{card.descricao}</p>}

                            <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${deptMeta.badgeBg} ${deptMeta.text} ${deptMeta.border}`}>
                                <deptMeta.icon className="w-2.5 h-2.5" />
                                <span>{deptMeta.label}</span>
                              </span>
                              {card.room_number && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold bg-stone-900 text-amber-400 shadow-2xs">
                                  <DoorClosed className="w-2.5 h-2.5" /><span>Quarto {card.room_number}</span>
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${assignedName ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>
                                <UserIcon className="w-2.5 h-2.5" /><span>{assignedName ? assignedName.split(' ')[0] : 'Sem responsável'}</span>
                              </span>
                            </div>

                            {(canEditThisCard || canArchiveThisCard || canPermanentlyDeleteThisCard) && (
                              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                                {canEditThisCard && (
                                  <button type="button" onClick={e => { e.stopPropagation(); handleOpenEditModal(card); }} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700 hover:bg-blue-100 disabled:opacity-40" title="Editar este card">
                                    <Pencil className="w-3 h-3" /> Editar
                                  </button>
                                )}
                                {canArchiveThisCard && (
                                  <button type="button" onClick={e => { e.stopPropagation(); void handleArchiveCard(card); }} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-800 hover:bg-amber-100 disabled:opacity-40" title="Arquivar mantendo histórico e possibilidade de restauração">
                                    <Archive className="w-3 h-3" /> Arquivar
                                  </button>
                                )}
                                {canPermanentlyDeleteThisCard && (
                                  <button type="button" onClick={e => { e.stopPropagation(); void handlePermanentDeleteCard(card); }} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-black text-rose-700 hover:bg-rose-100 disabled:opacity-40" title="Excluir permanentemente — ação irreversível">
                                    <Trash2 className="w-3 h-3" /> Excluir
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(card.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              {card.completed_at && <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Concluído</span>}
                            </div>
                          </article>
                        );
                      })}

                      {columnCards.length === 0 && (
                        <div onClick={() => { if (canCreateInActiveBoard) handleOpenCreateModal(column.id); }} className={`h-32 rounded-2xl border-2 border-dashed grid place-items-center text-xs transition ${canCreateInActiveBoard ? 'border-slate-200 hover:border-slate-300 hover:bg-white/50 text-slate-400 cursor-pointer' : 'border-slate-200 text-slate-300 cursor-default'}`}>
                          {canCreateInActiveBoard ? '+ Arraste ou clique para adicionar' : 'Sem permissão para criar neste setor'}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </main>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs p-4 grid place-items-center animate-in fade-in" onMouseDown={() => !saving && setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 space-y-4 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-950">{editingCard ? 'Editar Tarefa Operacional' : 'Nova Tarefa Operacional'}</h2>
                <p className="text-xs text-slate-500">Vinculada a Setor, Responsável e Acomodação</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Título da Tarefa *</label>
                <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} disabled={!canEditModalCard} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10 text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex.: Higienizar banheiro e repor toalhas" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Descrição e Observações</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} disabled={!canEditModalCard} className="w-full min-h-20 p-3 rounded-xl border border-slate-200 outline-none resize-none text-xs font-medium disabled:bg-slate-50 disabled:text-slate-500" placeholder="Detalhes específicos da execução…" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-500" /> Setor / Departamento *</label>
                  <select value={formDepartment} onChange={e => handleDepartmentChange(e.target.value)} disabled={!canEditModalCard || !hasFullKanbanVisibility} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500">
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Prioridade</label>
                  <select value={formPriority} onChange={e => setFormPriority(e.target.value)} disabled={!canEditModalCard} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="normal">Normal</option><option value="atencao">Atenção</option><option value="critica">Crítica (Urgente)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1"><UserIcon className="w-3.5 h-3.5 text-slate-500" /> Usuário Responsável</label>
                  <select value={formUserId} onChange={e => setFormUserId(e.target.value)} disabled={!canAssignModalCard} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500" title={canAssignModalCard ? 'Alterar responsável' : 'Atribuição de responsável é restrita ao perfil autorizado'}>
                    <option value="">-- Sem responsável --</option>
                    {responsibleUsers.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.tipo_usuario})</option>)}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {responsibleDirectoryAvailable ? 'Lista filtrada pelos usuários vinculados ao setor selecionado.' : 'Setores de usuários indisponíveis: exibindo lista completa temporariamente.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1"><DoorClosed className="w-3.5 h-3.5 text-slate-500" /> Quarto (Acomodação)</label>
                  <select value={formRoomNumber} onChange={e => setFormRoomNumber(e.target.value)} disabled={!canEditModalCard} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">-- Nenhum / Geral --</option>
                    {rooms.map(r => <option key={r.id} value={r.numero}>Quarto {r.numero} ({r.nome})</option>)}
                  </select>
                </div>
              </div>

              {modalColumns.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Coluna (Status no Quadro)</label>
                  <select value={formColumnId} onChange={e => setFormColumnId(e.target.value)} disabled={!canMoveModalCard || departmentChanged} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500" title={departmentChanged ? 'Ao trocar de setor, o card inicia na primeira coluna do novo quadro.' : canMoveModalCard ? 'Alterar status da tarefa' : 'Sem permissão para alterar o status'}>
                    {modalColumns.map(col => <option key={col.id} value={col.id}>{col.nome}</option>)}
                  </select>
                  {departmentChanged && (
                    <p className="mt-1 text-[10px] font-semibold text-amber-700">Ao salvar a troca de setor, o card entrará na primeira etapa do novo quadro. Depois, o status poderá ser alterado normalmente.</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {editingCard && canDeleteModalCard ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => void handleArchiveCard(editingCard)} disabled={saving} className="px-3.5 py-2.5 rounded-xl border border-amber-200 text-amber-800 hover:bg-amber-50 text-xs font-bold flex items-center gap-1.5 transition">
                    <Archive className="w-4 h-4" /> Arquivar
                  </button>
                  {hasFullKanbanVisibility && (
                    <button type="button" onClick={() => void handlePermanentDeleteCard(editingCard)} disabled={saving} className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition">
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  )}
                </div>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition">Cancelar</button>
                <button type="button" disabled={saving || !formTitle.trim() || !canEditModalCard} onClick={() => void handleSaveCard()} className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black disabled:opacity-40 flex items-center gap-2 shadow-sm transition">
                  {saving ? 'Salvando…' : <><Check className="w-4 h-4" /> Salvar Card</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};