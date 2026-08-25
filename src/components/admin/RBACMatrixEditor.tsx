import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  RBACMatrixConfig, 
  RBACResourceRule, 
  RBACRolePermission, 
  UserRole, 
  RBACAccessLevel,
  AdminTab 
} from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  X, 
  Sliders, 
  Lock, 
  Unlock, 
  Eye, 
  Search, 
  Info, 
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getTheme } from '../../utils/themeHelper';

const ROLE_INFO: Record<UserRole, { label: string; badgeColor: string; headerColor: string; description: string }> = {
  admin: {
    label: 'Administrador',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    headerColor: 'text-amber-400',
    description: 'Acesso mestre e irrestrito a todas as funções e auditorias'
  },
  gerente: {
    label: 'Gerente Geral',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    headerColor: 'text-blue-400',
    description: 'Gestão operacional, tarifária, relatórios e supervisão da equipe'
  },
  recepcionista: {
    label: 'Recepcionista',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    headerColor: 'text-emerald-400',
    description: 'Operações de front desk, check-in, check-out, reservas e consumos'
  },
  governanca: {
    label: 'Governança',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    headerColor: 'text-purple-400',
    description: 'Status de limpeza, vistorias de quartos e reposição de frigobar'
  },
  financeiro: {
    label: 'Financeiro',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    headerColor: 'text-cyan-400',
    description: 'Fluxo de caixa, conciliação PIX, faturamento, DRE e custos'
  }
};

const ACCESS_LEVEL_LABELS: Record<RBACAccessLevel, { label: string; defaultBadge: string; description: string }> = {
  total: {
    label: 'Acesso Total',
    defaultBadge: '✓ Total',
    description: 'Permissão irrestrita para visualizar, criar, editar e excluir neste módulo'
  },
  readonly: {
    label: 'Somente Leitura / Consulta',
    defaultBadge: '✗ Consulta',
    description: 'Apenas visualização de relatórios e registros, sem permissão de alteração'
  },
  custom: {
    label: 'Personalizado / Operacional',
    defaultBadge: '✓ Operacional',
    description: 'Ações operacionais específicas configuradas para este cargo'
  },
  exclusive: {
    label: 'Exclusivo do Cargo',
    defaultBadge: '✓ Exclusivo',
    description: 'Acesso restrito e reservado exclusivamente a este nível de autoridade'
  },
  none: {
    label: 'Sem Acesso (Bloqueado)',
    defaultBadge: '✗ Bloqueado',
    description: 'Acesso totalmente negado ao módulo ou funcionalidade'
  }
};

