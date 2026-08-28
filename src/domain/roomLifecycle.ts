import type { CanonicalRoomOperationalStatus } from './roomOperationalStatus';

export type RoomControlOwner = 'recepcao' | 'governanca' | 'manutencao' | 'gestao';

export type RoomLifecycleCommand =
  | 'checkin'
  | 'checkout'
  | 'send_to_governance_cleaning'
  | 'send_to_governance_inspection'
  | 'start_cleaning'
  | 'send_to_inspection'
  | 'approve_inspection'
  | 'reject_inspection'
  | 'request_daily_cleaning'
  | 'complete_daily_cleaning'
  | 'send_to_maintenance'
  | 'complete_maintenance'
  | 'block_room'
  | 'unblock_room';

export type RoomLifecycleActivity =
  | 'checkout_cleaning'
  | 'daily_cleaning'
  | 'recleaning'
  | 'inspection'
  | 'maintenance'
  | null;

export interface RoomLifecycleState {
  roomStatus: CanonicalRoomOperationalStatus;
  controlOwner: RoomControlOwner;
  activeActivity: RoomLifecycleActivity;
  hasActiveStay: boolean;
}

export interface RoomLifecycleTransition {
  command: RoomLifecycleCommand;
  fromStatus: CanonicalRoomOperationalStatus;
  toStatus: CanonicalRoomOperationalStatus;
  fromOwner: RoomControlOwner;
  toOwner: RoomControlOwner;
  resultingActivity: RoomLifecycleActivity;
}

export interface RoomLifecycleDecision {
  allowed: boolean;
  reason?: string;
  transition?: RoomLifecycleTransition;
}

function denied(reason: string): RoomLifecycleDecision {
  return { allowed: false, reason };
}

function allowed(
  state: RoomLifecycleState,
  command: RoomLifecycleCommand,
  toStatus: CanonicalRoomOperationalStatus,
  toOwner: RoomControlOwner,
  resultingActivity: RoomLifecycleActivity,
): RoomLifecycleDecision {
  return {
    allowed: true,
    transition: {
      command,
      fromStatus: state.roomStatus,
      toStatus,
      fromOwner: state.controlOwner,
      toOwner,
      resultingActivity,
    },
  };
}

/**
 * Contrato puro da máquina de estados do quarto.
 * Não persiste dados e não conversa com o Kanban Engine.
 * As integrações futuras devem chamar este contrato antes de qualquer alteração operacional.
 */
export function decideRoomLifecycleTransition(
  state: RoomLifecycleState,
  command: RoomLifecycleCommand,
): RoomLifecycleDecision {
  switch (command) {
    case 'checkin':
      if (state.roomStatus !== 'disponivel' || state.controlOwner !== 'recepcao') {
        return denied('Check-in só é permitido em quarto disponível sob controle da recepção.');
      }
      return allowed(state, command, 'ocupado', 'recepcao', null);

    case 'checkout':
      if (state.roomStatus !== 'ocupado' || !state.hasActiveStay) {
        return denied('Checkout operacional exige quarto ocupado com hospedagem ativa.');
      }
      return allowed(state, command, 'sujo', 'governanca', 'checkout_cleaning');

    case 'send_to_governance_cleaning':
      if (state.roomStatus !== 'disponivel' || state.controlOwner !== 'recepcao') {
        return denied('A recepção só pode devolver à governança um quarto disponível sob seu controle.');
      }
      return allowed(state, command, 'sujo', 'governanca', 'recleaning');

    case 'send_to_governance_inspection':
      if (state.roomStatus !== 'disponivel' || state.controlOwner !== 'recepcao') {
        return denied('A recepção só pode solicitar nova vistoria em quarto disponível sob seu controle.');
      }
      return allowed(state, command, 'vistoria', 'governanca', 'inspection');

    case 'start_cleaning':
      if (state.controlOwner !== 'governanca' || state.roomStatus !== 'sujo') {
        return denied('Somente a governança pode iniciar limpeza de quarto sujo sob seu controle.');
      }
      return allowed(state, command, 'limpeza', 'governanca', state.activeActivity || 'recleaning');

    case 'send_to_inspection':
      if (state.controlOwner !== 'governanca' || state.roomStatus !== 'limpeza') {
        return denied('Somente a governança pode enviar para vistoria após a limpeza.');
      }
      return allowed(state, command, 'vistoria', 'governanca', 'inspection');

    case 'approve_inspection':
      if (state.controlOwner !== 'governanca' || state.roomStatus !== 'vistoria') {
        return denied('A liberação exige quarto em vistoria sob controle da governança.');
      }
      return allowed(state, command, state.hasActiveStay ? 'ocupado' : 'disponivel', 'recepcao', null);

    case 'reject_inspection':
      if (state.controlOwner !== 'governanca' || state.roomStatus !== 'vistoria') {
        return denied('Somente a governança pode reprovar uma vistoria sob seu controle.');
      }
      return allowed(state, command, 'limpeza', 'governanca', 'recleaning');

    case 'request_daily_cleaning':
      if (state.roomStatus !== 'ocupado' || !state.hasActiveStay) {
        return denied('Limpeza diária só pode ser aberta para quarto ocupado com hospedagem ativa.');
      }
      return allowed(state, command, 'ocupado', 'governanca', 'daily_cleaning');

    case 'complete_daily_cleaning':
      if (
        state.roomStatus !== 'ocupado' ||
        state.controlOwner !== 'governanca' ||
        state.activeActivity !== 'daily_cleaning' ||
        !state.hasActiveStay
      ) {
        return denied('Conclusão de limpeza diária exige quarto ocupado e atividade diária ativa na governança.');
      }
      return allowed(state, command, 'ocupado', 'recepcao', null);

    case 'send_to_maintenance':
      if (state.roomStatus === 'ocupado' || state.hasActiveStay) {
        return denied('Quarto ocupado ou com hospedagem ativa não pode entrar em manutenção operacional.');
      }
      if (!['disponivel', 'sujo', 'vistoria'].includes(state.roomStatus)) {
        return denied('O estado atual do quarto não permite transferência para manutenção.');
      }
      return allowed(state, command, 'manutencao', 'manutencao', 'maintenance');

    case 'complete_maintenance':
      if (state.roomStatus !== 'manutencao' || state.controlOwner !== 'manutencao') {
        return denied('Somente manutenção pode concluir um quarto sob seu controle.');
      }
      return allowed(state, command, 'vistoria', 'governanca', 'inspection');

    case 'block_room':
      if (state.roomStatus === 'ocupado' || state.hasActiveStay) {
        return denied('Quarto ocupado não pode ser bloqueado por esta transição operacional.');
      }
      return allowed(state, command, 'bloqueado', 'gestao', null);

    case 'unblock_room':
      if (state.roomStatus !== 'bloqueado' || state.controlOwner !== 'gestao') {
        return denied('Desbloqueio exige quarto bloqueado sob controle da gestão.');
      }
      return allowed(state, command, 'disponivel', 'recepcao', null);
  }
}

export const RECEPTION_ROOM_KANBAN_STATUSES: CanonicalRoomOperationalStatus[] = [
  'disponivel',
  'ocupado',
  'sujo',
  'limpeza',
  'vistoria',
  'manutencao',
  'bloqueado',
];

export function receptionCanDirectlyControlRoom(state: RoomLifecycleState): boolean {
  return state.controlOwner === 'recepcao' && (state.roomStatus === 'disponivel' || state.roomStatus === 'ocupado');
}
