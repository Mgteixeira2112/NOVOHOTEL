import { supabase } from '../lib/supabase';
import { KANBAN_TENANT_ID } from './kanbanV2';

const GOVERNANCE_BOARD = 'kanban-board-governanca';
const RECEPTION_BOARD = 'kanban-board-recepcao';
const MAINTENANCE_BOARD = 'kanban-board-manutencao';
const DEFAULT_BOARD = 'kanban-default-board';

function nowIso() {
  return new Date().toISOString();
}

function safeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function baseCard(input: {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: string;
  department: string;
  roomNumber?: string | null;
  location?: string | null;
  reservationId?: string | null;
  guestName?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
}) {
  const now = nowIso();
  return {
    id: input.id,
    hotel_id: KANBAN_TENANT_ID,
    board_id: input.boardId,
    column_id: input.columnId,
    titulo: input.title,
    descricao: input.description || null,
    prioridade: input.priority || 'normal',
    ordem: Date.now(),
    departamento: input.department,
    room_number: input.roomNumber || null,
    location: input.location || (input.roomNumber ? `Quarto ${input.roomNumber}` : 'Geral'),
    assigned_to: null,
    checklist: [],
    comments: [],
    metadata: { automation_source: true, ...(input.metadata || {}) },
    completed_at: null,
    created_at: now,
    updated_at: now,
    is_archived: false,
    guest_name: input.guestName || null,
    reservation_id: input.reservationId || null,
    service_details: null,
    tags: input.tags || [input.department],
    notes: null,
  };
}

async function insertIfMissing(payload: Record<string, unknown>) {
  const { error } = await supabase
    .from('kanban_cards')
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`Falha ao sincronizar tarefa automática: ${error.message}`);
}

async function updateActiveByRoom(
  roomNumber: string,
  department: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('kanban_cards')
    .update({ ...updates, updated_at: nowIso() })
    .eq('hotel_id', KANBAN_TENANT_ID)
    .eq('room_number', roomNumber)
    .eq('departamento', department)
    .eq('is_archived', false)
    .is('deleted_at', null);
  if (error) throw new Error(`Falha ao atualizar tarefa automática: ${error.message}`);
}

async function updateActiveReservation(reservationId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('kanban_cards')
    .update({ ...updates, updated_at: nowIso() })
    .eq('hotel_id', KANBAN_TENANT_ID)
    .eq('reservation_id', reservationId)
    .eq('is_archived', false)
    .is('deleted_at', null);
  if (error) throw new Error(`Falha ao atualizar tarefa de reserva: ${error.message}`);
}

