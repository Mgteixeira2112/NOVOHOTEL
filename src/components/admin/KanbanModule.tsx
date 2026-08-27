import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  AlertCircle, 
  Check, 
  Clock3, 
  GripVertical, 
  LayoutDashboard, 
  Plus, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  X,
  DoorClosed,
  User as UserIcon,
  Wrench,
  Sparkles,
  BellRing,
  UtensilsCrossed,
  Building2,
  Trash2,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Board, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { fetchUserOperationalSectorsState } from '../../services/userSectorService';
import { defaultKanbanVisibilityScope, filterKanbanCardsForUser } from '../../domain/kanbanAccess';
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

  // Visibilidade seletiva por usuário e setor. Nunca restringe a visão enquanto
  // a infraestrutura/atribuição não estiver confirmada pelo banco.
  const [userSectorIds, setUserSectorIds] = useState<OperationalSectorId[]>([]);
  const [visibilityStatus, setVisibilityStatus] = useState<'loading' | 'active' | 'fallback'>('loading');
  const [visibilityMessage, setVisibilityMessage] = useState('');

  // Modal de Criação / Edição de Card
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanV2Card | null>(null);
  
  // Campos do formulário
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formDepartment, setFormDepartment] = useState('operacao');
  const [formUserId, setFormUserId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formColumnId, setFormColumnId] = useState('');

  // Filtros rápidos
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

  // Abertura do Modal para Novo Card
  const handleOpenCreateModal = (targetColId?: string) => {
    setEditingCard(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('normal');
    setFormDepartment(activeBoard?.departamento || 'operacao');
    setFormUserId(currentUser?.id || '');
    setFormRoomNumber('');
    setFormColumnId(targetColId || boardColumns[0]?.id || '');
    setModalOpen(true);
  };

  // Abertura do Modal para Edição de Card existente
  const handleOpenEditModal = (card: KanbanV2Card) => {
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

  // Salvar Card (Criação ou Edição)
  const handleSaveCard = async () => {
    if (!formTitle.trim() || saving) return;
    setSaving(true);
    setError('');

    const targetColumn = formColumnId || boardColumns[0]?.id;
    if (!targetColumn) {
      setError('Selecione uma coluna válida.');
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
        // Atualização de card existente
        const updated = await kanbanV2.updateCard(editingCard.id, {
          titulo: formTitle.trim(),
          descricao: formDescription.trim() || null,
          prioridade: formPriority,
          departamento: formDepartment,
          assigned_to: assignedPayload,
          room_number: formRoomNumber.trim() || null,
          location: formRoomNumber ? `Quarto ${formRoomNumber}` : 'Geral',
          column_id: formColumnId,
        });

        // Se mudou de coluna, chama a lógica de movimentação para sincronizar status de quarto se necessário
        if (editingCard.column_id !== formColumnId) {
          await kanbanV2.moveCard(KANBAN_TENANT_ID, editingCard.id, formColumnId);
        }

        setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        // Criação de novo card
        const newCard = await kanbanV2.createCard({
          hotelId: KANBAN_TENANT_ID,
          boardId: activeBoardId,
          columnId: targetColumn,
          titulo: formTitle.trim(),
          descricao: formDescription.trim() || undefined,
          prioridade: formPriority,
          departamento: formDepartment,
          assigned_to: assignedPayload,
          room_number: formRoomNumber.trim() || undefined,
          location: formRoomNumber ? `Quarto ${formRoomNumber}` : 'Geral',
        });
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

  // Excluir card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Deseja realmente remover esta tarefa do quadro?')) return;
    setSaving(true);
    try {
      await kanbanV2.deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      setModalOpen(false);
      setEditingCard(null);
    } catch (e: any) {
      setError(e?.message || 'Falha ao remover o card.');
    } finally {
      setSaving(false);
    }
  };

  // Mover Card via Drag & Drop
  const moveCard = async (card: KanbanV2Card | undefined, targetColumnId: string) => {
    if (!card || card.column_id === targetColumnId || saving) return;
    setSaving(true);
    setError('');
    try {
      const persisted = await kanbanV2.moveCard(KANBAN_TENANT_ID, card.id, targetColumnId);
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
        
        {/* CABEÇALHO OPERACIONAL */}
        <header className="rounded-3xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white grid place-items-center shadow-xs">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                    Kanbans Operacionais
                  </h1>
                  <p className="text-xs text-slate-500">
                    Gestão visual de tarefas por Setor, Responsável e Acomodação
                  </p>
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

            {/* AÇÕES PRINCIPAIS & FILTROS DISCRETOS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* FILTRO POR RESPONSÁVEL */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <select 
                  value={filterUser} 
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Responsáveis</option>
                  <option value="sem_responsavel">Sem Responsável</option>
                  {users.filter(u => u.ativo).map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              {/* FILTRO POR QUARTO */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <DoorClosed className="w-3.5 h-3.5 text-slate-500" />
                <select 
                  value={filterRoom} 
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="todos">Todas as Acomodações</option>
                  <option value="sem_quarto">Sem Quarto Vinculado</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.numero}>Quarto {r.numero}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => void load()} 
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 text-slate-700 transition active:scale-95 shadow-xs"
                title="Recarregar dados"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>

              <button 
                onClick={() => handleOpenCreateModal()} 
                disabled={!activeBoardId || !boardColumns.length || saving} 
                className="h-10 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Novo Card
              </button>
            </div>
          </div>
        </header>

        {/* FEEDBACK DE ERRO */}
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

        {/* ABAS DOS QUADROS OPERACIONAIS (SETORES) */}
        {visibleBoards.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {visibleBoards.map(board => {
              const deptMeta = getDepartmentMeta(board.departamento);
              const DeptIcon = deptMeta.icon;
              const isActive = activeBoardId === board.id;
              const boardCount = accessCards.filter(c => c.board_id === board.id).length;

              return (
                <button 
                  key={board.id} 
                  onClick={() => setActiveBoardId(board.id)} 
                  className={`shrink-0 px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-xs ${
                    isActive 
                      ? 'bg-slate-950 text-white border-slate-950 shadow-md' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <DeptIcon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{board.nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {boardCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* GRID DE COLUNAS DO KANBAN */}
        {loading ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500 font-medium shadow-xs">
            Carregando quadros operacionais em tempo real…
          </div>
        ) : boardColumns.length === 0 ? (
          <div className="rounded-3xl bg-white border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <h2 className="font-black text-slate-900 text-base">Nenhum quadro configurado</h2>
            <p className="text-xs text-slate-500 mt-1">Não há colunas ativas para o quadro selecionado.</p>
          </div>
        ) : (
          <main 
            className="grid gap-4 overflow-x-auto pb-4 items-start" 
            style={{ gridTemplateColumns: `repeat(${Math.max(boardColumns.length, 1)}, minmax(300px, 1fr))` }}
          >
            {boardColumns.map(column => {
              const columnCards = boardCards.filter(card => card.column_id === column.id);

              return (
                <section 
                  key={column.id} 
                  onDragOver={e => e.preventDefault()} 
                  onDrop={() => void moveCard(boardCards.find(c => c.id === draggingId), column.id)} 
                  className="min-h-[560px] rounded-3xl bg-slate-100/70 border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    {/* CABEÇALHO DA COLUNA */}
                    <div className="flex items-center justify-between px-2 pb-3">
                      <div>
                        <h2 className="font-black text-slate-900 text-sm">{column.nome}</h2>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {columnCards.length} {columnCards.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenCreateModal(column.id)}
                        className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 grid place-items-center text-slate-700 transition"
                        title="Adicionar card nesta coluna"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* LISTA DE CARDS DA COLUNA */}
                    <div className="space-y-2.5">
                      {columnCards.map(card => {
                        const deptMeta = getDepartmentMeta(card.departamento);
                        const assigned = card.assigned_to as any;
                        const assignedName = assigned?.name || (users.find(u => u.id === assigned?.id)?.nome) || null;

                        return (
                          <article 
                            key={card.id} 
                            draggable 
                            onDragStart={() => setDraggingId(card.id)} 
                            onDragEnd={() => setDraggingId(null)} 
                            onClick={() => handleOpenEditModal(card)}
                            className={`group rounded-2xl border bg-white p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition duration-150 relative space-y-2.5 ${
                              draggingId === card.id ? 'opacity-40 scale-95' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* TOPO: TÍTULO, GRIP E PRIORIDADE */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0 group-hover:text-slate-500" />
                                <h3 className="font-bold text-xs text-slate-900 leading-snug break-words">
                                  {card.titulo}
                                </h3>
                              </div>
                              <span className={`shrink-0 text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                                card.prioridade === 'critica' 
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                  : card.prioridade === 'atencao' 
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {card.prioridade}
                              </span>
                            </div>

                            {/* DESCRIÇÃO SE EXISTIR */}
                            {card.descricao && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 pl-5">
                                {card.descricao}
                              </p>
                            )}

                            {/* LINHA DE METADADOS: SETOR, QUARTO E RESPONSÁVEL */}
                            <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                              
                              {/* BADGE DE SETOR */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${deptMeta.badgeBg} ${deptMeta.text} ${deptMeta.border}`}>
                                <deptMeta.icon className="w-2.5 h-2.5" />
                                <span>{deptMeta.label}</span>
                              </span>

                              {/* BADGE DE QUARTO (SE VINCULADO) */}
                              {card.room_number && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold bg-stone-900 text-amber-400 shadow-2xs">
                                  <DoorClosed className="w-2.5 h-2.5" />
                                  <span>Quarto {card.room_number}</span>
                                </span>
                              )}

                              {/* BADGE DE USUÁRIO / RESPONSÁVEL */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                                assignedName 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'
                              }`}>
                                <UserIcon className="w-2.5 h-2.5" />
                                <span>{assignedName ? assignedName.split(' ')[0] : 'Sem responsável'}</span>
                              </span>
                            </div>

                            {/* RODAPÉ DO CARD: HORÁRIO DE CRIAÇÃO */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock3 className="w-3 h-3" />
                                {new Date(card.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {card.completed_at && (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Concluído
                                </span>
                              )}
                            </div>
                          </article>
                        );
                      })}

                      {columnCards.length === 0 && (
                        <div 
                          onClick={() => handleOpenCreateModal(column.id)}
                          className="h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-white/50 grid place-items-center text-xs text-slate-400 cursor-pointer transition"
                        >
                          + Arraste ou clique para adicionar
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CARD OPERACIONAL */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs p-4 grid place-items-center animate-in fade-in" 
          onMouseDown={() => !saving && setModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 space-y-4 border border-slate-200" 
            onMouseDown={e => e.stopPropagation()}
          >
            {/* TOPO DO MODAL */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {editingCard ? 'Editar Tarefa Operacional' : 'Nova Tarefa Operacional'}
                </h2>
                <p className="text-xs text-slate-500">
                  Vinculada a Setor, Responsável e Acomodação
                </p>
              </div>
              <button 
                onClick={() => !saving && setModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULÁRIO */}
            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Título da Tarefa *
                </label>
                <input 
                  autoFocus 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)} 
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10 text-sm font-medium" 
                  placeholder="Ex.: Higienizar banheiro e repor toalhas" 
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Descrição e Observações
                </label>
                <textarea 
                  value={formDescription} 
                  onChange={e => setFormDescription(e.target.value)} 
                  className="w-full min-h-20 p-3 rounded-xl border border-slate-200 outline-none resize-none text-xs font-medium" 
                  placeholder="Detalhes específicos da execução…" 
                />
              </div>

              {/* LINHA: SETOR & PRIORIDADE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500" /> Setor / Departamento *
                  </label>
                  <select 
                    value={formDepartment} 
                    onChange={e => setFormDepartment(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select 
                    value={formPriority} 
                    onChange={e => setFormPriority(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    <option value="normal">Normal</option>
                    <option value="atencao">Atenção</option>
                    <option value="critica">Crítica (Urgente)</option>
                  </select>
                </div>
              </div>

              {/* LINHA: USUÁRIO RESPONSÁVEL & QUARTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" /> Usuário Responsável
                  </label>
                  <select 
                    value={formUserId} 
                    onChange={e => setFormUserId(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Não atribuído --</option>
                    {users.filter(u => u.ativo).map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo_usuario})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
                    <DoorClosed className="w-3.5 h-3.5 text-slate-500" /> Quarto (Acomodação)
                  </label>
                  <select 
                    value={formRoomNumber} 
                    onChange={e => setFormRoomNumber(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Nenhum / Geral --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.numero}>Quarto {r.numero} ({r.nome})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELEÇÃO DE COLUNA (STATUS) */}
              {boardColumns.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Coluna (Status no Quadro)
                  </label>
                  <select 
                    value={formColumnId} 
                    onChange={e => setFormColumnId(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    {boardColumns.map(col => (
                      <option key={col.id} value={col.id}>{col.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {editingCard ? (
                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCard.id)}
                  disabled={saving}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving || !formTitle.trim()}
                  onClick={() => void handleSaveCard()}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black disabled:opacity-40 flex items-center gap-2 shadow-sm transition"
                >
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
