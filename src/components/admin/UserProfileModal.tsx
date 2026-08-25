import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  X, 
  User, 
  Key, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Check, 
  Camera, 
  Lock, 
  Briefcase, 
  Clock 
} from 'lucide-react';
import { formatDateBR } from '../../utils/availability';
import { AvatarUploader } from '../common/media/AvatarUploader';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, changeUserPassword } = useHotel();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile form state
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [telefone, setTelefone] = useState(currentUser?.telefone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [cargoTitulo, setCargoTitulo] = useState(currentUser?.cargo_titulo || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form state
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      nome,
      telefone,
      avatar,
      cargo_titulo: cargoTitulo,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
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
      setTimeout(() => setPasswordSuccess(false), 3000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500 bg-stone-800">
              <img src={currentUser.avatar} alt={currentUser.nome} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">{currentUser.nome}</h3>
              <span className="text-xs text-amber-400 capitalize font-medium">
                {currentUser.cargo_titulo || currentUser.tipo_usuario}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dados Pessoais</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Segurança & Senha</span>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Dados atualizados com sucesso!</span>
                </div>
              )}

              {/* Seletor de Avatar com Upload e Corte Interativo */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <AvatarUploader
                  label="Foto de Perfil / Avatar"
                  value={avatar}
                  onChange={(newAvatar) => setAvatar(newAvatar)}
                  presets={avatarsPresets}
                  size="md"
                  shape="circle"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-xs font-mono cursor-not-allowed"
                    title="O e-mail principal só pode ser alterado na Gestão de Usuários pelo Administrador."
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Cargo / Função Exibida</label>
                <input
                  type="text"
                  value={cargoTitulo}
                  onChange={(e) => setCargoTitulo(e.target.value)}
                  placeholder="Ex: Recepcionista Líder"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              {/* Informações da conta */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-stone-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Nível de Acesso:</span>
                  <span className="font-bold uppercase text-stone-900">{currentUser.tipo_usuario}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Data de Cadastro:</span>
                  <span className="font-mono text-stone-900">{currentUser.created_at ? formatDateBR(currentUser.created_at.split('T')[0]) : '-'}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Senha alterada com sucesso!</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 font-bold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Senha Atual</label>
                <input
                  type="password"
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Informe sua senha atual..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 4 caracteres..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Atualizar Minha Senha
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
