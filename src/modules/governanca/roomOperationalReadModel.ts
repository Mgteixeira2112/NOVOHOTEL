import { Hospede, Quarto, Reserva, Usuario } from '../../types';
import { KanbanV2Card } from '../../services/kanbanV2';
import { GOVERNANCA_STAGES } from './governancaWorkspaceModel';

export const MAINTENANCE_DONE_COLUMN = 'man-col-resolvido';

const text = (value: unknown) => String(value ?? '').trim();
const normalized = (value: unknown) => text(value).toLowerCase();
const stamp = (value?: string | null) => value ? new Date(value).getTime() : 0;

export function resolveGovernanceCard(room: Quarto, cards: KanbanV2Card[]): KanbanV2Card | undefined {
  const active = cards.filter(card => card.board_id === 'kanban-board-governanca' && !card.is_archived);
  const byRoomId = active.filter(card => text((card.metadata as any)?.room_id) === text(room.id));
  const candidates = byRoomId.length > 0 ? byRoomId : active.filter(card => text(card.room_number) === text(room.numero));
  return candidates.sort((a, b) => stamp(b.updated_at || b.created_at) - stamp(a.updated_at || a.created_at))[0];
}

export function housekeepingStatusFromCard(card?: KanbanV2Card): string | null {
  if (!card) return null;
  if (card.column_id === GOVERNANCA_STAGES.pending) return 'sujo';
  if (card.column_id === GOVERNANCA_STAGES.working) return 'em_limpeza';
  if (card.column_id === GOVERNANCA_STAGES.inspection) return 'aguardando_vistoria';
  if (card.column_id === GOVERNANCA_STAGES.done) return 'aprovado';
  return null;
}

export function resolveHousekeepingStatus(room: Quarto, card?: KanbanV2Card): string | null {
  return housekeepingStatusFromCard(card) || room.status_governanca || room.status_housekeeping || null;
}

export function resolveResponsibleName(room: Quarto, card: KanbanV2Card | undefined, users: Usuario[]): string | null {
  const assigned = card?.assigned_to as any;
  const embedded = assigned?.nome || assigned?.name;
  if (embedded) return String(embedded);
  const assignedId = String((card as any)?.assigned_user_id || assigned?.id || '');
  if (assignedId) {
    const user = users.find(item => String(item.id) === assignedId);
    if (user?.nome) return user.nome;
  }
  return room.responsavel_limpeza || null;
}

function dayStart(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveCurrentReservation(roomId: string, reservations: Reserva[], now = new Date()): Reserva | undefined {
  const forRoom = reservations.filter(item => item.quarto_id === roomId && !['cancelada', 'checkout_concluido'].includes(item.status));
  const checkedIn = forRoom.find(item => item.status === 'checkin_realizado');
  if (checkedIn) return checkedIn;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return forRoom.find(item => {
    if (item.status !== 'confirmada') return false;
    const start = dayStart(item.checkin || item.data_checkin);
    const end = dayStart(item.checkout || item.data_checkout);
    return start != null && end != null && start <= today && today < end;
  });
}

export function resolveNextReservation(roomId: string, reservations: Reserva[], now = new Date()): Reserva | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return reservations
    .filter(item => item.quarto_id === roomId && item.status === 'confirmada')
    .map(item => ({ item, start: dayStart(item.checkin || item.data_checkin) }))
    .filter(entry => entry.start != null && entry.start > today)
    .sort((a, b) => Number(a.start) - Number(b.start))[0]?.item;
}

export function guestForReservation(reservation: Reserva | undefined, guests: Hospede[]): Hospede | undefined {
  return reservation ? guests.find(guest => guest.id === reservation.hospede_id) : undefined;
}

export function isOpenMaintenanceCard(card: KanbanV2Card): boolean {
  return (card.board_id === 'kanban-board-manutencao' || normalized(card.departamento) === 'manutencao')
    && !card.is_archived
    && card.column_id !== MAINTENANCE_DONE_COLUMN;
}

export function roomRequiresAttention(room: Quarto, housekeepingStatus?: string | null, openMaintenanceCount = 0): boolean {
  const operational = normalized(room.status);
  const housekeeping = normalized(housekeepingStatus);
  return openMaintenanceCount > 0
    || ['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado'].includes(operational)
    || ['sujo', 'limpeza', 'em_limpeza', 'aguardando_vistoria', 'bloqueado'].includes(housekeeping);
}
