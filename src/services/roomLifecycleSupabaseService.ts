import { supabase } from '../lib/supabase';
import type { RoomLifecycleCommand, RoomLifecycleState } from '../domain/roomLifecycle';

export interface RoomLifecycleRpcInput {
  roomId: string;
  command: RoomLifecycleCommand;
  reservationId?: string | null;
  actorUserId?: string | null;
  reason?: string | null;
  expectedVersion?: number | null;
}

export interface PersistedRoomLifecycleResult {
  roomId: string;
  roomStatus: RoomLifecycleState['roomStatus'];
  controlOwner: RoomLifecycleState['controlOwner'];
  activeActivity: RoomLifecycleState['activeActivity'];
  hasActiveStay: boolean;
  version: number;
}

type RpcPayload = {
  room_id?: string;
  room_status?: RoomLifecycleState['roomStatus'];
  control_owner?: RoomLifecycleState['controlOwner'];
  active_activity?: RoomLifecycleState['activeActivity'];
  has_active_stay?: boolean;
  lifecycle_version?: number;
};

function normalizeRpcPayload(data: unknown): RpcPayload {
  if (Array.isArray(data)) return (data[0] || {}) as RpcPayload;
  return (data || {}) as RpcPayload;
}

/**
 * Adapter externo do Room Lifecycle Engine.
 * A RPC é responsável pela transação; este serviço não altera o Kanban Engine.
 */
export async function executeRoomLifecycleRpc(
  input: RoomLifecycleRpcInput,
): Promise<PersistedRoomLifecycleResult> {
  const { data, error } = await supabase.rpc('execute_room_lifecycle_transition', {
    p_room_id: input.roomId,
    p_command: input.command,
    p_reservation_id: input.reservationId || null,
    p_actor_user_id: input.actorUserId || null,
    p_reason: input.reason || null,
    p_expected_version: input.expectedVersion ?? null,
  });

  if (error) throw new Error(error.message || 'Não foi possível executar a transição operacional do quarto.');

  const payload = normalizeRpcPayload(data);
  if (!payload.room_id || !payload.room_status || !payload.control_owner) {
    throw new Error('A transição foi executada, mas o banco não retornou o estado operacional esperado.');
  }

  return {
    roomId: payload.room_id,
    roomStatus: payload.room_status,
    controlOwner: payload.control_owner,
    activeActivity: payload.active_activity || null,
    hasActiveStay: Boolean(payload.has_active_stay),
    version: Number(payload.lifecycle_version || 0),
  };
}

export async function performCheckoutLifecycle(input: {
  roomId: string;
  reservationId: string;
  actorUserId?: string | null;
  expectedVersion?: number | null;
}): Promise<PersistedRoomLifecycleResult> {
  return executeRoomLifecycleRpc({
    roomId: input.roomId,
    reservationId: input.reservationId,
    actorUserId: input.actorUserId,
    expectedVersion: input.expectedVersion,
    command: 'checkout',
    reason: 'Checkout concluído pela recepção',
  });
}
