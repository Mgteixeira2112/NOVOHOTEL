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

function roomIdFromCard(card: KanbanV2Card): string | null {
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata as Record<string, unknown> : {};
  const id = metadata.room_id;
  return typeof id === 'string' && id ? id : null;
}

export const receptionRoomKanbanService = {
  async moveRoomCard(card: KanbanV2Card, targetColumnId: string, userId?: string | null) {
    const roomStatus = ROOM_COLUMN_STATUS[targetColumnId];
    if (!roomStatus) throw new Error('Status de quarto não reconhecido.');

    const moved = await kanbanCardGovernance.moveCard(card, targetColumnId, { userId });
    const roomId = roomIdFromCard(card);

    if (!roomId) {
      throw new Error('O card do quarto não possui vínculo room_id.');
    }

    const { data, error } = await supabase
      .from('quartos')
      .update({ status: roomStatus })
      .eq('id', roomId)
      .select('id,status')
      .single();

    if (error) throw new Error(`Não foi possível persistir o status do quarto: ${error.message}`);
    if (!data || data.status !== roomStatus) throw new Error('O status do quarto não foi confirmado no banco de dados.');

    return moved;
  },
};
