import { supabase } from '../lib/supabase';

export interface OperationalRevenueSummary {
  grossPayments: number;
  refunds: number;
  netReceived: number;
  paymentCount: number;
  byMethod: {
    pix: number;
    creditCard: number;
    debitCard: number;
    other: number;
  };
}

type TransactionRow = {
  transaction_type?: string | null;
  amount?: number | string | null;
  method?: string | null;
  payment_method?: string | null;
  status?: string | null;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const normalizeMethod = (row: TransactionRow) =>
  String(row.payment_method ?? row.method ?? '')
    .trim()
    .toLowerCase();

const methodBucket = (method: string): keyof OperationalRevenueSummary['byMethod'] => {
  if (method === 'pix') return 'pix';
  if (['cartao_credito', 'credit_card', 'credit'].includes(method)) return 'creditCard';
  if (['cartao_debito', 'debit_card', 'debit'].includes(method)) return 'debitCard';
  return 'other';
};

export async function loadOperationalRevenueSummary(hotelId: string): Promise<OperationalRevenueSummary> {
  if (!hotelId) throw new Error('HOTEL_REQUIRED');

  const { data, error } = await supabase
    .from('hotel_os_transactions')
    .select('transaction_type,amount,method,payment_method,status')
    .eq('hotel_id', hotelId)
    .in('transaction_type', ['payment', 'refund']);

  if (error) throw error;

  const summary: OperationalRevenueSummary = {
    grossPayments: 0,
    refunds: 0,
    netReceived: 0,
    paymentCount: 0,
    byMethod: {
      pix: 0,
      creditCard: 0,
      debitCard: 0,
      other: 0,
    },
  };

  for (const row of (data ?? []) as TransactionRow[]) {
    const transactionType = String(row.transaction_type ?? '').toLowerCase();
    const status = String(row.status ?? '').toLowerCase();
    const amount = toNumber(row.amount);

    if (transactionType === 'payment' && status === 'approved') {
      summary.grossPayments += amount;
      summary.paymentCount += 1;
      summary.byMethod[methodBucket(normalizeMethod(row))] += amount;
      continue;
    }

    if (transactionType === 'refund' && ['approved', 'refunded'].includes(status)) {
      summary.refunds += amount;
    }
  }

  summary.netReceived = Math.max(0, summary.grossPayments - summary.refunds);
  return summary;
}
