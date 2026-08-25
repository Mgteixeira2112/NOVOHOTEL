import { Usuario, UserRole } from '../types';
import { KanbanBoard, KanbanCard } from '../types/kanban';
import { SoundNotificationService } from './soundHelper';

/**
 * Identifica o departamento principal do usuário com base no tipo de usuário e cargo
 */
export function getUserDepartment(user?: Usuario | null): string {
  if (!user) return 'recepcao';
  
  const role = user.tipo_usuario;
  const cargo = (user.cargo_titulo || '').toLowerCase();

  if (cargo.includes('manuten') || cargo.includes('engenhar') || cargo.includes('técnico') || cargo.includes('tecnico')) {
    return 'manutencao';
  }
  if (cargo.includes('almoxarif') || cargo.includes('estoqu') || cargo.includes('frigobar') || cargo.includes('compras') || cargo.includes('suprimentos')) {
    return 'almoxarifado';
  }
  if (cargo.includes('cozinh') || cargo.includes('chef') || cargo.includes('restaurante') || cargo.includes('room service') || cargo.includes('garçom') || cargo.includes('garcom')) {
    return 'cozinha';
  }
  if (cargo.includes('governan') || cargo.includes('limpeza') || cargo.includes('camareir')) {
    return 'governanca';
  }
  if (cargo.includes('recep') || cargo.includes('front desk') || cargo.includes('concierge')) {
    return 'recepcao';
  }
  if (cargo.includes('financ')) {
    return 'financeiro';
  }

  // Fallback baseado no tipo_usuario
  if (role === 'governanca') return 'governanca';
  if (role === 'recepcionista') return 'recepcao';
  if (role === 'financeiro') return 'financeiro';
  if ((role as string) === 'almoxarifado') return 'almoxarifado';
  if (role === 'gerente') return 'recepcao';
  return 'recepcao';
}

/**
 * Retorna se o usuário logado possui perfil de Administrador Geral (vê tudo sem restrições)
 */
export function isUserAdmin(user?: Usuario | null): boolean {
  if (!user) return false;
  return user.tipo_usuario === 'admin';
}

/**
 * Verifica se o usuário tem permissão para visualizar o quadro/board
 */
export function canUserViewBoard(board: KanbanBoard, user?: Usuario | null): boolean {
  if (!user) return true;
  if (isUserAdmin(user)) return true;

  const userDept = getUserDepartment(user);
  
  // Se o quadro for do departamento do usuário
  if (board.department === userDept || board.id === userDept) {
    return true;
  }

  // Se a role do usuário estiver explicitamente autorizada
  if (board.allowed_roles_view && board.allowed_roles_view.includes(user.tipo_usuario)) {
    return true;
  }

  return false;
}

/**
 * Verifica se um cartão específico é visível para o usuário atual
 * - Admins visualizam tudo.
 * - Funcionários visualizam apenas tarefas direcionadas a eles diretamente OU ao seu setor.
 */
export function canUserViewCard(
  card: KanbanCard, 
  board: KanbanBoard | undefined, 
  user?: Usuario | null
): boolean {
  if (!user) return true;
  if (isUserAdmin(user)) return true;

  // 1. Tarefa direcionada DIRETAMENTE ao colaborador
  const isAssignedToUser = 
    (card.assigned_to?.id && card.assigned_to.id === user.id) ||
    (card.assigned_to?.name && user.nome && card.assigned_to.name.trim().toLowerCase() === user.nome.trim().toLowerCase());

  if (isAssignedToUser) {
    return true;
  }

  // 2. Tarefa direcionada ao SETOR / DEPARTAMENTO do colaborador
  const userDept = getUserDepartment(user);
  const boardDept = board ? (board.department || board.id) : card.board_id;

  const isCardInUserDepartment = 
    boardDept === userDept || 
    card.board_id === userDept ||
    (card.delegated_to_department && card.delegated_to_department.toLowerCase().includes(userDept));

  if (isCardInUserDepartment) {
    return true;
  }

  return false;
}

/**
 * Determina e emite o som diferenciado para o evento com base no destinatário (Pessoal, Setor, Crítico ou Geral)
 */
export function playDifferentiatedNotificationSound(
  card: KanbanCard, 
  user?: Usuario | null,
  options?: { isDelegation?: boolean; isCompletion?: boolean }
): { soundType: 'personal' | 'department' | 'urgent' | 'delegation' | 'completion' | 'general'; label: string } {
  
  if (options?.isCompletion) {
    SoundNotificationService.playSuccessSound();
    return { soundType: 'completion', label: 'Tarefa Concluída' };
  }

  if (card.priority === 'critica') {
    SoundNotificationService.playUrgentAlert();
    return { soundType: 'urgent', label: 'Alerta Crítico / Urgente' };
  }

  if (options?.isDelegation) {
    SoundNotificationService.playDelegationSound();
    return { soundType: 'delegation', label: 'Chamado Transferido entre Setores' };
  }

  if (!user) {
    SoundNotificationService.playDepartmentOrderSound();
    return { soundType: 'general', label: 'Nova Tarefa no Sistema' };
  }

  const isAssignedToMe = 
    (card.assigned_to?.id && card.assigned_to.id === user.id) ||
    (card.assigned_to?.name && user.nome && card.assigned_to.name.trim().toLowerCase() === user.nome.trim().toLowerCase());

  if (isAssignedToMe) {
    SoundNotificationService.playPersonalAssignmentSound();
    return { soundType: 'personal', label: `Direcionado Diretamente a Você (${user.nome})` };
  }

  const userDept = getUserDepartment(user);
  const isMyDepartment = 
    card.board_id === userDept || 
    (card.delegated_to_department && card.delegated_to_department.toLowerCase().includes(userDept));

  if (isMyDepartment) {
    SoundNotificationService.playDepartmentOrderSound();
    return { soundType: 'department', label: `Novo Pedido para seu Setor (${userDept.toUpperCase()})` };
  }

  // Fallback geral (ex: Admin ouvindo eventos de outros setores)
  SoundNotificationService.playDepartmentOrderSound();
  return { soundType: 'general', label: 'Novo Chamado no Hotel' };
}
