import { useCallback, useEffect, useState } from 'react';
import { hotelIdentityService } from '../../../services/hotelIdentityService';
import { settleFinancialAccount } from '../../../services/financeService';
import type { PaymentMethod } from '../../../types/financial';
import { loadAdministrativeFinanceUiSnapshot } from './administrativeFinanceUiAdapter';

type AdministrativeFinanceUiState = Awaited<ReturnType<typeof loadAdministrativeFinanceUiSnapshot>>;

const INITIAL_STATE: AdministrativeFinanceUiState = {
  ready: false,
  missingSources: [],
  receivables: [],
  payables: [],
  transactions: [],
};

export function useAdministrativeFinanceUi(preferredHotelId?: string | null) {
  const [state, setState] = useState<AdministrativeFinanceUiState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resolvedHotelId = await hotelIdentityService.getActiveHotelId(preferredHotelId);
      setHotelId(resolvedHotelId);
      const snapshot = await loadAdministrativeFinanceUiSnapshot(resolvedHotelId);
      setState(snapshot);
    } catch (loadError) {
      setState(INITIAL_STATE);
      setError(loadError instanceof Error ? loadError.message : 'FINANCE_LOAD_FAILED');
    } finally {
      setLoading(false);
    }
  }, [preferredHotelId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const settleReceivable = useCallback(async (accountId: string, amount: number, method: PaymentMethod) => {
    await settleFinancialAccount({
      accountType: 'RECEIVABLE',
      accountId,
      amount,
      method,
      idempotencyKey: `ui-receivable-${accountId}-${amount}`,
    });
    await reload();
  }, [reload]);

  const settlePayable = useCallback(async (accountId: string, amount: number, method: PaymentMethod) => {
    await settleFinancialAccount({
      accountType: 'PAYABLE',
      accountId,
      amount,
      method,
      idempotencyKey: `ui-payable-${accountId}-${amount}`,
    });
    await reload();
  }, [reload]);

  return {
    ...state,
    hotelId,
    loading,
    error,
    reload,
    settleReceivable,
    settlePayable,
  };
}
