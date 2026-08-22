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
  Sparkles,
  UserCheck,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { UserRole } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Tela de Login e Autenticação Segura para o Painel PMS Administrativo
export const AdminLogin: React.FC = () => {
  const { hotelConfig, setCurrentView, login, users } = useHotel();
  
  const [email, setEmail] = useState('admin@itajubaflat.com.br');
  const [senha, setSenha] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const result = login(email, senha);
      setLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || 'Erro ao realizar login.');
      }
    }, 400);
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setSenha(userPass);
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const result = login(userEmail, userPass);
      setLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || 'Erro ao realizar login.');
      }
    }, 300);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador Geral', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'gerente':
        return { label: 'Gerência Operacional', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'recepcionista':
        return { label: 'Recepção / Front Desk', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'governanca':
        return { label: 'Governança & Limpeza', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'financeiro':
        return { label: 'Gestão Financeira', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: role, color: 'bg-stone-500/20 text-stone-300 border-stone-500/40' };
    }
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
          onClick={() => setCurrentView('landing')}
          className="px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-2 border border-stone-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site do Estabelecimento</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Ambiente Seguro PMS • Conexão Criptografada SSL</span>
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
            
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 ${theme.textAccentClass} text-xs font-bold uppercase tracking-wider border border-stone-700`}>
              <Lock className="w-3 h-3" />
              <span>Acesso Administrativo (PMS)</span>
            </div>
            
            <p className="text-xs text-stone-400 max-w-xs mx-auto pt-1">
              Informe suas credenciais corporativas para gerenciar reservas, quartos, hóspedes e faturamento.
            </p>
          </div>

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider mb-1.5 text-[11px]">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@itajubaflat.com.br"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-stone-100 text-xs sm:text-sm focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinição de senha corporativa, selecione um dos perfis rápidos abaixo ou contate o Administrador Geral.')}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
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
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acessar Painel PMS</span>
                </>
              )}
            </button>
          </form>

          {/* Seção de Acesso Rápido para Demonstração Interativa */}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold flex items-center gap-1.5 text-stone-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Acesso Rápido por Perfil (1 Clique):
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {users.filter(u => u.ativo).map((u) => {
                const badge = getRoleBadge(u.tipo_usuario);
                const isSelected = email === u.email;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.email, u.senha || 'admin')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={u.nome}
                        className="w-7 h-7 rounded-full object-cover border border-stone-700"
                      />
                      <div>
                        <strong className="block text-xs text-stone-200 leading-tight">
                          {u.nome}
                        </strong>
                        <span className="text-[10px] text-stone-400">
                          {u.cargo_titulo || u.email}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Rodapé da tela de login */}
      <footer className="p-4 text-center text-[11px] text-stone-500 z-10">
        <span>© 2026 {hotelConfig.nome} • Todos os direitos reservados • Sistema PMS com Controle de Acesso Baseado em Funções (RBAC)</span>
      </footer>

    </div>
  );
};
