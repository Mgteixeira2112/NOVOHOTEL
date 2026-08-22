import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Smartphone, 
  MessageSquare, 
  Mail, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Fingerprint,
  Info
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { TwoFactorMethod } from '../../types';

export const SecurityVerificationModal: React.FC = () => {
  const {
    securityModalOpen,
    securityModalRequest,
    closeSecurityModal,
    verifyAndExecuteAction,
    currentUser,
    currentTotp,
    activeActionOtp,
    generateNewActionOtp,
  } = useHotel();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [method, setMethod] = useState<TwoFactorMethod>('authenticator');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or request changes
  useEffect(() => {
    if (securityModalOpen) {
      setPassword('');
      setCode2FA('');
      setErrorMessage(null);
      setSuccessFeedback(null);
      setIsSubmitting(false);
    }
  }, [securityModalOpen, securityModalRequest]);

  if (!securityModalOpen || !securityModalRequest) {
    return null;
  }

  const handleFillDemoPassword = () => {
    setPassword(currentUser.senha || 'admin');
    setErrorMessage(null);
  };

  const handleFillDemoCode = (code: string) => {
    setCode2FA(code);
    setErrorMessage(null);
  };

  const handleResendOtp = () => {
    const newOtp = generateNewActionOtp();
    setCode2FA('');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Por favor, informe sua senha de confirmação.');
      return;
    }

    if (!code2FA.trim()) {
      setErrorMessage('Por favor, insira o código de dois fatores de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);

    // Pequeno atraso de processamento para feedback visual de autenticação criptográfica
    setTimeout(() => {
      const result = verifyAndExecuteAction(password, code2FA, method);
      setIsSubmitting(false);

      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        setSuccessFeedback(result.message);
      }
    }, 400);
  };

  return (
    <div 
      id="security-verification-modal-overlay" 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div 
        id="security-verification-modal-card" 
        className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Top Accent Warning Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Segurança Reforçada (2FA)
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {securityModalRequest.category}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Autorização de Operação Segura
              </h2>
            </div>
          </div>

          <button
            id="btn-close-security-modal"
            type="button"
            onClick={closeSecurityModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cancelar e fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Operation Details Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Operação Solicitada:
              </span>
              <span className="text-slate-400">
                Operador: <strong className="text-slate-200">{currentUser.nome}</strong> ({currentUser.cargo_titulo || currentUser.tipo_usuario})
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {securityModalRequest.title}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {securityModalRequest.description}
            </p>
            {securityModalRequest.details && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded">
                <strong>Detalhes técnicos:</strong> {securityModalRequest.details}
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Falha na Verificação de Segurança:</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Form */}
          <form id="form-security-2fa-verify" onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Senha Operacional */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  1. Senha Operacional do Usuário Conectado:
                </label>
                <button
                  type="button"
                  onClick={handleFillDemoPassword}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Usar senha atual ({currentUser.senha || 'admin'})
                </button>
              </div>
              <div className="relative">
                <input
                  id="security-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Digite sua senha de acesso"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step 2: Método 2FA Selector */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                2. Segundo Fator de Autenticação (2FA):
              </label>

              {/* Method Switcher Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="tab-2fa-authenticator"
                  onClick={() => {
                    setMethod('authenticator');
                    setErrorMessage(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'authenticator'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mb-1" />
                  <span>Authenticator</span>
                </button>

                <button
                  type="button"
                  id="tab-2fa-whatsapp"
                  onClick={() => {
                    setMethod('whatsapp');
                    setErrorMessage(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'whatsapp'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mb-1" />
                  <span>WhatsApp OTP</span>
                </button>

                <button
                  type="button"
                  id="tab-2fa-email"
                  onClick={() => {
                    setMethod('email');
                    setErrorMessage(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === 'email'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-4 h-4 mb-1" />
                  <span>E-mail Corporativo</span>
                </button>
              </div>

              {/* Dynamic 2FA Helper Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2">
                {method === 'authenticator' && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        Token TOTP Ativo (Google Auth / Authy):
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Atualiza a cada 30 segundos ({currentTotp.secondsRemaining}s restantes)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {currentTotp.token}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFillDemoCode(currentTotp.token)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/40 transition-colors"
                      >
                        Inserir
                      </button>
                    </div>
                  </div>
                )}

                {method === 'whatsapp' && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        Código enviado para {currentUser.telefone || '(35) 99876-1001'}:
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Token transacional de uso único
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {activeActionOtp || '492810'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFillDemoCode(activeActionOtp || '492810')}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/40 transition-colors"
                      >
                        Inserir
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        title="Gerar novo código"
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {method === 'email' && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        Código enviado para {currentUser.email}:
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Token de validação para a operação
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {activeActionOtp || '839102'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFillDemoCode(activeActionOtp || '839102')}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/40 transition-colors"
                      >
                        Inserir
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2FA Input */}
              <div className="pt-1">
                <input
                  id="security-input-2fa-code"
                  type="text"
                  maxLength={6}
                  value={code2FA}
                  onChange={(e) => {
                    setCode2FA(e.target.value.replace(/\D/g, ''));
                    setErrorMessage(null);
                  }}
                  placeholder="0 0 0 0 0 0"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-[0.4em] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>
            </div>

            {/* Audit Trail Info */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Trilha de Auditoria:</strong> Esta confirmação será registrada no Histórico de Segurança do PMS com carimbo de tempo, IP e identificação do operador.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
              <button
                id="btn-security-cancel-action"
                type="button"
                onClick={closeSecurityModal}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar Operação
              </button>

              <button
                id="btn-security-confirm-action"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando Criptografia 2FA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Executar com 2FA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
