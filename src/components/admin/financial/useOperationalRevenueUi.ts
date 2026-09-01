import { useEffect, useState } from 'react';
import { hotelIdentityService } from '../../../services/hotelIdentityService';
import {
  loadOperationalRevenueSummary,
  type OperationalRevenueSummary,
} from '../../../services/financialReportingService';

const EMPTY_SUMMARY: OperationalRevenueSummary = {
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

export function useOperationalRevenueUi(preferredHotelId?: string | null) {
  const [summary, setSummary] = useState<OperationalRevenueSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const hotelId = await hotelIdentityService.getActiveHotelId(preferredHotelId);
        const nextSummary = await loadOperationalRevenueSummary(hotelId);
        if (active) setSummary(nextSummary);
      } catch (loadError) {
        if (!active) return;
        setSummary(EMPTY_SUMMARY);
        setError(loadError instanceof Error ? loadError.message : 'OPERATIONAL_REVENUE_LOAD_FAILED');
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
    ...summary,
    loading,
    error,
  };
}
