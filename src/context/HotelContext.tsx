import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  HotelConfig, 
  Quarto, 
  TipoQuarto, 
  Hospede, 
  Reserva, 
  Pagamento, 
  BloqueioQuarto, 
  AutomacaoMensagem, 
  Usuario, 
  AvailabilityResult,
  ReservationStatus,
  RoomStatus,
  ConsumoExtra,
  SecurityLogEntry,
  SecurityActionRequest,
  TwoFactorMethod,
  UserRole,
  AdminTab,
  RBACMatrixConfig,
  RBACResourceRule,
  RBACRolePermission,
  RBACAccessLevel
} from '../types';
import { 
  INITIAL_HOTEL_CONFIG, 
  INITIAL_ROOMS, 
  INITIAL_ROOM_TYPES, 
  INITIAL_GUESTS, 
  INITIAL_RESERVATIONS, 
  INITIAL_PAYMENTS, 
  INITIAL_BLOCKS, 
  INITIAL_AUTOMATIONS, 
  INITIAL_USERS,
  INITIAL_SECURITY_LOGS,
  INITIAL_RBAC_MATRIX
} from '../data/mockInitialData';
import { searchAvailableRooms, generateBookingCode, generateSmartLockPin } from '../utils/availability';
import { TEMPLATE_PRESETS, applyThemeVariables } from '../utils/themeHelper';
import { getCurrentTotpToken, generateOtpToken, validate2FACode, TotpStatus } from '../utils/securityHelper';
import {
  isSupabaseConfigured,
  SUPABASE_URL,
  testSupabaseConnection,
  checkAllTablesHealth,
  SupabaseHealthReport,
  updateSupabaseCredentials as updateSupabaseCredsService,
  resetSupabaseCredentialsToDefault,
  fetchHotelConfigFromSupabase,
  saveHotelConfigToSupabase,
  fetchRoomTypesFromSupabase,
  upsertRoomTypeToSupabase,
  fetchRoomsFromSupabase,
  upsertRoomToSupabase,
  deleteRoomFromSupabase,
  fetchGuestsFromSupabase,
  upsertGuestToSupabase,
  deleteGuestFromSupabase,
  fetchReservationsFromSupabase,
  upsertReservationToSupabase,
  deleteReservationFromSupabase,
  fetchPaymentsFromSupabase,
  upsertPaymentToSupabase,
  fetchBlocksFromSupabase,
  upsertBlockToSupabase,
  deleteBlockFromSupabase,
  fetchAutomationsFromSupabase,
  upsertAutomationToSupabase,
  fetchUsersFromSupabase,
  upsertUserToSupabase,
  deleteUserFromSupabase,
  fetchSecurityLogsFromSupabase,
  insertSecurityLogToSupabase,
  seedAllDataToSupabase,
  SeedAllResponse
} from '../services/supabase';

// Tipagem para os filtros de busca de disponibilidade
interface BookingSearchFilters {
  checkin: string;
  checkout: string;
  guests: number;
  selectedRoomId?: string;
}

// Interface principal do Contexto do Hotel (Estado Global, Ações e Operações)
interface HotelContextType {
  // Estado Principal
  hotelConfig: HotelConfig;
  rooms: Quarto[];
  roomTypes: TipoQuarto[];
  guests: Hospede[];
  reservations: Reserva[];
  payments: Pagamento[];
  blocks: BloqueioQuarto[];
  automations: AutomacaoMensagem[];
  users: Usuario[];
  currentUser: Usuario;

  // Supabase Cloud Database Status & Sincronização
  supabaseConfigured: boolean;
  supabaseUrl: string;
  supabaseStatus: 'connected' | 'syncing' | 'offline' | 'needs_tables' | 'error';
  supabaseLatency: number | null;
  supabaseMessage: string;
  lastSyncTime: string | null;
  healthReport: SupabaseHealthReport | null;
  syncFromSupabase: () => Promise<{ success: boolean; message: string }>;
  exportAllToSupabase: () => Promise<SeedAllResponse>;
  checkSupabaseHealth: () => Promise<void>;
  updateSupabaseCredentials: (url: string, key: string) => { success: boolean; message: string };
  resetSupabaseCredentials: () => void;

  // Estado de Visualização e Navegação
  currentView: 'landing' | 'admin';
  setCurrentView: (view: 'landing' | 'admin') => void;
  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;

  // Estado do Motor de Reservas (Modal)
  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  bookingSearchFilters: BookingSearchFilters;
  setBookingSearchFilters: (filters: BookingSearchFilters) => void;
  openBookingWithRoom: (roomId?: string) => void;

  // Ações - Configurações do Hotel e White-Label
  updateHotelConfig: (config: Partial<HotelConfig>) => void;
  applyTemplatePreset: (presetId: string) => boolean;
  importConfigJson: (jsonString: string) => { success: boolean; message: string };

  // Ações - Quartos e Categorias
  addRoom: (room: Omit<Quarto, 'id'>) => Quarto;
  updateRoom: (id: string, data: Partial<Quarto>) => void;
  deleteRoom: (id: string) => void;
  setRoomStatus: (id: string, status: RoomStatus) => void;
  addRoomType: (type: Omit<TipoQuarto, 'id'>) => TipoQuarto;
  updateRoomType: (id: string, data: Partial<TipoQuarto>) => void;

  // Ações - Bloqueios e Manutenções
  addBlock: (block: Omit<BloqueioQuarto, 'id'>) => void;
  deleteBlock: (id: string) => void;

  // Ações - Hóspedes e CRM
  addGuest: (guest: Omit<Hospede, 'id' | 'created_at'>) => Hospede;
  updateGuest: (id: string, data: Partial<Hospede>) => void;
  deleteGuest: (id: string) => void;