export const kanbanAutomationSync = {
  async syncRoomStatus(roomNumber: string, status: string, details?: string) {
    if (!roomNumber) return;
    const roomKey = safeIdPart(roomNumber);

    if (status === 'sujo') {
      const id = `auto-gov-room-${roomKey}`;
      await insertIfMissing(baseCard({
        id,
        boardId: GOVERNANCE_BOARD,
        columnId: 'gov-col-a-limpar',
        title: `Higienização Quarto ${roomNumber}`,
        description: details || 'Quarto desocupado / necessita arrumação e higienização completa.',
        priority: 'atencao',
        department: 'governanca',
        roomNumber,
        tags: ['Governança', 'Higienização'],
        metadata: { automation_type: 'room_cleaning' },
      }));
      await updateActiveByRoom(roomNumber, 'governanca', {
        column_id: 'gov-col-a-limpar',
        completed_at: null,
      });
      return;
    }

    if (status === 'limpeza') {
      await updateActiveByRoom(roomNumber, 'governanca', {
        column_id: 'gov-col-em-limpeza',
        completed_at: null,
      });
      return;
    }

    if (status === 'manutencao') {
      const id = `auto-man-room-${roomKey}`;
      await insertIfMissing(baseCard({
        id,
        boardId: MAINTENANCE_BOARD,
        columnId: 'man-col-chamados',
        title: `Manutenção Quarto ${roomNumber}: ${details || 'Reparo Técnico'}`,
        description: details || 'Ordem de serviço aberta para manutenção do quarto.',
        priority: 'critica',
        department: 'manutencao',
        roomNumber,
        tags: ['Manutenção', 'Reparo'],
        metadata: { automation_type: 'room_maintenance' },
      }));
      await updateActiveByRoom(roomNumber, 'manutencao', {
        column_id: 'man-col-chamados',
        completed_at: null,
      });
      return;
    }

    if (status === 'disponivel') {
      const completedAt = nowIso();
      await Promise.all([
        updateActiveByRoom(roomNumber, 'governanca', {
          column_id: 'gov-col-liberado',
          completed_at: completedAt,
        }),
        updateActiveByRoom(roomNumber, 'manutencao', {
          column_id: 'man-col-resolvido',
          completed_at: completedAt,
        }),
        supabase
          .from('kanban_cards')
          .update({
            column_id: 'kanban-default-column-concluido',
            completed_at: completedAt,
            updated_at: completedAt,
          })
          .eq('hotel_id', KANBAN_TENANT_ID)
          .eq('board_id', DEFAULT_BOARD)
          .eq('room_number', roomNumber)
          .eq('is_archived', false)
          .is('deleted_at', null)
          .then(({ error }) => {
            if (error) throw new Error(`Falha ao concluir tarefa operacional: ${error.message}`);
          }),
      ]);
    }
  },

  async syncReservation(res: {
    id: string;
    codigo: string;
    status: string;
    guestName: string;
    roomNumber?: string;
    total?: number;
    checkin?: string;
    checkout?: string;
  }) {
    if (!res.id) return;
    const cardId = `auto-res-${safeIdPart(res.id)}`;

    if (res.status === 'confirmada' || res.status === 'checkin_realizado') {
      const targetColumn = res.status === 'checkin_realizado' ? 'rec-col-atendimento' : 'rec-col-novos';
      await insertIfMissing(baseCard({
        id: cardId,
        boardId: RECEPTION_BOARD,
        columnId: targetColumn,
        title: `${res.status === 'checkin_realizado' ? 'Hóspede In-House' : 'Check-in Previsto'}: ${res.guestName} (#${res.codigo})`,
        description: `Reserva #${res.codigo} | Quarto ${res.roomNumber || 'A definir'} | Check-out: ${res.checkout || 'N/D'}`,
        department: 'recepcao',
        roomNumber: res.roomNumber || null,
        location: res.roomNumber ? `Quarto ${res.roomNumber}` : 'Recepção',
        reservationId: res.id,
        guestName: res.guestName,
        tags: ['Recepção', res.status === 'checkin_realizado' ? 'In-House' : 'Check-in'],
        metadata: {
          automation_type: 'reservation',
          reservation_code: res.codigo,
          total: res.total,
          checkin: res.checkin,
          checkout: res.checkout,
        },
      }));

      await updateActiveReservation(res.id, {
        column_id: targetColumn,
        completed_at: null,
        room_number: res.roomNumber || null,
        location: res.roomNumber ? `Quarto ${res.roomNumber}` : 'Recepção',
        guest_name: res.guestName,
      });
      return;
    }

    if (res.status === 'checkout_concluido' || res.status === 'cancelada') {
      await updateActiveReservation(res.id, {
        column_id: 'rec-col-finalizado',
        completed_at: nowIso(),
      });
    }
  },

  async syncMinibar(roomNumber: string, needsRestock: boolean, missingSummary?: string) {
    if (!roomNumber) return;
    const cardId = `auto-minibar-room-${safeIdPart(roomNumber)}`;

    if (needsRestock) {
      await insertIfMissing(baseCard({
        id: cardId,
        boardId: GOVERNANCE_BOARD,
        columnId: 'gov-col-a-limpar',
        title: `Reposição Frigobar Quarto ${roomNumber}`,
        description: missingSummary || `Quarto ${roomNumber} necessita reposição de itens de frigobar.`,
        priority: 'atencao',
        department: 'governanca',
        roomNumber,
        tags: ['Frigobar', 'Reposição'],
        metadata: { automation_type: 'frigobar_restock' },
      }));
      await updateActiveByRoom(roomNumber, 'governanca', {
        completed_at: null,
      });
      return;
    }

    const completedAt = nowIso();
    const { error } = await supabase
      .from('kanban_cards')
      .update({
        column_id: 'gov-col-liberado',
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('hotel_id', KANBAN_TENANT_ID)
      .eq('id', cardId)
      .eq('is_archived', false)
      .is('deleted_at', null);
    if (error) throw new Error(`Falha ao concluir reposição do frigobar: ${error.message}`);
  },
};
