import { useEffect, useState } from 'react';
import { hotelIdentityService } from '../../../services/hotelIdentityService';
import {
  loadOperationalTransactions,
  type OperationalTransaction,
} from '../../../services/financialReportingService';

export function useOperationalTransactionsUi(preferredHotelId?: string | null) {
  const [transactions, setTransactions] = useState<OperationalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const hotelId = await hotelIdentityService.getActiveHotelId(preferredHotelId);
        const nextTransactions = await loadOperationalTransactions(hotelId);
        if (active) setTransactions(nextTransactions);
      } catch (loadError) {
        if (!active) return;
        setTransactions([]);
        setError(loadError instanceof Error ? loadError.message : 'OPERATIONAL_TRANSACTIONS_LOAD_FAILED');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [preferredHotelId]);

  return {
    transactions,
    loading,
    error,
  };
}
