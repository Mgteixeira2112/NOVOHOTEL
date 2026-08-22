// Utilitário de Segurança, Criptografia e Autenticação em Dois Fatores (2FA / MFA)

export interface TotpStatus {
  token: string;
  secondsRemaining: number;
  progressPercent: number;
}

// Gera um token TOTP de 6 dígitos sincronizado com o relógio de 30 segundos
export function getCurrentTotpToken(): TotpStatus {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30; // Janela de 30 segundos padrão TOTP (RFC 6238)
  const currentInterval = Math.floor(now / timeStep);
  const secondsRemaining = timeStep - (now % timeStep);
  const progressPercent = Math.round((secondsRemaining / timeStep) * 100);

  // Função pseudo-hash determinística para o intervalo de tempo
  let hash = 0;
  const str = `HOTEL_PMS_SECRET_SALT_${currentInterval}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const positiveHash = Math.abs(hash);
  const code = (positiveHash % 900000 + 100000).toString();

  return {
    token: code,
    secondsRemaining,
    progressPercent,
  };
}

// Gera um token OTP avulso (para envio simulado via SMS, WhatsApp ou E-mail)
export function generateOtpToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validador universal de códigos de 2 fatores (suporta token dinâmico atual, token gerado da sessão ou chaves mestras de homologação)
export function validate2FACode(
  inputCode: string, 
  activeSessionOtp?: string
): { valid: boolean; method: string } {
  const sanitized = inputCode.trim().replace(/\D/g, '');
  
  if (!sanitized || sanitized.length < 6) {
    return { valid: false, method: 'none' };
  }

  const currentTotp = getCurrentTotpToken().token;

  // 1. Verifica token TOTP do relógio atual
  if (sanitized === currentTotp) {
    return { valid: true, method: 'authenticator' };
  }

  // 2. Verifica token enviado na sessão ativa (SMS/WhatsApp/Email)
  if (activeSessionOtp && sanitized === activeSessionOtp) {
    return { valid: true, method: 'session_otp' };
  }

  // 3. Tokens universais de homologação e códigos de backup
  const backupCodes = ['123456', '888888', '999999', '000000', '777777'];
  if (backupCodes.includes(sanitized)) {
    return { valid: true, method: 'backup_code' };
  }

  return { valid: false, method: 'none' };
}
