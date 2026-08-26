export const TASK_TYPES = [
  'ROOM_CLEANING',
  'ROOM_INSPECTION',
  'MAINTENANCE',
  'MINIBAR',
  'LAUNDRY',
  'DELIVERY',
  'RESTOCK',
  'GENERAL',
] as const;
export type TaskType = typeof TASK_TYPES[number];

export const TASK_SOURCES = [
  'CHECKOUT',
  'RESERVATION',
  'FRONT_DESK',
  'HOUSEKEEPING',
  'GUEST_REQUEST',
  'MAINTENANCE_REQUEST',
  'SYSTEM',
  'MANUAL',
] as const;
export type TaskSource = typeof TASK_SOURCES[number];

export const TASK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'WAITING',
  'COMPLETED',
  'CANCELLED',
  'REOPENED',
] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

// Separação estrita de disponibilidade vs estado operacional
export const ROOM_AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'BLOCKED',
  'OUT_OF_ORDER',
] as const;
export type RoomAvailabilityStatus = typeof ROOM_AVAILABILITY_STATUSES[number];

export const ROOM_OPERATIONAL_STATUSES = [
  'CLEAN',
  'DIRTY',
  'CLEANING',
  'INSPECTION',
  'REWORK',
] as const;
export type RoomOperationalStatus = typeof ROOM_OPERATIONAL_STATUSES[number];

export const MAINTENANCE_CATEGORIES = [
  'ELECTRICAL',
  'PLUMBING',
  'HVAC',
  'CARPENTRY',
  'ELECTRONICS',
  'PAINTING',
  'STRUCTURAL',
  'OTHER',
] as const;
export type MaintenanceCategory = typeof MAINTENANCE_CATEGORIES[number];

export const MAINTENANCE_STATUSES = [
  'OPEN',
  'TRIAGE',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'VALIDATED',
] as const;
export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[number];

export const ASSET_STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'RETIRED'] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export interface OperationalTask {
  id: string;
  hotelId: string;
  type: TaskType;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  roomId?: string | null;
  areaId?: string | null;
  assetId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  source: TaskSource;
  dueAt?: string | null;
  acknowledgedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedBy?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

export interface ChecklistTemplate {
  id: string;
  hotelId: string;
  name: string;
  taskType: TaskType;
  items: Array<{ label: string; required: boolean; sortOrder: number }>;
}

export interface Asset {
  id: string;
  hotelId: string;
  roomId?: string | null;
  name: string;
  category: string;
  serialNumber?: string | null;
  installedAt?: string | null;
  status: AssetStatus;
}

export interface MaintenanceRequest {
  id: string;
  hotelId: string;
  taskId: string;
  roomId?: string | null;
  assetId?: string | null;
  category: MaintenanceCategory;
  description: string;
  priority: TaskPriority;
  status: MaintenanceStatus;
  createdBy?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanBoard {
  id: string;
  hotelId: string;
  name: string;
  taskType?: TaskType | null;
  columns: Array<{ name: string; status: string; sortOrder: number }>;
}

export interface TaskSlaMetrics {
  timeToAcknowledgeMs?: number | null;
  executionTimeMs?: number | null;
  totalTimeMs?: number | null;
  isOverdue: boolean;
}

export function validateTaskTransition(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['WAITING', 'COMPLETED', 'CANCELLED'],
    WAITING: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: ['REOPENED'],
    CANCELLED: ['PENDING'],
    REOPENED: ['IN_PROGRESS', 'CANCELLED'],
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}

export function calculateTaskSla(
  task: Pick<OperationalTask, 'createdAt' | 'acknowledgedAt' | 'startedAt' | 'completedAt' | 'dueAt'>,
  now: Date = new Date()
): TaskSlaMetrics {
  const createdMs = new Date(task.createdAt).getTime();
  const ackMs = task.acknowledgedAt ? new Date(task.acknowledgedAt).getTime() : null;
  const startMs = task.startedAt ? new Date(task.startedAt).getTime() : null;
  const completedMs = task.completedAt ? new Date(task.completedAt).getTime() : null;
  const dueMs = task.dueAt ? new Date(task.dueAt).getTime() : null;

  const timeToAcknowledgeMs = ackMs ? Math.max(0, ackMs - createdMs) : null;
  const executionTimeMs = startMs && completedMs ? Math.max(0, completedMs - startMs) : null;
  const totalTimeMs = completedMs ? Math.max(0, completedMs - createdMs) : Math.max(0, now.getTime() - createdMs);

  let isOverdue = false;
  if (dueMs) {
    if (completedMs) {
      isOverdue = completedMs > dueMs;
    } else {
      isOverdue = now.getTime() > dueMs;
    }
  }

  return {
    timeToAcknowledgeMs,
    executionTimeMs,
    totalTimeMs,
    isOverdue,
  };
}
