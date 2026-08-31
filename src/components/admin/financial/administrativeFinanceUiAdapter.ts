import type { ContaReceber, DespesaOperacional, ReceivableStatus, ExpenseStatus } from '../../../types/financial';
import { loadAdministrativeFinanceSnapshot } from '../../../services/financeService';

type AdministrativeReceivableRow = {
  id: string;
  customer_id?: string | null;
  folio_id?: string | null;
  description: string;
  amount: number | string;
  received_amount?: number | string | null;
  due_date: string;
  status: string;
  source?: string | null;
  source_id?: string | null;
  created_at: string;
  paid_at?: string | null;
};

type AdministrativePayableRow = {
  id: string;
  supplier_id?: string | null;
  description: string;
  amount: number | string;
  paid_amount?: number | string | null;
  due_date: string;
  status: string;
  cost_center_id?: string | null;
  created_at: string;
  paid_at?: string | null;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const mapReceivableStatus = (status: string): ReceivableStatus => {
  switch (status) {
    case 'PAID':
      return 'recebido';
    case 'PARTIALLY_PAID':
      return 'parcial';
    case 'OVERDUE':
      return 'atrasado';
    default:
      return 'pendente';
  }
};

const mapPayableStatus = (status: string): ExpenseStatus => {
  switch (status) {
    case 'PAID':
      return 'pago';
    case 'OVERDUE':
      return 'atrasado';
    default:
      return 'pendente';
  }
};

export function adaptAdministrativeReceivable(row: AdministrativeReceivableRow): ContaReceber {
  const total = toNumber(row.amount);
  const paid = toNumber(row.received_amount);

  return {
    id: row.id,
    reserva_id: row.folio_id ?? undefined,
    codigo_reserva: row.source_id ?? undefined,
    hospede_id: row.customer_id ?? undefined,
    hospede_nome: '—',
    hospede_telefone: '',
    categoria: 'outros',
    descricao: row.description,
    valor_total: total,
    valor_pago: paid,
    saldo_pendente: Math.max(0, total - paid),
    data_vencimento: row.due_date,
    data_pagamento: row.paid_at ?? undefined,
    status: mapReceivableStatus(row.status),
    created_at: row.created_at,
  };
}

export function adaptAdministrativePayable(row: AdministrativePayableRow): DespesaOperacional {
  const total = toNumber(row.amount);
  const paid = toNumber(row.paid_amount);

  return {
    id: row.id,
    descricao: row.description,
    categoria: 'outros',
    valor: Math.max(0, total - paid),
    data_vencimento: row.due_date,
    data_pagamento: row.paid_at ?? undefined,
    status: mapPayableStatus(row.status),
    fornecedor: '—',
    centro_custo: row.cost_center_id ?? undefined,
    created_at: row.created_at,
  };
}

export async function loadAdministrativeFinanceUiSnapshot(hotelId: string) {
  const snapshot = await loadAdministrativeFinanceSnapshot(hotelId);

  if (!snapshot.ready) {
    return {
      ready: false as const,
      missingSources: snapshot.missingSources,
      receivables: [] as ContaReceber[],
      payables: [] as DespesaOperacional[],
      transactions: snapshot.transactions,
    };
  }

  return {
    ready: true as const,
    missingSources: [] as string[],
    receivables: snapshot.receivables.map((row) => adaptAdministrativeReceivable(row as AdministrativeReceivableRow)),
    payables: snapshot.payables.map((row) => adaptAdministrativePayable(row as AdministrativePayableRow)),
    transactions: snapshot.transactions,
  };
}
