import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  KanbanBoard, 
  KanbanCard, 
  KanbanColumn, 
  KanbanPriority, 
  KanbanViewMode,
  KanbanCardComment,
  KanbanChecklistItem,
  KanbanCardAssignee,
  KanbanSlaMetrics
} from '../types/kanban';
import { INITIAL_KANBAN_BOARDS, INITIAL_KANBAN_CARDS } from '../data/mockKanbanData';
import { SoundNotificationService } from '../utils/soundHelper';
import { useHotel } from './HotelContext';
import { useFrigobar } from './FrigobarContext';
import { 
  getUserDepartment, 
  isUserAdmin, 
  canUserViewBoard, 
  canUserViewCard, 
  playDifferentiatedNotificationSound 
} from '../utils/kanbanPermissions';

interface LiveEventNotification {
  id: string;
  message: string;
  department: string;
  type: 'info' | 'success' | 'urgent' | 'personal';
  designationLabel?: string;
  timestamp: string;
}

export type KanbanUserScope = 'all' | 'my_cards' | 'my_department';

interface KanbanContextType {
  boards: KanbanBoard[];
  cards: KanbanCard[];
  visibleBoards: KanbanBoard[];
  visibleCards: KanbanCard[];
  activeBoardId: string;
  setActiveBoardId: (id: string) => void;
  activeBoard: KanbanBoard;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  viewMode: KanbanViewMode;
  setViewMode: (mode: KanbanViewMode) => void;
  
  // Escopo de Visualização do Usuário (Admin vs Colaborador)
  isAdmin: boolean;
  userDepartment: string;
  userScopeMode: KanbanUserScope;
  setUserScopeMode: (mode: KanbanUserScope) => void;
  
  // Filtros
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (a: string) => void;
  slaFilter: string;
  setSlaFilter: (s: string) => void;
  
  // Modais e Seleções
  selectedCard: KanbanCard | null;
  setSelectedCard: (card: KanbanCard | null) => void;
  isCreateCardModalOpen: boolean;
  setIsCreateCardModalOpen: (open: boolean) => void;
  isEditBoardModalOpen: boolean;
  setIsEditBoardModalOpen: (open: boolean) => void;
  isCreateColumnModalOpen: boolean;
  setIsCreateColumnModalOpen: (open: boolean) => void;
  
  // Notificações em Tempo Real
  liveEvent: LiveEventNotification | null;
  clearLiveEvent: () => void;
  
  // Sincronização 100% com o Hotel PMS (Quartos, Reservas, Manutenção, Consumos, Financeiro)
  syncAllFromPMS: () => { syncedCount: number; message: string };
  isSyncing: boolean;
  lastSyncTime: string;

  // Métricas
  slaMetrics: KanbanSlaMetrics;

  // Ações de Cartões
  moveCard: (cardId: string, targetColumnId: string, targetBoardId?: string) => void;
  createCard: (cardData: Omit<KanbanCard, 'id' | 'created_at' | 'order' | 'comments' | 'checklist'> & { comments?: KanbanCardComment[]; checklist?: KanbanChecklistItem[] }) => KanbanCard;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
  deleteCard: (cardId: string) => void;
  addCardComment: (cardId: string, content: string) => void;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  addChecklistItem: (cardId: string, text: string) => void;
  assignCard: (cardId: string, assignee: KanbanCardAssignee | null) => void;
  delegateCard: (cardId: string, targetDepartment: string, notes?: string) => void;
  quickRestockFrigobarCard: (cardId: string) => void;
  
  // Customização de Estrutura (Admin / Gerente)
  addColumn: (boardId: string, title: string, color?: string, isFinal?: boolean, isInProgress?: boolean) => void;
  updateColumn: (columnId: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (columnId: string) => void;
  addBoard: (board: Omit<KanbanBoard, 'id' | 'columns'> & { columns?: KanbanColumn[] }) => void;
  updateBoard: (boardId: string, updates: Partial<KanbanBoard>) => void;
  deleteBoard: (boardId: string) => void;
  resetToDefaults: () => void;
  
  // Simulações em Tempo Real (Demonstração do Fluxo Cross-Department)
  simulateIncomingEvent: (type: 'reception_to_maintenance' | 'room_service_order' | 'housekeeping_turnover' | 'guest_extra_pillow' | 'minibar_restock_needed' | 'almoxarifado_low_stock') => void;
  playTestSound: (soundType: 'personal' | 'department' | 'urgent' | 'delegation' | 'success') => void;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

const LOCAL_STORAGE_BOARDS_KEY = 'centenario_hotel_kanban_boards_v2';
const LOCAL_STORAGE_CARDS_KEY = 'centenario_hotel_kanban_cards_v2';
const LOCAL_STORAGE_SOUND_KEY = 'centenario_hotel_kanban_sound_enabled';

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    rooms, 
    setRoomStatus, 
    reservations, 
    updateReservationStatus, 
    blocks, 
    deleteBlock, 
    payments, 
    guests, 
    currentUser, 
    hotelConfig 
  } = useHotel();

  const {
    products: frigobarProducts,
    roomMinibars,
    getRoomMinibarSummary,
    quickRestockRoom
  } = useFrigobar();

  const isAdmin = useMemo(() => isUserAdmin(currentUser), [currentUser]);
  const userDepartment = useMemo(() => getUserDepartment(currentUser), [currentUser]);

