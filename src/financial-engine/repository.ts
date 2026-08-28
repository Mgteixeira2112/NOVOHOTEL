import { supabase } from '../lib/supabase';
import type {
  AddChargeInput,
  CheckoutFinancialEligibility,
  FinancialFolioSnapshot,
  ReceivePaymentInput,
} from './types';

export const financialRepository = {
  async getFolioByStay(stayId: string): Promise<FinancialFolioSnapshot> {
    const { data, error } = await supabase.rpc('hotel_os_financial_folio_snapshot_by_stay', {
      p_stay_id: stayId,
    });
    if (error) throw error;
    return data as FinancialFolioSnapshot;
  },

  async getFolio(folioId: string): Promise<FinancialFolioSnapshot> {
    const { data, error } = await supabase.rpc('hotel_os_financial_folio_snapshot', {
      p_folio_id: folioId,
    });
    if (error) throw error;
    return data as FinancialFolioSnapshot;
  },

  async addCharge(input: AddChargeInput): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_financial_add_charge', {
      p_folio_id: input.folioId,
      p_source: input.source,
      p_source_key: input.sourceKey ?? null,
      p_description: input.description,
      p_quantity: input.quantity,
      p_unit_price: input.unitPrice,
    });
    if (error) throw error;
    return String(data);
  },

  async receivePayment(input: ReceivePaymentInput): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_financial_receive_payment', {
      p_folio_id: input.folioId,
      p_amount: input.amount,
      p_method: input.method,
      p_external_reference: input.externalReference ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
    });
    if (error) throw error;
    return String(data);
  },

  async voidCharge(folioItemId: string, reason: string): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_void_folio_item', {
      p_folio_item_id: folioItemId,
      p_reason: reason,
    });
    if (error) throw error;
    return String(data);
  },

  async canCheckout(stayId: string): Promise<CheckoutFinancialEligibility> {
    const { data, error } = await supabase.rpc('hotel_os_financial_can_checkout', {
      p_stay_id: stayId,
    });
    if (error) throw error;
    return data as CheckoutFinancialEligibility;
  },

  async closeFolio(folioId: string): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_financial_close_folio', {
      p_folio_id: folioId,
    });
    if (error) throw error;
    return String(data);
  },
};
