export type UserRole =
  | 'admin'
  | 'gerente'
  | 'recepcionista'
  | 'governanca'
  | 'financeiro'
  | 'pdv_only'
  | 'cozinha_only'
  | 'tablet_quarto';

export type RBACAccessLevel = 'total' | 'readonly' | 'custom' | 'exclusive' | 'none';
export interface RBACRolePermission { granted: boolean; level: RBACAccessLevel; customLabel: string; description?: string; }
export interface RBACResourceRule { id: string; moduleName: string; description?: string; category?: string; adminTab?: AdminTab; isCustom?: boolean; permissions: Partial<Record<UserRole, RBACRolePermission>>; }
export interface RBACMatrixConfig { version: number; lastUpdated: string; updatedBy?: string; resources: RBACResourceRule[]; }
export interface Usuario { id: string; nome: string; email: string; senha?: string; tipo_usuario: UserRole; cargo_titulo?: string; telefone?: string; ativo: boolean; avatar?: string; avatar_url?: string; ultimo_acesso?: string; permissoes?: string[]; created_at: string; }
export interface TipoQuarto { id: string; nome: string; descricao: string; capacidade?: number; capacidade_padrao?: number; preco_base?: number; icone?: string; comodidades?: string[]; comodidades_principais?: string[]; fotos?: string[]; ativo?: boolean; }
export type RoomStatus = 'disponivel' | 'ocupado' | 'manutencao' | 'sujo' | 'limpeza' | 'vistoria' | 'bloqueado' | string;
export type HousekeepingStatus = 'sujo' | 'limpeza' | 'em_limpeza' | 'aguardando_vistoria' | 'inspecionado' | 'aprovado' | 'bloqueado' | 'limpo' | 'nao_perturbe' | string;
export interface Quarto { id: string; numero: string; nome?: string; tipo_quarto_id: string; andar: number; status: RoomStatus; status_housekeeping?: HousekeepingStatus; status_governanca?: HousekeepingStatus; status_manutencao_motivo?: string; ultima_limpeza?: string; responsavel_limpeza?: string; notas_internas?: string; capacidade: number; preco_diaria?: number; valor_diaria?: number; descricao: string; comodidades: string[]; fotos: string[]; ativo: boolean; tamanho_m2?: number; vista?: string; cama?: string; fechadura_pin?: string; fechadura_bateria?: number; }
export interface Hospede { id: string; nome: string; email: string; telefone: string; cpf?: string; documento?: string; data_nascimento?: string; endereco?: string; cidade?: string; estado?: string; cep?: string; nacionalidade?: string; notas_preferencias?: string; observacoes?: string; preferencia_quarto?: string; vip?: boolean; total_estadias?: number; ultima_estadia?: string; created_at?: string; }
export type ReservationStatus = 'pendente' | 'confirmada' | 'checkin_realizado' | 'checkout_concluido' | 'cancelada';
export interface ConsumoExtra { id?: string; reserva_id?: string; quarto_id?: string; produto_id?: string; item?: string; nome?: string; quantidade?: number; valor_unitario?: number; preco_unitario?: number; valor_total?: number; origem?: string; data_lancamento?: string; [key: string]: any; }
export interface Reserva { id: string; codigo?: string; codigo_reserva?: string; hospede_id: string; quarto_id: string; data_checkin?: string; data_checkout?: string; checkin?: string; checkout?: string; checkin_horario?: string; checkout_horario?: string; adultos?: number; criancas?: number; quantidade_hospedes?: number; status: ReservationStatus; origem?: 'direto' | 'booking' | 'airbnb' | 'expedia' | 'telefone' | 'outro' | string; valor_total?: number; valor_diarias?: number; valor_taxas?: number; valor_consumo?: number; valor_pago?: number; forma_pagamento?: string; observacoes?: string; consumo_itens?: ConsumoExtra[]; pin_fechadura?: string; created_at?: string; }
export interface BloqueioQuarto { id: string; quarto_id: string; motivo: string; data_inicio: string; data_fim: string; tipo?: 'manutencao' | 'bloqueio' | 'evento' | string; ativo?: boolean; criado_por?: string; created_at?: string; }
export interface AutomacaoMensagem { id: string; titulo?: string; tipo?: 'pre_checkin' | 'confirmacao_reserva' | 'pos_checkout' | 'senha_fechadura' | 'lembrete_pagamento' | string; nome?: string; gatilho: string; dias_offset?: number; canal?: 'whatsapp' | 'email' | 'ambos' | string; ativo?: boolean; assunto?: string; template?: string; template_texto?: string; template_mensagem?: string; variaveis_disponiveis?: string[]; }
export type AutomacaoRegra = AutomacaoMensagem;
export interface HotelConfigSobreDiferencial { titulo: string; desc: string; }
export interface HotelComodidadePersonalizada { id: string; icone: string; titulo: string; descricao: string; destaque: boolean; }
export interface HotelDepoimento { id: string; nome: string; origem: string; avaliacao: number; comentario: string; data: string; avatar: string; destaque: boolean; }
export interface HotelFaq { id: string; pergunta: string; resposta: string; categoria: string; }
export interface HotelPontoInteresse { id: string; nome: string; distancia: string; tipo: 'lazer' | 'gastronomia' | 'educacao' | 'negocios' | 'transporte' | 'outro' | string; }
export type CustomAmenity = HotelComodidadePersonalizada;
export type CustomFaq = HotelFaq;
export type CustomTestimonial = HotelDepoimento;
export type PointOfInterest = HotelPontoInteresse;
export interface HotelSecoesVisibilidade { show_hero?: boolean; show_search_bar?: boolean; show_highlights?: boolean; show_rooms?: boolean; show_amenities?: boolean; show_about?: boolean; show_testimonials?: boolean; show_faq?: boolean; show_location?: boolean; show_contact?: boolean; show_whatsapp_float?: boolean; }
export interface HotelRedesSociais { instagram?: string; facebook?: string; tripadvisor?: string; booking?: string; google_maps_embed?: string; }
export interface HotelConfig {
  id?: string; nome: string; tipo_estabelecimento: PropertyType; slogan: string; estrelas: number; cnpj?: string; telefone: string; whatsapp: string; email: string; endereco: string; bairro: string; cidade: string; cidade_uf?: string; estado: string; cep: string; razao_social?: string; site?: string; chave_pix?: string; horario_cafe?: string; desconto_pix_percentual?: number;
  tema_cor: ThemeColorPalette; tema_estilo: string; tipografia: TypographyStyle; logo_iniciais: string; logo_url?: string; banner_hero: string; hero_titulo_custom?: string; hero_subtitulo_custom?: string; hero_badge_custom?: string; hero_overlay_opacity?: number;
  sobre_titulo: string; sobre_subtitulo: string; sobre_texto: string; sobre_foto_url: string; nota_avaliacao: number; nota_label: string; sobre_diferenciais: HotelConfigSobreDiferencial[]; sobre_resumo?: string; descricao_completa?: string;
  quartos_titulo?: string; quartos_subtitulo?: string; quartos_descricao?: string; estrutura_titulo?: string; estrutura_subtitulo?: string; estrutura_descricao?: string; avaliacoes_titulo?: string; avaliacoes_subtitulo?: string; avaliacoes_descricao?: string; faq_titulo?: string; faq_subtitulo?: string; faq_descricao?: string; localizacao_titulo?: string; localizacao_subtitulo?: string; localizacao_descricao?: string; contato_titulo?: string; contato_subtitulo?: string; contato_descricao?: string; rodape_descricao?: string; rodape_copyright?: string;
  secoes_visibilidade: HotelSecoesVisibilidade; comodidades_personalizadas: HotelComodidadePersonalizada[]; depoimentos: HotelDepoimento[]; faqs: HotelFaq[]; pontos_interesse: HotelPontoInteresse[];
  horario_checkin: string; horario_checkout: string; politica_cancelamento: string; taxa_servico_percentual: number; pet_friendly: boolean; pet_politica: string; estacionamento_politica: string; redes_sociais: HotelRedesSociais; whatsapp_msg_padrao: string; comodidades_gerais: string[]; rbac_matrix?: RBACMatrixConfig;
}
export type AdminTab = 'dashboard' | 'management_bi' | 'command_center' | 'kanban' | 'reservations' | 'checkin_out' | 'rooms' | 'guests' | 'financial' | 'frigobar' | 'automation' | 'users' | 'pdv' | 'kds' | 'settings' | 'design';
export type ThemeColorPalette = 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'terracotta' | 'slate';
export type TypographyStyle = 'modern_sans' | 'editorial' | 'serif_luxury' | 'modern' | 'classic' | 'elegant' | 'technical';
export type PropertyType = 'hotel' | 'pousada' | 'resort' | 'hostel' | 'motel' | 'apart-hotel' | 'flat' | 'boutique' | 'chales' | string;
export interface SecurityLogEntry { id?: string; timestamp: string; user_id?: string; usuario_id?: string; user_name?: string; usuario_nome?: string; user_email?: string; usuario_email?: string; usuario_cargo?: string; action?: string; operacao?: string; resource?: string; categoria?: string; metodo_2fa?: string; ip?: string; ip_origem?: string; details?: string; detalhes?: string; status?: 'sucesso' | 'bloqueado' | 'alerta' | string; sucesso?: boolean; }
export interface SecurityActionRequest { id?: string; action?: string; actionTitle?: string; actionDescription?: string; severity?: 'low' | 'medium' | 'high' | 'critical' | string; resource?: string; requestedBy?: string; timestamp?: string; title?: string; description?: string; category?: string; onConfirm?: () => void | Promise<void>; details?: Record<string, unknown>; }
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'authenticator' | 'whatsapp';
export type MediaCategory = 'hero' | 'room' | 'hotel' | 'avatar' | 'outro' | 'logo' | 'sobre' | 'depoimento' | 'quarto' | string;
export interface MediaUploadRecord { id: string; url: string; file_name?: string; file_size?: number; category?: MediaCategory | string; room_id?: string | null; is_cover?: boolean; sort_order?: number; width?: number | null; height?: number | null; aspect_ratio?: string | null; crop_data?: Record<string, unknown> | null; uploaded_by?: string | null; created_at?: string; updated_at?: string; mime_type?: string | null; storage_path?: string; file_size_bytes?: number | null; }
export interface AvailabilityResult { disponivel?: boolean; available?: boolean; quarto?: Quarto; tipo?: TipoQuarto; noites?: number; valorDiarias?: number; taxas?: number; quartosDisponiveis?: Quarto[]; availableRooms?: Quarto[]; totalDiarias?: number; totalNights?: number; valorTotal?: number; estimatedTotal?: number; valorDiariaMedia?: number; baseRate?: number; matchingRooms?: Quarto[]; alternativeDates?: string[]; conflictReason?: string; reason?: string; }
export type HotelOSEventType = 'reservation.created' | 'reservation.confirmed' | 'checkin.completed' | 'checkout.completed' | 'room.status_changed' | 'housekeeping.created' | 'housekeeping.completed' | 'maintenance.created' | 'maintenance.completed' | 'kitchen.order_created' | 'kitchen.order_ready' | 'room_service.created' | 'stock.below_minimum' | 'purchase.created' | 'payment.approved' | 'guest.feedback_received' | 'workflow.executed';
export interface HotelOSEvent { id: string; hotel_id?: string; event_type: HotelOSEventType | string; source_module: string; entity_type?: string; entity_id?: string; payload: Record<string, unknown>; created_by?: string; created_at: string; }
export type HotelOSTaskStatus = 'pendente' | 'em_execucao' | 'aguardando' | 'concluida' | 'cancelada';
export type HotelOSTaskPriority = 'baixa' | 'normal' | 'alta' | 'critica';
export interface HotelOSTask { id: string; hotel_id?: string; title: string; description?: string; department: string; status: HotelOSTaskStatus; priority: HotelOSTaskPriority; room_id?: string; reservation_id?: string; assigned_to?: string; due_at?: string; started_at?: string; completed_at?: string; metadata?: Record<string, unknown>; created_by?: string; created_at: string; updated_at: string; }
export interface HotelOSWorkflow { id: string; hotel_id?: string; name: string; description?: string; trigger_event: string; actions: Record<string, unknown>[]; conditions?: Record<string, unknown>; active: boolean; run_count: number; last_run_at?: string; created_by?: string; created_at: string; updated_at: string; }
