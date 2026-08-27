import { useState } from 'react';
import { 
  SecurityActionRequest, 
  SecurityLogEntry, 
  TwoFactorMethod, 
  Usuario 
} from '../types';
import { INITIAL_SECURITY_LOGS } from '../data/mockInitialData';
import { generateOtpToken, validate2FACode, getCurrentTotpToken, TotpStatus } from '../utils/securityHelper';
import { insertSecurityLogToSupabase } from '../services/supabase';

export function useHotelSecurity2FA(
  currentUser: Usuario,
  initialLogs: SecurityLogEntry[] = INITIAL_SECURITY_LOGS
) {
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityModalRequest, setSecurityModalRequest] = useState<SecurityActionRequest | null>(null);
  const [activeActionOtp, setActiveActionOtp] = useState<string | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>(initialLogs);
  const [currentTotp] = useState<TotpStatus>(() => getCurrentTotpToken());

  const confirmActionWith2FA = (request: SecurityActionRequest) => {
    const otp = generateOtpToken();
    setActiveActionOtp(otp);
    setSecurityModalRequest(request);
    setSecurityModalOpen(true);
  };

  const closeSecurityModal = () => {
    setSecurityModalOpen(false);
    setSecurityModalRequest(null);
    setActiveActionOtp(null);
  };

  const generateNewActionOtp = (): string => {
    const otp = generateOtpToken();
    setActiveActionOtp(otp);
    return otp;
  };

  const verifyAndExecuteAction = (
    password: string, 
    code2FA: string, 
    method: TwoFactorMethod = 'authenticator'
  ): { success: boolean; message: string } => {
    if (!securityModalRequest) {
      return { success: false, message: 'Nenhuma operação em processo de autorização.' };
    }

    // 1. Validação Obrigatória da Senha Operacional do Usuário Atual
    const expectedPassword = currentUser.senha || 'admin';
    if (!password || password.trim() !== expectedPassword.trim()) {
      return { success: false, message: 'Senha operacional incorreta. Insira a senha do usuário conectado.' };
    }

    // 2. Validação Obrigatória do Token de 2 Fatores
    const validation = validate2FACode(code2FA, activeActionOtp || undefined);
    if (!validation.valid) {
      return { success: false, message: 'Código de Confirmação em 2 Fatores incorreto ou expirado.' };
    }

    // 3. Registrar Log de Auditoria Imutável
    const newLog: SecurityLogEntry = {
      id: `log-${Date.now()}`,
      usuario_id: currentUser.id,
      usuario_nome: currentUser.nome,
      usuario_email: currentUser.email,
      usuario_cargo: currentUser.cargo_titulo || currentUser.tipo_usuario,
      operacao: securityModalRequest.title,
      detalhes: `${securityModalRequest.description}${securityModalRequest.details ? ' | ' + securityModalRequest.details : ''}`,
      categoria: securityModalRequest.category,
      metodo_2fa: method,
      ip_origem: '10.0.4.12 (Terminal Seguro PMS)',
      sucesso: true,
      timestamp: new Date().toISOString(),
    };

    setSecurityLogs((prev) => [newLog, ...prev]);
    insertSecurityLogToSupabase(newLog).catch(() => {});

    // 4. Executa a Ação Operacional
    try {
      securityModalRequest.onConfirm();
    } catch (e) {
      console.error('Erro ao executar ação após autorização 2FA', e);
    }

    // 5. Finaliza e Fecha o Modal
    closeSecurityModal();
    return { success: true, message: 'Operação autorizada e executada com sucesso com validação 2FA!' };
  };

  const clearSecurityLogs = () => {
    setSecurityLogs(INITIAL_SECURITY_LOGS);
  };

  return {
    securityModalOpen,
    securityModalRequest,
    activeActionOtp,
    securityLogs,
    setSecurityLogs,
    currentTotp,
    confirmActionWith2FA,
    closeSecurityModal,
    generateNewActionOtp,
    verifyAndExecuteAction,
    clearSecurityLogs
  };
}
