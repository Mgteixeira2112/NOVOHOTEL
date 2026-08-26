import { pdvRepository, PdvProductRecord } from '../repositories/pdvRepository';

export type PdvProduct = PdvProductRecord;

export type CreatePdvOrderInput = {
  hotelId: string;
  origem: 'POS' | 'ROOM_SERVICE' | 'TABLET' | 'QR' | 'OTHER' | 'balcao' | 'quarto' | 'tablet';
  quartoId?: string | null;
  deviceId?: string | null;
  idempotencyKey?: string;
  criadoPor?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  chargeToRoom?: boolean;
  itens: Array<{ produto_id: string; quantidade: number; desconto?: number; observacao?: string }>;
};

const canonicalSource = (source: CreatePdvOrderInput['origem']) => {
  if (source === 'balcao') return 'POS';
  if (source === 'quarto') return 'ROOM_SERVICE';
  if (source === 'tablet') return 'TABLET';
  return source;
};

export async function listarProdutosPdv(): Promise<PdvProduct[]> {
  return pdvRepository.listProducts();
}

export async function criarPedidoPdv(input: CreatePdvOrderInput): Promise<string> {
  return pdvRepository.createOrder({
    hotelId: input.hotelId,
    source: canonicalSource(input.origem),
    roomId: input.quartoId,
    deviceId: input.deviceId,
    priority: input.priority,
    chargeToRoom: input.chargeToRoom ?? canonicalSource(input.origem) !== 'POS',
    idempotencyKey: input.idempotencyKey,
    items: input.itens,
  });
}

export async function finalizarPedidoPdv(orderId: string, paymentMethod?: string | null, cashSessionId?: string | null) {
  return pdvRepository.finalizeOrder(orderId, paymentMethod, cashSessionId);
}

export async function atualizarStatusKds(pedidoId: string, status: string) {
  return pdvRepository.updateKdsItem(pedidoId, status);
}

export async function listarKds(sector?: string) {
  return pdvRepository.listKds(sector);
}

export async function abrirCaixa(cashRegisterId: string, openingAmount: number) {
  return pdvRepository.openCash(cashRegisterId, openingAmount);
}

export async function fecharCaixa(sessionId: string, actualCash: number) {
  return pdvRepository.closeCash(sessionId, actualCash);
}
