import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  KanbanBoard, 
  KanbanCard, 
  KanbanColumn, 
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
import { 
  kanbanRepository, 
  subscribeToKanbanRealtime, 
  KanbanRealtimeStatus 
} from '../services/kanban';
import { generatePMSSyncCards } from '../services/kanbanSyncEngine';
import { buildSimulatedKanbanEvent, SimulationEventType } from '../services/kanbanSimulationEngine';
import { calculateKanbanSlaMetrics } from '../services/kanbanSlaCalculator';

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
  
  // Status de Sincronização em Tempo Real (Supabase Realtime)
  realtimeStatus: KanbanRealtimeStatus;

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

  // Ações de Cartões com Persistência Oficial no Supabase
  moveCard: (cardId: string, targetColumnId: string, targetBoardId?: string) => Promise<void>;
  createCard: (cardData: Omit<KanbanCard, 'id' | 'created_at' | 'order' | 'comments' | 'checklist'> & { comments?: KanbanCardComment[]; checklist?: KanbanChecklistItem[] }) => Promise<KanbanCard>;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addCardComment: (cardId: string, content: string) => Promise<void>;
  toggleChecklistItem: (cardId: string, itemId: string) => Promise<void>;
  addChecklistItem: (cardId: string, text: string) => Promise<void>;
  assignCard: (cardId: string, assignee: KanbanCardAssignee | null) => Promise<void>;
  delegateCard: (cardId: string, targetDepartment: string, notes?: string) => Promise<void>;
  quickRestockFrigobarCard: (cardId: string) => Promise<void>;
  
  // Customização de Estrutura (Admin / Gerente)
  addColumn: (boardId: string, title: string, color?: string, isFinal?: boolean, isInProgress?: boolean) => Promise<void>;
  updateColumn: (columnId: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  addBoard: (board: Omit<KanbanBoard, 'id' | 'columns'> & { columns?: KanbanColumn[] }) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<KanbanBoard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  
  // Simulações em Tempo Real (Demonstração do Fluxo Cross-Department)
  simulateIncomingEvent: (type: SimulationEventType) => void;
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

  const hotelId = hotelConfig?.id || 'default_hotel';
  const isAdmin = useMemo(() => isUserAdmin(currentUser), [currentUser]);
  const userDepartment = useMemo(() => getUserDepartment(currentUser), [currentUser]);

  // Status de Sincronização em Tempo Real (Supabase Realtime)
  const [realtimeStatus, setRealtimeStatus] = useState<KanbanRealtimeStatus>('CONNECTING');

  // Status de Sincronização com o PMS
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });

  // Estados locais com fallback seguro em cache
  const [boards, setBoards] = useState<KanbanBoard[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOARDS_KEY);
      if (saved) {
        const parsed: KanbanBoard[] = JSON.parse(saved);
        INITIAL_KANBAN_BOARDS.forEach((initB) => {
          if (!parsed.some((b) => b.id === initB.id)) {
            parsed.push(initB);
          }
        });
        return parsed;
      }
    } catch (e) {
      console.warn('[KANBAN] Erro ao carregar boards salvos no cache:', e);
    }
    return INITIAL_KANBAN_BOARDS;
  });

  const [cards, setCards] = useState<KanbanCard[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
      if (saved) {
        const parsed: KanbanCard[] = JSON.parse(saved);
        const hasAlmoxCards = parsed.some((c) => c.board_id === 'almoxarifado');
        if (!hasAlmoxCards) {
          const almoxCards = INITIAL_KANBAN_CARDS.filter((c) => c.board_id === 'almoxarifado');
          return [...parsed, ...almoxCards];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[KANBAN] Erro ao carregar cards salvos no cache:', e);
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

  // Refs de estado para referenciamento seguro dentro de callbacks assíncronos e Realtime
  const boardsRef = useRef<KanbanBoard[]>(boards);
  boardsRef.current = boards;
  const cardsRef = useRef<KanbanCard[]>(cards);
  cardsRef.current = cards;

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

  // Atualizar escopo e quadro ativo quando o usuário logado mudar
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

  // Cartões visíveis calculados de acordo com permissões e escopo
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

    return cards.filter((c) => {
      const b = boards.find((x) => x.id === c.board_id);
      return canUserViewCard(c, b, currentUser);
    });
  }, [cards, boards, isAdmin, userScopeMode, currentUser]);

  // Modo de visualização
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

  // Atualização de cache local secundário
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

  // CARREGAMENTO INICIAL OFICIAL DO SUPABASE (FONTE PRINCIPAL DA VERDADE)
  useEffect(() => {
    let isMounted = true;

    async function initializeFromSupabase() {
      try {
        console.info(`[KANBAN INIT] Carregando dados autoritativos do Supabase para o hotel: ${hotelId}`);
        const { boards: dbBoards, cards: dbCards } = await kanbanRepository.loadKanbanData(hotelId);

        if (!isMounted) return;

        if (dbBoards && dbBoards.length > 0) {
          setBoards(dbBoards);
        } else {
          // Se o hotel ainda não tiver quadros gravados no banco, inicializa com os defaults e persiste no Supabase
          console.info(`[KANBAN SEED] Inicializando quadros padrão no banco para o hotel: ${hotelId}`);
          for (const initBoard of INITIAL_KANBAN_BOARDS) {
            void kanbanRepository.upsertBoard(hotelId, initBoard).catch(() => {});
          }
        }

        if (dbCards && dbCards.length > 0) {
          setCards(dbCards);
        }
      } catch (err) {
        console.warn('[KANBAN INIT WARNING] Supabase indisponível no momento. Mantendo estado em cache local:', err);
      }
    }

    void initializeFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [hotelId]);

  // SUBSCRIÇÃO REALTIME COMPLETA (CARDS, BOARDS, COLUNAS)
  useEffect(() => {
    if (!hotelId) return;

    console.info(`[REALTIME SUBSCRIBING] Iniciando subscrição Realtime no hotel: ${hotelId}`);

    const unsubscribe = subscribeToKanbanRealtime(hotelId, {
      onStatusChange: (status) => {
        setRealtimeStatus(status);
      },

      // 1. Eventos de Cartões
      onCardInsert: (incomingCard) => {
        setCards((prev) => {
          if (prev.some((c) => c.id === incomingCard.id)) {
            return prev.map((c) => (c.id === incomingCard.id ? incomingCard : c));
          }
          return [incomingCard, ...prev];
        });

        // Alerta sonoro / visual se for criado por outro operador
        const audioResult = playDifferentiatedNotificationSound(incomingCard, currentUser);
        setLiveEvent({
          id: `ev_rt_in_${incomingCard.id}_${Date.now()}`,
          message: `Novo chamado: "${incomingCard.title}" em ${incomingCard.location}`,
          department: incomingCard.board_id,
          type: incomingCard.priority === 'critica' ? 'urgent' : (audioResult.soundType === 'personal' ? 'personal' : 'info'),
          designationLabel: audioResult.label,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
      },

      onCardUpdate: (incomingCard) => {
        setCards((prev) =>
          prev.map((c) => (c.id === incomingCard.id ? incomingCard : c))
        );

        setSelectedCard((prev) =>
          prev && prev.id === incomingCard.id ? incomingCard : prev
        );
      },

      onCardDelete: (cardId) => {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setSelectedCard((prev) => (prev && prev.id === cardId ? null : prev));
      },

      // 2. Eventos de Quadros (Boards)
      onBoardInsert: (incomingBoard) => {
        setBoards((prev) => {
          if (prev.some((b) => b.id === incomingBoard.id)) {
            return prev.map((b) => (b.id === incomingBoard.id ? incomingBoard : b));
          }
          return [...prev, incomingBoard];
        });
      },

      onBoardUpdate: (incomingBoard) => {
        setBoards((prev) =>
          prev.map((b) => {
            if (b.id !== incomingBoard.id) return b;
            return {
              ...incomingBoard,
              columns: incomingBoard.columns.length > 0 ? incomingBoard.columns : b.columns
            };
          })
        );
      },

      onBoardDelete: (boardId) => {
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        setCards((prev) => prev.filter((c) => c.board_id !== boardId));
        setActiveBoardId((prev) => (prev === boardId ? 'recepcao' : prev));
      },

      // 3. Eventos de Colunas (Columns)
      onColumnInsert: (incomingCol) => {
        setBoards((prev) =>
          prev.map((b) => {
            if (b.id !== incomingCol.board_id) return b;
            if (b.columns.some((c) => c.id === incomingCol.id)) {
              return {
                ...b,
                columns: b.columns.map((c) => (c.id === incomingCol.id ? incomingCol : c))
              };
            }
            return {
              ...b,
              columns: [...b.columns, incomingCol].sort((x, y) => x.order - y.order)
            };
          })
        );
      },

      onColumnUpdate: (incomingCol) => {
        setBoards((prev) =>
          prev.map((b) => {
            if (b.id !== incomingCol.board_id) return b;
            return {
              ...b,
              columns: b.columns.map((c) => (c.id === incomingCol.id ? incomingCol : c))
            };
          })
        );
      },

      onColumnDelete: (columnId) => {
        setBoards((prev) =>
          prev.map((b) => ({
            ...b,
            columns: b.columns.filter((col) => col.id !== columnId)
          }))
        );
      }
    });

    return () => {
      console.info(`[REALTIME UNSUBSCRIBING] Encerrando subscrição Realtime no hotel: ${hotelId}`);
      unsubscribe();
    };
  }, [hotelId, currentUser]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    SoundNotificationService.setSoundEnabled(enabled);
    try {
      localStorage.setItem(LOCAL_STORAGE_SOUND_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Board atual selecionado
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

  // AÇÕES DE CARTÕES COM PERSISTÊNCIA ATÔMICA E ROLLBACK
  const moveCard = useCallback(async (cardId: string, targetColumnId: string, targetBoardId?: string) => {
    const nowIso = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const prevCardsSnapshot = cardsRef.current;
    const cardIndex = prevCardsSnapshot.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const currentCard = prevCardsSnapshot[cardIndex];
    const boardToUse = targetBoardId || currentCard.board_id;
    const targetBoard = boardsRef.current.find((b) => b.id === boardToUse);
    const targetColumn = targetBoard?.columns.find((col) => col.id === targetColumnId);

    const updates: Partial<KanbanCard> = {
      column_id: targetColumnId,
      board_id: boardToUse,
      just_created: false
    };

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

    if (targetColumn?.is_final) {
      updates.completed_at = nowIso;
      SoundNotificationService.playSuccessSound();
    }

    // Sincronização reversa com o PMS
    if (boardToUse === 'governanca') {
      const rm = findRoomByCard(currentCard);
      if (rm) {
        if (targetColumnId === 'gov_liberado') {
          setRoomStatus(rm.id, 'limpo');
          setLiveEvent({
            id: `sync_rm_${Date.now()}`,
            message: `Governança: Quarto ${rm.numero} liberado e marcado como LIMPO no PMS!`,
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
            message: `Manutenção: Chamado resolvido! Quarto ${rm.numero} liberado e desbloqueado no PMS.`,
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

    if (boardToUse === 'recepcao' && currentCard.reservation_id) {
      const res = reservations.find((r) => r.id === currentCard.reservation_id);
      if (res) {
        if ((targetColumnId === 'rec_atendimento' || targetColumnId === 'rec_solicitacoes') && res.status === 'confirmada') {
          updateReservationStatus(res.id, 'checkin_realizado', { checkinTime: nowIso });
          setRoomStatus(res.quarto_id, 'ocupado');
        } else if (targetColumnId === 'rec_checkouts' && res.status === 'checkin_realizado') {
          updateReservationStatus(res.id, 'checkout_concluido', { checkoutTime: nowIso });
          setRoomStatus(res.quarto_id, 'limpeza');
          
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
          
          setCards((prev) => [govCard, ...prev]);
          void kanbanRepository.upsertCard(hotelId, govCard).catch(() => {});
        }
      }
    }

    if (boardToUse === 'almoxarifado') {
      const rm = findRoomByCard(currentCard);
      if (targetColumnId === 'alm_concluido') {
        if (rm) {
          quickRestockRoom(rm.numero, currentUser?.nome);
        }
        if (currentCard.checklist && currentCard.checklist.length > 0) {
          updates.checklist = currentCard.checklist.map((item) => ({ ...item, completed: true }));
        }
      }
    }

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

    // 1. Atualização otimista
    setCards((prev) => {
      const copy = [...prev];
      copy[cardIndex] = updatedCard;
      return copy;
    });

    // 2. Persistência oficial no Supabase com rollback em caso de falha
    try {
      await kanbanRepository.upsertCard(hotelId, updatedCard);
    } catch (error) {
      console.error('[KANBAN MOVE ERROR] Falha ao persistir movimento no Supabase, executando rollback:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [boards, currentUser, rooms, reservations, blocks, guests, setRoomStatus, updateReservationStatus, deleteBlock, findRoomByCard, quickRestockRoom, hotelId]);

  // Sincronização de todas as entidades do PMS para o Kanban
  const syncAllFromPMS = useCallback(() => {
    setIsSyncing(true);
    const { newCards: newCardsToAdd, syncedCount } = generatePMSSyncCards({
      rooms,
      reservations,
      blocks,
      guests,
      payments,
      cards: cardsRef.current,
      roomMinibars,
      getRoomMinibarSummary,
      frigobarProducts
    });

    if (newCardsToAdd.length > 0) {
      setCards((prev) => [...newCardsToAdd, ...prev]);
      // Persistir em lote no Supabase
      newCardsToAdd.forEach((c) => {
        void kanbanRepository.upsertCard(hotelId, c).catch(() => {});
      });
    }

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastSyncTime(timeString);
    setIsSyncing(false);

    SoundNotificationService.playSuccessSound();

    setLiveEvent({
      id: `sync_ev_${Date.now()}`,
      message: `Sincronização 100% Concluída: ${syncedCount} itens sincronizados entre PMS e Kanban!`,
      department: 'recepcao',
      type: 'success',
      designationLabel: 'PMS Sincronizado',
      timestamp: timeString
    });

    return {
      syncedCount,
      message: `Sincronização 100% concluída com sucesso! ${syncedCount} novos cartões atualizados.`
    };
  }, [rooms, reservations, blocks, guests, payments, roomMinibars, getRoomMinibarSummary, frigobarProducts, hotelId]);

  const createCard = useCallback(async (cardData: Omit<KanbanCard, 'id' | 'created_at' | 'order' | 'comments' | 'checklist'> & { comments?: KanbanCardComment[]; checklist?: KanbanChecklistItem[] }): Promise<KanbanCard> => {
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

    const prevCardsSnapshot = cardsRef.current;

    // 1. Atualização otimista
    setCards((prev) => [newCard, ...prev]);

    // 2. Disparo de áudio e notificação visual
    const audioResult = playDifferentiatedNotificationSound(newCard, currentUser);
    setLiveEvent({
      id: `ev_${Date.now()}`,
      message: `Novo chamado: "${newCard.title}" em ${newCard.location}`,
      department: newCard.board_id,
      type: newCard.priority === 'critica' ? 'urgent' : (audioResult.soundType === 'personal' ? 'personal' : 'info'),
      designationLabel: audioResult.label,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    // 3. Persistência no Supabase
    try {
      await kanbanRepository.upsertCard(hotelId, newCard);
    } catch (error) {
      console.error('[KANBAN CREATE ERROR] Falha ao criar cartão no Supabase, efetuando rollback:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }

    return newCard;
  }, [currentUser, hotelId]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<KanbanCard>) => {
    const prevCardsSnapshot = cardsRef.current;
    const target = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!target) return;

    const updated = { ...target, ...updates };

    // 1. Atualização otimista
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    // 2. Persistência no Supabase
    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN UPDATE ERROR] Falha ao atualizar cartão no Supabase, efetuando rollback:', error);
      setCards(prevCardsSnapshot);
      setSelectedCard((prev) => (prev && prev.id === cardId ? target : prev));
      throw error;
    }
  }, [hotelId]);

  const deleteCard = useCallback(async (cardId: string) => {
    const prevCardsSnapshot = cardsRef.current;

    // 1. Atualização otimista
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard((prev) => (prev && prev.id === cardId ? null : prev));

    // 2. Persistência no Supabase
    try {
      await kanbanRepository.deleteCard(cardId);
    } catch (error) {
      console.error('[KANBAN DELETE ERROR] Falha ao deletar cartão no Supabase, efetuando rollback:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, []);

  const addCardComment = useCallback(async (cardId: string, content: string) => {
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

    const prevCardsSnapshot = cardsRef.current;
    const target = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!target) return;

    const updated = {
      ...target,
      comments: [...target.comments, comment]
    };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN COMMENT ERROR] Falha ao adicionar comentário no Supabase:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [currentUser, hotelId]);

  const toggleChecklistItem = useCallback(async (cardId: string, itemId: string) => {
    const prevCardsSnapshot = cardsRef.current;
    const target = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!target) return;

    const updatedChecklist = target.checklist.map((item) => {
      if (item.id !== itemId) return item;
      const nextCompleted = !item.completed;
      return {
        ...item,
        completed: nextCompleted,
        completed_by: nextCompleted ? currentUser?.nome : undefined,
        completed_at: nextCompleted ? new Date().toISOString() : undefined
      };
    });

    const updated = { ...target, checklist: updatedChecklist };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN CHECKLIST ERROR] Falha ao alternar checklist no Supabase:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [currentUser, hotelId]);

  const addChecklistItem = useCallback(async (cardId: string, text: string) => {
    if (!text.trim()) return;
    const newItem: KanbanChecklistItem = {
      id: `chk_${Date.now()}`,
      text: text.trim(),
      completed: false
    };

    const prevCardsSnapshot = cardsRef.current;
    const target = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!target) return;

    const updated = {
      ...target,
      checklist: [...target.checklist, newItem]
    };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN CHECKLIST ADD ERROR] Falha ao adicionar checklist no Supabase:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [hotelId]);

  const assignCard = useCallback(async (cardId: string, assignee: KanbanCardAssignee | null) => {
    const prevCardsSnapshot = cardsRef.current;
    const target = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!target) return;

    const updated = { ...target, assigned_to: assignee };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN ASSIGN ERROR] Falha ao atribuir responsável no Supabase:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [hotelId]);

  const quickRestockFrigobarCard = useCallback(async (cardId: string) => {
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;

    const rm = findRoomByCard(card);
    if (rm) {
      quickRestockRoom(rm.numero, currentUser?.nome);
    }

    const updatedChecklist = (card.checklist || []).map((item) => ({ ...item, completed: true }));
    await updateCard(cardId, {
      column_id: 'alm_concluido',
      completed_at: new Date().toISOString(),
      checklist: updatedChecklist
    });

    SoundNotificationService.playSuccessSound();
    setLiveEvent({
      id: `restock_ev_${Date.now()}`,
      message: `Frigobar do ${card.location} abastecido com sucesso! Cartão concluído e estoque sincronizado.`,
      department: 'almoxarifado',
      type: 'success',
      designationLabel: 'Frigobar Abastecido',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }, [findRoomByCard, quickRestockRoom, currentUser, updateCard]);

  const delegateCard = useCallback(async (cardId: string, targetDepartment: string, notes?: string) => {
    const targetBoard = boardsRef.current.find((b) => b.id === targetDepartment || b.department === targetDepartment);
    if (!targetBoard || targetBoard.columns.length === 0) return;

    const firstColumn = targetBoard.columns[0];
    const nowIso = new Date().toISOString();

    const prevCardsSnapshot = cardsRef.current;
    const card = prevCardsSnapshot.find((c) => c.id === cardId);
    if (!card) return;

    const originDeptName = boardsRef.current.find((b) => b.id === card.board_id)?.title || card.board_id;
    const targetDeptName = targetBoard.title;

    const delegateComment: KanbanCardComment = {
      id: `c_del_${Date.now()}`,
      author_name: currentUser?.nome || 'Recepção',
      author_role: currentUser?.tipo_usuario,
      content: `Encaminhou este chamado de "${originDeptName}" para o quadro de "${targetDeptName}". ${notes ? `Observação: ${notes}` : ''}`,
      created_at: nowIso,
      is_system: true
    };

    const updated: KanbanCard = {
      ...card,
      board_id: targetBoard.id,
      column_id: firstColumn.id,
      origin_department: originDeptName,
      delegated_to_department: targetDeptName,
      comments: [...card.comments, delegateComment],
      just_created: true
    };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    setSelectedCard((prev) => (prev && prev.id === cardId ? updated : prev));

    SoundNotificationService.playDelegationSound();
    
    setLiveEvent({
      id: `ev_del_${Date.now()}`,
      message: `Chamado transferido para ${targetBoard.title}`,
      department: targetBoard.id,
      type: 'info',
      designationLabel: `Repassado para ${targetBoard.title}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    try {
      await kanbanRepository.upsertCard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN DELEGATE ERROR] Falha ao delegar chamado no Supabase:', error);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [currentUser, hotelId]);

  // GESTÃO DE COLUNAS (ADMIN / GERENTE) COM PERSISTÊNCIA NO SUPABASE
  const addColumn = useCallback(async (boardId: string, title: string, color?: string, isFinal?: boolean, isInProgress?: boolean) => {
    const prevBoardsSnapshot = boardsRef.current;
    const targetBoard = prevBoardsSnapshot.find((b) => b.id === boardId);
    if (!targetBoard) return;

    const newCol: KanbanColumn = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      board_id: boardId,
      title: title.trim(),
      color: color || '#64748b',
      order: targetBoard.columns.length + 1,
      is_final: isFinal,
      is_in_progress: isInProgress
    };

    const updatedBoard = {
      ...targetBoard,
      columns: [...targetBoard.columns, newCol]
    };

    setBoards((prev) => prev.map((b) => (b.id === boardId ? updatedBoard : b)));

    try {
      await kanbanRepository.upsertColumn(newCol);
    } catch (error) {
      console.error('[KANBAN ADD COLUMN ERROR] Falha ao adicionar coluna no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      throw error;
    }
  }, []);

  const updateColumn = useCallback(async (columnId: string, updates: Partial<KanbanColumn>) => {
    const prevBoardsSnapshot = boardsRef.current;
    let targetCol: KanbanColumn | null = null;

    for (const b of prevBoardsSnapshot) {
      const found = b.columns.find((c) => c.id === columnId);
      if (found) {
        targetCol = found;
        break;
      }
    }
    if (!targetCol) return;

    const updatedCol: KanbanColumn = { ...targetCol, ...updates };

    setBoards((prev) =>
      prev.map((b) => {
        if (!b.columns.some((c) => c.id === columnId)) return b;
        return {
          ...b,
          columns: b.columns.map((c) => (c.id === columnId ? updatedCol : c))
        };
      })
    );

    try {
      await kanbanRepository.upsertColumn(updatedCol);
    } catch (error) {
      console.error('[KANBAN UPDATE COLUMN ERROR] Falha ao atualizar coluna no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      throw error;
    }
  }, []);

  const deleteColumn = useCallback(async (columnId: string) => {
    const prevBoardsSnapshot = boardsRef.current;
    const prevCardsSnapshot = cardsRef.current;

    let targetBoardId: string | null = null;
    for (const b of prevBoardsSnapshot) {
      if (b.columns.some((c) => c.id === columnId)) {
        targetBoardId = b.id;
        break;
      }
    }

    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.filter((col) => col.id !== columnId)
      }))
    );

    setCards((prev) => {
      return prev.map((c) => {
        if (c.column_id !== columnId) return c;
        const board = prevBoardsSnapshot.find((b) => b.id === c.board_id);
        const remainingCols = board?.columns.filter((col) => col.id !== columnId) || [];
        if (remainingCols.length > 0) {
          const updated = { ...c, column_id: remainingCols[0].id };
          void kanbanRepository.upsertCard(hotelId, updated).catch(() => {});
          return updated;
        }
        return c;
      });
    });

    try {
      await kanbanRepository.deleteColumn(columnId);
    } catch (error) {
      console.error('[KANBAN DELETE COLUMN ERROR] Falha ao deletar coluna no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, [hotelId]);

  // GESTÃO DE QUADROS (ADMIN / GERENTE) COM PERSISTÊNCIA NO SUPABASE
  const addBoard = useCallback(async (boardData: Omit<KanbanBoard, 'id' | 'columns'> & { columns?: KanbanColumn[] }) => {
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

    const prevBoardsSnapshot = boardsRef.current;

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(id);

    try {
      await kanbanRepository.upsertBoard(hotelId, newBoard);
    } catch (error) {
      console.error('[KANBAN ADD BOARD ERROR] Falha ao criar quadro no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      throw error;
    }
  }, [hotelId]);

  const updateBoard = useCallback(async (boardId: string, updates: Partial<KanbanBoard>) => {
    const prevBoardsSnapshot = boardsRef.current;
    const target = prevBoardsSnapshot.find((b) => b.id === boardId);
    if (!target) return;

    const updated = { ...target, ...updates };

    setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));

    try {
      await kanbanRepository.upsertBoard(hotelId, updated);
    } catch (error) {
      console.error('[KANBAN UPDATE BOARD ERROR] Falha ao atualizar quadro no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      throw error;
    }
  }, [hotelId]);

  const deleteBoard = useCallback(async (boardId: string) => {
    const prevBoardsSnapshot = boardsRef.current;
    const prevCardsSnapshot = cardsRef.current;

    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setCards((prev) => prev.filter((c) => c.board_id !== boardId));
    setActiveBoardId('recepcao');

    try {
      await kanbanRepository.deleteBoard(boardId);
    } catch (error) {
      console.error('[KANBAN DELETE BOARD ERROR] Falha ao deletar quadro no Supabase:', error);
      setBoards(prevBoardsSnapshot);
      setCards(prevCardsSnapshot);
      throw error;
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    setBoards(INITIAL_KANBAN_BOARDS);
    setCards(INITIAL_KANBAN_CARDS);
    setActiveBoardId('recepcao');
    try {
      localStorage.removeItem(LOCAL_STORAGE_BOARDS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CARDS_KEY);
      for (const b of INITIAL_KANBAN_BOARDS) {
        await kanbanRepository.upsertBoard(hotelId, b);
      }
    } catch (e) {
      console.error('[KANBAN RESET ERROR]', e);
    }
  }, [hotelId]);

  // Simulações Interativas em Tempo Real
  const simulateIncomingEvent = useCallback((type: SimulationEventType) => {
    const { card, targetBoardId, liveMessage, eventType } = buildSimulatedKanbanEvent(type);
    
    setCards((prev) => [card, ...prev]);
    setActiveBoardId(targetBoardId);
    void kanbanRepository.upsertCard(hotelId, card).catch(() => {});
    
    const audioResult = playDifferentiatedNotificationSound(card, currentUser);
    setLiveEvent({
      id: `live_${Date.now()}`,
      message: liveMessage,
      department: targetBoardId,
      type: eventType,
      designationLabel: audioResult.label,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }, [currentUser, hotelId]);

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

  // Cálculo reativo das Métricas e SLAs (Demonstrativos atualizados em tempo real)
  const slaMetrics: KanbanSlaMetrics = useMemo(() => {
    return calculateKanbanSlaMetrics(cards, boards);
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
        realtimeStatus,
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
