import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Palette, ShieldCheck, Sparkles, User, Users } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { supabase } from '../../lib/supabase';
import { Usuario } from '../../types';
import { UserProfileModal } from '../admin/UserProfileModal';

const roleLabel = (role?: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'gerente': return 'Gerência';
    case 'recepcionista': return 'Recepção';
    case 'governanca': return 'Governança';
    case 'financeiro': return 'Financeiro';
    case 'pdv_only': return 'PDV';
    case 'cozinha_only': return 'Cozinha';
    case 'tablet_quarto': return 'Tablet do quarto';
    default: return role || 'Usuário';
  }
};

/**
 * Menu de sessão compartilhado pelos Workspaces.
 *
 * A identidade autenticada é resolvida pela sessão real do Supabase Auth.
 * A troca de usuário altera somente o contexto operacional de teste e nunca
 * substitui a sessão JWT do administrador que iniciou o login.
 */
export const WorkspaceUserMenu: React.FC = () => {
  const {
    currentUser,
    users,
    setCurrentUser,
    setAdminActiveTab,
  } = useHotel();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authenticatedPrincipal, setAuthenticatedPrincipal] = useState<Usuario | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const resolvePrincipal = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const email = data.user?.email?.trim().toLowerCase();
      if (!email) {
        setAuthenticatedPrincipal(current => current || (currentUser?.tipo_usuario === 'admin' ? currentUser : null));
        return;
      }
      const principal = users.find(user => user.email?.trim().toLowerCase() === email) || null;
      setAuthenticatedPrincipal(principal);
    };

    void resolvePrincipal();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void resolvePrincipal());
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [users, currentUser]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [open]);

  const principalIsAdmin = authenticatedPrincipal?.tipo_usuario === 'admin';
  const activeUsers = useMemo(() => users.filter(user => user.ativo), [users]);
  const isTestingAnotherUser = principalIsAdmin && authenticatedPrincipal?.id !== currentUser?.id;

  const switchOperationalUser = (userId: string) => {
    if (!principalIsAdmin) return;
    const nextUser = activeUsers.find(user => user.id === userId);
    if (!nextUser) return;
    setCurrentUser(nextUser);
    setOpen(false);
  };

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-left text-slate-700 transition hover:bg-slate-50"
          aria-haspopup="menu"
          aria-expanded={open}
          title="Menu do usuário"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {currentUser?.avatar || currentUser?.avatar_url ? (
              <img src={currentUser.avatar || currentUser.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-slate-500">
                {currentUser?.nome?.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'US'}
              </div>
            )}
          </div>
          <div className="hidden min-w-0 sm:block">
            <strong className="block max-w-36 truncate text-[11px] leading-tight text-slate-800">{currentUser?.nome}</strong>
            <span className="block max-w-36 truncate text-[9px] font-semibold text-slate-500">{roleLabel(currentUser?.tipo_usuario)}</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {currentUser?.avatar || currentUser?.avatar_url ? (
                    <img src={currentUser.avatar || currentUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-500">
                      {currentUser?.nome?.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'US'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">{currentUser?.nome}</strong>
                  <span className="block truncate text-[11px] text-slate-500">{currentUser?.email}</span>
                  <span className="mt-1 inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">
                    {roleLabel(currentUser?.tipo_usuario)}
                  </span>
                </div>
              </div>
              {isTestingAnotherUser && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] leading-relaxed text-amber-900">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span><strong>Modo de teste.</strong> A sessão autenticada continua pertencendo a {authenticatedPrincipal?.nome}; somente o contexto operacional está simulando {currentUser?.nome}.</span>
                </div>
              )}
            </div>

            <div className="p-2">
              <button type="button" onClick={() => { setOpen(false); setProfileOpen(true); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <User className="h-4 w-4 text-blue-600" /> Meu Perfil & Senha
              </button>
              {principalIsAdmin && (
                <button type="button" onClick={() => { setOpen(false); setAdminActiveTab('users'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Users className="h-4 w-4 text-blue-600" /> Gestão de Usuários & Permissões
                </button>
              )}
              <button type="button" onClick={() => { setOpen(false); setAdminActiveTab('settings'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Palette className="h-4 w-4 text-blue-600" /> Identidade Visual & Cores
              </button>
            </div>

            {principalIsAdmin && (
              <div className="border-t border-slate-100 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Trocar usuário para testes
                </div>
                <select
                  value={currentUser?.id || ''}
                  onChange={event => switchOperationalUser(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                >
                  {activeUsers.map(user => <option key={user.id} value={user.id}>{user.nome} ({user.tipo_usuario})</option>)}
                </select>
                <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Disponível somente para uma sessão autenticada como ADMIN. A troca não altera o usuário do Supabase Auth.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};