  // Ações - Reservas e Check-in/out
  createReservation: (
    reservaData: {
      quartoId: string;
      checkin: string;
      checkout: string;
      guestsCount: number;
      adultos: number;
      criancas: number;
      hospede: {
        nome: string;
        email: string;
        telefone: string;
        documento: string;
        dataNascimento?: string;
        cidade?: string;
        estado?: string;
      };
      pagamento: {
        metodo: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado';
        parcelas?: number;
      };
      observacoes?: string;
    }
  ) => { reserva: Reserva; hospede: Hospede; pagamento: Pagamento };

  updateReservationStatus: (id: string, status: ReservationStatus, extras?: { checkinTime?: string; checkoutTime?: string }) => void;
  cancelReservation: (id: string, motivo?: string) => void;
  addConsumoToReservation: (reservationId: string, consumo: Omit<ConsumoExtra, 'id'>) => void;
  deleteReservation: (id: string) => void;

  // Ações - Automações de Comunicação
  updateAutomation: (id: string, data: Partial<AutomacaoMensagem>) => void;
  simulateMessageDispatch: (automationId: string, reservaId: string) => { success: boolean; messageText: string; recipient: string; channel: string };

  // Ações - Usuários, Autenticação e Controle de Acesso
  isAuthenticated: boolean;
  pendingLoginUser: Usuario | null;
  pendingLoginOtp: string | null;
  loginValidatePassword: (email: string, senha: string) => { success: boolean; user?: Usuario; message?: string; otp?: string };
  complete2FALogin: (code: string, method?: TwoFactorMethod) => { success: boolean; message?: string };
  cancel2FALogin: () => void;
  login: (email: string, senha?: string) => { success: boolean; message?: string };
  logout: () => void;
  setCurrentUser: (user: Usuario) => void;
  addUser: (userData: Omit<Usuario, 'id' | 'created_at'>) => Usuario;
  updateUser: (id: string, data: Partial<Usuario>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  changeUserPassword: (id: string, novaSenha: string) => boolean;
  updateUserProfile: (data: Partial<Usuario>) => void;

  // Matriz de Controle de Acesso Baseado em Funções (RBAC Customizável)
  rbacMatrix: RBACMatrixConfig;
  updateRBACMatrix: (newMatrix: RBACMatrixConfig) => void;
  updateRBACPermission: (resourceId: string, role: UserRole, permission: Partial<RBACRolePermission>) => void;
  addRBACResource: (resource: Omit<RBACResourceRule, 'id'>) => void;
  editRBACResource: (resourceId: string, data: Partial<RBACResourceRule>) => void;
  deleteRBACResource: (resourceId: string) => void;
  resetRBACMatrix: () => void;
  hasTabAccess: (role: UserRole, tab: AdminTab) => boolean;
  getRoleModulePermission: (role: UserRole, resourceId: string) => RBACRolePermission | undefined;

  // Segurança em 2 Fatores em TODAS as Operações
  securityModalOpen: boolean;
  securityModalRequest: SecurityActionRequest | null;
  activeActionOtp: string | null;
  confirmActionWith2FA: (request: SecurityActionRequest) => void;
  closeSecurityModal: () => void;
  verifyAndExecuteAction: (password: string, code2FA: string, method?: TwoFactorMethod) => { success: boolean; message: string };
  generateNewActionOtp: () => string;
  securityLogs: SecurityLogEntry[];
  clearSecurityLogs: () => void;
  currentTotp: TotpStatus;

  // Utilitário de Busca de Disponibilidade
  searchRooms: (checkin: string, checkout: string, guests: number) => AvailabilityResult[];

  // Seletores e Consultas
  getRoomById: (id: string) => Quarto | undefined;
  getRoomTypeById: (id: string) => TipoQuarto | undefined;
  getGuestById: (id: string) => Hospede | undefined;
  getReservationById: (id: string) => Reserva | undefined;

  // Restauração de Base de Dados Demo
  resetDatabase: () => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

const STORAGE_PREFIX = 'HOTEL_CENTENARIO_PMS_V2_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao salvar no localStorage', e);
  }
}

// Datas padrão para formulário de busca inicial (amanhã / 3 noites após)
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(dayAfter.getDate() + 4);

