export type UserRole = 'admin' | 'gerente' | 'recepcionista' | 'governanca' | 'financeiro';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo_usuario: UserRole;
  cargo_titulo?: string;
  telefone?: string;
  ativo: boolean;
  avatar?: string;
  ultimo_acesso?: string;
  permissoes?: string[];
  created_at: string;
}

export interface TipoQuarto {
  id: string;
  nome: string;
  descricao: string;
  capacidade_padrao: number;
  icone?: string;
  comodidades_principais: string[];
}

export type RoomStatus = 'disponivel' | 'ocupado' | 'manutencao' | 'limpeza' | 'bloqueado' | 'vistoria';
export type HousekeepingStatus = 'limpo' | 'sujo' | 'em_limpeza' | 'inspecionado' | 'nao_perturbe';

export interface Quarto {
  id: string;
  numero: string;
  nome: string;
  tipo_quarto_id: string;
  capacidade: number;
  valor_diaria: number;
  descricao: string;
  status: RoomStatus;
  status_governanca?: HousekeepingStatus;
  status_manutencao_motivo?: string;
  ultima_limpeza?: string;
  responsavel_limpeza?: string;
  ativo: boolean;
  andar: number;
  fotos: string[];
  comodidades: string[];
  tamanho_m2: number;
  vista: string;
  cama: string;
  fechadura_pin?: string;
  fechadura_bateria?: number;
  fechadura_online?: boolean;
  notas_internas?: string;
}

export interface Hospede {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  data_nascimento: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  nacionalidade?: string;
  notas_preferencias?: string;
  vip?: boolean;
  total_estadias?: number;
  created_at: string;
}

export type ReservationStatus = 
  | 'pendente'
  | 'confirmada'
  | 'checkin_realizado'
  | 'checkout_concluido'
  | 'cancelada';

export interface ConsumoExtra {
  id: string;
  item: string;
  quantidade: number;
  valor_unitario: number;
  data: string;
}

export interface Reserva {
  id: string;
  codigo: string; // Ex: RES-9821
  hospede_id: string;
  quarto_id: string;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  quantidade_hospedes: number;
  adultos: number;
  criancas: number;
  valor_diarias: number;
  valor_taxas: number;
  valor_consumo?: number;
  valor_total: number;
  status: ReservationStatus;
  forma_pagamento?: string;
  pagamento_id?: string;
  observacoes?: string;
  checkin_horario?: string;
  checkout_horario?: string;
  consumo_itens?: ConsumoExtra[];
  pin_fechadura?: string;
  created_at: string;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado';
export type PaymentStatus = 'aprovado' | 'pendente' | 'reembolsado';

export interface Pagamento {
  id: string;
  reserva_id: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  codigo_transacao: string;
  parcelas?: number;
  data_pagamento: string;
}

export interface BloqueioQuarto {
  id: string;
  quarto_id: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  criado_por: string;
}

export type ThemeColorPalette = 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'slate' | 'terracotta';
export type TypographyStyle = 'serif_luxury' | 'modern_sans' | 'editorial';
export type PropertyType = 'hotel' | 'pousada' | 'resort' | 'flat' | 'boutique' | 'chales' | 'fazenda';

export interface CustomAmenity {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  destaque?: boolean;
}

export interface CustomTestimonial {
  id: string;
  nome: string;
  origem: string;
  avaliacao: number;
  comentario: string;
  data: string;
  avatar?: string;
  destaque?: boolean;
}

export interface CustomFaq {
  id: string;
  pergunta: string;
  resposta: string;
  categoria?: string;
}

export interface PointOfInterest {
  id: string;
  nome: string;
  distancia: string;
  tipo: 'transporte' | 'lazer' | 'educacao' | 'gastronomia' | 'negocios';
}

export interface SectionVisibility {
  show_hero: boolean;
  show_search_bar: boolean;
  show_highlights: boolean;
  show_rooms: boolean;
  show_amenities: boolean;
  show_about: boolean;
  show_testimonials: boolean;
  show_faq: boolean;
  show_location: boolean;
  show_contact: boolean;
  show_whatsapp_float: boolean;
}

export interface HotelConfig {
  // Identidade da Empresa / White-Label
  nome: string;
  tipo_estabelecimento: PropertyType;
  slogan: string;
  estrelas: number;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  
  // Aparência e Estilo Visual
  tema_cor: ThemeColorPalette;
  tema_estilo: string;
  tipografia: TypographyStyle;
  logo_url?: string;
  logo_iniciais?: string;
  
