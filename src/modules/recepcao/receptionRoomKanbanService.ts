import { supabase } from '../../lib/supabase';
import { KanbanV2Card } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';

export const RECEPTION_ROOMS_BOARD_ID = 'kanban-board-recepcao-quartos';

export const ROOM_COLUMN_STATUS: Record<string, string> = {
  'room-col-disponivel': 'disponivel',
  'room-col-ocupado': 'ocupado',
  'room-col-sujo': 'sujo',
  'room-col-limpeza': 'limpeza',
  'room-col-vistoria': 'vistoria',
  'room-col-manutencao': 'manutencao',
  'room-col-bloqueado': 'bloqueado',
  'room-col-outros': 'outros',
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function resolveRoomId(card: KanbanV2Card): Promise<string> {
  const extended = card as KanbanV2Card & { room_id?: unknown };
  const metadata = card.metadata && typeof card.metadata === 'object'
    ? card.metadata as Record<string, unknown>
    : {};

  const normalizedRoomId = text(extended.room_id);
  const metadataRoomId = text(metadata.room_id);
  if (normalizedRoomId || metadataRoomId) return normalizedRoomId || metadataRoomId as string;

  const roomNumber = text(card.room_number);
  if (!roomNumber) throw new Error('O card não possui vínculo com um quarto.');

  const { data, error } = await supabase
    .from('quartos')
    .select('id')
    .eq('numero', roomNumber)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível localizar o quarto ${roomNumber}: ${error.message}`);
  const resolved = text(data?.id);
  if (!resolved) throw new Error(`Não foi encontrado um quarto cadastrado com o número ${roomNumber}.`);
  return resolved;
}

export const receptionRoomKanbanService = {
  async moveRoomCard(card: KanbanV2Card, targetColumnId: string, userId?: string | null) {
    const roomStatus = ROOM_COLUMN_STATUS[targetColumnId];
    if (!roomStatus) throw new Error('Status de quarto não reconhecido.');

    // Resolve o vínculo estável antes de tocar no motor Kanban. Isso evita que
    // cards antigos de cache sejam movidos apenas localmente sem persistir o quarto.
    const roomId = await resolveRoomId(card);
    const moved = await kanbanCardGovernance.moveCard(card, targetColumnId, { userId });

    // O quarto é a fonte operacional. Os triggers do banco projetam este estado
    // para o Kanban de Quartos e, quando aplicável, para o fluxo de Governança.
    const { data, error } = await supabase
      .from('quartos')
      .update({ status: roomStatus })
      .eq('id', roomId)
      .select('id,status,status_operacional')
      .single();

    if (error) throw new Error(`Não foi possível persistir o status do quarto: ${error.message}`);
    if (!data || data.status !== roomStatus) throw new Error('O status do quarto não foi confirmado no banco de dados.');

    const { data: persistedCard, error: cardError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('id', moved.id)
      .eq('board_id', RECEPTION_ROOMS_BOARD_ID)
      .maybeSingle();

    if (cardError) throw new Error(`O quarto foi atualizado, mas não foi possível confirmar o card: ${cardError.message}`);
    return (persistedCard || moved) as KanbanV2Card;
  },
};
