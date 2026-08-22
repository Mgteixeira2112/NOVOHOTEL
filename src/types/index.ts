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

export type RoomStatus = 'disponivel' | 'ocupado' | 'manutencao' | 'limpeza';

export interface Quarto {
  id: string;
  numero: string;
  nome: string;
  tipo_quarto_id: string;
  capacidade: number;
  valor_diaria: number;
  descricao: string;
  status: RoomStatus;
  ativo: boolean;
  andar: number;
  fotos: string[];
  comodidades: string[];
  tamanho_m2: number;
  vista: string;
  cama: string;
  fechadura_pin?: string;
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
  
  // Conteúdos Editáveis
  sobre_titulo?: string;
  sobre_subtitulo?: string;
  sobre_texto: string;
  sobre_foto_url?: string;
  sobre_diferenciais?: Array<{ titulo: string; desc: string }>;
  nota_avaliacao?: number;
  nota_label?: string;
  
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
