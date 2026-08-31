import { supabase } from '../lib/supabase';

export type AdministrativeFinanceSource =
  | 'hotel_os_accounts_receivable'
  | 'hotel_os_accounts_payable'
  | 'hotel_os_financial_transactions';

export interface AdministrativeFinanceReadiness {
  ready: boolean;
  missingSources: AdministrativeFinanceSource[];
}

export const financeRepository = {
  async settle(input: {
    accountType: 'RECEIVABLE' | 'PAYABLE';
    accountId: string;
    amount: number;
    method: string;
    reference?: string | null;
    idempotencyKey?: string | null;
  }) {
    const { data, error } = await supabase.rpc('hotel_os_settle_financial_account', {
      p_account_type: input.accountType,
      p_account_id: input.accountId,
      p_amount: input.amount,
      p_method: input.method,
      p_reference: input.reference ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  async listTransactions(hotelId: string, from?: string, to?: string) {
    let q = supabase
      .from('hotel_os_financial_transactions')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('transaction_date', { ascending: false });
    if (from) q = q.gte('transaction_date', from);
    if (to) q = q.lte('transaction_date', to);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async listOpenAccounts(hotelId: string, type: 'RECEIVABLE' | 'PAYABLE') {
    const table = type === 'RECEIVABLE' ? 'hotel_os_accounts_receivable' : 'hotel_os_accounts_payable';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('hotel_id', hotelId)
      .in('status', ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'])
      .order('due_date');
    if (error) throw error;
    return data ?? [];
  },

  async getAdministrativeFinanceReadiness(hotelId: string): Promise<AdministrativeFinanceReadiness> {
    const [receivable, payable, transactions] = await Promise.all([
      supabase.from('hotel_os_accounts_receivable').select('id', { head: true }).eq('hotel_id', hotelId),
      supabase.from('hotel_os_accounts_payable').select('id', { head: true }).eq('hotel_id', hotelId),
      supabase.from('hotel_os_financial_transactions').select('id', { head: true }).eq('hotel_id', hotelId),
    ]);

    const missingSources: AdministrativeFinanceSource[] = [];
    if (receivable.error) missingSources.push('hotel_os_accounts_receivable');
    if (payable.error) missingSources.push('hotel_os_accounts_payable');
    if (transactions.error) missingSources.push('hotel_os_financial_transactions');

    return {
      ready: missingSources.length === 0,
      missingSources,
    };
  },
};
