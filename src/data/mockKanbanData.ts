import { KanbanBoard, KanbanCard } from '../types/kanban';

export const INITIAL_KANBAN_BOARDS: KanbanBoard[] = [
  {
    id: 'recepcao',
    title: 'Recepção & Front Desk',
    department: 'recepcao',
    icon_name: 'ConciergeBell',
    description: 'Centraliza o fluxo de entrada, saída, triagem e atendimento inicial aos hóspedes.',
    default_sla_minutes: 10,
    allowed_roles_manage: ['admin', 'gerente', 'recepcionista'],
    allowed_roles_view: ['admin', 'gerente', 'recepcionista', 'governanca', 'financeiro'],
    columns: [
      {
        id: 'rec_checkins',
        board_id: 'recepcao',
        title: 'Check-ins do Dia',
        color: '#ef4444', // red
        order: 1,
        wip_limit: 10
      },
      {
        id: 'rec_atendimento',
        board_id: 'recepcao',
        title: 'Em Atendimento',
        color: '#f59e0b', // amber
        order: 2,
        is_in_progress: true,
        wip_limit: 3
      },
      {
        id: 'rec_solicitacoes',
        board_id: 'recepcao',
        title: 'Solicitações Abertas',
        color: '#3b82f6', // blue
        order: 3
      },
      {
        id: 'rec_aguardando',
        board_id: 'recepcao',
        title: 'Aguardando Outros Setores',
        color: '#8b5cf6', // purple
        order: 4,
        is_delegated: true
      },
      {
        id: 'rec_checkouts',
        board_id: 'recepcao',
        title: 'Check-outs Pendentes',
        color: '#10b981', // emerald
        order: 5
      }
    ]
  },
  {
    id: 'governanca',
    title: 'Governança & Lavanderia',
    department: 'governanca',
    icon_name: 'Sparkles',
    description: 'Focado no status físico dos quartos, higienização, vistorias e pedidos de enxoval.',
    default_sla_minutes: 35,
    allowed_roles_manage: ['admin', 'gerente', 'governanca'],
    allowed_roles_view: ['admin', 'gerente', 'governanca', 'recepcionista'],
    columns: [
      {
        id: 'gov_a_limpar',
        board_id: 'governanca',
        title: 'A Limpar (Check-out)',
        color: '#ef4444', // red
        order: 1
      },
      {
        id: 'gov_em_andamento',
        board_id: 'governanca',
        title: 'Limpeza em Andamento',
        color: '#f59e0b', // amber
        order: 2,
        is_in_progress: true
      },
      {
        id: 'gov_revisao',
        board_id: 'governanca',
        title: 'Revisão / Inspeção VIP',
        color: '#3b82f6', // blue
        order: 3
      },
      {
        id: 'gov_pedidos_extra',
        board_id: 'governanca',
        title: 'Pedidos Extra (Enxoval)',
        color: '#8b5cf6', // purple
        order: 4
      },
      {
        id: 'gov_liberado',
        board_id: 'governanca',
        title: 'Liberado (Pronto)',
        color: '#10b981', // emerald
        order: 5,
        is_final: true
      }
    ]
  },
  {
    id: 'cozinha',
    title: 'Cozinha & Room Service',
    department: 'cozinha',
    icon_name: 'UtensilsCrossed',
    description: 'Estrutura ágil voltada para velocidade de preparo, mise en place e entrega gastronômica.',
    default_sla_minutes: 25,
    allowed_roles_manage: ['admin', 'gerente', 'recepcionista'],
    allowed_roles_view: ['admin', 'gerente', 'recepcionista', 'governanca', 'financeiro'],
    columns: [
      {
        id: 'coz_novos',
        board_id: 'cozinha',
        title: 'Novos Pedidos',
        color: '#ef4444', // red
        order: 1
      },
      {
        id: 'coz_preparo',
        board_id: 'cozinha',
        title: 'Em Preparo',
        color: '#f59e0b', // amber
        order: 2,
        is_in_progress: true
      },
      {
        id: 'coz_pronto',
        board_id: 'cozinha',
        title: 'Pronto para Entrega',
        color: '#3b82f6', // blue
        order: 3
      },
      {
        id: 'coz_em_rota',
        board_id: 'cozinha',
        title: 'Em Rota de Entrega',
        color: '#8b5cf6', // purple
        order: 4
      },
      {
        id: 'coz_concluido',
        board_id: 'cozinha',
        title: 'Concluído',
        color: '#10b981', // emerald
        order: 5,
        is_final: true
      }
    ]
  },
  {
    id: 'manutencao',
    title: 'Manutenção & Engenharia',
    department: 'manutencao',
    icon_name: 'Wrench',
    description: 'Gerenciamento rápido de chamados técnicos, infraestrutura, climatização e elétrica.',
    default_sla_minutes: 40,
    allowed_roles_manage: ['admin', 'gerente', 'recepcionista'],
    allowed_roles_view: ['admin', 'gerente', 'recepcionista', 'governanca'],
    columns: [
      {
        id: 'man_fila',
        board_id: 'manutencao',
        title: 'Fila de Chamados',
        color: '#ef4444', // red
        order: 1
      },
      {
        id: 'man_analise',
        board_id: 'manutencao',
        title: 'Em Análise / Orçamento',
        color: '#f59e0b', // amber
        order: 2
      },
      {
        id: 'man_conserto',
        board_id: 'manutencao',
        title: 'Em Conserto',
        color: '#3b82f6', // blue
        order: 3,
        is_in_progress: true
      },
      {
        id: 'man_resolvido',
        board_id: 'manutencao',
        title: 'Resolvido (Liberado)',
        color: '#10b981', // emerald
        order: 4,
        is_final: true
      }
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro & Auditoria',
    department: 'financeiro',
    icon_name: 'DollarSign',
    description: 'Conciliação de pagamentos, cobrança de contas em aberto, auditoria de frigobar e faturamento.',
    default_sla_minutes: 60,
    allowed_roles_manage: ['admin', 'gerente', 'financeiro'],
    allowed_roles_view: ['admin', 'gerente', 'financeiro', 'recepcionista'],
    columns: [
      {
        id: 'fin_pendente',
        board_id: 'financeiro',
        title: 'Pagamentos / PIX Pendentes',
        color: '#ef4444', // red
        order: 1
      },
      {
        id: 'fin_auditoria',
        board_id: 'financeiro',
        title: 'Auditoria de Consumo / Diárias',
        color: '#f59e0b', // amber
        order: 2,
        is_in_progress: true
      },
      {
        id: 'fin_faturado',
        board_id: 'financeiro',
        title: 'Contas Faturadas (Empresas)',
        color: '#3b82f6', // blue
        order: 3
      },
      {
        id: 'fin_concluido',
        board_id: 'financeiro',
        title: 'Conciliado & Liquidado',
        color: '#10b981', // emerald
        order: 4,
        is_final: true
      }
    ]
  },
  {
    id: 'almoxarifado',
    title: 'Almoxarifado & Frigobar',
    department: 'almoxarifado',
    icon_name: 'Package',
    description: 'Controle de reposição de frigobares nos quartos, controle de estoque mínimo, separação de pedidos e conferência de consumos.',
    default_sla_minutes: 20,
    allowed_roles_manage: ['admin', 'gerente', 'governanca', 'recepcionista'],
    allowed_roles_view: ['admin', 'gerente', 'governanca', 'recepcionista', 'financeiro'],
    columns: [
      {
        id: 'alm_reposicao',
        board_id: 'almoxarifado',
        title: 'Reposição de Quartos Solicitada',
        color: '#ef4444', // red
        order: 1
      },
      {
        id: 'alm_separacao',
        board_id: 'almoxarifado',
        title: 'Separação / Em Rota',
        color: '#f59e0b', // amber
        order: 2,
        is_in_progress: true
      },
      {
        id: 'alm_estoque_critico',
        board_id: 'almoxarifado',
        title: 'Estoque Crítico / Pedidos Fornecedor',
        color: '#8b5cf6', // purple
        order: 3
      },
      {
        id: 'alm_auditoria',
        board_id: 'almoxarifado',
        title: 'Auditoria de Consumo / Check-out',
        color: '#3b82f6', // blue
        order: 4
      },
      {
        id: 'alm_concluido',
        board_id: 'almoxarifado',
        title: 'Abastecido / Concluído',
        color: '#10b981', // emerald
        order: 5,
        is_final: true
      }
    ]
  }
];

const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

export const INITIAL_KANBAN_CARDS: KanbanCard[] = [
  // --- CARDS DA RECEPÇÃO ---
  {
    id: 'card_rec_1',
    board_id: 'recepcao',
    column_id: 'rec_checkins',
    title: 'Check-in VIP Antecipado',
    location: 'Suíte Presidencial 301',
    priority: 'critica',
    sla_target_minutes: 15,
    created_at: minutesAgo(8),
    assigned_to: {
      id: 'usr_3',
      name: 'Gabriel Ribeiro',
      role: 'Recepção'
    },
    guest_name: 'Dr. Roberto Silveira',
    origin_department: 'Recepção',
    summary_category: 'Check-in VIP (3 etapas):',
    order_items: [
      '1x Chave Magnética NFC + PIN Digital 301',
      '1x Kit de Boas-Vindas c/ Espumante Brut',
      '1x FNRH Digital Pré-Preenchida'
    ],
    amount: 1450.00,
    comments: [
      {
        id: 'c1',
        author_name: 'Gabriel Ribeiro',
        author_role: 'recepcionista',
        content: 'Hóspede avisou que pousou no aeroporto e chega em 15 minutos. Carta de boas-vindas impressa.',
        created_at: minutesAgo(7)
      }
    ],
    checklist: [
      { id: 'ck1', text: 'Emitir chave magnética & PIN digital', completed: true },
      { id: 'ck2', text: 'Conferir kit de boas-vindas e espumante', completed: true },
      { id: 'ck3', text: 'Coletar assinatura na FNRH Digital', completed: false }
    ],
    tags: ['VIP', 'Early Check-in'],
    order: 1
  },
  {
    id: 'card_rec_2',
    board_id: 'recepcao',
    column_id: 'rec_atendimento',
    title: 'Registro de Entrada Familiar',
    location: 'Quarto 104',
    priority: 'normal',
    sla_target_minutes: 10,
    created_at: minutesAgo(4),
    started_at: minutesAgo(2),
    assigned_to: {
      id: 'usr_3',
      name: 'Gabriel Ribeiro',
      role: 'Recepção'
    },
    guest_name: 'Família Mendonça',
    origin_department: 'Recepção',
    summary_category: 'Registro Familiar (2 hóspedes):',
    order_items: [
      '2x Pulseiras Piscina Térmica Climatizada',
      '1x Cartão de Acesso Estacionamento Vaga 12'
    ],
    amount: 680.00,
    comments: [],
    checklist: [
      { id: 'ck4', text: 'Cadastrar documento de 2 hóspedes', completed: true },
      { id: 'ck5', text: 'Entregar pulseira da piscina e Wi-Fi', completed: false }
    ],
    tags: ['Família', 'Balcão'],
    order: 1
  },
  {
    id: 'card_rec_3',
    board_id: 'recepcao',
    column_id: 'rec_aguardando',
    title: 'Vazamento Ar Condicionado (Repassado à Manutenção)',
    location: 'Quarto 302',
    priority: 'critica',
    sla_target_minutes: 30,
    created_at: minutesAgo(26), // Overdue simulation
    guest_name: 'Carla Nogueira',
    origin_department: 'Recepção',
    delegated_to_department: 'Manutenção',
    summary_category: 'Chamado Técnico Urgente:',
    order_items: [
      '1x Desobstrução Dreno Split 12.000 BTUs',
      '1x Sanitização Anti-Bacteriana Evaporadora'
    ],
    comments: [
      {
        id: 'c2',
        author_name: 'Gabriel Ribeiro',
        author_role: 'recepcionista',
        content: 'Hóspede ligou no ramal 9 informando goteira no quarto. Transferido com urgência para a equipe técnica.',
        created_at: minutesAgo(17)
      },
      {
        id: 'c3',
        author_name: 'Carlos Mendes',
        author_role: 'gerente',
        content: 'Técnico já no local fazendo a desobstrução do dreno.',
        created_at: minutesAgo(5)
      }
    ],
    checklist: [
      { id: 'ck6', text: 'Abrir chamado na Manutenção', completed: true },
      { id: 'ck7', text: 'Acompanhar resolução', completed: true },
      { id: 'ck8', text: 'Retornar ligação para o hóspede confirmando conforto', completed: false }
    ],
    tags: ['Inter-setores', 'Chamado Técnico'],
    order: 1
  },
  {
    id: 'card_rec_4',
    board_id: 'recepcao',
    column_id: 'rec_checkouts',
    title: 'Check-out Express com Fechamento PIX',
    location: 'Quarto 208',
    priority: 'atencao',
    sla_target_minutes: 10,
    created_at: minutesAgo(8),
    assigned_to: {
      id: 'usr_3',
      name: 'Gabriel Ribeiro',
      role: 'Recepção'
    },
    guest_name: 'Mariana Duarte',
    origin_department: 'Recepção',
    summary_category: 'Consumo & Fechamento:',
    order_items: [
      '2x Água Mineral sem Gás (Frigobar)',
      '1x Cerveja Stella Artois 330ml',
      '1x Extrato Faturado c/ Envio WhatsApp'
    ],
    amount: 34.00,
    comments: [],
    checklist: [
      { id: 'ck9', text: 'Conferir frigobar e consumos no sistema', completed: true },
      { id: 'ck10', text: 'Gerar QR Code PIX de saldo restante', completed: true },
      { id: 'ck11', text: 'Enviar recibo em PDF por WhatsApp', completed: false }
    ],
    tags: ['Check-out', 'PIX'],
    order: 1
  },

  // --- CARDS DA GOVERNANÇA ---
  {
    id: 'card_gov_1',
    board_id: 'governanca',
    column_id: 'gov_a_limpar',
    title: 'Limpeza Completa Pós Check-out',
    location: 'Quarto 102',
    priority: 'atencao',
    sla_target_minutes: 40,
    created_at: minutesAgo(25),
    origin_department: 'Recepção',
    guest_name: 'Quarto Desocupado',
    summary_category: 'Higienização & Enxoval (4 etapas):',
    order_items: [
      '1x Troca Enxoval 400 fios (Casal)',
      '1x Desinfecção UV Banheiro & Box',
      '1x Reposição Amenities L’Occitane'
    ],
    comments: [
      {
        id: 'cg1',
        author_name: 'Sistema PMS',
        content: 'Check-out realizado às 11:30. Quarto liberado para higienização completa.',
        created_at: minutesAgo(25),
        is_system: true
      }
    ],
    checklist: [
      { id: 'gck1', text: 'Troca completa de lençóis e fronhas 400 fios', completed: false },
      { id: 'gck2', text: 'Higienização e desinfecção do banheiro', completed: false },
      { id: 'gck3', text: 'Aspirar carpete e polir móveis', completed: false },
      { id: 'gck4', text: 'Reposição de amenities e frigobar', completed: false }
    ],
    tags: ['Check-out', 'Turnover'],
    order: 1
  },
  {
    id: 'card_gov_2',
    board_id: 'governanca',
    column_id: 'gov_em_andamento',
    title: 'Higienização Diária + Hidromassagem',
    location: 'Quarto 204',
    priority: 'normal',
    sla_target_minutes: 35,
    created_at: minutesAgo(20),
    started_at: minutesAgo(12),
    assigned_to: {
      id: 'usr_4',
      name: 'Luciana Ferreira',
      role: 'Governança'
    },
    guest_name: 'Eduardo Castro',
    origin_department: 'Governança',
    summary_category: 'Arrumação Diária:',
    order_items: [
      '1x Sanitização Hidromassagem Master',
      '4x Toalhas Banhão Felpudas Extras',
      '1x Reposição Sais de Banho Alecrim'
    ],
    comments: [
      {
        id: 'cg2',
        author_name: 'Luciana Ferreira',
        author_role: 'governanca',
        content: 'Hóspede saiu para passeio na cidade e pediu toalhas extras para a banheira.',
        created_at: minutesAgo(11)
      }
    ],
    checklist: [
      { id: 'gck5', text: 'Arrumar cama e trocar toalhas de banho', completed: true },
      { id: 'gck6', text: 'Sanitizar banheira de hidromassagem', completed: true },
      { id: 'gck7', text: 'Checar e repor amenities L’Occitane', completed: false }
    ],
    tags: ['Arrumação Diária'],
    order: 1
  },
  {
    id: 'card_gov_3',
    board_id: 'governanca',
    column_id: 'gov_revisao',
    title: 'Vistoria e Selagem de Quarto VIP',
    location: 'Suíte Presidencial 301',
    priority: 'critica',
    sla_target_minutes: 15,
    created_at: minutesAgo(12),
    assigned_to: {
      id: 'usr_4',
      name: 'Luciana Ferreira',
      role: 'Governança'
    },
    guest_name: 'Dr. Roberto Silveira',
    origin_department: 'Governança',
    summary_category: 'Auditoria de Qualidade VIP:',
    order_items: [
      '1x Aromatização Lavanda & Flores Frescas',
      '1x Calibração Climatização 22°C',
      '1x Aplicação de Selo de Inspeção Porta'
    ],
    comments: [
      {
        id: 'cg3',
        author_name: 'Luciana Ferreira',
        author_role: 'governanca',
        content: 'Limpeza concluída pela camareira Maria. Conferindo detalhes antes da chegada do hóspede VIP.',
        created_at: minutesAgo(5)
      }
    ],
    checklist: [
      { id: 'gck8', text: 'Conferência de temperatura do A/C (22°C)', completed: true },
      { id: 'gck9', text: 'Aromatização de lavanda & flores frescas', completed: true },
      { id: 'gck10', text: 'Inserir selo de inspeção na porta', completed: false }
    ],
    tags: ['Vistoria VIP', 'Auditoria'],
    order: 1
  },
  {
    id: 'card_gov_4',
    board_id: 'governanca',
    column_id: 'gov_pedidos_extra',
    title: 'Travesseiros de Plumas + Berço Portátil',
    location: 'Chalé 01 Vista Serra',
    priority: 'atencao',
    sla_target_minutes: 20,
    created_at: minutesAgo(10),
    origin_department: 'App do Hóspede',
    guest_name: 'Fernanda Lins',
    summary_category: 'Enxoval Especial & Kids:',
    order_items: [
      '1x Berço Portátil Higienizado c/ Colchão',
      '2x Travesseiros Plumas de Ganso Antialérgicos'
    ],
    comments: [
      {
        id: 'cg4',
        author_name: 'Recepção Front Desk',
        content: 'Hóspede solicitou pelo chat do hotel para o bebê dormir.',
        created_at: minutesAgo(9)
      }
    ],
    checklist: [
      { id: 'gck11', text: 'Separar berço higienizado na rouparia', completed: true },
      { id: 'gck12', text: 'Montar no chalé com lençol infantil', completed: false }
    ],
    tags: ['Enxoval Extra', 'Kids'],
    order: 1
  },

  // --- CARDS DA COZINHA & ROOM SERVICE ---
  {
    id: 'card_coz_1',
    board_id: 'cozinha',
    column_id: 'coz_novos',
    title: 'Filé Mignon ao Poivre + Vinho Reserva',
    location: 'Suíte Presidencial 301',
    priority: 'critica',
    sla_target_minutes: 25,
    created_at: minutesAgo(1),
    amount: 198.00,
    summary_category: 'Pedido (3 itens):',
    order_items: [
      '1x Medalhão de Mignon ao Molho Poivre Vert',
      '1x Risoto de Parmesão Trufado',
      '1x Vinho Tinto Reserva 750ml'
    ],
    guest_name: 'Alice Guimarães',
    origin_department: 'App do Hóspede (Room Service)',
    comments: [
      {
        id: 'cc1',
        author_name: 'App do Hóspede',
        content: 'Ponto da carne: ao ponto menos. Favor trazer duas taças de cristal.',
        created_at: minutesAgo(1),
        is_system: true
      }
    ],
    checklist: [
      { id: 'cck1', text: 'Grelhar medalhão de mignon ao ponto menos', completed: false },
      { id: 'cck2', text: 'Mise en place do molho poivre vert', completed: false },
      { id: 'cck3', text: 'Embalar em cloche térmico prata', completed: false }
    ],
    tags: ['Room Service', 'Gourmet'],
    order: 1
  },
  {
    id: 'card_coz_4',
    board_id: 'cozinha',
    column_id: 'coz_novos',
    title: '2x Hambúrguer Artesanal + Cerveja IPA',
    location: 'Quarto 204',
    priority: 'critica',
    sla_target_minutes: 25,
    created_at: minutesAgo(3),
    amount: 148.00,
    summary_category: 'Pedido (3 itens):',
    order_items: [
      '2x Burger Angus Premium c/ Cheddar Inglês',
      '1x Batata Rústica c/ Alecrim e Páprica',
      '2x Cerveja Artesanal IPA 500ml'
    ],
    guest_name: 'Eduardo Castro',
    origin_department: 'Hóspede (App)',
    comments: [
      {
        id: 'cc1b',
        author_name: 'App do Hóspede',
        content: 'Observação: Carne ao ponto para bem passada, sem cebola em um dos burgers.',
        created_at: minutesAgo(3),
        is_system: true
      }
    ],
    checklist: [
      { id: 'cck1b', text: 'Grelhar hambúrgueres e tostar pão brioche', completed: false },
      { id: 'cck2b', text: 'Fritar batatas e montar molho trufado', completed: false },
      { id: 'cck3b', text: 'Embalar cloche térmico e gelar cervejas', completed: false }
    ],
    tags: ['Room Service', 'Pedido App'],
    order: 2
  },
  {
    id: 'card_coz_2',
    board_id: 'cozinha',
    column_id: 'coz_preparo',
    title: 'Filé Mignon ao Poivre + Vinho Reserva',
    location: 'Suíte Presidencial 301',
    priority: 'critica',
    sla_target_minutes: 25,
    created_at: minutesAgo(1),
    started_at: minutesAgo(1),
    assigned_to: {
      id: 'usr_5',
      name: 'Alice',
      role: 'Cozinha'
    },
    amount: 198.00,
    summary_category: 'Pedido (3 itens):',
    order_items: [
      '1x Medalhão de Mignon ao Molho Poivre Vert',
      '1x Risoto de Parmesão Trufado',
      '1x Vinho Tinto Reserva 750ml'
    ],
    guest_name: 'Alice Guimarães',
    origin_department: 'App do Hóspede (Room Service)',
    comments: [
      {
        id: 'cc2',
        author_name: 'Alice',
        content: 'Mignon já selado na manteiga de ervas, risoto em finalização.',
        created_at: minutesAgo(1)
      }
    ],
    checklist: [
      { id: 'cck4', text: 'Selar medalhão e reduzir molho', completed: true },
      { id: 'cck5', text: 'Empratar com brotos frescos', completed: false },
      { id: 'cck5b', text: 'Acoplar cloche térmico', completed: false }
    ],
    tags: ['Gourmet', 'Prato Quente'],
    order: 1
  },
  {
    id: 'card_coz_5',
    board_id: 'cozinha',
    column_id: 'coz_preparo',
    title: 'Risoto de Cogumelos Frescos c/ Azeite Trufado',
    location: 'Suíte Presidencial 301',
    priority: 'atencao',
    sla_target_minutes: 30,
    created_at: minutesAgo(14),
    started_at: minutesAgo(10),
    amount: 92.00,
    summary_category: 'Pedido (2 itens):',
    order_items: [
      '1x Risoto Funghi Porcini c/ Parmigiano Reggiano',
      '1x Taça Vinho Tinto Cabernet'
    ],
    guest_name: 'Eduardo Silveira',
    origin_department: 'Recepção',
    comments: [],
    checklist: [
      { id: 'cck4b', text: 'Finalizar risoto na manteiga e ervas', completed: true },
      { id: 'cck5c', text: 'Montar prato fundo com brotos comestíveis', completed: false }
    ],
    tags: ['Gourmet'],
    order: 2
  },
  {
    id: 'card_coz_3',
    board_id: 'cozinha',
    column_id: 'coz_pronto',
    title: 'Cesta de Café da Manhã Flutuante',
    location: 'Chalé 02 com Piscina',
    priority: 'critica',
    sla_target_minutes: 20,
    created_at: minutesAgo(25), // Overdue simulation (25 min > 20 min)
    started_at: minutesAgo(18),
    assigned_to: {
      id: 'usr_2',
      name: 'Carlos',
      role: 'Cozinha'
    },
    amount: 180.00,
    summary_category: 'Pedido (1 itens):',
    order_items: [
      'Cesta Completa Flutuante (Croissants, Frutas da Estação, Ovos Benedict, Suco Natural)'
    ],
    origin_department: 'Agendamento Prévio',
    guest_name: 'Henrique & Sofia',
    comments: [
      {
        id: 'cc3',
        author_name: 'Carlos Mendes',
        content: 'Bandeja decorada com orquídeas pronta no balcão de saída aguardando o garçom.',
        created_at: minutesAgo(2)
      }
    ],
    checklist: [
      { id: 'cck6', text: 'Montar bandeja impermeável', completed: true },
      { id: 'cck7', text: 'Cobrir com domo de proteção', completed: true },
      { id: 'cck8', text: 'Transportar até o chalé', completed: false }
    ],
    tags: ['Café Flutuante', 'Experiência'],
    order: 1
  },

  // --- CARDS DA MANUTENÇÃO ---
  {
    id: 'card_man_1',
    board_id: 'manutencao',
    column_id: 'man_fila',
    title: 'Substituição de Lâmpada e Ducha Higiênica',
    location: 'Quarto 106',
    priority: 'normal',
    sla_target_minutes: 45,
    created_at: minutesAgo(22),
    origin_department: 'Governança',
    guest_name: 'Chamado Preventivo',
    summary_category: 'Chamado Técnico (2 itens):',
    order_items: [
      '1x Spot LED Dicroica 4.8W 3000K (Banheiro)',
      '1x Reparo Gatilho Ducha Higiênica'
    ],
    comments: [
      {
        id: 'cm1',
        author_name: 'Luciana Ferreira',
        author_role: 'governanca',
        content: 'Camareira notou que o spot acima do espelho está piscando.',
        created_at: minutesAgo(21)
      }
    ],
    checklist: [
      { id: 'mck1', text: 'Pegar lâmpada LED no almoxarifado', completed: false },
      { id: 'mck2', text: 'Testar circuito e vedação da ducha', completed: false }
    ],
    tags: ['Elétrica', 'Manutenção Leve'],
    order: 1
  },
  {
    id: 'card_man_2',
    board_id: 'manutencao',
    column_id: 'man_conserto',
    title: 'Ar Condicionado Gotejando (Quarto 302)',
    location: 'Quarto 302',
    priority: 'critica',
    sla_target_minutes: 30,
    created_at: minutesAgo(18),
    started_at: minutesAgo(6),
    assigned_to: {
      id: 'usr_2',
      name: 'Carlos Mendes',
      role: 'Técnico de Plantão'
    },
    guest_name: 'Carla Nogueira',
    origin_department: 'Recepção',
    summary_category: 'Manutenção Climatização:',
    order_items: [
      '1x Desobstrução Tubulação Dreno Split',
      '1x Medição Carga Gás Refrigerante R410A'
    ],
    comments: [
      {
        id: 'cm2',
        author_name: 'Gabriel Ribeiro',
        author_role: 'recepcionista',
        content: 'Chamado repassado da Recepção com alta prioridade.',
        created_at: minutesAgo(17)
      },
      {
        id: 'cm3',
        author_name: 'Carlos Mendes',
        author_role: 'gerente',
        content: 'Bandeja de condensação limpa. Aplicando bactericida e ajustando o caimento do dreno.',
        created_at: minutesAgo(4)
      }
    ],
    checklist: [
      { id: 'mck3', text: 'Desligar disjuntor do Q. 302', completed: true },
      { id: 'mck4', text: 'Desobstruir mangueira de dreno', completed: true },
      { id: 'mck5', text: 'Medir fluxo de ar e temperatura (18°C)', completed: false }
    ],
    tags: ['Climatização', 'Prioridade Alta'],
    order: 1
  },
  {
    id: 'card_man_3',
    board_id: 'manutencao',
    column_id: 'man_analise',
    title: 'Fechadura Eletrônica com Bateria Baixa (20%)',
    location: 'Chalé 01',
    priority: 'atencao',
    sla_target_minutes: 60,
    created_at: minutesAgo(35),
    origin_department: 'Sistema Fechaduras (IoT)',
    guest_name: 'Telemetria Smart Lock',
    summary_category: 'Automação & Segurança:',
    order_items: [
      '4x Pilhas Alcalinas AA Industriais 1.5V',
      '1x Teste de Abertura PIN & Cartão RFID'
    ],
    comments: [
      {
        id: 'cm4',
        author_name: 'Automação IoT',
        content: 'Alerta telemétrico: Nível de bateria da fechadura Tuya Zigbee atingiu 20%.',
        created_at: minutesAgo(35),
        is_system: true
      }
    ],
    checklist: [
      { id: 'mck6', text: 'Separar 4 pilhas AA alcalinas industriais', completed: true },
      { id: 'mck7', text: 'Trocar durante o período sem hóspede', completed: false }
    ],
    tags: ['IoT Fechaduras', 'Preventiva'],
    order: 1
  },
  // --- CARDS DO FINANCEIRO ---
  {
    id: 'card_fin_1',
    board_id: 'financeiro',
    column_id: 'fin_pendente',
    title: 'Cobrança PIX Diárias - Reserva #RES-8921',
    location: 'Recepção / Financeiro',
    priority: 'critica',
    sla_target_minutes: 30,
    created_at: minutesAgo(12),
    assigned_to: {
      id: 'usr_4',
      name: 'Mariana Lima',
      role: 'Financeiro'
    },
    guest_name: 'Dr. Roberto Silveira',
    origin_department: 'Recepção',
    summary_category: 'Auditoria de Pagamento:',
    order_items: [
      '3x Diárias Suíte Presidencial 301',
      '1x Consumo Frigobar Gourmet'
    ],
    amount: 1780.00,
    comments: [
      {
        id: 'cf1',
        author_name: 'Gabriel Ribeiro',
        author_role: 'recepcionista',
        content: 'Comprovante PIX recebido via WhatsApp. Aguardando conciliação bancária para baixa definitiva.',
        created_at: minutesAgo(10)
      }
    ],
    checklist: [
      { id: 'fck1', text: 'Validar comprovante bancário com extrato', completed: true },
      { id: 'fck2', text: 'Emitir Nota Fiscal Eletrônica (NFS-e)', completed: false },
      { id: 'fck3', text: 'Dar baixa de quitação no PMS', completed: false }
    ],
    tags: ['PIX', 'Auditoria'],
    order: 1
  },
  {
    id: 'card_fin_2',
    board_id: 'financeiro',
    column_id: 'fin_faturado',
    title: 'Faturamento Corporativo - Tech Corp Brasil',
    location: 'Quartos 201 e 202',
    priority: 'normal',
    sla_target_minutes: 120,
    created_at: minutesAgo(50),
    assigned_to: {
      id: 'usr_4',
      name: 'Mariana Lima',
      role: 'Financeiro'
    },
    guest_name: 'Engenharia Tech Corp (2 Hóspedes)',
    origin_department: 'Corporativo',
    summary_category: 'Faturamento 15 Dias:',
    order_items: [
      '4x Diárias Quarto Executivo',
      '2x Jantares Room Service'
    ],
    amount: 2450.00,
    comments: [],
    checklist: [
      { id: 'fck4', text: 'Conferir ordem de compra (PO-9912)', completed: true },
      { id: 'fck5', text: 'Enviar boleto e fatura detalhada por e-mail', completed: false }
    ],
    tags: ['Empresa', 'Faturado'],
    order: 1
  },
  // --- CARDS DO ALMOXARIFADO & FRIGOBAR ---
  {
    id: 'card_alm_1',
    board_id: 'almoxarifado',
    column_id: 'alm_reposicao',
    title: 'Reposição Frigobar Quarto 102',
    location: 'Quarto 102 (Standard)',
    room_number: '102',
    priority: 'critica',
    sla_target_minutes: 20,
    created_at: minutesAgo(10),
    assigned_to: {
      id: 'usr_2',
      name: 'Camila Santos',
      role: 'Governança & Frigobar'
    },
    guest_name: 'Lucas Martins',
    origin_department: 'Frigobar / Governança',
    summary_category: 'Itens a Repor no Frigobar:',
    order_items: [
      '2x Água Mineral sem Gás 500ml',
      '1x Coca-Cola Original Lata 350ml',
      '2x Cerveja Heineken Long Neck 330ml',
      '1x Castanha de Caju Especial 50g'
    ],
    amount: 52.00,
    comments: [
      {
        id: 'calm1',
        author_name: 'Camila Santos',
        author_role: 'governanca',
        content: 'Auditoria rápida pós arrumação identificou 6 itens em falta. Separando no almoxarifado.',
        created_at: minutesAgo(8)
      }
    ],
    checklist: [
      { id: 'alck1', text: 'Retirar itens no Almoxarifado Central', completed: true },
      { id: 'alck2', text: 'Abastecer frigobar e validar temperatura (4°C)', completed: false },
      { id: 'alck3', text: 'Confirmar reposição no sistema PMS', completed: false }
    ],
    tags: ['Frigobar', 'Reposição', 'Quarto 102'],
    order: 1
  },
  {
    id: 'card_alm_2',
    board_id: 'almoxarifado',
    column_id: 'alm_separacao',
    title: 'Kit Frigobar VIP Suíte 301 (Pré Check-in)',
    location: 'Suíte Presidencial 301',
    room_number: '301',
    priority: 'critica',
    sla_target_minutes: 15,
    created_at: minutesAgo(15),
    started_at: minutesAgo(8),
    assigned_to: {
      id: 'usr_2',
      name: 'Camila Santos',
      role: 'Governança & Frigobar'
    },
    guest_name: 'Dr. Roberto Silveira (VIP)',
    origin_department: 'Recepção (Pré-Chegada)',
    summary_category: 'Kit Boas-Vindas & Frigobar Gourmet:',
    order_items: [
      '1x Espumante Chandon Brut 750ml',
      '2x Água com Gás Caxambu 500ml',
      '1x Chocolate Lindt Excellence 70%',
      '2x Cerveja Stella Artois 330ml'
    ],
    amount: 210.00,
    comments: [
      {
        id: 'calm2',
        author_name: 'Gabriel Ribeiro',
        author_role: 'recepcionista',
        content: 'Hóspede VIP pousou no aeroporto. Frigobar deve estar abastecido e espumante resfriado antes da entrega da chave.',
        created_at: minutesAgo(14)
      }
    ],
    checklist: [
      { id: 'alck4', text: 'Colocar espumante no balde de gelo', completed: true },
      { id: 'alck5', text: 'Conferir taças de cristal na bancada', completed: true },
      { id: 'alck6', text: 'Abastecer refrigerador e lacrar', completed: false }
    ],
    tags: ['VIP', 'Pré Check-in', 'Gourmet'],
    order: 1
  },
  {
    id: 'card_alm_3',
    board_id: 'almoxarifado',
    column_id: 'alm_estoque_critico',
    title: 'Estoque Crítico: Água Mineral sem Gás (8 un. restantes)',
    location: 'Almoxarifado Central (Prateleira A1)',
    priority: 'atencao',
    sla_target_minutes: 60,
    created_at: minutesAgo(35),
    assigned_to: {
      id: 'usr_1',
      name: 'Carlos Mendes',
      role: 'Gerência / Compras'
    },
    origin_department: 'Monitor de Almoxarifado',
    summary_category: 'Alerta de Reposição de Estoque:',
    order_items: [
      'Estoque Central Atual: 8 unidades',
      'Estoque Mínimo Definido: 40 unidades',
      'Fornecedor: Distribuidora Mantiqueira de Águas'
    ],
    comments: [
      {
        id: 'calm3',
        author_name: 'Robô de Almoxarifado',
        content: 'Disparo automático: Quantidade no almoxarifado atingiu nível abaixo do estoque mínimo de segurança.',
        created_at: minutesAgo(35),
        is_system: true
      }
    ],
    checklist: [
      { id: 'alck7', text: 'Emitir Pedido de Compra #PO-882 (150 un.)', completed: true },
      { id: 'alck8', text: 'Confirmar entrega com Distribuidora Mantiqueira', completed: false },
      { id: 'alck9', text: 'Receber lote, conferir NF e dar entrada no sistema', completed: false }
    ],
    tags: ['Estoque Mínimo', 'Compras', 'Bebidas'],
    order: 1
  },
  {
    id: 'card_alm_4',
    board_id: 'almoxarifado',
    column_id: 'alm_auditoria',
    title: 'Auditoria de Consumo Frigobar: Quarto 204',
    location: 'Quarto 204',
    room_number: '204',
    priority: 'normal',
    sla_target_minutes: 15,
    created_at: minutesAgo(18),
    assigned_to: {
      id: 'usr_2',
      name: 'Camila Santos',
      role: 'Governança & Frigobar'
    },
    guest_name: 'Beatriz Vasconcelos',
    origin_department: 'Check-out Express',
    summary_category: 'Consumo Identificado na Vistoria:',
    order_items: [
      '2x Cerveja Corona Extra 330ml (R$ 28,00)',
      '1x Batata Pringles 40g (R$ 14,00)'
    ],
    amount: 42.00,
    comments: [
      {
        id: 'calm4',
        author_name: 'Camila Santos',
        author_role: 'governanca',
        content: 'Itens consumidos conferidos no quarto. Já debitados no extrato da reserva da recepção.',
        created_at: minutesAgo(12)
      }
    ],
    checklist: [
      { id: 'alck10', text: 'Conferir lacres e embalagens vazias', completed: true },
      { id: 'alck11', text: 'Lançar consumo na conta da reserva #RES-9102', completed: true },
      { id: 'alck12', text: 'Repor os 3 itens para o próximo hóspede', completed: false }
    ],
    tags: ['Auditoria', 'Consumo', 'Check-out'],
    order: 1
  },
  {
    id: 'card_alm_5',
    board_id: 'almoxarifado',
    column_id: 'alm_concluido',
    title: 'Reposição Completa Frigobar: Quarto 101',
    location: 'Quarto 101 (Standard)',
    room_number: '101',
    priority: 'normal',
    sla_target_minutes: 20,
    created_at: minutesAgo(75),
    completed_at: minutesAgo(40),
    assigned_to: {
      id: 'usr_2',
      name: 'Camila Santos',
      role: 'Governança & Frigobar'
    },
    origin_department: 'Frigobar / Governança',
    summary_category: 'Abastecimento Efetuado:',
    order_items: [
      '4x Água Mineral sem Gás',
      '2x Guaraná Antarctica Lata',
      '2x Cerveja Heineken'
    ],
    amount: 64.00,
    comments: [
      {
        id: 'calm5',
        author_name: 'Camila Santos',
        author_role: 'governanca',
        content: 'Frigobar 100% abastecido conforme template padrão e higienizado.',
        created_at: minutesAgo(40)
      }
    ],
    checklist: [
      { id: 'alck13', text: 'Retirar itens no almoxarifado', completed: true },
      { id: 'alck14', text: 'Abastecer frigobar e validar temperatura', completed: true },
      { id: 'alck15', text: 'Confirmar reposição no sistema PMS', completed: true }
    ],
    tags: ['Concluído', 'Abastecido'],
    order: 1
  }
];
