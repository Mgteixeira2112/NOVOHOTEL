import React, { useEffect, useRef } from 'react';
import { useHotel } from '../../context/HotelContext';
import { clearSupabaseStaffSession, establishSupabaseStaffSession } from '../../services/supabaseAuthBridge';

/**
 * Transitional auth cutover agent.
 *
 * It never persists credentials. The password is captured from the existing
 * login form into memory only and is used only after the local password + 2FA
 * flow has marked the user authenticated. A bridge failure never revokes the
 * existing local session; RLS remains blocked by the database rollout gate.
 */
export const SupabaseAuthSessionBridge: React.FC = () => {
  const { isAuthenticated } = useHotel();
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);
  const previousAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    const captureCredentials = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.id !== 'form-login-step1') return;
      const emailInput = document.getElementById('login-input-email') as HTMLInputElement | null;
      const passwordInput = document.getElementById('login-input-password') as HTMLInputElement | null;
      const email = emailInput?.value.trim().toLowerCase() || '';
      const password = passwordInput?.value || '';
      if (email && password) credentialsRef.current = { email, password };
    };

    document.addEventListener('submit', captureCredentials, true);
    return () => document.removeEventListener('submit', captureCredentials, true);
  }, []);

  useEffect(() => {
    const wasAuthenticated = previousAuthenticatedRef.current;
    previousAuthenticatedRef.current = isAuthenticated;

    if (!wasAuthenticated && isAuthenticated && credentialsRef.current) {
      const credentials = credentialsRef.current;
      credentialsRef.current = null;
      void establishSupabaseStaffSession(credentials.email, credentials.password).catch(() => {
        // Safe rollout fallback: the local authenticated session remains valid.
        // Restrictive RLS stays disabled until the database cutover gate is enabled.
        console.warn('AUTH_BRIDGE_FALLBACK');
      });
      return;
    }

    if (wasAuthenticated && !isAuthenticated) {
      credentialsRef.current = null;
      void clearSupabaseStaffSession().catch(() => undefined);
    }
  }, [isAuthenticated]);

  return null;
};
