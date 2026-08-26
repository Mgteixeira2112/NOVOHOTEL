import { supabase } from '../lib/supabase';

export type PdvProduct = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
};

export type CreatePdvOrderInput = {
  hotelId: string;
  origem: 'balcao' | 'quarto' | 'tablet';
  quartoId?: string | null;
  idempotencyKey: string;
  criadoPor?: string | null;
  itens: Array<{ produto_id: string; quantidade: number; observacao?: string }>;
};

export async function listarProdutosPdv(): Promise<PdvProduct[]> {
  const { data, error } = await supabase
    .from('pdv_produtos')
    .select('id,nome,categoria,preco,estoque_atual,estoque_minimo,ativo')
    .eq('ativo', true)
    .order('categoria')
    .order('nome');

  if (error) throw new Error(`Não foi possível carregar os produtos: ${error.message}`);
  return (data ?? []) as PdvProduct[];
}

export async function criarPedidoPdv(input: CreatePdvOrderInput): Promise<string> {
  const { data, error } = await supabase.rpc('criar_pedido_pdv', {
    p_hotel_id: input.hotelId,
    p_origem: input.origem,
    p_quarto_id: input.quartoId ?? null,
    p_idempotency_key: input.idempotencyKey,
    p_itens: input.itens,
    p_criado_por: input.criadoPor ?? null,
  });

  if (error) throw new Error(`Não foi possível enviar o pedido: ${error.message}`);
  if (!data) throw new Error('O Supabase não retornou o identificador do pedido.');
  return String(data);
}

export async function atualizarStatusKds(pedidoId: string, status: 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado') {
  const { error } = await supabase.rpc('atualizar_status_kds', {
    p_pedido_id: pedidoId,
    p_status: status,
  });
  if (error) throw new Error(`Não foi possível atualizar o KDS: ${error.message}`);
}
