export type CanonicalRoomOperationalStatus =
  | 'manutencao'
  | 'bloqueado'
  | 'ocupado'
  | 'sujo'
  | 'limpeza'
  | 'vistoria'
  | 'disponivel'
  | 'outros';

export const ROOM_OPERATIONAL_STATUS: Record<CanonicalRoomOperationalStatus, {
  label: string;
  badgeClass: string;
  dotClass: string;
}> = {
  manutencao: { label: 'Manutenção', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', dotClass: 'bg-rose-500' },
  bloqueado: { label: 'Bloqueado', badgeClass: 'bg-slate-200 text-slate-800 border-slate-300', dotClass: 'bg-slate-700' },
  ocupado: { label: 'Ocupado', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', dotClass: 'bg-blue-500' },
  sujo: { label: 'Sujo', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', dotClass: 'bg-orange-500' },
  limpeza: { label: 'Em limpeza', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200', dotClass: 'bg-cyan-500' },
  vistoria: { label: 'Vistoria', badgeClass: 'bg-violet-100 text-violet-800 border-violet-200', dotClass: 'bg-violet-500' },
  disponivel: { label: 'Disponível', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotClass: 'bg-emerald-500' },
  outros: { label: 'Outro', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', dotClass: 'bg-stone-400' },
};

export function normalizeRoomOperationalStatus(value?: unknown): CanonicalRoomOperationalStatus {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'manutencao' || status === 'manutenção') return 'manutencao';
  if (status === 'bloqueado' || status === 'interditado') return 'bloqueado';
  if (status === 'ocupado' || status === 'checkin_realizado') return 'ocupado';
  if (status === 'sujo') return 'sujo';
  if (status === 'limpeza' || status === 'em_limpeza') return 'limpeza';
  if (status === 'vistoria' || status === 'aguardando_vistoria' || status === 'inspecionado') return 'vistoria';
  if (status === 'disponivel' || status === 'disponível' || status === 'limpo' || status === 'aprovado') return 'disponivel';
  return 'outros';
}

export function roomOperationalStatusFromCardMetadata(metadata?: Record<string, unknown> | null) {
  return normalizeRoomOperationalStatus(metadata?.room_operational_status);
}