export const RBACMatrixEditor: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    hotelConfig, 
    rbacMatrix, 
    updateRBACPermission, 
    updateRBACMatrix, 
    addRBACResource, 
    editRBACResource, 
    deleteRBACResource, 
    resetRBACMatrix, 
    currentUser,
    confirmActionWith2FA
  } = useHotel();

  const theme = getTheme(hotelConfig?.tema_cor);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoleHighlight, setFilterRoleHighlight] = useState<UserRole | 'all'>('all');

  // Modais de Edição
  const [editingPermission, setEditingPermission] = useState<{
    resourceId: string;
    resourceName: string;
    role: UserRole;
    permission: RBACRolePermission;
  } | null>(null);

  const [resourceModal, setResourceModal] = useState<{
    isOpen: boolean;
    isEditing: boolean;
    resourceId?: string;
    moduleName: string;
    description: string;
    adminTab?: string;
  }>({
    isOpen: false,
    isEditing: false,
    moduleName: '',
    description: '',
    adminTab: ''
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const rolesList: UserRole[] = ['admin', 'gerente', 'recepcionista', 'governanca', 'financeiro'];

  // Recursos filtrados
  const filteredResources = (rbacMatrix?.resources || []).filter((res) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      res.moduleName.toLowerCase().includes(term) ||
      res.description.toLowerCase().includes(term) ||
      (res.adminTab && res.adminTab.toLowerCase().includes(term))
    );
  });

  // Ação de Toggle Rápido de Permissão
  const handleQuickToggle = (resource: RBACResourceRule, role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();

    // Administrador tem acesso total protegido por padrão
    if (role === 'admin') {
      showToast('O perfil Administrador mantém acesso mestre por segurança do sistema.', 'error');
      return;
    }

    const current = resource.permissions[role] || { granted: false, level: 'none', customLabel: '✗' };
    const newGranted = !current.granted;

    let newLevel: RBACAccessLevel = newGranted ? 'total' : 'none';
    let newLabel = newGranted ? '✓ Total' : '✗';

    // Inteligência contextual por cargo
    if (newGranted) {
      if (role === 'governanca' && (resource.id === 'rooms' || resource.id === 'frontdesk')) {
        newLevel = 'custom';
        newLabel = '✓ Status Limpeza';
      } else if (role === 'financeiro' && resource.id === 'financial') {
        newLevel = 'total';
        newLabel = '✓ Total';
      } else if (role === 'recepcionista' && resource.id === 'automation') {
        newLevel = 'custom';
        newLabel = '✓ Enviar Mensagens';
      }
    }

    updateRBACPermission(resource.id, role, {
      granted: newGranted,
      level: newLevel,
      customLabel: newLabel
    });

    showToast(
      `Permissão de "${ROLE_INFO[role].label}" para "${resource.moduleName}" alterada para ${newGranted ? 'PERMITIDO' : 'BLOQUEADO'}.`
    );
  };

  // Abrir Modal de Edição Detalhada da Permissão
  const handleOpenPermissionEditor = (resource: RBACResourceRule, role: UserRole) => {
    const current = resource.permissions[role] || {
      granted: false,
      level: 'none',
      customLabel: '✗',
      description: ''
    };

    setEditingPermission({
      resourceId: resource.id,
      resourceName: resource.moduleName,
      role,
      permission: { ...current }
    });
  };

  // Salvar Permissão Customizada
  const handleSavePermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermission) return;

    updateRBACPermission(editingPermission.resourceId, editingPermission.role, editingPermission.permission);
    showToast(`Regra de acesso de "${ROLE_INFO[editingPermission.role].label}" salva com sucesso.`);
    setEditingPermission(null);
  };

  // Criar ou Salvar Recurso/Módulo
  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceModal.moduleName.trim()) {
      showToast('O nome do módulo/recurso é obrigatório.', 'error');
      return;
    }

    if (resourceModal.isEditing && resourceModal.resourceId) {
      editRBACResource(resourceModal.resourceId, {
        moduleName: resourceModal.moduleName.trim(),
        description: resourceModal.description.trim(),
        adminTab: (resourceModal.adminTab as AdminTab) || undefined
      });
      showToast(`Módulo "${resourceModal.moduleName}" atualizado.`);
    } else {
      addRBACResource({
        moduleName: resourceModal.moduleName.trim(),
        description: resourceModal.description.trim() || 'Regra personalizada de controle de acesso',
        adminTab: (resourceModal.adminTab as AdminTab) || undefined,
        permissions: {
          admin: { granted: true, level: 'total', customLabel: '✓ Total', description: 'Acesso total de administrador' },
          gerente: { granted: true, level: 'total', customLabel: '✓ Total', description: 'Supervisão do módulo' },
          recepcionista: { granted: false, level: 'none', customLabel: '✗', description: 'Sem acesso' },
          governanca: { granted: false, level: 'none', customLabel: '✗', description: 'Sem acesso' },
          financeiro: { granted: false, level: 'none', customLabel: '✗', description: 'Sem acesso' }
        }
      });
      showToast(`Novo módulo "${resourceModal.moduleName}" adicionado à matriz.`);
    }

    setResourceModal({ isOpen: false, isEditing: false, moduleName: '', description: '', adminTab: '' });
  };

  // Excluir Recurso Customizado
  const handleDeleteResource = (resource: RBACResourceRule) => {
    if (!resource.isCustom) {
      showToast('Módulos nativos do sistema não podem ser excluídos, apenas customizados.', 'error');
      return;
    }

    if (confirm(`Tem certeza que deseja remover o módulo "${resource.moduleName}" da matriz de permissões?`)) {
      deleteRBACResource(resource.id);
      showToast(`Módulo "${resource.moduleName}" removido.`);
    }
  };

  // Restaurar Padrão com Confirmação 2FA
  const handleResetWith2FA = () => {
    confirmActionWith2FA({
      actionTitle: 'Restaurar Matriz de Permissões (RBAC)',
      actionDescription: 'Esta ação irá redefinir todas as permissões de acesso aos módulos para o padrão recomendado de fábrica da rede hoteleira.',
      severity: 'high',
      category: 'Segurança',
      onConfirm: () => {
        resetRBACMatrix();
        showToast('Matriz de controle de acesso restaurada para os padrões originais com sucesso.');
      }
    });
  };

  // Importar JSON
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.resources || !Array.isArray(parsed.resources)) {
        throw new Error('O JSON informado não possui o formato válido de matriz RBAC com array de "resources".');
      }
      updateRBACMatrix({
        version: (parsed.version || 1) + 1,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: parsed.resources
      });
      setIsExportModalOpen(false);
      setImportJsonText('');
      setImportError(null);
      showToast('Matriz RBAC importada e aplicada com sucesso!');
    } catch (err: any) {
      setImportError(err.message || 'Erro ao processar arquivo JSON.');
    }
  };

  // Exportar JSON para download
  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rbacMatrix, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rbac_matrix_hotel_centenario_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Download do arquivo de configuração RBAC iniciado.');
  };

  // Ações Rápidas por Perfil
  const handleApplyRoleBulkAction = (role: UserRole, action: 'grant_all' | 'revoke_all' | 'readonly') => {
    if (role === 'admin') {
      showToast('O Administrador sempre possui acesso pleno.', 'error');
      return;
    }

    const updatedResources = rbacMatrix.resources.map(res => {
      const current = res.permissions[role] || { granted: false, level: 'none', customLabel: '✗' };
      if (action === 'grant_all') {
        return {
          ...res,
          permissions: {
            ...res.permissions,
            [role]: { ...current, granted: true, level: 'total' as RBACAccessLevel, customLabel: '✓ Total' }
          }
        };
      } else if (action === 'revoke_all') {
        return {
          ...res,
          permissions: {
            ...res.permissions,
            [role]: { ...current, granted: false, level: 'none' as RBACAccessLevel, customLabel: '✗' }
          }
        };
      } else {
        return {
          ...res,
          permissions: {
            ...res.permissions,
            [role]: { ...current, granted: true, level: 'readonly' as RBACAccessLevel, customLabel: '✓ Somente Leitura' }
          }
        };
      }
    });

    updateRBACMatrix({
      ...rbacMatrix,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.nome || 'Administrador',
      resources: updatedResources
    });

    showToast(`Ação em lote aplicada com sucesso para o cargo ${ROLE_INFO[role].label}.`);
  };

  return (
    <div className="bg-stone-900 text-stone-100 p-6 md:p-8 rounded-3xl border border-stone-800 shadow-2xl space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-4 ${
          notification.type === 'error' 
            ? 'bg-red-950 text-red-200 border-red-800' 
            : 'bg-emerald-950 text-emerald-200 border-emerald-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Cabeçalho do Editor RBAC */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Matriz de Controle de Acesso Baseado em Funções (RBAC)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Customizável em Tempo Real
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Defina e personalize os níveis de autorização, permissões e restrições por cargo para cada módulo do sistema PMS.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Global */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setResourceModal({ isOpen: true, isEditing: false, moduleName: '', description: '', adminTab: '' })}
            className={`px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Módulo / Recurso</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Importar ou Exportar Configuração JSON"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Backup / JSON</span>
          </button>

          <button
            onClick={handleResetWith2FA}
            className="px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-red-950/60 text-stone-300 hover:text-red-300 border border-stone-700 hover:border-red-800/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Restaurar Configurações Padrão de Segurança"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400 hover:text-red-400" />
            <span>Restaurar Padrão</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
              title="Fechar Painel RBAC"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Status da Matriz e Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Barra de Busca de Módulos */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por módulo, funcionalidade ou descrição..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-800/80 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Metadados de Auditoria */}
        <div className="bg-stone-800/60 border border-stone-700/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] text-stone-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-stone-200">Última Revisão:</span>
          </div>
          <span className="text-stone-400 truncate max-w-[150px] font-mono">
            {rbacMatrix?.updatedBy || 'Administrador'}
          </span>
        </div>
      </div>

      {/* Filtro Rápido e Ações em Lote por Cargo */}
      <div className="bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800/90 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Configurações Rápidas por Cargo:</span>
          </span>

          <span className="text-[10px] text-stone-400 italic">
            Dica: Clique diretamente sobre qualquer célula da tabela para alternar acesso rápido ou no botão de editar para regras avançadas.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {rolesList.map((role) => {
            const info = ROLE_INFO[role];
            return (
              <div 
                key={role}
                className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 space-y-1.5 flex flex-col justify-between hover:border-stone-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${info.headerColor}`}>
                    {info.label}
                  </span>
                  {role === 'admin' && (
                    <span className="text-[9px] font-bold bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                      Mestre
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">
                  {info.description}
                </p>

                {role !== 'admin' && (
                  <div className="flex items-center gap-1 pt-1 border-t border-stone-800/80">
                    <button
                      onClick={() => handleApplyRoleBulkAction(role, 'grant_all')}
                      className="flex-1 py-1 px-1 rounded bg-stone-800 hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 text-[9px] font-semibold text-center transition cursor-pointer"
                      title="Conceder acesso total a todos os módulos"
                    >
                      Liberar Tudo
                    </button>
                    <button
                      onClick={() => handleApplyRoleBulkAction(role, 'readonly')}
                      className="flex-1 py-1 px-1 rounded bg-stone-800 hover:bg-blue-950 text-stone-300 hover:text-blue-300 text-[9px] font-semibold text-center transition cursor-pointer"
                      title="Permitir apenas leitura nos módulos"
                    >
                      Leitura
                    </button>
                    <button
                      onClick={() => handleApplyRoleBulkAction(role, 'revoke_all')}
                      className="flex-1 py-1 px-1 rounded bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-300 text-[9px] font-semibold text-center transition cursor-pointer"
                      title="Bloquear todos os acessos"
                    >
                      Bloquear
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela Interativa e Editável de Matriz de Permissões */}
      <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-950/40">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 w-72">Módulo / Recurso do Sistema</th>
              <th className="py-3 px-3 text-center text-amber-400 w-36">Admin</th>
              <th className="py-3 px-3 text-center text-blue-400 w-36">Gerente</th>
              <th className="py-3 px-3 text-center text-emerald-400 w-36">Recepção</th>
              <th className="py-3 px-3 text-center text-purple-400 w-36">Governança</th>
              <th className="py-3 px-3 text-center text-cyan-400 w-36">Financeiro</th>
              <th className="py-3 px-3 text-center w-16">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/70 text-stone-300">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400">
                  Nenhum módulo encontrado com o termo pesquisado.
                </td>
              </tr>
            ) : (
              filteredResources.map((resource) => (
                <tr 
                  key={resource.id}
                  className="hover:bg-stone-800/40 transition group"
                >
                  {/* Nome e Descrição do Módulo */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-100 text-xs">
                          {resource.moduleName}
                        </span>
                        {resource.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            Customizado
                          </span>
                        )}
                        {resource.adminTab && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-stone-800 text-stone-400">
                            aba: {resource.adminTab}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1 leading-snug">
                        {resource.description}
                      </p>
                    </div>
                  </td>

                  {/* Células de Permissão por Cargo */}
                  {rolesList.map((role) => {
                    const perm = resource.permissions[role] || { granted: false, level: 'none', customLabel: '✗' };
                    const isGranted = perm.granted;
                    const isMaster = role === 'admin';

                    return (
                      <td 
                        key={role}
                        onClick={(e) => handleQuickToggle(resource, role, e)}
                        className={`py-2 px-2 text-center transition cursor-pointer select-none relative group/cell ${
                          isMaster ? 'cursor-default' : 'hover:bg-stone-800/80'
                        }`}
                        title={`${isGranted ? 'Acesso Permitido' : 'Acesso Bloqueado'}: ${perm.description || perm.customLabel || 'Clique para alternar ou duplo clique para editar'}`}
                      >
                        <div className="flex items-center justify-center">
                          <div className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition flex items-center justify-between gap-1 w-full max-w-[120px] ${
                            isGranted
                              ? perm.level === 'total' || perm.level === 'exclusive'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:border-emerald-500'
                                : 'bg-blue-950/60 text-blue-300 border-blue-800/80 hover:border-blue-500'
                              : 'bg-stone-900/60 text-stone-500 border-stone-800/80 hover:text-stone-300 hover:border-stone-700'
                          }`}>
                            <span className="truncate">
                              {perm.customLabel || (isGranted ? '✓ Total' : '✗ Bloqueado')}
                            </span>

                            {!isMaster && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPermissionEditor(resource, role);
                                }}
                                className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Configurar Regra Avançada"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Ações do Módulo */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setResourceModal({
                          isOpen: true,
                          isEditing: true,
                          resourceId: resource.id,
                          moduleName: resource.moduleName,
                          description: resource.description,
                          adminTab: resource.adminTab || ''
                        })}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                        title="Editar Informações do Módulo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {resource.isCustom ? (
                        <button
                          onClick={() => handleDeleteResource(resource)}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title="Excluir Módulo Customizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="p-1 text-stone-600" title="Módulo nativo protegido">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição Detalhada de Permissão de Cargo */}
      {editingPermission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury text-base font-bold text-stone-100">
                  Personalizar Regra de Acesso
                </h3>
              </div>
              <button
                onClick={() => setEditingPermission(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Cargo / Função:</span>
                <span className={`font-bold capitalize ${ROLE_INFO[editingPermission.role].headerColor}`}>
                  {ROLE_INFO[editingPermission.role].label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Módulo do Sistema:</span>
                <span className="font-semibold text-stone-200">
                  {editingPermission.resourceName}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePermission} className="space-y-4 text-xs">
              {/* Status do Acesso (Concedido / Negado) */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">Status do Acesso:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPermission({
                      ...editingPermission,
                      permission: {
                        ...editingPermission.permission,
                        granted: true,
                        level: editingPermission.permission.level === 'none' ? 'total' : editingPermission.permission.level,
                        customLabel: editingPermission.permission.customLabel.startsWith('✗') ? '✓ Total' : editingPermission.permission.customLabel
                      }
                    })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      editingPermission.permission.granted
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Acesso Permitido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPermission({
                      ...editingPermission,
                      permission: {
                        ...editingPermission.permission,
                        granted: false,
                        level: 'none',
                        customLabel: '✗ Bloqueado'
                      }
                    })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      !editingPermission.permission.granted
                        ? 'bg-red-950 text-red-200 border-red-700'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                    <span>Acesso Negado</span>
                  </button>
                </div>
              </div>

              {/* Nível de Acesso */}
              {editingPermission.permission.granted && (
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block">Nível de Autorização:</label>
                  <select
                    value={editingPermission.permission.level}
                    onChange={(e) => {
                      const newLvl = e.target.value as RBACAccessLevel;
                      setEditingPermission({
                        ...editingPermission,
                        permission: {
                          ...editingPermission.permission,
                          level: newLvl,
                          customLabel: ACCESS_LEVEL_LABELS[newLvl].defaultBadge
                        }
                      });
                    }}
                    className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="total">Acesso Total (Criar, Editar, Excluir, Visualizar)</option>
                    <option value="readonly">Somente Leitura / Consulta (Visualização apenas)</option>
                    <option value="custom">Personalizado / Operacional (Ações específicas)</option>
                    <option value="exclusive">Exclusivo (Acesso restrito de alta autoridade)</option>
                  </select>
                  <p className="text-[11px] text-stone-400">
                    {ACCESS_LEVEL_LABELS[editingPermission.permission.level].description}
                  </p>
                </div>
              )}

              {/* Rótulo Visual Customizado */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">
                  Rótulo Visual da Matriz (Texto exibido na tabela):
                </label>
                <input
                  type="text"
                  value={editingPermission.permission.customLabel}
                  onChange={(e) => setEditingPermission({
                    ...editingPermission,
                    permission: {
                      ...editingPermission.permission,
                      customLabel: e.target.value
                    }
                  })}
                  placeholder="Ex: ✓ Total, ✓ Status Limpeza, ✗ Somente Leitura..."
                  className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Descrição / Instrução da Regra */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">
                  Descrição e Orientações Operacionais para este Perfil:
                </label>
                <textarea
                  value={editingPermission.permission.description || ''}
                  onChange={(e) => setEditingPermission({
                    ...editingPermission,
                    permission: {
                      ...editingPermission.permission,
                      description: e.target.value
                    }
                  })}
                  rows={2}
                  placeholder="Instruções sobre o que o colaborador com este cargo pode fazer neste módulo..."
                  className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingPermission(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md transition cursor-pointer`}
                >
                  Salvar Permissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Módulo de Recurso */}
      {resourceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury text-base font-bold text-stone-100">
                  {resourceModal.isEditing ? 'Editar Módulo do Sistema' : 'Novo Módulo / Recurso RBAC'}
                </h3>
              </div>
              <button
                onClick={() => setResourceModal({ isOpen: false, isEditing: false, moduleName: '', description: '', adminTab: '' })}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">Nome do Módulo / Recurso *:</label>
                <input
                  type="text"
                  required
                  value={resourceModal.moduleName}
                  onChange={(e) => setResourceModal({ ...resourceModal, moduleName: e.target.value })}
                  placeholder="Ex: Bar & Bistrô Executivo, Câmeras de Monitoramento..."
                  className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">Descrição da Funcionalidade:</label>
                <textarea
                  value={resourceModal.description}
                  onChange={(e) => setResourceModal({ ...resourceModal, description: e.target.value })}
                  rows={3}
                  placeholder="Descreva as responsabilidades, ferramentas e escopo deste módulo..."
                  className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block">Aba PMS Vinculada (Opcional):</label>
                <select
                  value={resourceModal.adminTab}
                  onChange={(e) => setResourceModal({ ...resourceModal, adminTab: e.target.value })}
                  className="w-full p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhuma aba (Recurso Independente)</option>
                  <option value="dashboard">Dashboard Geral</option>
                  <option value="kanban">Operação Kanban em Tempo Real</option>
                  <option value="reservations">Mapa de Reservas</option>
                  <option value="checkin_out">Desk Check-in / Out</option>
                  <option value="rooms">Quartos & Tarifas</option>
                  <option value="guests">Hóspedes & CRM</option>
                  <option value="financial">Financeiro & PIX</option>
                  <option value="frigobar">Frigobar & Estoque</option>
                  <option value="automation">Automações & Fechaduras</option>
                  <option value="users">Equipe & Acessos</option>
                  <option value="settings">Personalização & Configurações</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setResourceModal({ isOpen: false, isEditing: false, moduleName: '', description: '', adminTab: '' })}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {resourceModal.isEditing ? 'Atualizar Módulo' : 'Adicionar à Matriz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Backup / Importação / Exportação JSON */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif-luxury text-base font-bold text-stone-100">
                  Backup & Transferência de Matriz RBAC
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setImportError(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Exportar JSON */}
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-200">Exportar Configuração Atual:</span>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo JSON</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-400">
                Salve a configuração atual em um arquivo JSON para restaurar em outro ambiente ou manter cópia de segurança.
              </p>
            </div>

            {/* Importar JSON */}
            <div className="space-y-2.5 text-xs">
              <label className="font-bold text-stone-200 block">
                Restaurar / Importar Matriz via Código JSON:
              </label>
              <textarea
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError(null);
                }}
                rows={6}
                placeholder="Cole aqui o conteúdo do JSON da matriz de controle de acesso..."
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl font-mono text-[11px] text-stone-200 focus:outline-none focus:border-amber-500"
              />

              {importError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  importJsonText.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Aplicar e Importar Matriz RBAC</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