  // Status de Sincronização com o PMS
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });

  // Estados principais persistidos
  const [boards, setBoards] = useState<KanbanBoard[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOARDS_KEY);
      if (saved) {
        const parsed: KanbanBoard[] = JSON.parse(saved);
        // Garantir que todos os quadros padrão (incluindo Almoxarifado) existam
        INITIAL_KANBAN_BOARDS.forEach((initB) => {
          if (!parsed.some((b) => b.id === initB.id)) {
            parsed.push(initB);
          }
        });
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar boards salvos', e);
    }
    return INITIAL_KANBAN_BOARDS;
  });

  const [cards, setCards] = useState<KanbanCard[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
      if (saved) {
        const parsed: KanbanCard[] = JSON.parse(saved);
        // Garantir que os cards iniciais do Almoxarifado existam se nenhum estiver presente
        const hasAlmoxCards = parsed.some((c) => c.board_id === 'almoxarifado');
        if (!hasAlmoxCards) {
          const almoxCards = INITIAL_KANBAN_CARDS.filter((c) => c.board_id === 'almoxarifado');
          return [...parsed, ...almoxCards];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar cards salvos', e);
    }
    return INITIAL_KANBAN_CARDS;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Quadros visíveis para o perfil do usuário
  const visibleBoards = useMemo(() => {
    if (isAdmin) return boards;
    const filtered = boards.filter((b) => canUserViewBoard(b, currentUser));
    return filtered.length > 0 ? filtered : boards;
  }, [boards, isAdmin, currentUser]);

  // Quadro ativo
  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    const defaultBoard = isUserAdmin(currentUser) 
      ? 'recepcao' 
      : (boards.find(b => canUserViewBoard(b, currentUser))?.id || 'recepcao');
    return defaultBoard;
  });

  // Escopo de visualização: 'all' (apenas admin), 'my_department' (setor), 'my_cards' (somente as minhas)
  const [userScopeMode, setUserScopeMode] = useState<KanbanUserScope>(() => {
    return isUserAdmin(currentUser) ? 'all' : 'my_department';
  });

  // Atualizar escopo e quadro ativo quando o usuário logado mudar para exibir o Kanban completo do seu setor
  useEffect(() => {
    if (currentUser) {
      const dept = getUserDepartment(currentUser);
      const targetBoard = boards.find((b) => b.department === dept || b.id === dept);
      if (targetBoard) {
        setActiveBoardId(targetBoard.id);
      } else if (!isUserAdmin(currentUser) && visibleBoards.length > 0) {
        setActiveBoardId(visibleBoards[0].id);
      }

      if (!isUserAdmin(currentUser)) {
        setUserScopeMode('my_department');
      } else {
        setUserScopeMode('all');
      }
    }
  }, [currentUser, boards, visibleBoards]);

  // Garantir que o usuário não-admin esteja sempre em um quadro acessível
  useEffect(() => {
    if (!isAdmin && visibleBoards.length > 0) {
      const isCurrentAllowed = visibleBoards.some((b) => b.id === activeBoardId);
      if (!isCurrentAllowed) {
        setActiveBoardId(visibleBoards[0].id);
      }
    }
  }, [isAdmin, visibleBoards, activeBoardId]);

  // Cartões visíveis calculados de acordo com as permissões e escopo
  const visibleCards = useMemo(() => {
    if (isAdmin && userScopeMode === 'all') {
      return cards;
    }

    if (userScopeMode === 'my_cards') {
      return cards.filter((c) => {
        const isAssigned = (c.assigned_to?.id && c.assigned_to.id === currentUser?.id) ||
          (c.assigned_to?.name && currentUser?.nome && c.assigned_to.name.trim().toLowerCase() === currentUser.nome.trim().toLowerCase());
        return isAssigned;
      });
    }

    // Para colaboradores ou modo 'my_department': apenas tarefas direcionadas a ele ou ao seu setor
    return cards.filter((c) => {
      const b = boards.find((x) => x.id === c.board_id);
      return canUserViewCard(c, b, currentUser);
    });
  }, [cards, boards, isAdmin, userScopeMode, currentUser]);

  // Modo de visualização (Quadro Kanban | Monitor de Cozinha KDS / Painel TV | Métricas SLA | Tabela)
  const [viewMode, setViewMode] = useState<KanbanViewMode>('board');

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');

  // Modais e Seleções
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState<boolean>(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState<boolean>(false);
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState<boolean>(false);

  // Notificação de evento ao vivo (live ping)
  const [liveEvent, setLiveEvent] = useState<LiveEventNotification | null>(null);

  // Sincronizar com localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOARDS_KEY, JSON.stringify(boards));
    } catch (e) {
      console.error(e);
    }
  }, [boards]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  }, [cards]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    SoundNotificationService.setSoundEnabled(enabled);
    try {
      localStorage.setItem(LOCAL_STORAGE_SOUND_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Board atual selecionado com fallback
  const activeBoard = useMemo(() => {
    const found = boards.find((b) => b.id === activeBoardId);
    return found || boards[0] || INITIAL_KANBAN_BOARDS[0];
  }, [boards, activeBoardId]);

  const clearLiveEvent = useCallback(() => {
    setLiveEvent(null);
  }, []);

  // Auto-dispensa do banner de evento ao vivo após 6 segundos
  useEffect(() => {
    if (!liveEvent) return;
    const timer = setTimeout(() => {
      setLiveEvent(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [liveEvent]);

  // Helper para localizar o quarto associado ao cartão por número ou nome
  const findRoomByCard = useCallback((card: KanbanCard) => {
    if (card.room_number) {
      const r = rooms.find((room) => room.numero === card.room_number);
      if (r) return r;
    }
    const match = card.location.match(/\b(\d{1,4})\b/);
    if (match) {
      const num = match[1];
      const r = rooms.find((room) => room.numero === num || room.numero.endsWith(num));
      if (r) return r;
    }
    return rooms.find((room) => card.location.toLowerCase().includes(room.nome.toLowerCase()));
  }, [rooms]);

  // Ações de Cartões com Sincronização Bidirecional Reversa ao PMS
  const moveCard = useCallback((cardId: string, targetColumnId: string, targetBoardId?: string) => {
    const nowIso = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setCards((prevCards) => {
      const cardIndex = prevCards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prevCards;

      const currentCard = prevCards[cardIndex];
      const boardToUse = targetBoardId || currentCard.board_id;
      const targetBoard = boards.find((b) => b.id === boardToUse);
      const targetColumn = targetBoard?.columns.find((col) => col.id === targetColumnId);

      const updates: Partial<KanbanCard> = {
        column_id: targetColumnId,
        board_id: boardToUse,
        just_created: false
      };

      // Se moveu para coluna de "Em Andamento" e não tem responsável, auto-atribui ao usuário logado
      if (targetColumn?.is_in_progress) {
        if (!currentCard.started_at) {
          updates.started_at = nowIso;
        }
        if (!currentCard.assigned_to && currentUser) {
          updates.assigned_to = {
            id: currentUser.id,
            name: currentUser.nome,
            role: currentUser.cargo_titulo || currentUser.tipo_usuario,
            avatar: currentUser.avatar
          };
        }
      }

      // Se moveu para coluna final (concluído / liberado)
      if (targetColumn?.is_final) {
        updates.completed_at = nowIso;
        SoundNotificationService.playSuccessSound();
      }

      // --- SINCRONIZAÇÃO REVERSA BIDIRECIONAL COM O PMS ---
      
      // 1. Quadro de Governança
      if (boardToUse === 'governanca') {
        const rm = findRoomByCard(currentCard);
        if (rm) {
          if (targetColumnId === 'gov_liberado') {
            setRoomStatus(rm.id, 'limpo');
            setLiveEvent({
              id: `sync_rm_${Date.now()}`,
              message: `✨ Governança: Quarto ${rm.numero} liberado e marcado como LIMPO no PMS!`,
              department: 'governanca',
              type: 'success',
              designationLabel: 'Quarto Liberado',
              timestamp: timeFormatted
            });
          } else if (targetColumnId === 'gov_revisao') {
            setRoomStatus(rm.id, 'inspecionado');
          } else if (targetColumnId === 'gov_em_andamento') {
            setRoomStatus(rm.id, 'limpeza');
          } else if (targetColumnId === 'gov_a_limpar') {
            setRoomStatus(rm.id, 'sujo');
          }
        }
      }

      // 2. Quadro de Manutenção
      if (boardToUse === 'manutencao') {
        const rm = findRoomByCard(currentCard);
        if (rm) {
          if (targetColumnId === 'man_resolvido') {
            setRoomStatus(rm.id, 'limpo');
            const activeBlock = blocks.find((b) => b.quarto_id === rm.id);
            if (activeBlock) {
              deleteBlock(activeBlock.id);
            }
            setLiveEvent({
              id: `sync_man_${Date.now()}`,
              message: `🔧 Manutenção: Chamado resolvido! Quarto ${rm.numero} liberado e desbloqueado no PMS.`,
              department: 'manutencao',
              type: 'success',
              designationLabel: 'Manutenção Concluída',
              timestamp: timeFormatted
            });
          } else if (targetColumnId === 'man_conserto' || targetColumnId === 'man_fila') {
            setRoomStatus(rm.id, 'manutencao');
          }
        }
      }

      // 3. Quadro de Recepção
      if (boardToUse === 'recepcao') {
        if (currentCard.reservation_id) {
          const res = reservations.find((r) => r.id === currentCard.reservation_id);
          if (res) {
            if ((targetColumnId === 'rec_atendimento' || targetColumnId === 'rec_solicitacoes') && res.status === 'confirmada') {
              updateReservationStatus(res.id, 'checkin_realizado', { checkinTime: nowIso });
              setRoomStatus(res.quarto_id, 'ocupado');
              setLiveEvent({
                id: `sync_res_${Date.now()}`,
                message: `🏨 Recepção: Check-in da Reserva #${res.codigo_reserva} efetivado no PMS!`,
                department: 'recepcao',
                type: 'success',
                designationLabel: 'Check-in Realizado',
                timestamp: timeFormatted
              });
            } else if (targetColumnId === 'rec_checkouts' && res.status === 'checkin_realizado') {
              updateReservationStatus(res.id, 'checkout_concluido', { checkoutTime: nowIso });
              setRoomStatus(res.quarto_id, 'limpeza');
              
              // Gera automaticamente cartão na Governança pós check-out
              const rm = rooms.find((r) => r.id === res.quarto_id);
              const gst = guests.find((g) => g.id === res.hospede_id);
              const govCard: KanbanCard = {
                id: `gov_post_co_${Date.now()}`,
                board_id: 'governanca',
                column_id: 'gov_a_limpar',
                title: `Higienização Pós Check-out: Quarto ${rm?.numero || ''}`,
                location: `Quarto ${rm?.numero || ''} (${rm?.nome || ''})`,
                room_number: rm?.numero,
                priority: 'atencao',
                sla_target_minutes: 40,
                created_at: nowIso,
                origin_department: 'Recepção (Check-out)',
                guest_name: gst?.nome || 'Saída de Hóspede',
                summary_category: 'Turnover Completo:',
                comments: [
                  {
                    id: `c_${Date.now()}`,
                    author_name: currentUser?.nome || 'Sistema PMS',
                    content: `Check-out concluído na Recepção da reserva #${res.codigo_reserva}. Quarto enviado para higienização completa.`,
                    created_at: nowIso,
                    is_system: true
                  }
                ],
                checklist: [
                  { id: 'ck_g1', text: 'Troca completa de roupa de cama e toalhas', completed: false },
                  { id: 'ck_g2', text: 'Desinfecção profunda e higienização do banheiro', completed: false },
                  { id: 'ck_g3', text: 'Conferência e reposição do frigobar', completed: false },
                  { id: 'ck_g4', text: 'Vistoria de itens esquecidos e liberação', completed: false }
                ],
                tags: ['Check-out', 'Limpeza Geral'],
                order: 0,
                just_created: true
              };
              
              setTimeout(() => {
                setCards((prev) => [govCard, ...prev]);
              }, 100);

              setLiveEvent({
                id: `sync_co_${Date.now()}`,
                message: `🛎️ Recepção: Check-out da Reserva #${res.codigo_reserva} concluído! Cartão gerado na Governança.`,
                department: 'recepcao',
                type: 'info',
                designationLabel: 'Check-out Concluído',
                timestamp: timeFormatted
              });
            }
          }
        }
      }

      // 4. Quadro de Cozinha
      if (boardToUse === 'cozinha' && targetColumnId === 'coz_concluido') {
        setLiveEvent({
          id: `sync_coz_${Date.now()}`,
          message: `🍽️ Cozinha: Pedido "${currentCard.title}" em ${currentCard.location} finalizado e entregue!`,
          department: 'cozinha',
          type: 'success',
          designationLabel: 'Pedido Entregue',
          timestamp: timeFormatted
        });
      }

      // 5. Quadro Financeiro
      if (boardToUse === 'financeiro' && targetColumnId === 'fin_concluido') {
        setLiveEvent({
          id: `sync_fin_${Date.now()}`,
          message: `💰 Financeiro: Item "${currentCard.title}" auditado e conciliado no PMS!`,
          department: 'financeiro',
          type: 'success',
          designationLabel: 'Conciliação Concluída',
          timestamp: timeFormatted
        });
      }

      // 6. Quadro de Almoxarifado & Frigobar
      if (boardToUse === 'almoxarifado') {
        const rm = findRoomByCard(currentCard);
        if (targetColumnId === 'alm_concluido') {
          if (rm) {
            quickRestockRoom(rm.numero, currentUser?.nome);
          }
          // Marcar todos os checklists como concluídos automaticamente
          if (currentCard.checklist && currentCard.checklist.length > 0) {
            updates.checklist = currentCard.checklist.map((item) => ({ ...item, completed: true }));
          }
          setLiveEvent({
            id: `sync_alm_${Date.now()}`,
            message: `📦 Almoxarifado & Frigobar: "${currentCard.title}" 100% abastecido e estoque sincronizado!`,
            department: 'almoxarifado',
            type: 'success',
            designationLabel: 'Abastecimento Concluído',
            timestamp: timeFormatted
          });
        } else if (targetColumnId === 'alm_separacao') {
          setLiveEvent({
            id: `sync_alm_sep_${Date.now()}`,
            message: `🛒 Almoxarifado: Itens para "${currentCard.title}" separados e em rota de entrega.`,
            department: 'almoxarifado',
            type: 'info',
            designationLabel: 'Separação de Itens',
            timestamp: timeFormatted
          });
        }
      }

      // Adiciona comentário de log de transição
      const columnName = targetColumn?.title || targetColumnId;
      const newComment: KanbanCardComment = {
        id: `c_move_${Date.now()}`,
        author_name: currentUser?.nome || 'Operador',
        author_role: currentUser?.tipo_usuario,
        content: `Moveu o cartão para "${columnName}"`,
        created_at: nowIso,
        is_system: true
      };

      const updatedCard: KanbanCard = {
        ...currentCard,
        ...updates,
        comments: [...currentCard.comments, newComment]
      };

      const newCards = [...prevCards];
      newCards[cardIndex] = updatedCard;
      return newCards;
    });
  }, [boards, currentUser, rooms, reservations, blocks, guests, setRoomStatus, updateReservationStatus, deleteBlock, findRoomByCard, quickRestockRoom]);

  // Sincronização 100% Completa de Todas as Entidades do PMS para os Quadros Kanban
  const syncAllFromPMS = useCallback(() => {
    setIsSyncing(true);
    const nowIso = new Date().toISOString();
    const newCardsToAdd: KanbanCard[] = [];
    let syncedCount = 0;

    // 1. Sincronizar Quartos com Governança e Manutenção
    rooms.forEach((room) => {
      if (room.status === 'sujo' || room.status === 'limpeza') {
        const existing = cards.find(
          (c) => c.board_id === 'governanca' && 
          (c.room_number === room.numero || c.location.includes(room.numero)) &&
          c.column_id !== 'gov_liberado'
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_gov_${room.id}_${Date.now()}`,
            board_id: 'governanca',
            column_id: room.status === 'limpeza' ? 'gov_em_andamento' : 'gov_a_limpar',
            title: `Higienização Quarto ${room.numero}`,
            location: `Quarto ${room.numero} (${room.nome})`,
            room_number: room.numero,
            priority: 'atencao',
            sla_target_minutes: 35,
            created_at: nowIso,
            origin_department: 'Sincronização PMS (Quartos)',
            summary_category: 'Status Quarto PMS:',
            order_items: ['Higienização padrão', 'Troca de enxoval'],
            comments: [
              {
                id: `c_s_${Date.now()}`,
                author_name: 'Motor de Sincronização PMS',
                content: `Quarto detectado como "${room.status.toUpperCase()}" na grade do hotel. Cartão sincronizado automaticamente.`,
                created_at: nowIso,
                is_system: true
              }
            ],
            checklist: [
              { id: 'sck1', text: 'Higienização e desinfecção', completed: false },
              { id: 'sck2', text: 'Conferência frigobar e comodidades', completed: false },
              { id: 'sck3', text: 'Inspeção final e liberação', completed: false }
            ],
            tags: ['PMS Sync', 'Quarto'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      } else if (room.status === 'manutencao') {
        const existing = cards.find(
          (c) => c.board_id === 'manutencao' && 
          (c.room_number === room.numero || c.location.includes(room.numero)) &&
          c.column_id !== 'man_resolvido'
        );
        if (!existing) {
          const relatedBlock = blocks.find((b) => b.quarto_id === room.id);
          newCardsToAdd.push({
            id: `sync_man_${room.id}_${Date.now()}`,
            board_id: 'manutencao',
            column_id: 'man_fila',
            title: `Reparo Quarto ${room.numero}: ${relatedBlock?.motivo || 'Manutenção Ativa'}`,
            location: `Quarto ${room.numero} (${room.nome})`,
            room_number: room.numero,
            priority: 'critica',
            sla_target_minutes: 45,
            created_at: nowIso,
            origin_department: 'Sincronização PMS (Bloqueios)',
            summary_category: 'Ordem de Serviço:',
            order_items: [relatedBlock?.motivo || 'Verificação técnica geral'],
            comments: [
              {
                id: `c_sm_${Date.now()}`,
                author_name: 'Motor de Sincronização PMS',
                content: `Quarto bloqueado para manutenção no PMS. Motivo: ${relatedBlock?.motivo || 'Reparo técnico'}.`,
                created_at: nowIso,
                is_system: true
              }
            ],
            checklist: [
              { id: 'smck1', text: 'Diagnóstico técnico inicial', completed: false },
              { id: 'smck2', text: 'Execução do reparo / peças', completed: false },
              { id: 'smck3', text: 'Teste funcional e liberação', completed: false }
            ],
            tags: ['PMS Sync', 'Manutenção'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      }
    });

    // 2. Sincronizar Reservas (Recepção & Financeiro)
    reservations.forEach((res) => {
      const rm = rooms.find((r) => r.id === res.quarto_id);
      const gst = guests.find((g) => g.id === res.hospede_id);
      
      if (res.status === 'confirmada') {
        const existing = cards.find(
          (c) => c.board_id === 'recepcao' && (c.reservation_id === res.id || c.title.includes(res.codigo_reserva))
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_rec_${res.id}_${Date.now()}`,
            board_id: 'recepcao',
            column_id: 'rec_checkins',
            title: `Check-in: ${gst?.nome || 'Hóspede'} (#${res.codigo_reserva})`,
            location: `Quarto ${rm?.numero || ''} (${rm?.nome || ''})`,
            reservation_id: res.id,
            room_number: rm?.numero,
            guest_name: gst?.nome,
            priority: 'normal',
            sla_target_minutes: 15,
            created_at: nowIso,
            amount: res.valor_total,
            origin_department: 'Motor de Reservas PMS',
            summary_category: 'Check-in Agendado:',
            order_items: [
              `Período: ${res.checkin} a ${res.checkout}`,
              `Adultos: ${res.adultos}, Crianças: ${res.criancas}`,
              `Valor Total: R$ ${res.valor_total.toFixed(2)}`
            ],
            comments: [
              {
                id: `c_srec_${Date.now()}`,
                author_name: 'Motor de Sincronização PMS',
                content: `Reserva confirmada no PMS. Check-in previsto para ${res.checkin}.`,
                created_at: nowIso,
                is_system: true
              }
            ],
            checklist: [
              { id: 'srck1', text: 'Conferir documento / FNRH Digital', completed: false },
              { id: 'srck2', text: 'Emitir chave / PIN Smart Lock', completed: false },
              { id: 'srck3', text: 'Entregar boas-vindas e efetivar check-in', completed: false }
            ],
            tags: ['Reserva', 'Check-in'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      } else if (res.status === 'checkin_realizado') {
        const existing = cards.find(
          (c) => c.board_id === 'recepcao' && (c.reservation_id === res.id || c.title.includes(res.codigo_reserva))
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_inhouse_${res.id}_${Date.now()}`,
            board_id: 'recepcao',
            column_id: 'rec_atendimento',
            title: `Hóspede In-House: ${gst?.nome || 'Hóspede'}`,
            location: `Quarto ${rm?.numero || ''}`,
            reservation_id: res.id,
            room_number: rm?.numero,
            guest_name: gst?.nome,
            priority: 'normal',
            sla_target_minutes: 20,
            created_at: nowIso,
            amount: res.valor_total,
            origin_department: 'Front Desk PMS',
            summary_category: 'Estadia Ativa:',
            order_items: [`Quarto ${rm?.numero}`, `Check-out: ${res.checkout}`],
            comments: [],
            checklist: [
              { id: 'sik1', text: 'Atendimento e suporte ao hóspede', completed: true },
              { id: 'sik2', text: 'Acompanhamento de consumos e solicitações', completed: false }
            ],
            tags: ['In-House', 'Hóspede Ativo'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      }
    });

    // 3. Sincronizar Pagamentos Pendentes com Financeiro
    payments.forEach((pay) => {
      if (pay.status === 'pendente') {
        const existing = cards.find(
          (c) => c.board_id === 'financeiro' && c.title.includes(pay.reserva_id)
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_fin_${pay.id}_${Date.now()}`,
            board_id: 'financeiro',
            column_id: 'fin_pendente',
            title: `Auditoria de Pagamento: Reserva #${pay.reserva_id.substring(0, 8)}`,
            location: 'Financeiro / Recepção',
            priority: 'critica',
            sla_target_minutes: 30,
            created_at: nowIso,
            amount: pay.valor,
            origin_department: 'Módulo Financeiro',
            summary_category: 'Auditoria de Recebimento:',
            order_items: [
              `Método: ${pay.metodo.toUpperCase()}`,
              `Valor: R$ ${pay.valor.toFixed(2)}`
            ],
            comments: [],
            checklist: [
              { id: 'fck1', text: 'Verificar comprovante bancário', completed: false },
              { id: 'fck2', text: 'Conciliar e dar baixa no PMS', completed: false }
            ],
            tags: ['Financeiro', 'PIX'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      }
    });

    // 4. Sincronizar Frigobares que precisam de reposição com o Almoxarifado
    roomMinibars.forEach((mb) => {
      const summary = getRoomMinibarSummary(mb.quarto_numero);
      if (summary.needsRestock) {
        const existing = cards.find(
          (c) => c.board_id === 'almoxarifado' && 
          (c.room_number === mb.quarto_numero || c.location.includes(mb.quarto_numero)) &&
          c.column_id !== 'alm_concluido'
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_alm_${mb.quarto_numero}_${Date.now()}`,
            board_id: 'almoxarifado',
            column_id: 'alm_reposicao',
            title: `Reposição Frigobar Quarto ${summary.quartoNumero}`,
            location: `Quarto ${summary.quartoNumero}`,
            room_number: summary.quartoNumero,
            priority: summary.status === 'critico_vazio' ? 'critica' : 'atencao',
            sla_target_minutes: 20,
            created_at: nowIso,
            origin_department: 'Frigobar & Almoxarifado',
            summary_category: `Itens em Falta (${summary.missingCount} un.):`,
            order_items: summary.missingList.map((m) => `${m.missing}x ${m.product.nome}`),
            comments: [
              {
                id: `c_alm_${Date.now()}`,
                author_name: 'Monitor de Frigobar PMS',
                content: `Quarto com nível de abastecimento em ${summary.percentage}%. ${summary.missingCount} itens pendentes de reposição.`,
                created_at: nowIso,
                is_system: true
              }
            ],
            checklist: summary.missingList.map((m, idx) => ({
              id: `alck_sync_${idx}_${Date.now()}`,
              text: `Repor ${m.missing}x ${m.product.nome}`,
              completed: false
            })),
            tags: ['Frigobar', 'Reposição', `Quarto ${summary.quartoNumero}`],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      }
    });

    // 5. Sincronizar Produtos com Estoque Baixo no Almoxarifado Central
    frigobarProducts.forEach((prod) => {
      if (prod.estoque_central <= prod.estoque_minimo) {
        const existing = cards.find(
          (c) => c.board_id === 'almoxarifado' && 
          c.column_id === 'alm_estoque_critico' &&
          c.title.includes(prod.nome)
        );
        if (!existing) {
          newCardsToAdd.push({
            id: `sync_alm_stk_${prod.id}_${Date.now()}`,
            board_id: 'almoxarifado',
            column_id: 'alm_estoque_critico',
            title: `Estoque Crítico: ${prod.nome} (${prod.estoque_central} ${prod.unidade})`,
            location: 'Almoxarifado Central',
            priority: prod.estoque_central === 0 ? 'critica' : 'atencao',
            sla_target_minutes: 60,
            created_at: nowIso,
            origin_department: 'Monitor de Estoque Central',
            summary_category: 'Alerta de Reposição de Compras:',
            order_items: [
              `Estoque Atual: ${prod.estoque_central} ${prod.unidade}`,
              `Estoque Mínimo: ${prod.estoque_minimo} ${prod.unidade}`,
              `Fornecedor: ${prod.fornecedor_padrao || 'Distribuidora Mantiqueira'}`
            ],
            comments: [
              {
                id: `c_stk_${Date.now()}`,
                author_name: 'Monitor de Almoxarifado',
                content: `Estoque central atingiu ${prod.estoque_central} unidades, abaixo do mínimo de segurança (${prod.estoque_minimo}).`,
                created_at: nowIso,
                is_system: true
              }
            ],
            checklist: [
              { id: `ck_stk_1_${Date.now()}`, text: `Emitir pedido de compra para ${prod.fornecedor_padrao || 'Fornecedor'}`, completed: false },
              { id: `ck_stk_2_${Date.now()}`, text: 'Receber lote, conferir NF e dar entrada no almoxarifado', completed: false }
            ],
            tags: ['Almoxarifado', 'Estoque Baixo', 'Compras'],
            order: 0,
            just_created: true
          });
          syncedCount++;
        }
      }
    });

    if (newCardsToAdd.length > 0) {
      setCards((prev) => [...newCardsToAdd, ...prev]);
    }

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastSyncTime(timeString);
    setIsSyncing(false);

    SoundNotificationService.playSuccessSound();

    setLiveEvent({
      id: `sync_ev_${Date.now()}`,
      message: `🔄 Sincronização 100% Concluída: ${syncedCount} itens sincronizados entre PMS e Kanban!`,
      department: 'recepcao',
      type: 'success',
      designationLabel: 'PMS 100% Sincronizado',
      timestamp: timeString
    });

    return {
      syncedCount,
      message: `Sincronização 100% concluída com sucesso! ${syncedCount} novos cartões atualizados.`
    };
  }, [rooms, reservations, blocks, guests, payments, cards, roomMinibars, getRoomMinibarSummary, frigobarProducts]);

  const createCard = useCallback((cardData: Omit<KanbanCard, 'id' | 'created_at' | 'order' | 'comments' | 'checklist'> & { comments?: KanbanCardComment[]; checklist?: KanbanChecklistItem[] }) => {
    const id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    
    const newCard: KanbanCard = {
      ...cardData,
      id,
      created_at: nowIso,
      order: 0,
      comments: cardData.comments || [
        {
          id: `c_init_${Date.now()}`,
          author_name: currentUser?.nome || 'Sistema PMS',
          author_role: currentUser?.tipo_usuario,
          content: 'Cartão de serviço criado no sistema.',
          created_at: nowIso,
          is_system: true
        }
      ],
      checklist: cardData.checklist || [],
      just_created: true
    };

    setCards((prev) => [newCard, ...prev]);

    // Disparo de Alerta Sonoro Inteligente e Diferenciado (Pessoal, Setor, Crítico ou Geral)
    const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);

    // Alerta visual de live event com rótulo de designação
    setLiveEvent({
      id: `ev_${Date.now()}`,
      message: `Novo chamado: "${newCard.title}" em ${newCard.location}`,
      department: newCard.board_id,
      type: newCard.priority === 'critica' ? 'urgent' : (audioResult.soundType === 'personal' ? 'personal' : 'info'),
      designationLabel: audioResult.label,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    return newCard;
  }, [currentUser]);

  const updateCard = useCallback((cardId: string, updates: Partial<KanbanCard>) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return { ...c, ...updates };
      })
    );
    setSelectedCard((prev) => (prev && prev.id === cardId ? { ...prev, ...updates } : prev));
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard((prev) => (prev && prev.id === cardId ? null : prev));
  }, []);

  const addCardComment = useCallback((cardId: string, content: string) => {
    if (!content.trim()) return;
    const nowIso = new Date().toISOString();
    const comment: KanbanCardComment = {
      id: `comment_${Date.now()}`,
      author_id: currentUser?.id,
      author_name: currentUser?.nome || 'Colaborador',
      author_role: currentUser?.tipo_usuario,
      content: content.trim(),
      created_at: nowIso
    };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          comments: [...c.comments, comment]
        };
      })
    );

    setSelectedCard((prev) => {
      if (!prev || prev.id !== cardId) return prev;
      return {
        ...prev,
        comments: [...prev.comments, comment]
      };
    });
  }, [currentUser]);

  const toggleChecklistItem = useCallback((cardId: string, itemId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const updatedChecklist = c.checklist.map((item) => {
          if (item.id !== itemId) return item;
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            completed_by: nextCompleted ? currentUser?.nome : undefined,
            completed_at: nextCompleted ? new Date().toISOString() : undefined
          };
        });
        return { ...c, checklist: updatedChecklist };
      })
    );

    setSelectedCard((prev) => {
      if (!prev || prev.id !== cardId) return prev;
      const updatedChecklist = prev.checklist.map((item) => {
        if (item.id !== itemId) return item;
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completed_by: nextCompleted ? currentUser?.nome : undefined,
          completed_at: nextCompleted ? new Date().toISOString() : undefined
        };
      });
      return { ...prev, checklist: updatedChecklist };
    });
  }, [currentUser]);

  const addChecklistItem = useCallback((cardId: string, text: string) => {
    if (!text.trim()) return;
    const newItem: KanbanChecklistItem = {
      id: `chk_${Date.now()}`,
      text: text.trim(),
      completed: false
    };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          checklist: [...c.checklist, newItem]
        };
      })
    );

    setSelectedCard((prev) => {
      if (!prev || prev.id !== cardId) return prev;
      return {
        ...prev,
        checklist: [...prev.checklist, newItem]
      };
    });
  }, []);

  const assignCard = useCallback((cardId: string, assignee: KanbanCardAssignee | null) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return { ...c, assigned_to: assignee };
      })
    );
    setSelectedCard((prev) => (prev && prev.id === cardId ? { ...prev, assigned_to: assignee } : prev));
  }, []);

  // Ação Rápida: Repor Frigobar e Concluir Cartão Diretamente
  const quickRestockFrigobarCard = useCallback((cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const rm = findRoomByCard(card);
    if (rm) {
      quickRestockRoom(rm.numero, currentUser?.nome);
    }
    const updatedChecklist = (card.checklist || []).map((item) => ({ ...item, completed: true }));
    updateCard(cardId, {
      column_id: 'alm_concluido',
      completed_at: new Date().toISOString(),
      checklist: updatedChecklist
    });
    SoundNotificationService.playSuccessSound();
    setLiveEvent({
      id: `restock_ev_${Date.now()}`,
      message: `📦 Frigobar do ${card.location} abastecido com sucesso! Cartão concluído e estoque sincronizado.`,
      department: 'almoxarifado',
      type: 'success',
      designationLabel: 'Frigobar Abastecido',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }, [cards, findRoomByCard, quickRestockRoom, currentUser, updateCard]);

  // Delegação entre setores (ex: Recepção repassa para Manutenção)
  const delegateCard = useCallback((cardId: string, targetDepartment: string, notes?: string) => {
    const targetBoard = boards.find((b) => b.id === targetDepartment || b.department === targetDepartment);
    if (!targetBoard || targetBoard.columns.length === 0) return;

    const firstColumn = targetBoard.columns[0];
    const nowIso = new Date().toISOString();

    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card) return prev;

      const originDeptName = boards.find((b) => b.id === card.board_id)?.title || card.board_id;
      const targetDeptName = targetBoard.title;

      const delegateComment: KanbanCardComment = {
        id: `c_del_${Date.now()}`,
        author_name: currentUser?.nome || 'Recepção',
        author_role: currentUser?.tipo_usuario,
        content: `Encaminhou este chamado de "${originDeptName}" para o quadro de "${targetDeptName}". ${notes ? `Observação: ${notes}` : ''}`,
        created_at: nowIso,
        is_system: true
      };

      return prev.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          board_id: targetBoard.id,
          column_id: firstColumn.id,
          origin_department: originDeptName,
          delegated_to_department: targetDeptName,
          comments: [...c.comments, delegateComment],
          just_created: true
        };
      });
    });

    // Disparo de som de delegação / transferência
    SoundNotificationService.playDelegationSound();
    
    setLiveEvent({
      id: `ev_del_${Date.now()}`,
      message: `Chamado transferido para ${targetBoard.title}`,
      department: targetBoard.id,
      type: 'info',
      designationLabel: `Repassado para ${targetBoard.title}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }, [boards, currentUser]);

  // Gestão de Colunas (Admin / Gerente)
  const addColumn = useCallback((boardId: string, title: string, color?: string, isFinal?: boolean, isInProgress?: boolean) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const newCol: KanbanColumn = {
          id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          board_id: boardId,
          title: title.trim(),
          color: color || '#64748b',
          order: b.columns.length + 1,
          is_final: isFinal,
          is_in_progress: isInProgress
        };
        return {
          ...b,
          columns: [...b.columns, newCol]
        };
      })
    );
  }, []);

  const updateColumn = useCallback((columnId: string, updates: Partial<KanbanColumn>) => {
    setBoards((prev) =>
      prev.map((b) => {
        const hasCol = b.columns.some((col) => col.id === columnId);
        if (!hasCol) return b;
        return {
          ...b,
          columns: b.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
        };
      })
    );
  }, []);

  const deleteColumn = useCallback((columnId: string) => {
    setBoards((prev) =>
      prev.map((b) => {
        const hasCol = b.columns.some((col) => col.id === columnId);
        if (!hasCol) return b;
        return {
          ...b,
          columns: b.columns.filter((col) => col.id !== columnId)
        };
      })
    );
    // Move cartões da coluna excluída para a primeira coluna restante do quadro
    setCards((prev) => {
      return prev.map((c) => {
        if (c.column_id !== columnId) return c;
        const board = boards.find((b) => b.id === c.board_id);
        const remainingCols = board?.columns.filter((col) => col.id !== columnId) || [];
        if (remainingCols.length > 0) {
          return { ...c, column_id: remainingCols[0].id };
        }
        return c;
      });
    });
  }, [boards]);

  // Gestão de Quadros (Admin / Gerente)
  const addBoard = useCallback((boardData: Omit<KanbanBoard, 'id' | 'columns'> & { columns?: KanbanColumn[] }) => {
    const id = `board_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBoard: KanbanBoard = {
      ...boardData,
      id,
      is_custom: true,
      columns: boardData.columns || [
        { id: `col_${Date.now()}_1`, board_id: id, title: 'A Fazer', order: 1, color: '#ef4444' },
        { id: `col_${Date.now()}_2`, board_id: id, title: 'Em Andamento', order: 2, color: '#f59e0b', is_in_progress: true },
        { id: `col_${Date.now()}_3`, board_id: id, title: 'Concluído', order: 3, color: '#10b981', is_final: true }
      ]
    };

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(id);
  }, []);

  const updateBoard = useCallback((boardId: string, updates: Partial<KanbanBoard>) => {
    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, ...updates } : b)));
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setCards((prev) => prev.filter((c) => c.board_id !== boardId));
    setActiveBoardId('recepcao');
  }, []);

  const resetToDefaults = useCallback(() => {
    setBoards(INITIAL_KANBAN_BOARDS);
    setCards(INITIAL_KANBAN_CARDS);
    setActiveBoardId('recepcao');
    try {
      localStorage.removeItem(LOCAL_STORAGE_BOARDS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CARDS_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Simulações Interativas em Tempo Real (Demonstração do Fluxo Cross-Department e WebSocket Mock)
  const simulateIncomingEvent = useCallback((type: 'reception_to_maintenance' | 'room_service_order' | 'housekeeping_turnover' | 'guest_extra_pillow') => {
    const nowIso = new Date().toISOString();
    
    if (type === 'reception_to_maintenance') {
      // Exemplo prático do prompt: Hóspede liga na recepção relatando ar condicionado do Q. 302
      const newCard: KanbanCard = {
        id: `sim_m_${Date.now()}`,
        board_id: 'manutencao',
        column_id: 'man_fila',
        title: 'Ar Condicionado Q. 302 Sem Refrigeração',
        location: 'Quarto 302',
        priority: 'critica',
        sla_target_minutes: 30,
        created_at: nowIso,
        origin_department: 'Recepção (Chamada Telefônica)',
        delegated_to_department: 'Manutenção & Engenharia',
        guest_name: 'Dr. Roberto Silveira',
        comments: [
          {
            id: `sc_1_${Date.now()}`,
            author_name: 'Gabriel Ribeiro (Recepção)',
            author_role: 'recepcionista',
            content: 'Hóspede informou pelo ramal 9 que o aparelho está ligado mas não resfria. Prioridade máxima.',
            created_at: nowIso
          }
        ],
        checklist: [
          { id: `sck_1`, text: 'Inspecionar compressor e gás refrigerante', completed: false },
          { id: `sck_2`, text: 'Limpar filtros de ar', completed: false },
          { id: `sck_3`, text: 'Testar sensor do controle remoto', completed: false }
        ],
        tags: ['Urgência', 'Ar Condicionado', 'VIP'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('manutencao');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '⚡ URGENTE: Recepção repassou chamado de Ar Condicionado no Q. 302 para a Manutenção!',
        department: 'manutencao',
        type: 'urgent',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'room_service_order') {
      // Pedido novo na Cozinha via App do Hóspede
      const newCard: KanbanCard = {
        id: `sim_c_${Date.now()}`,
        board_id: 'cozinha',
        column_id: 'coz_novos',
        title: 'Filé Mignon ao Poivre + Vinho Reserva',
        location: 'Suíte Presidencial 301',
        priority: 'critica',
        sla_target_minutes: 25,
        created_at: nowIso,
        amount: 198.00,
        guest_name: 'Alice Guimarães',
        origin_department: 'App do Hóspede (Room Service)',
        order_items: [
          '1x Medalhão de Mignon ao Molho Poivre Vert',
          '1x Risoto de Parmesão Trufado',
          '1x Garrafa Vinho Tinto Gran Reserva 750ml'
        ],
        comments: [
          {
            id: `scc_1_${Date.now()}`,
            author_name: 'App do Hóspede',
            content: 'Ponto da carne: Mal passada. Enviar 2 taças de cristal para vinho.',
            created_at: nowIso,
            is_system: true
          }
        ],
        checklist: [
          { id: `cck_1`, text: 'Grelhar medalhões no ponto solicitado', completed: false },
          { id: `cck_2`, text: 'Empratar com cloche aquecido', completed: false },
          { id: `cck_3`, text: 'Acionar garçom com carrinho de serviço', completed: false }
        ],
        tags: ['Gourmet', 'App Hóspede', 'VIP'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('cozinha');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '🍽️ NOVO PEDIDO: Room Service na Suíte 301 (Filé Mignon ao Poivre) entrou na Cozinha!',
        department: 'cozinha',
        type: 'info',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'housekeeping_turnover') {
      // Check-out efetuado na recepção gerando cartão na Governança
      const newCard: KanbanCard = {
        id: `sim_g_${Date.now()}`,
        board_id: 'governanca',
        column_id: 'gov_a_limpar',
        title: 'Higienização de Saída (Check-out Realizado)',
        location: 'Quarto 204 (Master com Banheira)',
        priority: 'atencao',
        sla_target_minutes: 40,
        created_at: nowIso,
        origin_department: 'Recepção (Check-out)',
        comments: [
          {
            id: `scg_1_${Date.now()}`,
            author_name: 'Sistema Front Desk',
            content: 'Hóspede realizou check-out e liberou a chave. Quarto liberado para arrumação completa.',
            created_at: nowIso,
            is_system: true
          }
        ],
        checklist: [
          { id: `gck_1`, text: 'Troca de todo o enxoval e toalhas', completed: false },
          { id: `gck_2`, text: 'Higienizar e desinfetar hidromassagem', completed: false },
          { id: `gck_3`, text: 'Conferir e repor itens do frigobar', completed: false },
          { id: `gck_4`, text: 'Chamar governanta para inspeção final', completed: false }
        ],
        tags: ['Turnover', 'Saída Hóspede'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('governanca');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '🧹 GOVERNANÇA: Quarto 204 teve check-out concluído e entrou na fila de limpeza!',
        department: 'governanca',
        type: 'info',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'guest_extra_pillow') {
      const newCard: KanbanCard = {
        id: `sim_p_${Date.now()}`,
        board_id: 'governanca',
        column_id: 'gov_pedidos_extra',
        title: 'Kit Extra: 2 Travesseiros Ortopédicos + Roupão',
        location: 'Chalé 02 com Piscina',
        priority: 'normal',
        sla_target_minutes: 20,
        created_at: nowIso,
        origin_department: 'Hóspede (WhatsApp)',
        comments: [
          {
            id: `scw_1_${Date.now()}`,
            author_name: 'WhatsApp Concierge',
            content: 'Hóspede solicitou travesseiro mais alto para a noite.',
            created_at: nowIso
          }
        ],
        checklist: [
          { id: `pck_1`, text: 'Retirar enxoval premium no armário 3', completed: false },
          { id: `pck_2`, text: 'Entregar ao hóspede com cartão de cortesia', completed: false }
        ],
        tags: ['Enxoval Extra', 'Concierge'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('governanca');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '🛏️ Pedido de Enxoval Extra registrado para o Chalé 02!',
        department: 'governanca',
        type: 'info',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'minibar_restock_needed') {
      // Reposição de Frigobar Solicitada por Consumo
      const newCard: KanbanCard = {
        id: `sim_mb_${Date.now()}`,
        board_id: 'almoxarifado',
        column_id: 'alm_reposicao',
        title: 'Reposição Urgente: Frigobar Quarto 205',
        location: 'Quarto 205 (Luxo com Varanda)',
        room_number: '205',
        priority: 'critica',
        sla_target_minutes: 20,
        created_at: nowIso,
        origin_department: 'Check-out Express / Frigobar',
        summary_category: 'Itens em Falta (Auditoria de Consumo):',
        order_items: [
          '2x Cerveja Heineken Long Neck 330ml',
          '2x Água Mineral sem Gás 500ml',
          '1x Batata Pringles Original 40g'
        ],
        amount: 49.00,
        comments: [
          {
            id: `scmb_1_${Date.now()}`,
            author_name: 'Monitor de Frigobar',
            content: 'Hóspede consumiu 5 itens do refrigerador. Reposição necessária antes da entrada da próxima reserva.',
            created_at: nowIso,
            is_system: true
          }
        ],
        checklist: [
          { id: `mbck_1`, text: 'Separar 2x Heineken + 2x Água + 1x Pringles no almoxarifado', completed: false },
          { id: `mbck_2`, text: 'Transportar carrinho e abastecer refrigerador no quarto 205', completed: false },
          { id: `mbck_3`, text: 'Conferir temperatura (4°C) e dar baixa de reposição no sistema', completed: false }
        ],
        tags: ['Frigobar', 'Urgente', 'Quarto 205'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('almoxarifado');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '📦 ALMOXARIFADO & FRIGOBAR: Reposição solicitada para o Quarto 205 (5 itens consumidos)!',
        department: 'almoxarifado',
        type: 'urgent',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else if (type === 'almoxarifado_low_stock') {
      // Estoque Baixo de Suprimento no Almoxarifado Central
      const newCard: KanbanCard = {
        id: `sim_astk_${Date.now()}`,
        board_id: 'almoxarifado',
        column_id: 'alm_estoque_critico',
        title: 'Estoque Crítico: Cerveja Heineken (4 garrafas restantes)',
        location: 'Almoxarifado Central (Prateleira Bebidas B2)',
        priority: 'atencao',
        sla_target_minutes: 60,
        created_at: nowIso,
        origin_department: 'Monitor de Estoque Central',
        summary_category: 'Disparo de Reposição de Compras:',
        order_items: [
          'Estoque Central Atual: 4 garrafas',
          'Estoque Mínimo Definido: 30 garrafas',
          'Fornecedor: Distribuidora Vale do Sapucaí Bebidas'
        ],
        comments: [
          {
            id: `scastk_1_${Date.now()}`,
            author_name: 'Robô de Compras',
            content: 'Nível crítico atingido. Sugerido pedido de compra padrão de 120 unidades para atender o final de semana.',
            created_at: nowIso,
            is_system: true
          }
        ],
        checklist: [
          { id: `stkck_1`, text: 'Emitir Pedido de Compra #PO-901 (120 un.)', completed: false },
          { id: `stkck_2`, text: 'Validar faturamento com setor financeiro', completed: false },
          { id: `stkck_3`, text: 'Receber lote no cais de carga e dar entrada no sistema', completed: false }
        ],
        tags: ['Estoque Baixo', 'Almoxarifado', 'Bebidas'],
        order: 0,
        just_created: true
      };

      setCards((prev) => [newCard, ...prev]);
      setActiveBoardId('almoxarifado');
      const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
      setLiveEvent({
        id: `live_${Date.now()}`,
        message: '⚠️ ALMOXARIFADO: Estoque crítico de Cerveja Heineken (Apenas 4 un. restantes no estoque central)!',
        department: 'almoxarifado',
        type: 'info',
        designationLabel: audioResult.label,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }
  }, [boards, currentUser]);

  // Função para testar sons individualmente pelo painel
  const playTestSound = useCallback((soundType: 'personal' | 'department' | 'urgent' | 'delegation' | 'success') => {
    switch (soundType) {
      case 'personal':
        SoundNotificationService.playPersonalAssignmentSound();
        break;
      case 'department':
        SoundNotificationService.playDepartmentOrderSound();
        break;
      case 'urgent':
        SoundNotificationService.playUrgentAlert();
        break;
      case 'delegation':
        SoundNotificationService.playDelegationSound();
        break;
      case 'success':
        SoundNotificationService.playSuccessSound();
        break;
    }
  }, []);

  // Cálculo de Métricas e SLAs
  const slaMetrics: KanbanSlaMetrics = useMemo(() => {
    const total_cards_today = cards.length;
    const completedCards = cards.filter((c) => {
      const board = boards.find((b) => b.id === c.board_id);
      const col = board?.columns.find((col) => col.id === c.column_id);
      return col?.is_final || !!c.completed_at;
    });
    const completed_cards_today = completedCards.length;

    let totalResolutionMins = 0;
    let onTimeCount = 0;

    cards.forEach((card) => {
      const createdTime = new Date(card.created_at).getTime();
      const endTime = card.completed_at ? new Date(card.completed_at).getTime() : Date.now();
      const elapsedMins = (endTime - createdTime) / (1000 * 60);

      if (card.completed_at) {
        totalResolutionMins += elapsedMins;
        if (elapsedMins <= card.sla_target_minutes) {
          onTimeCount++;
        }
      }
    });

    const on_time_percentage = completed_cards_today > 0 
      ? Math.round((onTimeCount / completed_cards_today) * 100) 
      : 92;

    const avg_resolution_minutes = completed_cards_today > 0 
      ? Math.round(totalResolutionMins / completed_cards_today) 
      : 22;

    const active_urgent_count = cards.filter((c) => {
      const board = boards.find((b) => b.id === c.board_id);
      const col = board?.columns.find((col) => col.id === c.column_id);
      return !col?.is_final && c.priority === 'critica';
    }).length;

    // Identifica gargalos (colunas não finais com mais cartões acumulados)
    const columnCounts: Record<string, { column_title: string; count: number; department: string }> = {};
    cards.forEach((c) => {
      const board = boards.find((b) => b.id === c.board_id);
      const col = board?.columns.find((col) => col.id === c.column_id);
      if (col && !col.is_final) {
        if (!columnCounts[col.id]) {
          columnCounts[col.id] = { column_title: col.title, count: 0, department: board?.title || c.board_id };
        }
        columnCounts[col.id].count++;
      }
    });

    const bottlenecks_by_column = Object.values(columnCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      total_cards_today,
      completed_cards_today,
      on_time_percentage,
      avg_resolution_minutes,
      active_urgent_count,
      bottlenecks_by_column
    };
  }, [cards, boards]);

  return (
    <KanbanContext.Provider
      value={{
        boards,
        cards,
        visibleBoards,
        visibleCards,
        activeBoardId,
        setActiveBoardId,
        activeBoard,
        soundEnabled,
        setSoundEnabled,
        viewMode,
        setViewMode,
        isAdmin,
        userDepartment,
        userScopeMode,
        setUserScopeMode,
        searchQuery,
        setSearchQuery,
        priorityFilter,
        setPriorityFilter,
        assigneeFilter,
        setAssigneeFilter,
        slaFilter,
        setSlaFilter,
        selectedCard,
        setSelectedCard,
        isCreateCardModalOpen,
        setIsCreateCardModalOpen,
        isEditBoardModalOpen,
        setIsEditBoardModalOpen,
        isCreateColumnModalOpen,
        setIsCreateColumnModalOpen,
        liveEvent,
        clearLiveEvent,
        syncAllFromPMS,
        isSyncing,
        lastSyncTime,
        slaMetrics,
        moveCard,
        createCard,
        updateCard,
        deleteCard,
        addCardComment,
        toggleChecklistItem,
        addChecklistItem,
        assignCard,
        delegateCard,
        quickRestockFrigobarCard,
        addColumn,
        updateColumn,
        deleteColumn,
        addBoard,
        updateBoard,
        deleteBoard,
        resetToDefaults,
        simulateIncomingEvent,
        playTestSound
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = (): KanbanContextType => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban deve ser usado dentro de um KanbanProvider');
  }
  return context;
};
