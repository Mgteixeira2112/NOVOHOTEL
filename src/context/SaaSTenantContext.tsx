import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useHotel } from './HotelContext';
import { tenantService, TenantSnapshot } from '../services/tenantService';
import type { HotelMembership, HotelTenant, Organization, TenantContext } from '../core/tenant/tenantTypes';

interface SaaSTenantContextValue {
  snapshot: TenantSnapshot | null;
  activeContext: TenantContext | null;
  activeHotel: HotelTenant | null;
  activeOrganization: Organization | null;
  activeMembership: HotelMembership | null;
  activeHotelId: string | null;
  loading: boolean;
  available: boolean;
  error: string | null;
  canSwitchHotels: boolean;
  refresh: () => Promise<void>;
  switchHotel: (hotelId: string) => Promise<boolean>;
}

const SaaSTenantContext = createContext<SaaSTenantContextValue | undefined>(undefined);

function resolveMembership(snapshot: TenantSnapshot, preferredHotelId?: string | null): HotelMembership | null {
  if (preferredHotelId) {
    const preferred = snapshot.memberships.find(membership => membership.hotel_id === preferredHotelId && membership.active);
    if (preferred) return preferred;
  }
  return snapshot.memberships.find(membership => membership.active) ?? null;
}

export const SaaSTenantProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, hotelConfig } = useHotel();
  const [snapshot, setSnapshot] = useState<TenantSnapshot | null>(null);
  const [activeMembership, setActiveMembership] = useState<HotelMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSnapshot(null);
      setActiveMembership(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await tenantService.getSnapshot();
      setSnapshot(nextSnapshot);
      setActiveMembership(nextSnapshot ? resolveMembership(nextSnapshot, hotelConfig?.id) : null);
    } catch (err) {
      setSnapshot(null);
      setActiveMembership(null);
      setError(err instanceof Error ? err.message : 'Contexto SaaS indisponível');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hotelConfig?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchHotel = useCallback(async (hotelId: string): Promise<boolean> => {
    if (!snapshot) return false;
    const membership = snapshot.memberships.find(item => item.hotel_id === hotelId && item.active);
    if (!membership) return false;

    try {
      const allowed = await tenantService.canSwitchToHotel(hotelId);
      if (!allowed) return false;
      setActiveMembership(membership);
      return true;
    } catch {
      return false;
    }
  }, [snapshot]);

  const activeHotel = useMemo(
    () => snapshot?.hotels.find(hotel => hotel.id === activeMembership?.hotel_id) ?? null,
    [snapshot, activeMembership?.hotel_id],
  );

  const activeOrganization = useMemo(
    () => snapshot?.organizations.find(organization => organization.id === activeMembership?.organization_id) ?? null,
    [snapshot, activeMembership?.organization_id],
  );

  const activeContext = useMemo<TenantContext | null>(() => {
    if (!snapshot || !activeMembership) return null;
    return {
      userId: snapshot.userId,
      organizationId: activeMembership.organization_id,
      hotelId: activeMembership.hotel_id,
      role: activeMembership.role,
    };
  }, [snapshot, activeMembership]);

  const activeHotelId = activeMembership?.hotel_id ?? hotelConfig?.id ?? null;
  const canSwitchHotels = (snapshot?.hotels.length ?? 0) > 1;

  const value = useMemo<SaaSTenantContextValue>(() => ({
    snapshot,
    activeContext,
    activeHotel,
    activeOrganization,
    activeMembership,
    activeHotelId,
    loading,
    available: Boolean(snapshot && activeMembership),
    error,
    canSwitchHotels,
    refresh,
    switchHotel,
  }), [
    snapshot,
    activeContext,
    activeHotel,
    activeOrganization,
    activeMembership,
    activeHotelId,
    loading,
    error,
    canSwitchHotels,
    refresh,
    switchHotel,
  ]);

  return <SaaSTenantContext.Provider value={value}>{children}</SaaSTenantContext.Provider>;
};

export function useSaaSTenant(): SaaSTenantContextValue {
  const context = useContext(SaaSTenantContext);
  if (!context) throw new Error('useSaaSTenant deve ser usado dentro de SaaSTenantProvider');
  return context;
}
