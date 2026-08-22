import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Usuario, UserRole } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  KeyRound, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  Clock, 
  Lock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  X,
  RefreshCw,
  Building,
  UserCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { formatDateBR } from '../../utils/availability';

// Módulo Completo de Controle de Usuários e Gestão de Permissões (RBAC)
export const UsersModule: React.FC = () => {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus, 
    changeUserPassword 
  } = useHotel();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<Usuario | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<Usuario | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado do formulário de usuário (Criar / Editar)
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formTipo, setFormTipo] = useState<UserRole>('recepcionista');
  const [formCargoTitulo, setFormCargoTitulo] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Estado do modal de reset de senha
  const [newPassword, setNewPassword] = useState('');

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const avatarsPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  ];

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormNome('');
    setFormEmail('');
    setFormSenha('hotel123');
    setFormTipo('recepcionista');
    setFormCargoTitulo('');
    setFormTelefone('');
    setFormAvatar(avatarsPresets[Math.floor(Math.random() * avatarsPresets.length)]);
    setFormAtivo(true);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (user: Usuario) => {
    setEditingUser(user);
    setFormNome(user.nome);
    setFormEmail(user.email);
    setFormSenha(user.senha || '');
    setFormTipo(user.tipo_usuario);
    setFormCargoTitulo(user.cargo_titulo || '');
    setFormTelefone(user.telefone || '');
    setFormAvatar(user.avatar || avatarsPresets[0]);
    setFormAtivo(user.ativo);
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome.trim() || !formEmail.trim()) {
      showNotification('Nome e e-mail são obrigatórios.', true);
      return;
    }

    // Validação de e-mail duplicado
    const emailExist = users.find(
      (u) => u.email.toLowerCase() === formEmail.toLowerCase().trim() && (!editingUser || u.id !== editingUser.id)
    );
    if (emailExist) {
      showNotification('Já existe outro colaborador cadastrado com este e-mail.', true);
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        nome: formNome,
        email: formEmail.toLowerCase().trim(),
        tipo_usuario: formTipo,
        cargo_titulo: formCargoTitulo || undefined,
        telefone: formTelefone || undefined,
        avatar: formAvatar,
        ativo: formAtivo,
        ...(formSenha ? { senha: formSenha } : {}),
      });
      showNotification(`Usuário "${formNome}" atualizado com sucesso.`);
    } else {
      addUser({
        nome: formNome,
        email: formEmail.toLowerCase().trim(),
        senha: formSenha || 'hotel123',
        tipo_usuario: formTipo,
        cargo_titulo: formCargoTitulo || undefined,
        telefone: formTelefone || undefined,
        avatar: formAvatar,
        ativo: formAtivo,
      });
      showNotification(`Novo usuário "${formNome}" cadastrado com sucesso.`);
    }

    setIsCreateModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    const res = deleteUser(deleteConfirmUser.id);
    if (res.success) {
      showNotification(`Usuário "${deleteConfirmUser.nome}" removido do sistema.`);
    } else {
      showNotification(res.message || 'Erro ao remover usuário.', true);
    }
    setDeleteConfirmUser(null);
  };

  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (!newPassword || newPassword.length < 3) {
      showNotification('A senha deve ter no mínimo 3 caracteres.', true);
      return;
    }

    changeUserPassword(passwordResetUser.id, newPassword);
    showNotification(`Senha de "${passwordResetUser.nome}" redefinida com sucesso.`);
    setPasswordResetUser(null);
    setNewPassword('');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormSenha(pass);
  };

  // Filtragem de Usuários
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.telefone && u.telefone.includes(searchTerm)) ||
      (u.cargo_titulo && u.cargo_titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole = roleFilter === 'todos' || u.tipo_usuario === roleFilter;
    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativos' && u.ativo) ||
      (statusFilter === 'inativos' && !u.ativo);

    return matchSearch && matchRole && matchStatus;
  });

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'gerente':
        return { label: 'Gerente', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'recepcionista':
        return { label: 'Recepcionista', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'governanca':
        return { label: 'Governança', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'financeiro':
        return { label: 'Financeiro', bg: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
      default:
        return { label: role, bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  // Contadores
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.ativo).length;
  const adminUsers = users.filter((u) => u.tipo_usuario === 'admin').length;

  return (
    <div className="space-y-6">
      
      {/* Alertas de Notificação */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cabeçalho do Módulo & Estatísticas */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-serif-luxury text-xl font-bold text-stone-900">
                Gestão de Usuários & Controle de Acessos
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Cadastre colaboradores, defina cargos operacionais, gerencie credenciais e audite permissões de acesso ao PMS.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Info className="w-4 h-4 text-stone-500" />
              <span>Matriz de Permissões</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Cartões de Indicadores Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Total de Usuários</span>
            <span className="text-xl font-bold text-stone-900">{totalUsers}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Contas Ativas</span>
            <span className="text-xl font-bold text-emerald-900">{activeUsers}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Administradores</span>
            <span className="text-xl font-bold text-amber-900">{adminUsers}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Seu Nível Atual</span>
            <span className="text-sm font-bold text-stone-900 capitalize block truncate">{currentUser?.cargo_titulo || currentUser?.tipo_usuario}</span>
          </div>
        </div>
      </div>

      {/* Matriz Visual de Permissões por Cargo (Expansível) */}
      {showPermissionsMatrix && (
        <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif-luxury text-base font-bold text-stone-100">
                Matriz de Controle de Acesso Baseado em Funções (RBAC)
              </h3>
            </div>
            <button
              onClick={() => setShowPermissionsMatrix(false)}
              className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 pr-4">Módulo / Recurso</th>
                  <th className="py-2.5 px-3 text-center text-amber-400">Admin</th>
                  <th className="py-2.5 px-3 text-center text-blue-400">Gerente</th>
                  <th className="py-2.5 px-3 text-center text-emerald-400">Recepção</th>
                  <th className="py-2.5 px-3 text-center text-purple-400">Governança</th>
                  <th className="py-2.5 px-3 text-center text-cyan-400">Financeiro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                <tr>
                  <td className="py-2.5 font-medium">Dashboard & Indicadores de Ocupação</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Operacional</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Ocupação</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Faturamento</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Mapa de Reservas (Criar, Editar, Cancelar)</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Somente Leitura</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Consulta</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Front Desk: Check-in, Check-out & Consumos</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Status Limpeza</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Quartos, Tarifas & Bloqueios de Manutenção</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Consulta</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Alterar Status</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">CRM de Hóspedes & Histórico</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Módulo Financeiro, Relatórios & DRE</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Restrito</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Restrito</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Automações de WhatsApp / E-mail & Fechaduras</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Total</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Enviar Mensagens</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Gestão de Usuários, Senhas & Permissões</td>
                  <td className="py-2.5 text-center text-emerald-400">✓ Exclusivo</td>
                  <td className="py-2.5 text-center text-stone-600">✗ Consulta</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                  <td className="py-2.5 text-center text-stone-600">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuário por nome, e-mail, telefone ou cargo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Perfil:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none cursor-pointer bg-white"
          >
            <option value="todos">Todos os Cargos</option>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="recepcionista">Recepcionista</option>
            <option value="governanca">Governança</option>
            <option value="financeiro">Financeiro</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none cursor-pointer bg-white"
          >
            <option value="todos">Todos Status</option>
            <option value="ativos">Apenas Ativos</option>
            <option value="inativos">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Lista / Tabela de Usuários */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900">
            Colaboradores Cadastrados ({filteredUsers.length})
          </h3>
          <span className="text-[11px] text-stone-500">
            Sessão Atual: <strong className="text-stone-800">{currentUser?.nome}</strong> ({currentUser?.tipo_usuario})
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-medium">Nenhum colaborador encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredUsers.map((user) => {
              const roleStyle = getRoleStyle(user.tipo_usuario);
              const isSelf = user.id === currentUser?.id;

              return (
                <div 
                  key={user.id} 
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    !user.ativo ? 'bg-stone-50/70 opacity-70' : 'hover:bg-stone-50/40'
                  }`}
                >
                  
                  {/* Informações Principais do Usuário */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={user.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-stone-200 shadow-sm"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          user.ativo ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                        title={user.ativo ? 'Usuário Ativo' : 'Usuário Inativo'}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-stone-900">{user.nome}</strong>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black tracking-wide">
                            VOCÊ (EM SESSÃO)
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${roleStyle.bg}`}>
                          {roleStyle.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{user.email}</span>
                        </span>

                        {user.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>{user.telefone}</span>
                          </span>
                        )}

                        {user.cargo_titulo && (
                          <span className="text-stone-600 font-medium italic">
                            • {user.cargo_titulo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadados de Acesso e Ações */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 text-xs">
                    
                    {/* Último Acesso */}
                    <div className="text-right hidden lg:block text-stone-500">
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Último Acesso</span>
                      <span className="text-[11px] font-mono">
                        {user.ultimo_acesso ? formatDateBR(user.ultimo_acesso.split('T')[0]) : 'Nunca acessou'}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* Alternar Status Ativo/Inativo */}
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={isSelf}
                        className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          user.ativo
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            : 'text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-300'
                        } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isSelf ? 'Você não pode desativar seu próprio usuário.' : user.ativo ? 'Desativar acesso' : 'Ativar acesso'}
                      >
                        {user.ativo ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-stone-400" />}
                        <span className="hidden sm:inline">{user.ativo ? 'Ativo' : 'Inativo'}</span>
                      </button>

                      {/* Redefinir Senha */}
                      <button
                        onClick={() => {
                          setPasswordResetUser(user);
                          setNewPassword('');
                        }}
                        className="p-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                        title="Redefinir senha de acesso"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                      </button>

                      {/* Editar Dados */}
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                        title="Editar cadastro do usuário"
                      >
                        <Edit className="w-4 h-4 text-stone-700" />
                      </button>

                      {/* Excluir Usuário */}
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        disabled={isSelf}
                        className={`p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer ${
                          isSelf ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={isSelf ? 'Não é possível excluir seu próprio usuário.' : 'Excluir usuário'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Criar / Editar Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">
                    {editingUser ? 'Editar Colaborador' : 'Novo Usuário & Colaborador'}
                  </h3>
                  <span className="text-xs text-stone-400">
                    {editingUser ? `Atualizando informações de ${editingUser.nome}` : 'Cadastre um novo usuário no PMS com controle de acesso.'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* Seletor de Avatar */}
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-2">Foto / Avatar</label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {avatarsPresets.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormAvatar(presetUrl)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                        formAvatar === presetUrl ? 'border-amber-600 scale-110 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="URL direta de uma foto online..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Alice Guimarães"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nome@itajubaflat.com.br"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Perfil / Cargo *</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-bold bg-stone-50 cursor-pointer"
                  >
                    <option value="admin">Administrador Geral (Acesso Total)</option>
                    <option value="gerente">Gerente Operacional</option>
                    <option value="recepcionista">Recepcionista / Front Desk</option>
                    <option value="governanca">Governança & Limpeza</option>
                    <option value="financeiro">Gestão Financeira</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Título do Cargo / Turno</label>
                  <input
                    type="text"
                    value={formCargoTitulo}
                    onChange={(e) => setFormCargoTitulo(e.target.value)}
                    placeholder="Ex: Recepcionista Noturno"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700 uppercase">
                      {editingUser ? 'Alterar Senha (Opcional)' : 'Senha Inicial *'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-amber-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Gerar Senha</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      value={formSenha}
                      onChange={(e) => setFormSenha(e.target.value)}
                      placeholder={editingUser ? 'Deixe em branco para manter a atual' : '••••••••'}
                      className="w-full p-2.5 pr-9 rounded-xl border border-stone-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="p-1 text-stone-400 hover:text-stone-600 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status da Conta */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <strong className="block text-xs text-stone-800 font-bold">Status do Usuário</strong>
                  <span className="text-[11px] text-stone-500">Usuários inativos não conseguem fazer login no sistema.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-stone-800">{formAtivo ? 'Conta Ativa' : 'Conta Inativa'}</span>
                </label>
              </div>

              {/* Resumo de Permissões do Perfil Selecionado */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Resumo do Acesso Concedido:</span>
                </div>
                <p>
                  {formTipo === 'admin' && 'Acesso irrestrito a todos os módulos, configurações críticas, relatórios de DRE, fechaduras e gestão de usuários.'}
                  {formTipo === 'gerente' && 'Acesso total às operações hoteleiras, cancelamentos, mapa de reservas, check-in/out, fluxo de caixa e automações.'}
                  {formTipo === 'recepcionista' && 'Acesso operacional: Mapa de reservas, criação e check-in/out de hóspedes, envio de mensagens e lançamentos de consumos.'}
                  {formTipo === 'governanca' && 'Acesso focado no painel de quartos, status de limpeza, vistorias e bloqueios temporários para manutenção.'}
                  {formTipo === 'financeiro' && 'Acesso aos relatórios de faturamento, conciliação de pagamentos Pix/Cartão, fluxo de caixa e faturamento corporativo.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-stone-100">Redefinir Senha de Acesso</h3>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="p-6 space-y-4 text-xs">
              <p className="text-stone-600 leading-relaxed">
                Você está redefinindo a senha do colaborador <strong className="text-stone-900">{passwordResetUser.nome}</strong> ({passwordResetUser.email}).
              </p>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Nova Senha</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Informe a nova senha..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md cursor-pointer"
                >
                  Confirmar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Usuário */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-base text-stone-900">Excluir Colaborador?</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tem certeza que deseja remover o usuário <strong className="text-stone-800">{deleteConfirmUser.nome}</strong> ({deleteConfirmUser.email})? Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Sim, Excluir Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
