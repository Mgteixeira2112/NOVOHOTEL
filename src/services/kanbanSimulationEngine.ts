import { KanbanCard } from '../types/kanban';

export type SimulationEventType = 
  | 'reception_to_maintenance' 
  | 'room_service_order' 
  | 'housekeeping_turnover' 
  | 'guest_extra_pillow' 
  | 'minibar_restock_needed' 
  | 'almoxarifado_low_stock';

export interface SimulationResult {
  card: KanbanCard;
  targetBoardId: string;
  liveMessage: string;
  eventType: 'info' | 'success' | 'urgent' | 'personal';
}

export function buildSimulatedKanbanEvent(type: SimulationEventType): SimulationResult {
  const nowIso = new Date().toISOString();

  if (type === 'reception_to_maintenance') {
    const card: KanbanCard = {
      id: `sim_m_${Date.now()}`,
      board_id: 'manutencao',
      column_id: 'man_fila',
      title: 'Ar Condicionado Q. 302 Sem Refrigeração',
      location: 'Quarto 302',
      priority: 'critica',
      sla_target_minutes: 30,
      created_at: nowIso,
      origin_department: 'Recepção (Chamada Telefônica)',
      delegated_to_department: 'Manutenção & Engenharia',
      guest_name: 'Dr. Roberto Silveira',
      comments: [
        {
          id: `sc_1_${Date.now()}`,
          author_name: 'Gabriel Ribeiro (Recepção)',
          author_role: 'recepcionista',
          content: 'Hóspede informou pelo ramal 9 que o aparelho está ligado mas não resfria. Prioridade máxima.',
          created_at: nowIso
        }
      ],
      checklist: [
        { id: `sck_1`, text: 'Inspecionar compressor e gás refrigerante', completed: false },
        { id: `sck_2`, text: 'Limpar filtros de ar', completed: false },
        { id: `sck_3`, text: 'Testar sensor do controle remoto', completed: false }
      ],
      tags: ['Urgência', 'Ar Condicionado', 'VIP'],
      order: 0,
      just_created: true
    };
    return {
      card,
      targetBoardId: 'manutencao',
      liveMessage: '⚡ URGENTE: Recepção repassou chamado de Ar Condicionado no Q. 302 para a Manutenção!',
      eventType: 'urgent'
    };
  }

  if (type === 'room_service_order') {
    const card: KanbanCard = {
      id: `sim_c_${Date.now()}`,
      board_id: 'cozinha',
      column_id: 'coz_novos',
      title: 'Filé Mignon ao Poivre + Vinho Reserva',
      location: 'Suíte Presidencial 301',
      priority: 'critica',
      sla_target_minutes: 25,
      created_at: nowIso,
      amount: 198.00,
      guest_name: 'Alice Guimarães',
      origin_department: 'App do Hóspede (Room Service)',
      order_items: [
        '1x Medalhão de Mignon ao Molho Poivre Vert',
        '1x Risoto de Parmesão Trufado',
        '1x Garrafa Vinho Tinto Gran Reserva 750ml'
      ],
      comments: [
        {
          id: `scc_1_${Date.now()}`,
          author_name: 'App do Hóspede',
          content: 'Ponto da carne: Mal passada. Enviar 2 taças de cristal para vinho.',
          created_at: nowIso,
          is_system: true
        }
      ],
      checklist: [
        { id: `cck_1`, text: 'Grelhar medalhões no ponto solicitado', completed: false },
        { id: `cck_2`, text: 'Empratar com cloche aquecido', completed: false },
        { id: `cck_3`, text: 'Acionar garçom com carrinho de serviço', completed: false }
      ],
      tags: ['Gourmet', 'App Hóspede', 'VIP'],
      order: 0,
      just_created: true
    };
    return {
      card,
      targetBoardId: 'cozinha',
      liveMessage: '🍽️ NOVO PEDIDO: Room Service na Suíte 301 (Filé Mignon ao Poivre) entrou na Cozinha!',
      eventType: 'info'
    };
  }

  if (type === 'housekeeping_turnover') {
    const card: KanbanCard = {
      id: `sim_g_${Date.now()}`,
      board_id: 'governanca',
      column_id: 'gov_a_limpar',
      title: 'Higienização de Saída (Check-out Realizado)',
      location: 'Quarto 204 (Master com Banheira)',
      priority: 'atencao',
      sla_target_minutes: 40,
      created_at: nowIso,
      origin_department: 'Recepção (Check-out)',
      comments: [
        {
          id: `scg_1_${Date.now()}`,
          author_name: 'Sistema Front Desk',
          content: 'Hóspede realizou check-out e liberou a chave. Quarto liberado para arrumação completa.',
          created_at: nowIso,
          is_system: true
        }
      ],
      checklist: [
        { id: `gck_1`, text: 'Troca de todo o enxoval e toalhas', completed: false },
        { id: `gck_2`, text: 'Higienizar e desinfetar hidromassagem', completed: false },
        { id: `gck_3`, text: 'Conferir e repor itens do frigobar', completed: false },
        { id: `gck_4`, text: 'Chamar governanta para inspeção final', completed: false }
      ],
      tags: ['Turnover', 'Saída Hóspede'],
      order: 0,
      just_created: true
    };
    return {
      card,
      targetBoardId: 'governanca',
      liveMessage: '🧹 GOVERNANÇA: Quarto 204 teve check-out concluído e entrou na fila de limpeza!',
      eventType: 'info'
    };
  }

  if (type === 'guest_extra_pillow') {
    const card: KanbanCard = {
      id: `sim_p_${Date.now()}`,
      board_id: 'governanca',
      column_id: 'gov_pedidos_extra',
      title: 'Kit Extra: 2 Travesseiros Ortopédicos + Roupão',
      location: 'Chalé 02 com Piscina',
      priority: 'normal',
      sla_target_minutes: 20,
      created_at: nowIso,
      origin_department: 'Hóspede (WhatsApp)',
      comments: [
        {
          id: `scw_1_${Date.now()}`,
          author_name: 'WhatsApp Concierge',
          content: 'Hóspede solicitou travesseiro mais alto para a noite.',
          created_at: nowIso
        }
      ],
      checklist: [
        { id: `pck_1`, text: 'Retirar enxoval premium no armário 3', completed: false },
        { id: `pck_2`, text: 'Entregar ao hóspede com cartão de cortesia', completed: false }
      ],
      tags: ['Enxoval Extra', 'Concierge'],
      order: 0,
      just_created: true
    };
    return {
      card,
      targetBoardId: 'governanca',
      liveMessage: '🛏️ Pedido de Enxoval Extra registrado para o Chalé 02!',
      eventType: 'info'
    };
  }

  if (type === 'minibar_restock_needed') {
    const card: KanbanCard = {
      id: `sim_mb_${Date.now()}`,
      board_id: 'almoxarifado',
      column_id: 'alm_reposicao',
      title: 'Reposição Urgente: Frigobar Quarto 205',
      location: 'Quarto 205 (Luxo com Varanda)',
      room_number: '205',
      priority: 'critica',
      sla_target_minutes: 20,
      created_at: nowIso,
      origin_department: 'Check-out Express / Frigobar',
      summary_category: 'Itens em Falta (Auditoria de Consumo):',
      order_items: [
        '2x Cerveja Heineken Long Neck 330ml',
        '2x Água Mineral sem Gás 500ml',
        '1x Batata Pringles Original 40g'
      ],
      amount: 49.00,
      comments: [
        {
          id: `scmb_1_${Date.now()}`,
          author_name: 'Monitor de Frigobar',
          content: 'Hóspede consumiu 5 itens do refrigerador. Reposição necessária antes da entrada da próxima reserva.',
          created_at: nowIso,
          is_system: true
        }
      ],
      checklist: [
        { id: `mbck_1`, text: 'Separar 2x Heineken + 2x Água + 1x Pringles no almoxarifado', completed: false },
        { id: `mbck_2`, text: 'Transportar carrinho e abastecer refrigerador no quarto 205', completed: false },
        { id: `mbck_3`, text: 'Conferir temperatura (4°C) e dar baixa de reposição no sistema', completed: false }
      ],
      tags: ['Frigobar', 'Urgente', 'Quarto 205'],
      order: 0,
      just_created: true
    };
    return {
      card,
      targetBoardId: 'almoxarifado',
      liveMessage: '📦 ALMOXARIFADO & FRIGOBAR: Reposição solicitada para o Quarto 205 (5 itens consumidos)!',
      eventType: 'urgent'
    };
  }

  // almoxarifado_low_stock
  const card: KanbanCard = {
    id: `sim_astk_${Date.now()}`,
    board_id: 'almoxarifado',
    column_id: 'alm_estoque_critico',
    title: 'Estoque Crítico: Cerveja Heineken (4 garrafas restantes)',
    location: 'Almoxarifado Central (Prateleira Bebidas B2)',
    priority: 'atencao',
    sla_target_minutes: 60,
    created_at: nowIso,
    origin_department: 'Monitor de Estoque Central',
    summary_category: 'Disparo de Reposição de Compras:',
    order_items: [
      'Estoque Central Atual: 4 garrafas',
      'Estoque Mínimo Definido: 30 garrafas',
      'Fornecedor: Distribuidora Vale do Sapucaí Bebidas'
    ],
    comments: [
      {
        id: `scastk_1_${Date.now()}`,
        author_name: 'Robô de Compras',
        content: 'Nível crítico atingido. Sugerido pedido de compra padrão de 120 unidades para atender o final de semana.',
        created_at: nowIso,
        is_system: true
      }
    ],
    checklist: [
      { id: `stkck_1`, text: 'Emitir Pedido de Compra #PO-901 (120 un.)', completed: false },
      { id: `stkck_2`, text: 'Validar faturamento com setor financeiro', completed: false },
      { id: `stkck_3`, text: 'Receber lote no cais de carga e dar entrada no sistema', completed: false }
    ],
    tags: ['Estoque Baixo', 'Almoxarifado', 'Bebidas'],
    order: 0,
    just_created: true
  };
  return {
    card,
    targetBoardId: 'almoxarifado',
    liveMessage: '⚠️ ALMOXARIFADO: Estoque crítico de Cerveja Heineken (Apenas 4 un. restantes no estoque central)!',
    eventType: 'info'
  };
}
