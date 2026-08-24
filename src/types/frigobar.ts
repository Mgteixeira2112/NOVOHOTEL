export type FrigobarProductCategory = 
  | 'bebidas_nao_alcoolicas'
  | 'cervejas'
  | 'vinhos_espumantes'
  | 'destilados'
  | 'snacks_doces'
  | 'snacks_salgados'
  | 'conveniencia_higiene'
  | 'kits_especiais';

export type ProductUnit = 'un' | 'lata' | 'garrafa' | 'pacote' | 'dose' | 'kit';

export interface FrigobarProduct {
  id: string;
  codigo: string; // Ex: BEB-001
  nome: string;
  categoria: FrigobarProductCategory;
  preco_custo: number; // Ex: 3.50
  preco_venda: number; // Ex: 9.00
  estoque_central: number; // Quantidade no Almoxarifado Central
  estoque_alocado_quartos: number; // Quantidade em todos os frigobares
  estoque_minimo: number; // Alerta de reposição
  estoque_maximo: number;
  unidade: ProductUnit;
  validade_proxima?: string;
  lote_atual?: string;
  fornecedor_padrao?: string;
  ativo: boolean;
  descricao?: string;
  icone?: string;
  temperatura_servico?: 'gelada' | 'ambiente' | 'congelada';
  codigo_barras?: string;
}

export interface FrigobarItemQuarto {
  produto_id: string;
  quantidade_padrao: number; // Quantidade esperada de acordo com o padrão do quarto
  quantidade_atual: number;  // Quantidade real presente
  ultima_auditoria?: string;
}

export type RoomFrigobarStatus = 
  | 'abastecido' 
  | 'precisa_reposicao' 
  | 'critico_vazio' 
  | 'discrepancia_auditoria';

export interface FrigobarQuarto {
  quarto_id: string;
  quarto_numero: string;
  itens: FrigobarItemQuarto[];
  status: RoomFrigobarStatus;
  ultima_verificacao?: string;
  verificado_por?: string;
  observacoes?: string;
  bloqueado_por_solicitacao?: boolean;
}

export type TipoMovimentacaoEstoque = 
  | 'entrada_fornecedor'        // Compra / Entrada Almoxarifado
  | 'saida_consumo_hospede'     // Consumo lançado no quarto e debitado na reserva
  | 'transferencia_reposicao'   // Almoxarifado -> Frigobar Quarto
  | 'recolhimento_almoxarifado' // Frigobar Quarto -> Almoxarifado
  | 'avaria_quebra'             // Produto danificado/vencido
  | 'vencimento_descarte'       // Vencido
  | 'cortesia_gerencia'         // Cortesia ou upgrade VIP
  | 'ajuste_inventario';        // Correção de balanço

export interface FrigobarMovimentacao {
  id: string;
  data_hora: string;
  tipo: TipoMovimentacaoEstoque;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_unitario_custo: number;
  valor_unitario_venda: number;
  valor_total: number;
  quarto_id?: string;
  quarto_numero?: string;
  reserva_id?: string;
  codigo_reserva?: string;
  hospede_id?: string;
  hospede_nome?: string;
  responsavel_nome: string;
  motivo?: string;
  nota_fiscal?: string;
  observacoes?: string;
}

export interface FrigobarAuditoriaRegistro {
  id: string;
  quarto_id: string;
  quarto_numero: string;
  reserva_id?: string;
  codigo_reserva?: string;
  hospede_id?: string;
  hospede_nome?: string;
  data_hora: string;
  responsavel_nome: string;
  itens_consumidos: Array<{
    produto_id: string;
    produto_nome: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }>;
  valor_total_consumo: number;
  lancado_na_reserva: boolean;
  reposicao_efetuada: boolean;
  observacoes?: string;
}

export interface FrigobarPreferenciaHospede {
  hospede_id: string;
  hospede_nome: string;
  hospede_documento?: string;
  hospede_telefone?: string;
  itens_favoritos: string[]; // IDs de produtos preferidos
  restricoes_alimentares?: string[]; // 'zero_acucar', 'sem_alcool', 'sem_gluten'
  temperatura_preferida?: string;
  notas_vip?: string;
  total_gasto_frigobar: number;
  total_itens_consumidos: number;
  ultima_compra_data?: string;
}

export interface FrigobarTemplateQuarto {
  id: string;
  tipo_quarto_id: string;
  tipo_quarto_nome: string;
  descricao: string;
  itens_padrao: Array<{
    produto_id: string;
    quantidade: number;
  }>;
}

export interface FornecedorFrigobar {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  contato_vendedor: string;
  telefone: string;
  email: string;
  produtos_fornecidos: string[];
  prazo_entrega_dias: number;
  condicao_pagamento: string;
}
