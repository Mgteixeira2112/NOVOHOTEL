import { supabase } from '../../lib/supabase';
import { Quarto } from '../../types';

export type RoomOperationalPatch = Pick<Partial<Quarto>,
  | 'status_housekeeping'
  | 'status_governanca'
  | 'status_manutencao_motivo'
  | 'ultima_limpeza'
  | 'responsavel_limpeza'
  | 'notas_internas'
  | 'fechadura_bateria'
>;

export async function persistRoomOperationalPatch(roomId: string, patch: RoomOperationalPatch): Promise<Quarto> {
  const payload = { ...patch, updated_at: new Date().toISOString() } as Record<string, unknown>;
  const { data, error } = await supabase
    .from('quartos')
    .update(payload)
    .eq('id', roomId)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'O banco não confirmou a atualização operacional do quarto.');
  return data as Quarto;
}

export async function verifyKanbanColumn(cardId: string, expectedColumnId: string): Promise<void> {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('id,column_id')
    .eq('id', cardId)
    .single();
  if (error || !data) throw new Error(error?.message || 'Não foi possível confirmar o card no banco.');
  if (String(data.column_id) !== expectedColumnId) {
    throw new Error('O Kanban não confirmou a nova etapa no banco. A tela não foi marcada como sincronizada.');
  }
}
