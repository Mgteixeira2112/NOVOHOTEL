import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Key, User, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { formatDateBR } from '../../utils/availability';
import { AvatarUploader } from '../common/media/AvatarUploader';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, changeUserPassword } = useHotel();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [telefone, setTelefone] = useState(currentUser?.telefone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || currentUser?.avatar_url || '');
  const [cargoTitulo, setCargoTitulo] = useState(currentUser?.cargo_titulo || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setNome(currentUser.nome || '');
    setTelefone(currentUser.telefone || '');
    setAvatar(currentUser.avatar || currentUser.avatar_url || '');
    setCargoTitulo(currentUser.cargo_titulo || '');
    setProfileSaved(false);
    setPasswordError(null);
    setPasswordSuccess(false);
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser || typeof document === 'undefined') return null;

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    updateUserProfile({ nome, telefone, avatar, cargo_titulo: cargoTitulo });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSavePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (currentUser.senha && senhaAtual !== currentUser.senha) {
      setPasswordError('A senha atual informada está incorreta.');
      return;
    }
    if (novaSenha.length < 4) {
      setPasswordError('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    const success = changeUserPassword(currentUser.id, novaSenha);
    if (success) {
      setPasswordSuccess(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      window.setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError('Não foi possível alterar a senha.');
    }
  };

  const avatarsPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  ];

  const modal = (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto bg-stone-950/80 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Meu Perfil e Senha"
          className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
          onMouseDown={event => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-800 bg-stone-900 p-4 text-stone-100 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 flex-none overflow-hidden rounded-full border-2 border-amber-500 bg-stone-800">
                {avatar ? <img src={avatar} alt={currentUser.nome} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs font-black">{currentUser.nome?.slice(0, 1).toUpperCase()}</div>}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-stone-100">{currentUser.nome}</h3>
                <span className="block truncate text-xs font-medium capitalize text-amber-400">{currentUser.cargo_titulo || currentUser.tipo_usuario}</span>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar perfil" className="ml-3 grid h-10 w-10 flex-none place-items-center rounded-xl text-stone-300 transition hover:bg-stone-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex shrink-0 overflow-x-auto border-b border-stone-200 bg-stone-50 px-2 text-xs font-bold sm:px-5">
            <button type="button" onClick={() => setActiveTab('profile')} className={`flex whitespace-nowrap border-b-2 px-3 py-3 transition sm:px-4 ${activeTab === 'profile' ? 'border-amber-600 text-amber-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
              <User className="mr-2 h-4 w-4" /> Dados Pessoais
            </button>
            <button type="button" onClick={() => setActiveTab('security')} className={`flex whitespace-nowrap border-b-2 px-3 py-3 transition sm:px-4 ${activeTab === 'security' ? 'border-amber-600 text-amber-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
              <Key className="mr-2 h-4 w-4" /> Segurança & Senha
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 text-xs sm:p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileSaved && <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 font-bold text-emerald-800"><Check className="h-4 w-4" /> Dados atualizados com sucesso!</div>}

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <AvatarUploader label="Foto de Perfil / Avatar" value={avatar} onChange={setAvatar} presets={avatarsPresets} size="md" shape="circle" />
                </div>

                <div>
                  <label className="mb-1 block font-bold uppercase text-stone-700">Nome Completo</label>
                  <input type="text" required value={nome} onChange={event => setNome(event.target.value)} className="w-full rounded-xl border border-stone-200 p-2.5 text-sm font-semibold" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold uppercase text-stone-700">E-mail Corporativo</label>
                    <input type="email" disabled value={currentUser.email} className="w-full cursor-not-allowed rounded-xl border border-stone-200 bg-stone-100 p-2.5 font-mono text-xs text-stone-500" title="O e-mail principal só pode ser alterado na Gestão de Usuários pelo Administrador." />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold uppercase text-stone-700">Telefone / WhatsApp</label>
                    <input type="text" value={telefone} onChange={event => setTelefone(event.target.value)} placeholder="(35) 99999-9999" className="w-full rounded-xl border border-stone-200 p-2.5 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold uppercase text-stone-700">Cargo / Função Exibida</label>
                  <input type="text" value={cargoTitulo} onChange={event => setCargoTitulo(event.target.value)} placeholder="Ex: Recepcionista Líder" className="w-full rounded-xl border border-stone-200 p-2.5 text-xs" />
                </div>

                <div className="space-y-1.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-stone-600">
                  <div className="flex items-center justify-between gap-3 text-[11px]"><span>Nível de Acesso:</span><span className="font-bold uppercase text-stone-900">{currentUser.tipo_usuario}</span></div>
                  <div className="flex items-center justify-between gap-3 text-[11px]"><span>Data de Cadastro:</span><span className="font-mono text-stone-900">{currentUser.created_at ? formatDateBR(currentUser.created_at.split('T')[0]) : '-'}</span></div>
                </div>

                <div className="flex justify-end pt-3"><button type="submit" className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 shadow-md transition hover:bg-amber-400">Salvar Alterações</button></div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                {passwordSuccess && <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 font-bold text-emerald-800"><Check className="h-4 w-4" /> Senha alterada com sucesso!</div>}
                {passwordError && <div className="rounded-xl bg-rose-100 p-3 font-bold text-rose-800">{passwordError}</div>}

                <div><label className="mb-1 block font-bold uppercase text-stone-700">Senha Atual</label><input type="password" required value={senhaAtual} onChange={event => setSenhaAtual(event.target.value)} placeholder="Informe sua senha atual..." className="w-full rounded-xl border border-stone-200 p-2.5 text-xs" /></div>
                <div><label className="mb-1 block font-bold uppercase text-stone-700">Nova Senha</label><input type="password" required value={novaSenha} onChange={event => setNovaSenha(event.target.value)} placeholder="Mínimo 4 caracteres..." className="w-full rounded-xl border border-stone-200 p-2.5 text-xs" /></div>
                <div><label className="mb-1 block font-bold uppercase text-stone-700">Confirmar Nova Senha</label><input type="password" required value={confirmarSenha} onChange={event => setConfirmarSenha(event.target.value)} placeholder="Repita a nova senha..." className="w-full rounded-xl border border-stone-200 p-2.5 text-xs" /></div>
                <div className="flex justify-end pt-3"><button type="submit" className="rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-bold text-amber-300 shadow-md transition hover:bg-stone-800">Atualizar Minha Senha</button></div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
