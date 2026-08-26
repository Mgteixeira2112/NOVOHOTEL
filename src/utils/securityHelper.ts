// Utilitário de segurança para compatibilidade durante a migração para Supabase Auth/MFA.
//
// IMPORTANTE: autenticação e MFA reais devem ser validados no servidor.
// Este módulo não contém segredos compartilhados e não aceita códigos mestre.

export interface TotpStatus {
  token: string;
  secondsRemaining: number;
  progressPercent: number;
}

const isProduction = () => import.meta.env.VITE_APP_ENV === 'production';

/**
 * Mantém a visualização do contador legado em desenvolvimento, mas nunca
 * representa um segredo de autenticação de produção.
 */
export function getCurrentTotpToken(): TotpStatus {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const secondsRemaining = timeStep - (now % timeStep);
  const progressPercent = Math.round((secondsRemaining / timeStep) * 100);

  if (isProduction()) {
    return { token: '', secondsRemaining, progressPercent };
  }

  // Apenas compatibilidade visual de desenvolvimento. Não é um autenticador.
  return { token: '', secondsRemaining, progressPercent };
}

/** Gera um OTP aleatório para simulações locais; não autentica produção. */
export function generateOtpToken(): string {
  const values = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
  }
  return String(100000 + Math.floor(Math.random() * 900000));
}

/**
 * Validação de compatibilidade local.
 * Em produção, qualquer MFA deve passar por Supabase Auth/servidor.
 */
export function validate2FACode(
  inputCode: string,
  activeSessionOtp?: string,
): { valid: boolean; method: string } {
  const sanitized = inputCode.trim().replace(/\D/g, '');
  if (sanitized.length !== 6) return { valid: false, method: 'none' };

  if (isProduction()) {
    return { valid: false, method: 'server_mfa_required' };
  }

  if (activeSessionOtp && sanitized === activeSessionOtp) {
    return { valid: true, method: 'development_session_otp' };
  }

  return { valid: false, method: 'none' };
}