const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hotelConfig, setHotelConfig] = useState<HotelConfig>(() => {
    const loaded = loadFromStorage<HotelConfig>('hotel_config', INITIAL_HOTEL_CONFIG);
    if (loaded.hero_titulo_custom === 'Hotel Centenário Itajubá') {
      loaded.hero_titulo_custom = 'Hotel Centenário';
    }
    if (loaded.nome === 'Hotel Centenário Itajubá') {
      loaded.nome = 'Hotel Centenário';
    }
    return loaded;
  });
  const [rooms, setRooms] = useState<Quarto[]>(() => loadFromStorage('rooms', INITIAL_ROOMS));
  const [roomTypes, setRoomTypes] = useState<TipoQuarto[]>(() => loadFromStorage('room_types', INITIAL_ROOM_TYPES));
  const [guests, setGuests] = useState<Hospede[]>(() => loadFromStorage('guests', INITIAL_GUESTS));
  const [reservations, setReservations] = useState<Reserva[]>(() => loadFromStorage('reservations', INITIAL_RESERVATIONS));
  const [payments, setPayments] = useState<Pagamento[]>(() => loadFromStorage('payments', INITIAL_PAYMENTS));
  const [blocks, setBlocks] = useState<BloqueioQuarto[]>(() => loadFromStorage('blocks', INITIAL_BLOCKS));
  const [automations, setAutomations] = useState<AutomacaoMensagem[]>(() => loadFromStorage('automations', INITIAL_AUTOMATIONS));
  const [users, setUsers] = useState<Usuario[]>(() => loadFromStorage('users', INITIAL_USERS));
  const [rbacMatrix, setRbacMatrix] = useState<RBACMatrixConfig>(() => {
    return loadFromStorage<RBACMatrixConfig>('rbac_matrix', hotelConfig.rbac_matrix || INITIAL_RBAC_MATRIX);
  });
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>(() => loadFromStorage('security_logs', INITIAL_SECURITY_LOGS));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadFromStorage('auth_authenticated', false));
  const [currentUser, setCurrentUser] = useState<Usuario>(() => {
    const saved = loadFromStorage<Usuario | null>('auth_current_user', null);
    if (saved) {
      const found = INITIAL_USERS.find((u) => u.id === saved.id);
      return found || saved;
    }
    return INITIAL_USERS[0];
  });

  // Supabase State
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'syncing' | 'offline' | 'needs_tables' | 'error'>('syncing');
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);
  const [supabaseMessage, setSupabaseMessage] = useState<string>('Verificando conexão com o Supabase...');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => loadFromStorage('supabase_last_sync', null));
  const [healthReport, setHealthReport] = useState<SupabaseHealthReport | null>(null);

  // Estados de Autenticação e 2FA
  const [pendingLoginUser, setPendingLoginUser] = useState<Usuario | null>(null);
  const [pendingLoginOtp, setPendingLoginOtp] = useState<string | null>(null);
  const [activeActionOtp, setActiveActionOtp] = useState<string | null>(null);

  // Estado do Modal de Confirmação de Operações 2FA
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityModalRequest, setSecurityModalRequest] = useState<SecurityActionRequest | null>(null);

  // Sincronizador de Token TOTP em Tempo Real
  const [currentTotp, setCurrentTotp] = useState<TotpStatus>(() => getCurrentTotpToken());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTotp(getCurrentTotpToken());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Estado de Visualização
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [adminActiveTab, setAdminActiveTab] = useState<string>('dashboard');

  // Estado do Modal de Reservas
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSearchFilters, setBookingSearchFilters] = useState<BookingSearchFilters>({
    checkin: formatDateForInput(tomorrow),
    checkout: formatDateForInput(dayAfter),
    guests: 2,
  });

  // Sincronização Automática com o Armazenamento Local (localStorage) e Variáveis CSS de Tema
  useEffect(() => { 
    saveToStorage('hotel_config', hotelConfig); 
    applyThemeVariables(hotelConfig.tema_cor);
  }, [hotelConfig]);
  useEffect(() => { saveToStorage('rooms', rooms); }, [rooms]);
  useEffect(() => { saveToStorage('room_types', roomTypes); }, [roomTypes]);
  useEffect(() => { saveToStorage('guests', guests); }, [guests]);
  useEffect(() => { saveToStorage('reservations', reservations); }, [reservations]);
  useEffect(() => { saveToStorage('payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('blocks', blocks); }, [blocks]);
  useEffect(() => { saveToStorage('automations', automations); }, [automations]);
  useEffect(() => { saveToStorage('users', users); }, [users]);
  useEffect(() => { saveToStorage('rbac_matrix', rbacMatrix); }, [rbacMatrix]);
  useEffect(() => { saveToStorage('security_logs', securityLogs); }, [securityLogs]);
  useEffect(() => { saveToStorage('auth_authenticated', isAuthenticated); }, [isAuthenticated]);
  useEffect(() => { saveToStorage('auth_current_user', currentUser); }, [currentUser]);
  useEffect(() => { if (lastSyncTime) saveToStorage('supabase_last_sync', lastSyncTime); }, [lastSyncTime]);

  // Função para testar saúde da conexão com Supabase e verificar todas as 10 tabelas
  const checkSupabaseHealth = useCallback(async () => {
    try {
      const report = await checkAllTablesHealth();
      setHealthReport(report);
      setSupabaseLatency(report.latencyMs);

      if (report.connected) {
        if (!report.allTablesReady) {
          setSupabaseStatus('needs_tables');
          setSupabaseMessage(`Supabase conectado! ${report.missingTables.length} tabela(s) pendente(s) de criação.`);
        } else {
          setSupabaseStatus('connected');
          setSupabaseMessage(`Conectado ao Supabase com todas as 10 tabelas prontas (${report.latencyMs}ms).`);
        }
      } else {
        setSupabaseStatus('offline');
        setSupabaseMessage(report.message || 'Falha ao conectar com o Supabase.');
      }
    } catch (err: any) {
      setSupabaseStatus('offline');
      setSupabaseMessage(`Erro de conexão: ${err?.message || 'Inacessível'}`);
    }
  }, []);

  const updateSupabaseCredentials = useCallback((url: string, key: string) => {
    const res = updateSupabaseCredsService(url, key);
    if (res.success) {
      checkSupabaseHealth();
    }
    return res;
  }, [checkSupabaseHealth]);

  const resetSupabaseCredentials = useCallback(() => {
    resetSupabaseCredentialsToDefault();
    checkSupabaseHealth();
  }, [checkSupabaseHealth]);

  // Função para sincronizar dados do Supabase para o estado local
  const syncFromSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setSupabaseStatus('syncing');
    setSupabaseMessage('Sincronizando com Supabase...');

    try {
      const [
        cfg,
        remoteTypes,
        remoteRooms,
        remoteGuests,
        remoteRes,
        remotePay,
        remoteBlocks,
        remoteAuto,
        remoteUsers,
        remoteLogs
      ] = await Promise.all([
        fetchHotelConfigFromSupabase(),
        fetchRoomTypesFromSupabase(),
        fetchRoomsFromSupabase(),
        fetchGuestsFromSupabase(),
        fetchReservationsFromSupabase(),
        fetchPaymentsFromSupabase(),
        fetchBlocksFromSupabase(),
        fetchAutomationsFromSupabase(),
        fetchUsersFromSupabase(),
        fetchSecurityLogsFromSupabase(),
      ]);

      let syncCount = 0;

      if (cfg) { setHotelConfig(cfg); syncCount++; }
      if (remoteTypes && remoteTypes.length > 0) { setRoomTypes(remoteTypes); syncCount += remoteTypes.length; }
      if (remoteRooms && remoteRooms.length > 0) { setRooms(remoteRooms); syncCount += remoteRooms.length; }
      if (remoteGuests && remoteGuests.length > 0) { setGuests(remoteGuests); syncCount += remoteGuests.length; }
      if (remoteRes && remoteRes.length > 0) { setReservations(remoteRes); syncCount += remoteRes.length; }
      if (remotePay && remotePay.length > 0) { setPayments(remotePay); syncCount += remotePay.length; }
      if (remoteBlocks && remoteBlocks.length > 0) { setBlocks(remoteBlocks); syncCount += remoteBlocks.length; }
      if (remoteAuto && remoteAuto.length > 0) { setAutomations(remoteAuto); syncCount += remoteAuto.length; }
      if (remoteUsers && remoteUsers.length > 0) { setUsers(remoteUsers); syncCount += remoteUsers.length; }
      if (remoteLogs && remoteLogs.length > 0) { setSecurityLogs(remoteLogs); syncCount += remoteLogs.length; }

      const now = new Date().toLocaleTimeString('pt-BR');
      setLastSyncTime(now);
      setSupabaseStatus('connected');
      const msg = `Sincronização concluída com sucesso! (${syncCount} registros atualizados).`;
      setSupabaseMessage(msg);
      return { success: true, message: msg };
    } catch (err: any) {
      setSupabaseStatus('error');
      const msg = `Erro ao sincronizar com Supabase: ${err?.message || 'Falha de rede'}`;
      setSupabaseMessage(msg);
      return { success: false, message: msg };
    }
  }, []);

  // Exportar / Enviar todos os dados locais para o Supabase (Seed / Push)
  const exportAllToSupabase = useCallback(async () => {
    setSupabaseStatus('syncing');
    setSupabaseMessage('Enviando dados locais para o Supabase...');

    const result = await seedAllDataToSupabase({
      hotelConfig,
      roomTypes,
      rooms,
      guests,
      reservations,
      payments,
      blocks,
      automations,
      users,
      securityLogs,
    });

    if (result.success) {
      setSupabaseStatus('connected');
      const now = new Date().toLocaleTimeString('pt-BR');
      setLastSyncTime(now);
      setSupabaseMessage('Todos os dados foram gravados no Supabase com sucesso!');
    } else {
      setSupabaseStatus(result.errors.some(e => e.includes('does not exist')) ? 'needs_tables' : 'error');
      setSupabaseMessage(`Erros ao exportar: ${result.errors.join('; ')}`);
    }

    return result;
  }, [hotelConfig, roomTypes, rooms, guests, reservations, payments, blocks, automations, users, securityLogs]);

  // Inicialização no Mount: testa Supabase e tenta sincronizar
  useEffect(() => {
    checkSupabaseHealth().then(() => {
      // Tenta sincronizar se estiver conectado
      syncFromSupabase().catch(() => {
        // Fallback silencioso para dados locais
      });
    });
  }, [checkSupabaseHealth, syncFromSupabase]);

  const openBookingWithRoom = (roomId?: string) => {
    setBookingSearchFilters((prev) => ({
      ...prev,
      selectedRoomId: roomId,
    }));
    setBookingModalOpen(true);
  };

  const updateHotelConfig = (newConfig: Partial<HotelConfig>) => {
    setHotelConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveHotelConfigToSupabase(updated).catch(() => {});
      return updated;
    });
  };

  const applyTemplatePreset = (presetId: string): boolean => {
    const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);
    if (!preset) return false;
    setHotelConfig(prev => {
      const updated = { ...prev, ...preset.config };
      saveHotelConfigToSupabase(updated).catch(() => {});
      return updated;
    });
    return true;
  };

  const importConfigJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !parsed.nome) {
        return { success: false, message: 'O arquivo JSON não possui o formato de configuração do hotel.' };
      }
      setHotelConfig(prev => {
        const updated = { ...prev, ...parsed };
        saveHotelConfigToSupabase(updated).catch(() => {});
        return updated;
      });
      return { success: true, message: `Configurações de "${parsed.nome}" importadas com sucesso!` };
    } catch {
      return { success: false, message: 'Erro ao interpretar arquivo JSON. Verifique a formatação do arquivo.' };
    }
  };

  // Gerenciamento de Quartos
  const addRoom = (roomData: Omit<Quarto, 'id'>): Quarto => {
    const newRoom: Quarto = {
      ...roomData,
      id: `rm-${Date.now()}`,
      fechadura_pin: roomData.fechadura_pin || generateSmartLockPin(),
    };
    setRooms((prev) => [...prev, newRoom]);
    upsertRoomToSupabase(newRoom).catch(() => {});
    return newRoom;
  };

  const updateRoom = (id: string, data: Partial<Quarto>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...data };
          upsertRoomToSupabase(updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );
  };

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    deleteRoomFromSupabase(id).catch(() => {});
  };

  const setRoomStatus = (id: string, status: RoomStatus) => {
    updateRoom(id, { status });
  };

  const addRoomType = (typeData: Omit<TipoQuarto, 'id'>): TipoQuarto => {
    const newType: TipoQuarto = {
      ...typeData,
      id: `tipo-${Date.now()}`,
    };
    setRoomTypes((prev) => [...prev, newType]);
    upsertRoomTypeToSupabase(newType).catch(() => {});
    return newType;
  };

  const updateRoomType = (id: string, data: Partial<TipoQuarto>) => {
    setRoomTypes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...data };
          upsertRoomTypeToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  };

  // Bloqueios de Quarto e Manutenção
  const addBlock = (blockData: Omit<BloqueioQuarto, 'id'>) => {
    const newBlock: BloqueioQuarto = {
      ...blockData,
      id: `blk-${Date.now()}`,
    };
    setBlocks((prev) => [...prev, newBlock]);
    upsertBlockToSupabase(newBlock).catch(() => {});
    // Define o quarto como em manutenção
    setRoomStatus(blockData.quarto_id, 'manutencao');
  };

  const deleteBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block) {
      setRoomStatus(block.quarto_id, 'disponivel');
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    deleteBlockFromSupabase(id).catch(() => {});
  };

  // Cadastro e CRM de Hóspedes
  const addGuest = (guestData: Omit<Hospede, 'id' | 'created_at'>): Hospede => {
    const existing = guests.find((g) => g.documento === guestData.documento || g.email === guestData.email);
    if (existing) {
      const updated: Hospede = { ...existing, ...guestData, total_estadias: (existing.total_estadias || 1) + 1 };
      setGuests((prev) => prev.map((g) => (g.id === existing.id ? updated : g)));
      upsertGuestToSupabase(updated).catch(() => {});
      return updated;
    }

    const newGuest: Hospede = {
      ...guestData,
      id: `hosp-${Date.now()}`,
      total_estadias: 1,
      created_at: new Date().toISOString(),
    };
    setGuests((prev) => [...prev, newGuest]);
    upsertGuestToSupabase(newGuest).catch(() => {});
    return newGuest;
  };

  const updateGuest = (id: string, data: Partial<Hospede>) => {
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = { ...g, ...data };
          upsertGuestToSupabase(updated).catch(() => {});
          return updated;
        }
        return g;
      })
    );
  };

  const deleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    deleteGuestFromSupabase(id).catch(() => {});
  };

  // Fluxo Completo de Criação de Reserva (conforme fluxo de reservas)
  const createReservation = (params: {
    quartoId: string;
    checkin: string;
    checkout: string;
    guestsCount: number;
    adultos: number;
    criancas: number;
    hospede: {
      nome: string;
      email: string;
      telefone: string;
      documento: string;
      dataNascimento?: string;
      cidade?: string;
      estado?: string;
    };
    pagamento: {
      metodo: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado';
      parcelas?: number;
    };
    observacoes?: string;
  }) => {
    const room = rooms.find((r) => r.id === params.quartoId);
    if (!room) throw new Error('Quarto não encontrado');

    // 1. Cadastrar ou localizar hóspede
    const guest = addGuest({
      nome: params.hospede.nome,
      email: params.hospede.email,
      telefone: params.hospede.telefone,
      documento: params.hospede.documento,
      data_nascimento: params.hospede.dataNascimento || '1990-01-01',
      cidade: params.hospede.cidade,
      estado: params.hospede.estado,
    });

    // 2. Calcular valores de diárias e taxa de serviço
    const start = new Date(params.checkin + 'T00:00:00');
    const end = new Date(params.checkout + 'T00:00:00');
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const valorDiarias = room.valor_diaria * nights;
    const valorTaxas = Math.round(valorDiarias * (hotelConfig.taxa_servico_percentual / 100));
    const valorTotal = valorDiarias + valorTaxas;

    const reservationId = `res-${Date.now()}`;
    const paymentId = `pag-${Date.now()}`;
    const bookingCode = generateBookingCode();
    const smartPin = room.fechadura_pin || generateSmartLockPin();

    // 3. Registrar o Pagamento
    const payment: Pagamento = {
      id: paymentId,
      reserva_id: reservationId,
      valor: valorTotal,
      metodo: params.pagamento.metodo,
      status: 'aprovado',
      codigo_transacao: `${params.pagamento.metodo.toUpperCase()}-AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`,
      parcelas: params.pagamento.parcelas || 1,
      data_pagamento: new Date().toISOString(),
    };

    // 4. Registrar a Reserva
    const reservation: Reserva = {
      id: reservationId,
      codigo: bookingCode,
      hospede_id: guest.id,
      quarto_id: room.id,
      checkin: params.checkin,
      checkout: params.checkout,
      quantidade_hospedes: params.guestsCount,
      adultos: params.adultos,
      criancas: params.criancas,
      valor_diarias: valorDiarias,
      valor_taxas: valorTaxas,
      valor_consumo: 0,
      valor_total: valorTotal,
      status: 'confirmada',
      forma_pagamento: params.pagamento.metodo,
      pagamento_id: paymentId,
      observacoes: params.observacoes || '',
      pin_fechadura: smartPin,
      consumo_itens: [],
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [payment, ...prev]);
    setReservations((prev) => [reservation, ...prev]);

    // Gravação no Supabase
    upsertPaymentToSupabase(payment).catch(() => {});
    upsertReservationToSupabase(reservation).catch(() => {});

    return { reserva: reservation, hospede: guest, pagamento: payment };
  };

  const updateReservationStatus = (
    id: string, 
    status: ReservationStatus, 
    extras?: { checkinTime?: string; checkoutTime?: string }
  ) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== id) return res;
        const updated = { ...res, status };
        if (extras?.checkinTime) updated.checkin_horario = extras.checkinTime;
        if (extras?.checkoutTime) updated.checkout_horario = extras.checkoutTime;

        // Atualização automática do status operacional do quarto
        if (status === 'checkin_realizado') {
          setRoomStatus(res.quarto_id, 'ocupado');
        } else if (status === 'checkout_concluido') {
          setRoomStatus(res.quarto_id, 'limpeza');
        }

        upsertReservationToSupabase(updated).catch(() => {});
        return updated;
      })
    );
  };

  const cancelReservation = (id: string, motivo?: string) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== id) return res;
        setRoomStatus(res.quarto_id, 'disponivel');
        const updated: Reserva = {
          ...res,
          status: 'cancelada',
          observacoes: motivo ? `${res.observacoes ? res.observacoes + ' | ' : ''}Cancelada: ${motivo}` : res.observacoes,
        };
        upsertReservationToSupabase(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addConsumoToReservation = (reservationId: string, consumo: Omit<ConsumoExtra, 'id'>) => {
    const newExtra: ConsumoExtra = {
      ...consumo,
      id: `c-${Date.now()}`,
    };

    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== reservationId) return res;
        const currentItens = res.consumo_itens || [];
        const updatedItens = [...currentItens, newExtra];
        const addedValue = (consumo.quantidade || 1) * (consumo.valor_unitario || 0);
        const currentConsumo = res.valor_consumo || 0;
        const newConsumo = currentConsumo + addedValue;
        const updated: Reserva = {
          ...res,
          consumo_itens: updatedItens,
          valor_consumo: newConsumo,
          valor_total: (res.valor_diarias || 0) + (res.valor_taxas || 0) + newConsumo,
        };
        upsertReservationToSupabase(updated).catch(() => {});
        return updated;
      })
    );
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    deleteReservationFromSupabase(id).catch(() => {});
  };

  // Automações de Mensagens
  const updateAutomation = (id: string, data: Partial<AutomacaoMensagem>) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...data };
          upsertAutomationToSupabase(updated).catch(() => {});
          return updated;
        }
        return a;
      })
    );
  };

  const simulateMessageDispatch = (automationId: string, reservaId: string) => {
    const auto = automations.find((a) => a.id === automationId);
    const res = reservations.find((r) => r.id === reservaId);
    if (!auto || !res) return { success: false, messageText: '', recipient: '', channel: '' };

    const guest = guests.find((g) => g.id === res.hospede_id);
    const room = rooms.find((r) => r.id === res.quarto_id);

    let text = auto.template;
    text = text.replace(/{NOME_HOSPEDE}/g, guest?.nome || 'Hóspede');
    text = text.replace(/{CODIGO_RESERVA}/g, res.codigo);
    text = text.replace(/{NOME_QUARTO}/g, room?.nome || 'Acomodação');
    text = text.replace(/{NUMERO_QUARTO}/g, room?.numero || '---');
    text = text.replace(/{CHECKIN}/g, res.checkin);
    text = text.replace(/{CHECKOUT}/g, res.checkout);
    text = text.replace(/{QTD_HOSPEDES}/g, res.quantidade_hospedes.toString());
    text = text.replace(/{PIN_FECHADURA}/g, res.pin_fechadura || '123456');
    text = text.replace(/{VALOR_TOTAL}/g, `R$ ${res.valor_total.toFixed(2)}`);

    return {
      success: true,
      messageText: text,
      recipient: auto.canal === 'whatsapp' ? (guest?.telefone || '') : (guest?.email || ''),
      channel: auto.canal,
    };
  };

  // Controle de Autenticação e Sessão do Usuário com 2 Fatores (2FA)
  const loginValidatePassword = (email: string, senha: string): { success: boolean; user?: Usuario; message?: string; otp?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.trim().toLowerCase() === trimmedEmail);

    if (!user) {
      return { success: false, message: 'E-mail corporativo não encontrado no sistema.' };
    }

    if (user.ativo === false) {
      return { success: false, message: 'Este usuário está desativado pelo administrador. Entre em contato com a gerência.' };
    }

    const expectedPassword = user.senha || 'admin';
    if (senha.trim() !== expectedPassword.trim()) {
      return { success: false, message: 'Senha incorreta para o usuário informado.' };
    }

    const otp = generateOtpToken();
    setPendingLoginUser(user);
    setPendingLoginOtp(otp);

    return { success: true, user, otp };
  };

  const complete2FALogin = (code: string, method: TwoFactorMethod = 'authenticator'): { success: boolean; message?: string } => {
    if (!pendingLoginUser) {
      return { success: false, message: 'Nenhuma sessão de autenticação pendente.' };
    }

    const validation = validate2FACode(code, pendingLoginOtp || undefined);
    if (!validation.valid) {
      return { success: false, message: 'Código de Confirmação em 2 Fatores inválido. Verifique seu app autenticador ou token recebido.' };
    }

    const updatedUser = {
      ...pendingLoginUser,
      ultimo_acesso: new Date().toISOString(),
    };

    const newLog: SecurityLogEntry = {
      id: `log-${Date.now()}`,
      usuario_id: pendingLoginUser.id,
      usuario_nome: pendingLoginUser.nome,
      usuario_email: pendingLoginUser.email,
      usuario_cargo: pendingLoginUser.cargo_titulo || pendingLoginUser.tipo_usuario,
      operacao: 'Login com Autenticação de 2 Fatores (2FA)',
      detalhes: `Acesso autenticado com sucesso via ${method.toUpperCase()} e senha corporativa.`,
      categoria: 'Sistema',
      metodo_2fa: method,
      ip_origem: '187.54.120.45 (Terminal Autenticado)',
      sucesso: true,
      timestamp: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === pendingLoginUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setAdminActiveTab('dashboard');
    setSecurityLogs((prev) => [newLog, ...prev]);

    // Supabase
    upsertUserToSupabase(updatedUser).catch(() => {});
    insertSecurityLogToSupabase(newLog).catch(() => {});

    setPendingLoginUser(null);
    setPendingLoginOtp(null);

    return { success: true };
  };

  const cancel2FALogin = () => {
    setPendingLoginUser(null);
    setPendingLoginOtp(null);
  };

  const login = (email: string, senha?: string): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.trim().toLowerCase() === trimmedEmail);

    if (!user) {
      return { success: false, message: 'E-mail de usuário não encontrado no sistema.' };
    }

    if (user.ativo === false) {
      return { success: false, message: 'Este usuário está desativado pelo administrador.' };
    }

    if (senha && user.senha && user.senha !== senha) {
      return { success: false, message: 'Senha incorreta para o usuário informado.' };
    }

    const updatedUser = {
      ...user,
      ultimo_acesso: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setAdminActiveTab('dashboard');
    upsertUserToSupabase(updatedUser).catch(() => {});
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPendingLoginUser(null);
    setPendingLoginOtp(null);
    setSecurityModalOpen(false);
    setSecurityModalRequest(null);
  };

  // Sistema de Confirmação em 2 Fatores para Operações Administrativas (Área Logada)
  const confirmActionWith2FA = (request: SecurityActionRequest) => {
    const otp = generateOtpToken();
    setActiveActionOtp(otp);
    setSecurityModalRequest(request);
    setSecurityModalOpen(true);
  };

  const closeSecurityModal = () => {
    setSecurityModalOpen(false);
    setSecurityModalRequest(null);
    setActiveActionOtp(null);
  };

  const generateNewActionOtp = (): string => {
    const otp = generateOtpToken();
    setActiveActionOtp(otp);
    return otp;
  };

  const verifyAndExecuteAction = (
    password: string, 
    code2FA: string, 
    method: TwoFactorMethod = 'authenticator'
  ): { success: boolean; message: string } => {
    if (!securityModalRequest) {
      return { success: false, message: 'Nenhuma operação em processo de autorização.' };
    }

    // 1. Validação Obrigatória da Senha Operacional do Usuário Atual
    const expectedPassword = currentUser.senha || 'admin';
    if (!password || password.trim() !== expectedPassword.trim()) {
      return { success: false, message: 'Senha operacional incorreta. Insira a senha do usuário conectado.' };
    }

    // 2. Validação Obrigatória do Token de 2 Fatores
    const validation = validate2FACode(code2FA, activeActionOtp || undefined);
    if (!validation.valid) {
      return { success: false, message: 'Código de Confirmação em 2 Fatores incorreto ou expirado.' };
    }

    // 3. Registrar Log de Auditoria Imutável
    const newLog: SecurityLogEntry = {
      id: `log-${Date.now()}`,
      usuario_id: currentUser.id,
      usuario_nome: currentUser.nome,
      usuario_email: currentUser.email,
      usuario_cargo: currentUser.cargo_titulo || currentUser.tipo_usuario,
      operacao: securityModalRequest.title,
      detalhes: `${securityModalRequest.description}${securityModalRequest.details ? ' | ' + securityModalRequest.details : ''}`,
      categoria: securityModalRequest.category,
      metodo_2fa: method,
      ip_origem: '187.54.120.45 (Terminal Seguro PMS)',
      sucesso: true,
      timestamp: new Date().toISOString(),
    };

    setSecurityLogs((prev) => [newLog, ...prev]);
    insertSecurityLogToSupabase(newLog).catch(() => {});

    // 4. Executa a Ação Operacional
    try {
      securityModalRequest.onConfirm();
    } catch (e) {
      console.error('Erro ao executar ação após autorização 2FA', e);
    }

    // 5. Finaliza e Fecha o Modal
    closeSecurityModal();
    return { success: true, message: 'Operação autorizada e executada com sucesso com validação 2FA!' };
  };

  const clearSecurityLogs = () => {
    setSecurityLogs(INITIAL_SECURITY_LOGS);
  };

  // Gerenciamento Completo de Usuários
  const addUser = (userData: Omit<Usuario, 'id' | 'created_at'>): Usuario => {
    const newUser: Usuario = {
      ...userData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      ultimo_acesso: undefined,
    };
    setUsers((prev) => [...prev, newUser]);
    upsertUserToSupabase(newUser).catch(() => {});
    return newUser;
  };

  const updateUser = (id: string, data: Partial<Usuario>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          upsertUserToSupabase(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Não é possível excluir o usuário conectado na sessão atual.' };
    }

    const adminCount = users.filter((u) => u.tipo_usuario === 'admin' && u.ativo).length;
    if (userToDelete.tipo_usuario === 'admin' && adminCount <= 1) {
      return { success: false, message: 'Não é possível remover o único administrador ativo do hotel.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteUserFromSupabase(id).catch(() => {});
    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          if (u.id === currentUser.id) {
            alert('Você não pode desativar seu próprio usuário em sessão.');
            return u;
          }
          const updated = { ...u, ativo: !u.ativo };
          upsertUserToSupabase(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
  };

  const changeUserPassword = (id: string, novaSenha: string): boolean => {
    if (!novaSenha || novaSenha.length < 3) return false;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, senha: novaSenha };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          upsertUserToSupabase(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
    return true;
  };

  const updateUserProfile = (data: Partial<Usuario>) => {
    if (!currentUser) return;
    updateUser(currentUser.id, data);
  };

  // Gerenciamento e Customização da Matriz de Controle de Acesso (RBAC)
  const hasTabAccess = useCallback((role: UserRole, tab: AdminTab): boolean => {
    if (role === 'admin') return true;

    // Buscar recurso mapeado com adminTab ou pelo id
    const rule = rbacMatrix.resources.find((r) => r.adminTab === tab || r.id === tab);
    if (rule && rule.permissions && rule.permissions[role]) {
      return rule.permissions[role].granted;
    }

    // Regras padrão de contingência
    if (tab === 'dashboard') return true;
    if (tab === 'settings' || tab === 'users') return role === 'gerente';
    if (tab === 'financial') return role === 'gerente' || role === 'financeiro';
    if (tab === 'rooms' || tab === 'checkin_out' || tab === 'frigobar') return true;
    if (tab === 'reservations' || tab === 'guests' || tab === 'automation') return role === 'gerente' || role === 'recepcionista';
    return false;
  }, [rbacMatrix]);

  const getRoleModulePermission = useCallback((role: UserRole, resourceId: string): RBACRolePermission | undefined => {
    const rule = rbacMatrix.resources.find((r) => r.id === resourceId);
    return rule?.permissions?.[role];
  }, [rbacMatrix]);

  const updateRBACPermission = useCallback((resourceId: string, role: UserRole, permissionData: Partial<RBACRolePermission>) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome ? `${currentUser.nome} (${currentUser.cargo_titulo || currentUser.tipo_usuario})` : 'Administrador',
        resources: prev.resources.map((res) => {
          if (res.id !== resourceId) return res;
          const currentRolePerm = res.permissions[role] || { granted: true, level: 'total', customLabel: '✓ Total' };
          return {
            ...res,
            permissions: {
              ...res.permissions,
              [role]: {
                ...currentRolePerm,
                ...permissionData,
              },
            },
          };
        }),
      };
      setHotelConfig((h) => ({ ...h, rbac_matrix: updated }));
      return updated;
    });
  }, [currentUser]);

  const updateRBACMatrix = useCallback((newMatrix: RBACMatrixConfig) => {
    setRbacMatrix(newMatrix);
    setHotelConfig((h) => ({ ...h, rbac_matrix: newMatrix }));
    saveToStorage('rbac_matrix', newMatrix);
  }, []);

  const addRBACResource = useCallback((resourceData: Omit<RBACResourceRule, 'id'>) => {
    const newId = 'custom-res-' + Date.now();
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: [
          ...prev.resources,
          {
            ...resourceData,
            id: newId,
            isCustom: true,
          },
        ],
      };
      setHotelConfig((h) => ({ ...h, rbac_matrix: updated }));
      return updated;
    });
  }, [currentUser]);

  const editRBACResource = useCallback((resourceId: string, data: Partial<RBACResourceRule>) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: prev.resources.map((r) => (r.id === resourceId ? { ...r, ...data } : r)),
      };
      setHotelConfig((h) => ({ ...h, rbac_matrix: updated }));
      return updated;
    });
  }, [currentUser]);

  const deleteRBACResource = useCallback((resourceId: string) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: prev.resources.filter((r) => r.id !== resourceId),
      };
      setHotelConfig((h) => ({ ...h, rbac_matrix: updated }));
      return updated;
    });
  }, [currentUser]);

  const resetRBACMatrix = useCallback(() => {
    setRbacMatrix(INITIAL_RBAC_MATRIX);
    setHotelConfig((h) => ({ ...h, rbac_matrix: INITIAL_RBAC_MATRIX }));
    saveToStorage('rbac_matrix', INITIAL_RBAC_MATRIX);
  }, []);

  // Motor de Busca de Disponibilidade
  const searchRooms = (checkin: string, checkout: string, guestsCount: number) => {
    return searchAvailableRooms(
      checkin,
      checkout,
      guestsCount,
      rooms,
      roomTypes,
      reservations,
      blocks,
      hotelConfig.taxa_servico_percentual
    );
  };

  // Seletores e Localizadores
  const getRoomById = (id: string) => rooms.find((r) => r.id === id);
  const getRoomTypeById = (id: string) => roomTypes.find((t) => t.id === id);
  const getGuestById = (id: string) => guests.find((g) => g.id === id);
  const getReservationById = (id: string) => reservations.find((r) => r.id === id);

  const resetDatabase = () => {
    localStorage.clear();
    setHotelConfig(INITIAL_HOTEL_CONFIG);
    setRooms(INITIAL_ROOMS);
    setRoomTypes(INITIAL_ROOM_TYPES);
    setGuests(INITIAL_GUESTS);
    setReservations(INITIAL_RESERVATIONS);
    setPayments(INITIAL_PAYMENTS);
    setBlocks(INITIAL_BLOCKS);
    setAutomations(INITIAL_AUTOMATIONS);
    setUsers(INITIAL_USERS);
    setRbacMatrix(INITIAL_RBAC_MATRIX);
    setCurrentUser(INITIAL_USERS[0]);
    setIsAuthenticated(true);
  };

  return (
    <HotelContext.Provider
      value={{
        hotelConfig,
        rooms,
        roomTypes,
        guests,
        reservations,
        payments,
        blocks,
        automations,
        users,
        currentUser,
        rbacMatrix,
        updateRBACMatrix,
        updateRBACPermission,
        addRBACResource,
        editRBACResource,
        deleteRBACResource,
        resetRBACMatrix,
        hasTabAccess,
        getRoleModulePermission,
        supabaseConfigured: isSupabaseConfigured,
        supabaseUrl: SUPABASE_URL,
        supabaseStatus,
        supabaseLatency,
        supabaseMessage,
        lastSyncTime,
        healthReport,
        syncFromSupabase,
        exportAllToSupabase,
        checkSupabaseHealth,
        updateSupabaseCredentials,
        resetSupabaseCredentials,
        isAuthenticated,
        pendingLoginUser,
        pendingLoginOtp,
        loginValidatePassword,
        complete2FALogin,
        cancel2FALogin,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        changeUserPassword,
        updateUserProfile,
        securityModalOpen,
        securityModalRequest,
        activeActionOtp,
        confirmActionWith2FA,
        closeSecurityModal,
        verifyAndExecuteAction,
        generateNewActionOtp,
        securityLogs,
        clearSecurityLogs,
        currentTotp,
        currentView,
        setCurrentView,
        adminActiveTab,
        setAdminActiveTab,
        bookingModalOpen,
        setBookingModalOpen,
        bookingSearchFilters,
        setBookingSearchFilters,
        openBookingWithRoom,
        updateHotelConfig,
        applyTemplatePreset,
        importConfigJson,
        addRoom,
        updateRoom,
        deleteRoom,
        setRoomStatus,
        addRoomType,
        updateRoomType,
        addBlock,
        deleteBlock,
        addGuest,
        updateGuest,
        deleteGuest,
        createReservation,
        updateReservationStatus,
        cancelReservation,
        addConsumoToReservation,
        deleteReservation,
        updateAutomation,
        simulateMessageDispatch,
        setCurrentUser,
        searchRooms,
        getRoomById,
        getRoomTypeById,
        getGuestById,
        getReservationById,
        resetDatabase,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
