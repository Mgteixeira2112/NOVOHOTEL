import { supabase } from '../lib/supabase';

/**
 * Resolve o identificador canônico da instalação a partir da fonte de verdade.
 * O schema atual mantém uma única linha ativa em hotel_config; o id da linha é
 * o tenant usado pelos módulos Hotel OS (financeiro, estoque e frigobar).
 */
export const hotelIdentityService = {
  async getActiveHotelId(preferredId?: string | null): Promise<string> {
    if (preferredId?.trim()) return preferredId.trim();

    const { data, error } = await supabase
      .from('hotel_config')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`HOTEL_IDENTITY_LOOKUP_FAILED: ${error.message}`);
    const hotelId = typeof data?.id === 'string' ? data.id.trim() : '';
    if (!hotelId) throw new Error('HOTEL_IDENTITY_NOT_FOUND');
    return hotelId;
  },
};
