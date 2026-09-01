import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Smartphone,
  MessageSquare,
  RefreshCw,
  Fingerprint
} from 'lucide-react';
import { TwoFactorMethod } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Tela de Login e Autenticação Segura em 2 Fatores para o Painel PMS Administrativo
export const AdminLogin: React.FC = () => {
  const { 
    hotelConfig, 
    setCurrentView, 
    loginValidatePassword, 
    complete2FALogin, 
    cancel2FALogin,
    pendingLoginUser,
    pendingLoginOtp,
    currentTotp
  } = useHotel();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados da Etapa 2 (2FA)
  const [step2FA, setStep2FA] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [method2FA, setMethod2FA] = useState<TwoFactorMethod>('authenticator');

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  // Etapa 1: Validação de E-mail e Senha
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const result = await loginValidatePassword(email, senha);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.message || 'E-mail ou senha incorretos.');
    } else {
      setStep2FA(true);
      setCode2FA('');
    }
  };

  // Etapa 2: Validação do Código 2FA
  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code2FA || code2FA.length < 6) {
      setErrorMsg('Por favor, insira o código de verificação de 6 dígitos.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = complete2FALogin(code2FA, method2FA);
      setLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || 'Código de dois fatores inválido.');
      }
    }, 350);
  };

  const handleBackToStep1 = () => {
    cancel2FALogin();
    setStep2FA(false);
    setErrorMsg(null);
    setCode2FA('');
  };

  const handleFillCode = (code: string) => {
    setCode2FA(code);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between text-stone-100 relative overflow-hidden font-sans">
      
      {/* Elementos visuais de fundo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Barra superior com link para voltar ao site */}
      <header className="p-4 sm:p-6 flex items-center justify-between z-10">
        <button
          id="btn-back-to-landing"
          onClick={() => setCurrentView('landing')}
          className="px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 border border-stone-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site do Estabelecimento</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Ambiente Seguro PMS • Autenticação Obrigatória em 2 Fatores</span>
        </div>
      </header>

      {/* Caixa central de autenticação */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-stone-900/95 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
          
          {/* Cabeçalho da caixa de login */}
          <div className="text-center space-y-2">
            {hotelConfig.logo_url ? (
              <img
                src={hotelConfig.logo_url}
                alt={hotelConfig.nome}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-stone-700 shadow-md mx-auto mb-3"
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl ${theme.badgeClass} flex items-center justify-center font-black shadow-lg border border-stone-700 mx-auto mb-3`}>
                <span className={`${fontClass} text-2xl font-black`}>
                  {getInitials(hotelConfig.nome)}
                </span>
              </div>
            )}
            
            <h1 className={`${fontClass} text-2xl font-bold text-stone-100 tracking-wide`}>
              {hotelConfig.nome}
            </h1>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-amber-400 text-xs font-bold uppercase tracking-wider border border-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{step2FA ? 'Etapa 2: Confirmação 2FA' : 'Painel de Controle PMS'}</span>
            </div>
          </div>

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ETAPA 1: E-MAIL E SENHA */}
          {!step2FA ? (
            <form id="form-login-step1" onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <p className="text-xs text-stone-400 text-center">
                Digite suas credenciais de acesso corporativo para prosseguir ao sistema.
              </p>

              <div>
                <label className="block font-bold text-stone-300 uppercase tracking-wider mb-1.5 text-[11px]">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@hotel.com.br"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-stone-100 text-xs sm:text-sm focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                    Senha de Acesso
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-stone-100 text-xs sm:text-sm focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-stone-400 hover:text-stone-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-400 text-xs">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-950"
                  />
                  <span>Lembrar meu acesso neste dispositivo</span>
                </label>
              </div>

              <button
                id="btn-login-next-step"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Validando credenciais...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ETAPA 2: CONFIRMAÇÃO EM 2 FATORES */
            <form id="form-login-step2" onSubmit={handle2FASubmit} className="space-y-4 text-xs">
              {/* Usuário Identificado */}
              {pendingLoginUser && (
                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={pendingLoginUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={pendingLoginUser.nome}
                      className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                    />
                    <div>
                      <strong className="block text-xs text-stone-100">{pendingLoginUser.nome}</strong>
                      <span className="text-[10px] text-stone-400">{pendingLoginUser.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-[11px] text-amber-400 hover:underline font-medium"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* Seletor de Método 2FA */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                  Método de Segundo Fator:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod2FA('authenticator');
                      setErrorMsg(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      method2FA === 'authenticator'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1" />
                    <span>Authenticator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod2FA('whatsapp');
                      setErrorMsg(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      method2FA === 'whatsapp'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mb-1" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod2FA('email');
                      setErrorMsg(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      method2FA === 'email'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Mail className="w-4 h-4 mb-1" />
                    <span>E-mail</span>
                  </button>
                </div>

                {/* Token Box Interativo */}
                <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800 text-xs">
                  {method2FA === 'authenticator' && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-stone-300 font-medium">Token TOTP Google Authenticator:</span>
                        <span className="text-[10px] text-stone-500">Expira em {currentTotp.secondsRemaining}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-sm tracking-widest bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                          {currentTotp.token}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFillCode(currentTotp.token)}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold text-[11px] border border-amber-500/30"
                        >
                          Inserir
                        </button>
                      </div>
                    </div>
                  )}

                  {method2FA === 'whatsapp' && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-stone-300 font-medium">Token WhatsApp {pendingLoginUser?.telefone || '(35) 99876-1001'}:</span>
                        <span className="text-[10px] text-stone-500">Código de verificação SMS / Zap</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-sm tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          {pendingLoginOtp || '592810'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFillCode(pendingLoginOtp || '592810')}
                          className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded font-semibold text-[11px] border border-emerald-500/30"
                        >
                          Inserir
                        </button>
                      </div>
                    </div>
                  )}

                  {method2FA === 'email' && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-stone-300 font-medium">Token enviado ao e-mail:</span>
                        <span className="text-[10px] text-stone-500">{pendingLoginUser?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 text-sm tracking-widest bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                          {pendingLoginOtp || '738192'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFillCode(pendingLoginOtp || '738192')}
                          className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded font-semibold text-[11px] border border-cyan-500/30"
                        >
                          Inserir
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input do Código 2FA */}
                <div>
                  <label className="block font-bold text-stone-300 uppercase tracking-wider mb-1.5 text-[11px]">
                    Digite o Código de 6 Dígitos
                  </label>
                  <input
                    id="login-input-2fa-code"
                    type="text"
                    maxLength={6}
                    required
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full py-3 bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl text-center text-xl font-mono tracking-[0.3em] font-bold text-white placeholder-stone-600 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="w-1/3 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
                >
                  Voltar
                </button>

                <button
                  id="btn-login-submit-2fa"
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <span>Validando 2FA...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Validar e Entrar no PMS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Rodapé da tela de login */}
      <footer className="p-4 text-center text-[11px] text-stone-500 z-10">
        <span>© 2026 {hotelConfig.nome} • Todos os direitos reservados • Sistema PMS com Autenticação em 2 Fatores (2FA)</span>
      </footer>

    </div>
  );
};
