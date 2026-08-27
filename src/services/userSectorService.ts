import { supabase } from '../lib/supabase';
import {
  OPERATIONAL_SECTORS,
  OperationalSectorId,
  normalizeOperationalSectorIds,
} from '../domain/operationalSectors';

export const DEFAULT_OPERATIONAL_HOTEL_ID = 'default_hotel';

export interface UserOperationalSectorAssignment {
  userId: string;
  hotelId: string;
  sectorIds: OperationalSectorId[];
  principalSectorId: OperationalSectorId | null;
}

export function operationalSectorRowId(
  sectorId: OperationalSectorId,
  hotelId = DEFAULT_OPERATIONAL_HOTEL_ID,
): string {
  return `${hotelId}:${sectorId}`;
}

function sectorCodeFromRowId(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const separator = value.lastIndexOf(':');
  return separator >= 0 ? value.slice(separator + 1) : value;
}

export async function fetchOperationalSectors(hotelId = DEFAULT_OPERATIONAL_HOTEL_ID) {
  try {
    const { data, error } = await supabase
      .from('operational_sectors')
      .select('codigo,nome,descricao,ordem,ativo')
      .eq('hotel_id', hotelId)
      .eq('ativo', true)
      .order('ordem');

    if (!error && Array.isArray(data) && data.length > 0) {
      return data
        .filter(row => normalizeOperationalSectorIds([row.codigo]).length === 1)
        .map(row => ({
          id: row.codigo as OperationalSectorId,
          label: String(row.nome || row.codigo),
          description: String(row.descricao || ''),
          order: Number(row.ordem || 0),
        }));
    }
  } catch {}

  // Compatibilidade enquanto a migration ainda não foi aplicada no projeto Supabase.
  return [...OPERATIONAL_SECTORS];
}

export async function fetchUserOperationalSectors(
  userId: string,
  hotelId = DEFAULT_OPERATIONAL_HOTEL_ID,
): Promise<UserOperationalSectorAssignment> {
  if (!userId) {
    return { userId: '', hotelId, sectorIds: [], principalSectorId: null };
  }

  try {
    const { data, error } = await supabase
      .from('usuario_operational_sectors')
      .select('sector_id,principal')
      .eq('hotel_id', hotelId)
      .eq('usuario_id', userId);

    if (!error && Array.isArray(data)) {
      const sectorIds = normalizeOperationalSectorIds(
        data.map(row => sectorCodeFromRowId(row.sector_id)),
      );
      const principalSectorId = normalizeOperationalSectorIds([
        sectorCodeFromRowId(data.find(row => row.principal)?.sector_id),
      ])[0] || null;

      return { userId, hotelId, sectorIds, principalSectorId };
    }
  } catch {}

  return { userId, hotelId, sectorIds: [], principalSectorId: null };
}

export async function saveUserOperationalSectors(input: {
  userId: string;
  sectorIds: OperationalSectorId[];
  principalSectorId?: OperationalSectorId | null;
  hotelId?: string;
}): Promise<{ success: boolean; message?: string }> {
  const hotelId = input.hotelId || DEFAULT_OPERATIONAL_HOTEL_ID;
  const sectorIds = normalizeOperationalSectorIds(input.sectorIds);
  const principalSectorId = input.principalSectorId && sectorIds.includes(input.principalSectorId)
    ? input.principalSectorId
    : (sectorIds[0] || null);

  if (!input.userId) return { success: false, message: 'Usuário inválido.' };

  try {
    const { error: deleteError } = await supabase
      .from('usuario_operational_sectors')
      .delete()
      .eq('hotel_id', hotelId)
      .eq('usuario_id', input.userId);

    if (deleteError) return { success: false, message: deleteError.message };
    if (sectorIds.length === 0) return { success: true };

    const rows = sectorIds.map(sectorId => ({
      hotel_id: hotelId,
      usuario_id: input.userId,
      sector_id: operationalSectorRowId(sectorId, hotelId),
      principal: sectorId === principalSectorId,
    }));

    const { error: insertError } = await supabase
      .from('usuario_operational_sectors')
      .insert(rows);

    if (insertError) return { success: false, message: insertError.message };
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: String(error?.message || error || 'Falha ao salvar setores do usuário.'),
    };
  }
}
