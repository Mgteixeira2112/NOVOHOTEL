import {
  decideRoomLifecycleTransition,
  type RoomLifecycleActivity,
  type RoomLifecycleCommand,
  type RoomLifecycleDecision,
  type RoomLifecycleState,
  type RoomLifecycleTransition,
} from '../domain/roomLifecycle';

export type RoomLifecycleEffect =
  | {
      type: 'create_governance_demand';
      activity: Extract<RoomLifecycleActivity, 'checkout_cleaning' | 'daily_cleaning' | 'recleaning' | 'inspection'>;
    }
  | {
      type: 'create_maintenance_demand';
      activity: 'maintenance';
    };

export interface RoomLifecycleCommandContext {
  roomId: string;
  reservationId?: string | null;
  actorUserId?: string | null;
  reason?: string | null;
}

export interface RoomLifecycleSnapshot {
  state: RoomLifecycleState;
  version?: string | number | null;
}

export interface RoomLifecyclePlan {
  roomId: string;
  command: RoomLifecycleCommand;
  previousState: RoomLifecycleState;
  transition: RoomLifecycleTransition;
  nextState: RoomLifecycleState;
  effects: RoomLifecycleEffect[];
  context: RoomLifecycleCommandContext;
  expectedVersion?: string | number | null;
}

export interface RoomLifecycleExecutionResult {
  ok: boolean;
  reason?: string;
  decision?: RoomLifecycleDecision;
  plan?: RoomLifecyclePlan;
}

export interface RoomLifecycleStateReader {
  getSnapshot(roomId: string): Promise<RoomLifecycleSnapshot | null>;
}

/**
 * A implementação concreta deve persistir a transição e seus efeitos na mesma
 * transação de banco. Assim não existe cenário em que o status do quarto muda
 * mas a demanda obrigatória deixa de ser criada (ou vice-versa).
 */
export interface RoomLifecycleTransactionPort {
  commit(plan: RoomLifecyclePlan): Promise<void>;
}

function commandEffects(command: RoomLifecycleCommand): RoomLifecycleEffect[] {
  switch (command) {
    case 'checkout':
      return [{ type: 'create_governance_demand', activity: 'checkout_cleaning' }];
    case 'send_to_governance_cleaning':
      return [{ type: 'create_governance_demand', activity: 'recleaning' }];
    case 'send_to_governance_inspection':
      return [{ type: 'create_governance_demand', activity: 'inspection' }];
    case 'request_daily_cleaning':
      return [{ type: 'create_governance_demand', activity: 'daily_cleaning' }];
    case 'send_to_maintenance':
      return [{ type: 'create_maintenance_demand', activity: 'maintenance' }];
    default:
      return [];
  }
}

function validateContext(
  state: RoomLifecycleState,
  command: RoomLifecycleCommand,
  context: RoomLifecycleCommandContext,
): string | null {
  if (!context.roomId?.trim()) return 'roomId é obrigatório para qualquer transição operacional.';

  if (command === 'checkin' && !context.reservationId) {
    return 'Check-in operacional exige uma reserva vinculada.';
  }

  if (command === 'checkout' && !context.reservationId) {
    return 'Checkout operacional exige a reserva que está sendo encerrada.';
  }

  if (command === 'request_daily_cleaning' && state.hasActiveStay && !context.reservationId) {
    return 'Limpeza diária exige a hospedagem ativa vinculada.';
  }

  return null;
}

export function buildRoomLifecyclePlan(
  snapshot: RoomLifecycleSnapshot,
  command: RoomLifecycleCommand,
  context: RoomLifecycleCommandContext,
): RoomLifecycleExecutionResult {
  const contextError = validateContext(snapshot.state, command, context);
  if (contextError) return { ok: false, reason: contextError };

  const decision = decideRoomLifecycleTransition(snapshot.state, command);
  if (!decision.allowed || !decision.transition) {
    return { ok: false, reason: decision.reason || 'Transição operacional não permitida.', decision };
  }

  const transition = decision.transition;
  const nextState: RoomLifecycleState = {
    roomStatus: transition.toStatus,
    controlOwner: transition.toOwner,
    activeActivity: transition.resultingActivity,
    hasActiveStay:
      command === 'checkin'
        ? true
        : command === 'checkout'
          ? false
          : snapshot.state.hasActiveStay,
  };

  return {
    ok: true,
    decision,
    plan: {
      roomId: context.roomId,
      command,
      previousState: snapshot.state,
      transition,
      nextState,
      effects: commandEffects(command),
      context,
      expectedVersion: snapshot.version,
    },
  };
}

export class RoomLifecycleEngine {
  constructor(
    private readonly reader: RoomLifecycleStateReader,
    private readonly transaction: RoomLifecycleTransactionPort,
  ) {}

  async execute(
    command: RoomLifecycleCommand,
    context: RoomLifecycleCommandContext,
  ): Promise<RoomLifecycleExecutionResult> {
    const snapshot = await this.reader.getSnapshot(context.roomId);
    if (!snapshot) return { ok: false, reason: 'Quarto não encontrado para a transição operacional.' };

    const result = buildRoomLifecyclePlan(snapshot, command, context);
    if (!result.ok || !result.plan) return result;

    await this.transaction.commit(result.plan);
    return result;
  }
}
