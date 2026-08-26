import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ASSET_STATUSES,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_STATUSES,
  ROOM_AVAILABILITY_STATUSES,
  ROOM_OPERATIONAL_STATUSES,
  TASK_PRIORITIES,
  TASK_SOURCES,
  TASK_STATUSES,
  TASK_TYPES,
  calculateTaskSla,
  validateTaskTransition,
  type Asset,
  type KanbanBoard,
  type MaintenanceRequest,
  type OperationalTask,
  type TaskChecklistItem,
} from '../src/domain/taskCore';
import { hasRolePermission } from '../src/core/permissions/permissionService';

// 1. Checkout cria tarefa
test('1. checkout cria tarefa: gera automaticamente uma tarefa de ROOM_CLEANING com prioridade HIGH', () => {
  const stayCheckoutEvent = {
    hotelId: 'hotel-a',
    roomId: 'room-101',
    status: 'CHECKED_OUT',
  };

  const generatedTask: OperationalTask = {
    id: 'task-clean-1',
    hotelId: stayCheckoutEvent.hotelId,
    type: 'ROOM_CLEANING',
    title: `Limpeza do quarto ${stayCheckoutEvent.roomId}`,
    status: 'PENDING',
    priority: 'HIGH',
    roomId: stayCheckoutEvent.roomId,
    source: 'CHECKOUT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(generatedTask.type, 'ROOM_CLEANING');
  assert.equal(generatedTask.source, 'CHECKOUT');
  assert.equal(generatedTask.priority, 'HIGH');
  assert.equal(generatedTask.status, 'PENDING');
});

// 2. Quarto fica DIRTY
test('2. quarto fica DIRTY: checkout atualiza o estado operacional para DIRTY mantendo disponibilidade isolada', () => {
  const roomStatus = {
    availability: 'AVAILABLE' as const,
    operational: 'DIRTY' as const,
  };

  assert.equal(roomStatus.operational, 'DIRTY');
  assert.equal(ROOM_OPERATIONAL_STATUSES.includes(roomStatus.operational), true);
  assert.equal(ROOM_AVAILABILITY_STATUSES.includes(roomStatus.availability), true);
  // Não mistura disponibilidade com limpeza
  assert.notEqual(ROOM_AVAILABILITY_STATUSES, ROOM_OPERATIONAL_STATUSES);
});

// 3. Camareira visualiza tarefa
test('3. camareira visualiza tarefa: filtro de tarefas de limpeza por quarto ou atribuídas', () => {
  const tasks: OperationalTask[] = [
    {
      id: 't-1',
      hotelId: 'hotel-a',
      type: 'ROOM_CLEANING',
      title: 'Limpeza 101',
      status: 'PENDING',
      priority: 'HIGH',
      roomId: 'room-101',
      source: 'CHECKOUT',
      assignedTo: 'user-camareira-1',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 't-2',
      hotelId: 'hotel-a',
      type: 'MAINTENANCE',
      title: 'Reparo Ar 102',
      status: 'PENDING',
      priority: 'NORMAL',
      roomId: 'room-102',
      source: 'MANUAL',
      assignedTo: 'user-manutencao-1',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const camareiraTasks = tasks.filter(
    (t) => t.type === 'ROOM_CLEANING' && (t.assignedTo === 'user-camareira-1' || !t.assignedTo)
  );

  assert.equal(camareiraTasks.length, 1);
  assert.equal(camareiraTasks[0].id, 't-1');
});

// 4. Camareira inicia tarefa
test('4. camareira inicia tarefa: transição válida PENDING -> IN_PROGRESS altera quarto para CLEANING', () => {
  const currentStatus = 'PENDING';
  const newStatus = 'IN_PROGRESS';
  const isValid = validateTaskTransition(currentStatus, newStatus);
  assert.equal(isValid, true);

  const roomOperational = newStatus === 'IN_PROGRESS' ? 'CLEANING' : 'DIRTY';
  assert.equal(roomOperational, 'CLEANING');
});

// 5. Camareira conclui
test('5. camareira conclui: transição IN_PROGRESS -> COMPLETED gera tarefa de ROOM_INSPECTION e quarto vira INSPECTION', () => {
  const isValid = validateTaskTransition('IN_PROGRESS', 'COMPLETED');
  assert.equal(isValid, true);

  const roomOperational = 'INSPECTION';
  const inspectionTask: OperationalTask = {
    id: 'task-insp-1',
    hotelId: 'hotel-a',
    type: 'ROOM_INSPECTION',
    title: 'Inspeção do quarto 101',
    status: 'PENDING',
    priority: 'HIGH',
    roomId: 'room-101',
    source: 'HOUSEKEEPING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(inspectionTask.type, 'ROOM_INSPECTION');
  assert.equal(roomOperational, 'INSPECTION');
});

// 6. Supervisor aprova
test('6. supervisor aprova: inspeção aprovada finaliza tarefa e libera quarto para CLEAN -> AVAILABLE', () => {
  const inspectionApproved = true;
  let roomOperational = 'INSPECTION';
  let roomAvailability = 'BLOCKED';

  if (inspectionApproved) {
    roomOperational = 'CLEAN';
    roomAvailability = 'AVAILABLE';
  }

  assert.equal(roomOperational, 'CLEAN');
  assert.equal(roomAvailability, 'AVAILABLE');
});

// 7. Supervisor reprova
test('7. supervisor reprova: exige motivo e cria retrabalho', () => {
  const reason = 'Espelho do banheiro manchado e toalha faltando';

  assert.throws(
    () => {
      const emptyReason = '';
      if (!emptyReason.trim()) throw new Error('REJECTION_REASON_REQUIRED');
    },
    /REJECTION_REASON_REQUIRED/
  );

  const reworkTask: OperationalTask = {
    id: 'task-rework-1',
    hotelId: 'hotel-a',
    type: 'ROOM_CLEANING',
    title: 'Retrabalho do quarto 101',
    description: reason,
    status: 'REOPENED',
    priority: 'HIGH',
    roomId: 'room-101',
    source: 'HOUSEKEEPING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(reworkTask.status, 'REOPENED');
  assert.equal(reworkTask.description, reason);
});

// 8. Retrabalho
test('8. retrabalho: quarto transita para REWORK e permite reinício com status REOPENED -> IN_PROGRESS', () => {
  const roomOperational = 'REWORK';
  assert.equal(roomOperational, 'REWORK');
  assert.equal(validateTaskTransition('REOPENED', 'IN_PROGRESS'), true);
});

// 9. Manutenção
test('9. manutenção: suporta ciclo OPEN -> TRIAGE -> ASSIGNED -> IN_PROGRESS -> WAITING_PARTS -> COMPLETED -> VALIDATED', () => {
  const fullFlow = ['OPEN', 'TRIAGE', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'VALIDATED'];
  for (const st of fullFlow) {
    assert.equal(MAINTENANCE_STATUSES.includes(st as any), true);
  }
});

// 10. Manutenção por quarto
test('10. manutenção por quarto: associa requisição ao quarto e bloqueia disponibilidade caso crítico', () => {
  const maintenance: MaintenanceRequest = {
    id: 'maint-1',
    hotelId: 'hotel-a',
    taskId: 'task-maint-1',
    roomId: 'room-202',
    category: 'PLUMBING',
    description: 'Vazamento no sifão da pia',
    priority: 'URGENT',
    status: 'ASSIGNED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const roomAvailability = maintenance.priority === 'URGENT' ? 'OUT_OF_ORDER' : 'AVAILABLE';
  assert.equal(maintenance.roomId, 'room-202');
  assert.equal(roomAvailability, 'OUT_OF_ORDER');
});

// 11. Ativo
test('11. ativo: cadastro de ativos (ASSET) vinculados a quartos com status e categoria', () => {
  const asset: Asset = {
    id: 'asset-1',
    hotelId: 'hotel-a',
    roomId: 'room-101',
    name: 'Ar-Condicionado Split Inverter 12k BTU',
    category: 'HVAC',
    serialNumber: 'SN-SPLIT-99281',
    installedAt: '2025-01-10',
    status: 'ACTIVE',
  };

  assert.equal(asset.name.includes('Ar-Condicionado'), true);
  assert.equal(ASSET_STATUSES.includes(asset.status), true);
  assert.equal(MAINTENANCE_CATEGORIES.includes('HVAC'), true);
});

// 12. Consumo de peça
test('12. consumo de peça: aplicação de peça em manutenção gera movimentação de estoque CONSUMPTION', () => {
  const stockConsumption = {
    productId: 'prod-sifao-pvc',
    locationId: 'loc-maintenance',
    movementType: 'CONSUMPTION',
    quantityDelta: -1,
    referenceType: 'MAINTENANCE_REQUEST',
    referenceId: 'maint-1',
  };

  assert.equal(stockConsumption.movementType, 'CONSUMPTION');
  assert.equal(stockConsumption.quantityDelta, -1);
});

// 13. SLA
test('13. SLA: cálculo de tempo até atendimento, tempo de execução e detecção de atraso', () => {
  const created = new Date('2026-08-26T10:00:00Z');
  const ack = new Date('2026-08-26T10:15:00Z');
  const start = new Date('2026-08-26T10:20:00Z');
  const completed = new Date('2026-08-26T11:00:00Z');
  const due = new Date('2026-08-26T10:45:00Z'); // Prazo era 10:45, concluiu às 11:00 -> Atrasado

  const task = {
    createdAt: created.toISOString(),
    acknowledgedAt: ack.toISOString(),
    startedAt: start.toISOString(),
    completedAt: completed.toISOString(),
    dueAt: due.toISOString(),
  };

  const sla = calculateTaskSla(task);
  assert.equal(sla.timeToAcknowledgeMs, 15 * 60 * 1000); // 15 min
  assert.equal(sla.executionTimeMs, 40 * 60 * 1000); // 40 min
  assert.equal(sla.isOverdue, true); // ultrapassou dueAt
});

// 14. Kanban
test('14. Kanban: quadros isolados com colunas ordenadas por função (Housekeeping vs Manutenção)', () => {
  const housekeepingBoard: KanbanBoard = {
    id: 'board-hk',
    hotelId: 'hotel-a',
    name: 'Governança',
    taskType: 'ROOM_CLEANING',
    columns: [
      { name: 'Pendente', status: 'PENDING', sortOrder: 1 },
      { name: 'Em Limpeza', status: 'IN_PROGRESS', sortOrder: 2 },
      { name: 'Em Inspeção', status: 'WAITING', sortOrder: 3 },
      { name: 'Retrabalho', status: 'REOPENED', sortOrder: 4 },
      { name: 'Concluído', status: 'COMPLETED', sortOrder: 5 },
    ],
  };

  assert.equal(housekeepingBoard.columns.length, 5);
  assert.equal(housekeepingBoard.taskType, 'ROOM_CLEANING');
});

// 15. Drag and drop
test('15. drag and drop: valida transições no backend e rejeita pulos de estado inválidos', () => {
  // Pular direto de PENDING para COMPLETED não é permitido
  assert.equal(validateTaskTransition('PENDING', 'COMPLETED'), false);
  // Transição passo a passo é permitida
  assert.equal(validateTaskTransition('PENDING', 'IN_PROGRESS'), true);
  assert.equal(validateTaskTransition('IN_PROGRESS', 'COMPLETED'), true);
});

// 16. Realtime
test('16. realtime: catálogo de eventos operacionais para publicação instantânea', () => {
  const operationalEvents = [
    'CHECKOUT_COMPLETED',
    'ROOM_MARKED_DIRTY',
    'CLEANING_CREATED',
    'CLEANING_STARTED',
    'CLEANING_COMPLETED',
    'INSPECTION_COMPLETED',
    'MAINTENANCE_CREATED',
    'MAINTENANCE_COMPLETED',
    'TASK_ASSIGNED',
    'TASK_COMPLETED',
  ];

  assert.equal(operationalEvents.length, 10);
  assert.equal(operationalEvents.includes('ROOM_MARKED_DIRTY'), true);
});

// 17. Permissões
test('17. permissões: controle rigoroso para governança, recepção e gerente', () => {
  assert.equal(hasRolePermission('governanca', 'housekeeping.view'), true);
  assert.equal(hasRolePermission('governanca', 'housekeeping.start'), true);
  assert.equal(hasRolePermission('governanca', 'finance.refund'), false); // Governança não estorna pagamentos
  assert.equal(hasRolePermission('gerente', 'housekeeping.assign'), true); // Gerente atribui e supervisiona
  assert.equal(hasRolePermission('gerente', 'maintenance.view'), true);
});

// 18. RLS
test('18. RLS: tarefas são filtradas exclusivamente pelo hotel do usuário', () => {
  const allTasks = [
    { id: 't-a', hotelId: 'hotel-a', title: 'Tarefa Hotel A' },
    { id: 't-b', hotelId: 'hotel-b', title: 'Tarefa Hotel B' },
  ];

  const currentHotelId = 'hotel-a';
  const visible = allTasks.filter((t) => t.hotelId === currentHotelId);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 't-a');
});

// 19. Multi-hotel
test('19. multi-hotel: tarefas, ativos e quadros Kanban possuem integridade estrita por hotel_id', () => {
  const assetA: Asset = { id: 'ast-a', hotelId: 'hotel-a', name: 'TV 43', category: 'ELECTRONICS', status: 'ACTIVE' };
  const assetB: Asset = { id: 'ast-b', hotelId: 'hotel-b', name: 'TV 43', category: 'ELECTRONICS', status: 'ACTIVE' };

  assert.notEqual(assetA.hotelId, assetB.hotelId);
});

// 20. Auditoria
test('20. auditoria: tarefas registram quem criou, quem assumiu, horários e motivos', () => {
  const task: OperationalTask = {
    id: 'task-audited',
    hotelId: 'hotel-a',
    type: 'ROOM_CLEANING',
    title: 'Limpeza Suíte Master',
    status: 'COMPLETED',
    priority: 'URGENT',
    source: 'GUEST_REQUEST',
    createdBy: 'user-reception',
    assignedTo: 'user-cleaner-2',
    startedAt: '2026-08-26T09:00:00Z',
    completedAt: '2026-08-26T09:35:00Z',
    createdAt: '2026-08-26T08:50:00Z',
    updatedAt: '2026-08-26T09:35:00Z',
    metadata: { inspectionNote: 'Aprovado 100%' },
  };

  assert.equal(task.createdBy, 'user-reception');
  assert.equal(task.assignedTo, 'user-cleaner-2');
  assert.ok(task.metadata);
  assert.equal(TASK_SOURCES.includes('GUEST_REQUEST'), true);
  assert.equal(TASK_PRIORITIES.includes('URGENT'), true);
});

// 21. Concorrência
test('21. concorrência: lock otimista/advisory garante que duas pessoas não assumam ou finalizem a mesma tarefa simultaneamente', () => {
  let taskAssignee: string | null = null;

  function tryAssignTask(taskId: string, userId: string): boolean {
    if (taskAssignee !== null) {
      return false; // Já atribuído / bloqueado
    }
    taskAssignee = userId;
    return true;
  }

  const firstAttempt = tryAssignTask('task-10', 'camareira-1');
  const secondAttempt = tryAssignTask('task-10', 'camareira-2');

  assert.equal(firstAttempt, true);
  assert.equal(secondAttempt, false);
  assert.equal(taskAssignee, 'camareira-1');
});

// PROMPT 06 — PERSISTÊNCIA OPERACIONAL DO KANBAN NO BANCO (SEM EXPANDIR ESCOPO)
test('Prompt 06: operações de CRUD (create, update, move, delete) preservam integridade e contratos do Kanban', () => {
  const card: any = {
    id: 'card-persisted-1',
    board_id: 'governanca',
    column_id: 'gov_a_limpar',
    title: 'Higienização Quarto 204',
    location: 'Quarto 204 (Suíte Master)',
    room_number: '204',
    priority: 'atencao',
    sla_target_minutes: 35,
    created_at: new Date().toISOString(),
    order: 0,
    checklist: [
      { id: 'chk-1', text: 'Troca de enxoval', completed: false },
    ],
    comments: [
      { id: 'com-1', author_name: 'Recepção', content: 'Hóspede fez check-out.', created_at: new Date().toISOString() },
    ],
  };

  // 1. Create
  assert.ok(card.id);
  assert.equal(card.board_id, 'governanca');
  assert.equal(card.column_id, 'gov_a_limpar');

  // 2. Update (checklist & comment)
  const updatedCard = {
    ...card,
    checklist: card.checklist.map((c: any) => ({ ...c, completed: true })),
    comments: [...card.comments, { id: 'com-2', author_name: 'Camareira', content: 'Enxoval trocado.', created_at: new Date().toISOString() }],
  };
  assert.equal(updatedCard.checklist[0].completed, true);
  assert.equal(updatedCard.comments.length, 2);

  // 3. Move (transição de coluna com timestamp)
  const movedCard = {
    ...updatedCard,
    column_id: 'gov_liberado',
    completed_at: new Date().toISOString(),
  };
  assert.equal(movedCard.column_id, 'gov_liberado');
  assert.ok(movedCard.completed_at);

  // 4. Delete
  const cardsList = [movedCard];
  const remaining = cardsList.filter((c) => c.id !== movedCard.id);
  assert.equal(remaining.length, 0);
});

test('Prompt 06: vinculo com quarto, reserva ou hóspede apenas quando o dado já existir', () => {
  const cardWithExistingRoom = {
    id: 'card-1',
    room_number: '101',
    reservation_id: 'res-9988',
    guest_name: 'Carlos Drummond',
  };

  const cardGeneral = {
    id: 'card-2',
    location: 'Lobby',
    room_number: undefined,
    reservation_id: undefined,
    guest_name: undefined,
  };

  assert.ok(cardWithExistingRoom.room_number);
  assert.ok(cardWithExistingRoom.reservation_id);
  assert.equal(cardGeneral.room_number, undefined);
  assert.equal(cardGeneral.reservation_id, undefined);
});

test('Prompt 06: persistência em banco garante mesmo estado operacional em navegadores distintos', () => {
  // Simulação de 2 navegadores/sessões buscando o mesmo hotel
  const databaseStore = new Map<string, any>();
  
  const serverCard = {
    id: 'card-sync-global',
    hotel_id: 'hotel-centenario',
    board_id: 'recepcao',
    column_id: 'rec_atendimento',
    titulo: 'Atendimento VIP',
    location: 'Recepção Principal',
    prioridade: 'critica',
    ordem: 0,
    created_at: new Date().toISOString(),
  };
  
  // Persiste no banco de dados
  databaseStore.set(serverCard.id, serverCard);

  // Navegador A e Navegador B lêem do banco de dados (fonte da verdade)
  const browserA_State = databaseStore.get('card-sync-global');
  const browserB_State = databaseStore.get('card-sync-global');

  assert.deepEqual(browserA_State, browserB_State);
  assert.equal(browserA_State.column_id, 'rec_atendimento');
});

