import React, { createContext, useContext, useState, useEffect } from 'react';
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
  ConsumoExtra
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
  INITIAL_USERS 
} from '../data/mockInitialData';
import { searchAvailableRooms, generateBookingCode, generateSmartLockPin } from '../utils/availability';
import { TEMPLATE_PRESETS } from '../utils/themeHelper';

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
  login: (email: string, senha?: string) => { success: boolean; message?: string };
  logout: () => void;
  setCurrentUser: (user: Usuario) => void;
  addUser: (userData: Omit<Usuario, 'id' | 'created_at'>) => Usuario;
  updateUser: (id: string, data: Partial<Usuario>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  changeUserPassword: (id: string, novaSenha: string) => boolean;
  updateUserProfile: (data: Partial<Usuario>) => void;

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

const STORAGE_PREFIX = 'ITAJUBA_FLAT_PMS_V1_';

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
  const [hotelConfig, setHotelConfig] = useState<HotelConfig>(() => loadFromStorage('hotel_config', INITIAL_HOTEL_CONFIG));
  const [rooms, setRooms] = useState<Quarto[]>(() => loadFromStorage('rooms', INITIAL_ROOMS));
  const [roomTypes, setRoomTypes] = useState<TipoQuarto[]>(() => loadFromStorage('room_types', INITIAL_ROOM_TYPES));
  const [guests, setGuests] = useState<Hospede[]>(() => loadFromStorage('guests', INITIAL_GUESTS));
  const [reservations, setReservations] = useState<Reserva[]>(() => loadFromStorage('reservations', INITIAL_RESERVATIONS));
  const [payments, setPayments] = useState<Pagamento[]>(() => loadFromStorage('payments', INITIAL_PAYMENTS));
  const [blocks, setBlocks] = useState<BloqueioQuarto[]>(() => loadFromStorage('blocks', INITIAL_BLOCKS));
  const [automations, setAutomations] = useState<AutomacaoMensagem[]>(() => loadFromStorage('automations', INITIAL_AUTOMATIONS));
  const [users, setUsers] = useState<Usuario[]>(() => loadFromStorage('users', INITIAL_USERS));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadFromStorage('auth_authenticated', false));
  const [currentUser, setCurrentUser] = useState<Usuario>(() => {
    const saved = loadFromStorage<Usuario | null>('auth_current_user', null);
    if (saved) {
      const found = INITIAL_USERS.find((u) => u.id === saved.id);
      return found || saved;
    }
    return INITIAL_USERS[0];
  });

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

  // Sincronização Automática com o Armazenamento Local (localStorage)
  useEffect(() => { saveToStorage('hotel_config', hotelConfig); }, [hotelConfig]);
  useEffect(() => { saveToStorage('rooms', rooms); }, [rooms]);
  useEffect(() => { saveToStorage('room_types', roomTypes); }, [roomTypes]);
  useEffect(() => { saveToStorage('guests', guests); }, [guests]);
  useEffect(() => { saveToStorage('reservations', reservations); }, [reservations]);
  useEffect(() => { saveToStorage('payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('blocks', blocks); }, [blocks]);
  useEffect(() => { saveToStorage('automations', automations); }, [automations]);
  useEffect(() => { saveToStorage('users', users); }, [users]);
  useEffect(() => { saveToStorage('auth_authenticated', isAuthenticated); }, [isAuthenticated]);
  useEffect(() => { saveToStorage('auth_current_user', currentUser); }, [currentUser]);

  const openBookingWithRoom = (roomId?: string) => {
    setBookingSearchFilters((prev) => ({
      ...prev,
      selectedRoomId: roomId,
    }));
    setBookingModalOpen(true);
  };

  const updateHotelConfig = (newConfig: Partial<HotelConfig>) => {
    setHotelConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const applyTemplatePreset = (presetId: string): boolean => {
    const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);
    if (!preset) return false;
    setHotelConfig(prev => ({
      ...prev,
      ...preset.config
    }));
    return true;
  };

  const importConfigJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !parsed.nome) {
        return { success: false, message: 'O arquivo JSON não possui o formato de configuração do hotel.' };
      }
      setHotelConfig(prev => ({
        ...prev,
        ...parsed
      }));
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
    return newRoom;
  };

  const updateRoom = (id: string, data: Partial<Quarto>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const setRoomStatus = (id: string, status: RoomStatus) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const addRoomType = (typeData: Omit<TipoQuarto, 'id'>): TipoQuarto => {
    const newType: TipoQuarto = {
      ...typeData,
      id: `tipo-${Date.now()}`,
    };
    setRoomTypes((prev) => [...prev, newType]);
    return newType;
  };

  const updateRoomType = (id: string, data: Partial<TipoQuarto>) => {
    setRoomTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  // Bloqueios de Quarto e Manutenção
  const addBlock = (blockData: Omit<BloqueioQuarto, 'id'>) => {
    const newBlock: BloqueioQuarto = {
      ...blockData,
      id: `blk-${Date.now()}`,
    };
    setBlocks((prev) => [...prev, newBlock]);
    // Define o quarto como em manutenção
    setRoomStatus(blockData.quarto_id, 'manutencao');
  };

  const deleteBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block) {
      setRoomStatus(block.quarto_id, 'disponivel');
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Cadastro e CRM de Hóspedes
  const addGuest = (guestData: Omit<Hospede, 'id' | 'created_at'>): Hospede => {
    const existing = guests.find((g) => g.documento === guestData.documento || g.email === guestData.email);
    if (existing) {
      const updated: Hospede = { ...existing, ...guestData, total_estadias: (existing.total_estadias || 1) + 1 };
      setGuests((prev) => prev.map((g) => (g.id === existing.id ? updated : g)));
      return updated;
    }

    const newGuest: Hospede = {
      ...guestData,
      id: `hosp-${Date.now()}`,
      total_estadias: 1,
      created_at: new Date().toISOString(),
    };
    setGuests((prev) => [...prev, newGuest]);
    return newGuest;
  };

  const updateGuest = (id: string, data: Partial<Hospede>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
  };

  const deleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
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
        return updated;
      })
    );
  };

  const cancelReservation = (id: string, motivo?: string) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== id) return res;
        setRoomStatus(res.quarto_id, 'disponivel');
        return {
          ...res,
          status: 'cancelada',
          observacoes: motivo ? `${res.observacoes ? res.observacoes + ' | ' : ''}Cancelada: ${motivo}` : res.observacoes,
        };
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
        const addedValue = consumo.quantidade * consumo.valor_unitario;
        const currentConsumo = res.valor_consumo || 0;
        const newConsumo = currentConsumo + addedValue;
        return {
          ...res,
          consumo_itens: updatedItens,
          valor_consumo: newConsumo,
          valor_total: res.valor_diarias + res.valor_taxas + newConsumo,
        };
      })
    );
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  // Automações de Mensagens
  const updateAutomation = (id: string, data: Partial<AutomacaoMensagem>) => {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
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

  // Controle de Autenticação e Sessão do Usuário
  const login = (email: string, senha?: string): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.trim().toLowerCase() === trimmedEmail);

    if (!user) {
      return { success: false, message: 'E-mail de usuário não encontrado no sistema.' };
    }

    if (user.ativo === false) {
      return { success: false, message: 'Este usuário está desativado pelo administrador. Entre em contato com a gerência.' };
    }

    // Se a senha foi informada, valida (se não cadastrada, aceita senha padrão de demonstração)
    if (senha && user.senha && user.senha !== senha) {
      return { success: false, message: 'Senha incorreta para o usuário selecionado.' };
    }

    const updatedUser = {
      ...user,
      ultimo_acesso: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
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
        isAuthenticated,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        changeUserPassword,
        updateUserProfile,
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
