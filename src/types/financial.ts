export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado' | 'transferencia' | 'boleto';
export type PaymentStatus = 'aprovado' | 'pendente' | 'reembolsado' | 'cancelado';

export type ExpenseCategory = 
  | 'fornecedores_alimentos'
  | 'lavanderia_enxoval'
  | 'concessionarias_energia_agua'
  | 'telecom_internet_software'
  | 'manutencao_predial'
  | 'folha_pagamento_comissoes'
  | 'impostos_taxas'
  | 'marketing_comissoes_ota'
  | 'outros';

export type ExpenseStatus = 'pago' | 'pendente' | 'atrasado';

export interface DespesaOperacional {
  id: string;
  descricao: string;
  categoria: ExpenseCategory;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: ExpenseStatus;
  fornecedor: string;
  metodo_pagamento?: PaymentMethod;
  comprovante_url?: string;
  recorrente?: boolean;
  observacoes?: string;
  centro_custo?: string;
  created_at: string;
}

export type ReceivableCategory = 'diaria_hospedagem' | 'consumo_frigobar' | 'taxa_servico' | 'day_use' | 'multa_no_show' | 'locacao_espaco' | 'outros';

export type ReceivableStatus = 'recebido' | 'pendente' | 'parcial' | 'atrasado';

export interface ContaReceber {
  id: string;
  reserva_id?: string;
  codigo_reserva?: string;
  hospede_id?: string;
  hospede_nome: string;
  hospede_documento?: string;
  hospede_telefone: string;
  hospede_email?: string;
  quarto_numero?: string;
  categoria: ReceivableCategory;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  saldo_pendente: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: ReceivableStatus;
  metodo_pagamento?: PaymentMethod;
  parcelas?: number;
  link_pagamento_id?: string;
  notas_cobranca?: string;
  created_at: string;
}

// Configurações de Chaves PIX
export type PixKeyType = 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export interface PixKeyConfig {
  id: string;
  tipo: PixKeyType;
  chave: string;
  titular_nome: string;
  titular_documento: string;
  banco_nome: string;
  cidade: string;
  desconto_percentual: number;
  ativo: boolean;
  webhook_url?: string;
  descricao?: string;
}

// Provedores PSP de PIX Instantâneo
export type PixPspProvider = 
  | 'banco_brasil'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'sicoob'
  | 'sicredi'
  | 'inter'
  | 'mercadopago'
  | 'efi'
  | 'asaas'
  | 'nubank';

export interface PixPspConfig {
  provider: PixPspProvider;
  nome_exibicao: string;
  client_id: string;
  client_secret: string;
  chave_pix_psp: string;
  certificado_nome?: string;
  ambiente: 'sandbox' | 'producao';
  ativo: boolean;
  webhook_ativo: boolean;
  webhook_url: string;
  webhook_secret?: string;
  auto_confirmar_reserva: boolean;
}

// Gateways de Cartão de Crédito
export type GatewayCardProvider = 
  | 'asaas'
  | 'mercadopago'
  | 'stripe'
  | 'pagarme'
  | 'cielo'
  | 'pagbank'
  | 'infinitepay';

export interface GatewayConfig {
  id: GatewayCardProvider;
  nome: string;
  logo_badge: string;
  descricao: string;
  ativo: boolean;
  is_primary: boolean;
  ambiente: 'sandbox' | 'producao';
  public_key: string;
  secret_key: string;
  client_id?: string;
  webhook_secret?: string;
  webhook_url: string;
  max_parcelas: number;
  parcelas_sem_juros: number;
  taxa_juros_mensal: number;
  taxa_mdr_credito_vista: number;
  taxa_mdr_credito_parcelado: number;
  taxa_mdr_debito: number;
  pre_autorizacao_ativa: boolean; // Hold / Caução de reserva
  prazo_repasse_dias: number; // Ex: D+1, D+14, D+30
  suporte_apple_pay: boolean;
  suporte_link_pagamento: boolean;
  split_habilitado?: boolean;
}

// Links de Pagamento Gerados para Hóspedes
export interface PaymentLink {
  id: string;
  codigo_link: string;
  reserva_id?: string;
  codigo_reserva?: string;
  hospede_nome: string;
  hospede_telefone: string;
  hospede_email?: string;
  valor: number;
  descricao: string;
  metodos_permitidos: ('pix' | 'cartao_credito' | 'boleto')[];
  gateway_utilizado: GatewayCardProvider | 'pix_direto';
  max_parcelas: number;
  status: 'ativo' | 'pago' | 'expirado' | 'cancelado';
  url_pagamento: string;
  pix_copia_cola?: string;
  data_expiracao: string;
  data_pagamento?: string;
  created_at: string;
}

// Resumo DRE e Indicadores Hoteleiros
export interface HotelFinancialKpis {
  faturamento_bruto: number;
  faturamento_liquido: number;
  total_despesas: number;
  lucro_operacional: number;
  margem_operacional: number;
  saldo_receber: number;
  saldo_pagar: number;
  inadimplencia_valor: number;
  inadimplencia_percentual: number;
  revpar: number; // Receita por Quarto Disponível
  adr: number; // Diária Média (Average Daily Rate)
  taxa_ocupacao: number;
  ticket_medio: number;
  total_transacoes: number;
  receita_pix: number;
  receita_cartao_credito: number;
  receita_cartao_debito: number;
  receita_outros: number;
}