  // Customizações de Layout & Hero
  banner_hero: string;
  hero_titulo_custom?: string;
  hero_subtitulo_custom?: string;
  hero_badge_custom?: string;
  hero_galeria?: string[];
  hero_overlay_opacity?: number;
  hero_cta_text?: string;
  
  // Conteúdos Editáveis de Cada Seção da Landing Page
  sobre_titulo?: string;
  sobre_subtitulo?: string;
  sobre_texto: string;
  sobre_foto_url?: string;
  sobre_diferenciais?: Array<{ titulo: string; desc: string }>;
  nota_avaliacao?: number;
  nota_label?: string;

  // Títulos e Textos Customizáveis das Seções
  estrutura_titulo?: string;
  estrutura_subtitulo?: string;
  estrutura_descricao?: string;
  quartos_titulo?: string;
  quartos_subtitulo?: string;
  quartos_descricao?: string;
  avaliacoes_titulo?: string;
  avaliacoes_subtitulo?: string;
  avaliacoes_descricao?: string;
  faq_titulo?: string;
  faq_subtitulo?: string;
  faq_descricao?: string;
  localizacao_titulo?: string;
  localizacao_subtitulo?: string;
  localizacao_descricao?: string;
  contato_titulo?: string;
  contato_subtitulo?: string;
  contato_descricao?: string;
  rodape_descricao?: string;
  rodape_copyright?: string;
  sobre_resumo?: string;
  descricao_completa?: string;
  
  // Seções e Coleções
  secoes_visibilidade: SectionVisibility;
  comodidades_personalizadas: CustomAmenity[];
  depoimentos: CustomTestimonial[];
  faqs: CustomFaq[];
  pontos_interesse: PointOfInterest[];
  
  // Regras & Políticas
  horario_checkin: string;
  horario_checkout: string;
  politica_cancelamento: string;
  taxa_servico_percentual: number;
  pet_friendly: boolean;
  pet_politica?: string;
  estacionamento_politica?: string;
  
  // Redes Sociais & Integrações
  redes_sociais: {
    instagram?: string;
    facebook?: string;
    tripadvisor?: string;
    booking?: string;
    google_maps_embed?: string;
  };
  whatsapp_msg_padrao?: string;

  // Campo retrocompatível
  comodidades_gerais?: string[];
}

export type AdminTab = 
  | 'dashboard' 
  | 'reservations' 
  | 'checkin_out' 
  | 'rooms' 
  | 'guests' 
  | 'frigobar'
  | 'financial' 
  | 'automation' 
  | 'design'
  | 'users'
  | 'settings';

export interface AutomacaoMensagem {
  id: string;
  titulo: string;
  gatilho: 'reserva_confirmada' | 'pre_checkin_24h' | 'boas_vindas_checkin' | 'checkout_agradecimento';
  canal: 'whatsapp' | 'email';
  template: string;
  template_mensagem?: string;
  ativo: boolean;
  variaveis_disponiveis: string[];
}

export type AutomacaoRegra = AutomacaoMensagem;

export interface AvailabilityResult {
  disponivel: boolean;
  quarto: Quarto;
  tipo: TipoQuarto;
  noites: number;
  valorDiarias: number;
  taxas: number;
  valorTotal: number;
}

export type TwoFactorMethod = 'authenticator' | 'whatsapp' | 'sms' | 'email' | 'backup_code';

export interface SecurityLogEntry {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_cargo: string;
  operacao: string;
  detalhes: string;
  categoria: string;
  metodo_2fa: TwoFactorMethod;
  ip_origem: string;
  sucesso: boolean;
  timestamp: string;
}

export interface SecurityActionRequest {
  title: string;
  description: string;
  details?: string;
  category: 'Reserva & Check-in' | 'Financeiro & PIX' | 'Quartos & Tarifas' | 'Hóspedes & CRM' | 'Automações & Fechaduras' | 'Personalização White-Label' | 'Equipe & Acessos' | 'Configurações do Hotel' | 'Sistema';
  severity?: 'normal' | 'warning' | 'danger';
  onConfirm: () => void | Promise<void>;
}

export * from './frigobar';

export type MediaCategory = 'hero' | 'logo' | 'sobre' | 'quarto' | 'avatar' | 'depoimento' | 'comodidade' | 'outro';

export interface MediaUploadRecord {
  id: string;
  file_name: string;
  url: string;
  storage_path?: string | null;
  category: MediaCategory;
  room_id?: string | null;
  is_cover?: boolean;
  sort_order?: number;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string;
  crop_data?: Record<string, any> | null;
  uploaded_by?: string | null;
  created_at?: string;
  updated_at?: string;
}


