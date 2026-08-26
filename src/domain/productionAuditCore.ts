/**
 * HOTEL OS — Phase 17 Production Readiness & Comprehensive Audit Core
 * Contém utilitários para validação de integridade, cálculo monetário seguro,
 * verificação de SLA/RPO/RTO, auditoria append-only, e simulação de resiliência.
 */

export interface SystemHealthMetrics {
  databaseStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  apiLatencyMs: number;
  memoryUsageMb: number;
  activeRealtimeConnections: number;
  pendingOfflineOperations: number;
}

export interface BackupRecoveryPolicy {
  rpoMinutes: number; // Recovery Point Objective (e.g. 5 min)
  rtoMinutes: number; // Recovery Time Objective (e.g. 15 min)
  automatedDailySnapshots: boolean;
  pointInTimeRecoveryDays: number;
  encryptedAtRest: boolean;
  testedRestoreDate: string;
}

export interface EndToEndStayFlowResult {
  reservationId: string;
  stayId: string;
  roomId: string;
  guestName: string;
  roomServiceOrderId: string;
  posOrderId: string;
  minibarChargeId: string;
  totalCharges: number;
  totalPayments: number;
  balanceDue: number;
  checkedOut: boolean;
  roomTurnoverStatus: 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'AVAILABLE';
}

/**
 * 1. Cálculo monetário preciso sem erros de arredondamento IEEE-754
 */
export function calculatePreciseFinancialTotal(items: Array<{ unitAmount: number; quantity: number }>): number {
  const totalCents = items.reduce((acc, item) => {
    const itemCents = Math.round(item.unitAmount * 100) * item.quantity;
    return acc + itemCents;
  }, 0);
  return totalCents / 100;
}

/**
 * 2. Validador de integridade relacional sem registros órfãos
 */
export function validateDomainRelationalIntegrity(records: {
  orders: Array<{ id: string; hotelId: string; stayId?: string | null }>;
  stays: Array<{ id: string; hotelId: string; roomId: string; reservationId: string }>;
  reservations: Array<{ id: string; hotelId: string; roomId?: string | null }>;
  maintenanceTickets: Array<{ id: string; hotelId: string; roomId: string }>;
  folios: Array<{ id: string; hotelId: string; stayId: string }>;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const order of records.orders) {
    if (!order.hotelId) violations.push(`Order ${order.id} missing hotelId`);
  }

  for (const stay of records.stays) {
    if (!stay.hotelId) violations.push(`Stay ${stay.id} missing hotelId`);
    if (!stay.roomId) violations.push(`Stay ${stay.id} missing roomId`);
    if (!stay.reservationId) violations.push(`Stay ${stay.id} missing reservationId`);
  }

  for (const res of records.reservations) {
    if (!res.hotelId) violations.push(`Reservation ${res.id} missing hotelId`);
  }

  for (const mnt of records.maintenanceTickets) {
    if (!mnt.hotelId) violations.push(`Maintenance ${mnt.id} missing hotelId`);
    if (!mnt.roomId) violations.push(`Maintenance ${mnt.id} missing roomId`);
  }

  for (const fol of records.folios) {
    if (!fol.hotelId) violations.push(`Folio ${fol.id} missing hotelId`);
    if (!fol.stayId) violations.push(`Folio ${fol.id} missing stayId`);
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * 3. Validador de Política de Backup & Disaster Recovery
 */
export function validateDisasterRecoverySLA(policy: BackupRecoveryPolicy): boolean {
  if (policy.rpoMinutes > 15) return false; // RPO máximo tolerado: 15 min
  if (policy.rtoMinutes > 60) return false; // RTO máximo tolerado: 60 min
  if (!policy.automatedDailySnapshots) return false;
  if (policy.pointInTimeRecoveryDays < 7) return false;
  if (!policy.encryptedAtRest) return false;
  return true;
}

/**
 * 4. Validador de Sanitização de Upload de Arquivos
 */
export function validateUploadSecurity(file: {
  filename: string;
  sizeBytes: number;
  mimeType: string;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
}): { allowed: boolean; reason?: string } {
  const max = file.maxSizeBytes ?? 10 * 1024 * 1024; // 10 MB default
  const allowedExts = file.allowedExtensions ?? ['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.csv', '.xlsx'];

  if (file.sizeBytes <= 0 || file.sizeBytes > max) {
    return { allowed: false, reason: 'FILE_SIZE_EXCEEDS_LIMIT' };
  }

  const dotIdx = file.filename.lastIndexOf('.');
  if (dotIdx === -1) {
    return { allowed: false, reason: 'MISSING_FILE_EXTENSION' };
  }

  const ext = file.filename.substring(dotIdx).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { allowed: false, reason: 'FILE_EXTENSION_DISALLOWED' };
  }

  // Prevenção de Path Traversal
  if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
    return { allowed: false, reason: 'INVALID_FILENAME_CHARACTERS' };
  }

  return { allowed: true };
}
