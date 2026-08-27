import { KanbanCard } from '../types/kanban';
import { Quarto, Reserva, BloqueioQuarto, Hospede, Pagamento } from '../types';
import { FrigobarProduct, FrigobarQuarto } from '../types/frigobar';
import { MinibarRoomSummary } from '../context/FrigobarContext';

export interface PMSSyncContext {
  rooms: Quarto[];
  reservations: Reserva[];
  blocks: BloqueioQuarto[];
  guests: Hospede[];
  payments: Pagamento[];
  cards: KanbanCard[];
  roomMinibars: FrigobarQuarto[];
  getRoomMinibarSummary: (roomNumber: string) => MinibarRoomSummary;
  frigobarProducts: FrigobarProduct[];
}

export function generatePMSSyncCards(context: PMSSyncContext): { newCards: KanbanCard[]; syncedCount: number } {
  const {
    rooms,
    reservations,
    blocks,
    guests,
    payments,
    cards,
    roomMinibars,
    getRoomMinibarSummary,
    frigobarProducts
  } = context;

  const nowIso = new Date().toISOString();
  const newCardsToAdd: KanbanCard[] = [];
  let syncedCount = 0;

  // 1. Sincronizar Quartos com Governança e Manutenção
  rooms.forEach((room) => {
    if (room.status === 'sujo' || room.status === 'limpeza') {
      const existing = cards.find(
        (c) => c.board_id === 'governanca' && 
        (c.room_number === room.numero || c.location.includes(room.numero)) &&
        c.column_id !== 'gov_liberado'
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_gov_${room.id}_${Date.now()}`,
          board_id: 'governanca',
          column_id: room.status === 'limpeza' ? 'gov_em_andamento' : 'gov_a_limpar',
          title: `Higienização Quarto ${room.numero}`,
          location: `Quarto ${room.numero} (${room.nome})`,
          room_number: room.numero,
          priority: 'atencao',
          sla_target_minutes: 35,
          created_at: nowIso,
          origin_department: 'Sincronização PMS (Quartos)',
          summary_category: 'Status Quarto PMS:',
          order_items: ['Higienização padrão', 'Troca de enxoval'],
          comments: [
            {
              id: `c_s_${Date.now()}`,
              author_name: 'Motor de Sincronização PMS',
              content: `Quarto detectado como "${room.status.toUpperCase()}" na grade do hotel. Cartão sincronizado automaticamente.`,
              created_at: nowIso,
              is_system: true
            }
          ],
          checklist: [
            { id: 'sck1', text: 'Higienização e desinfecção', completed: false },
            { id: 'sck2', text: 'Conferência frigobar e comodidades', completed: false },
            { id: 'sck3', text: 'Inspeção final e liberação', completed: false }
          ],
          tags: ['PMS Sync', 'Quarto'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    } else if (room.status === 'manutencao') {
      const existing = cards.find(
        (c) => c.board_id === 'manutencao' && 
        (c.room_number === room.numero || c.location.includes(room.numero)) &&
        c.column_id !== 'man_resolvido'
      );
      if (!existing) {
        const relatedBlock = blocks.find((b) => b.quarto_id === room.id);
        newCardsToAdd.push({
          id: `sync_man_${room.id}_${Date.now()}`,
          board_id: 'manutencao',
          column_id: 'man_fila',
          title: `Reparo Quarto ${room.numero}: ${relatedBlock?.motivo || 'Manutenção Ativa'}`,
          location: `Quarto ${room.numero} (${room.nome})`,
          room_number: room.numero,
          priority: 'critica',
          sla_target_minutes: 45,
          created_at: nowIso,
          origin_department: 'Sincronização PMS (Bloqueios)',
          summary_category: 'Ordem de Serviço:',
          order_items: [relatedBlock?.motivo || 'Verificação técnica geral'],
          comments: [
            {
              id: `c_sm_${Date.now()}`,
              author_name: 'Motor de Sincronização PMS',
              content: `Quarto bloqueado para manutenção no PMS. Motivo: ${relatedBlock?.motivo || 'Reparo técnico'}.`,
              created_at: nowIso,
              is_system: true
            }
          ],
          checklist: [
            { id: 'smck1', text: 'Diagnóstico técnico inicial', completed: false },
            { id: 'smck2', text: 'Execução do reparo / peças', completed: false },
            { id: 'smck3', text: 'Teste funcional e liberação', completed: false }
          ],
          tags: ['PMS Sync', 'Manutenção'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    }
  });

  // 2. Sincronizar Reservas (Recepção & Financeiro)
  reservations.forEach((res) => {
    const rm = rooms.find((r) => r.id === res.quarto_id);
    const gst = guests.find((g) => g.id === res.hospede_id);
    
    if (res.status === 'confirmada') {
      const existing = cards.find(
        (c) => c.board_id === 'recepcao' && (c.reservation_id === res.id || c.title.includes(res.codigo_reserva))
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_rec_${res.id}_${Date.now()}`,
          board_id: 'recepcao',
          column_id: 'rec_checkins',
          title: `Check-in: ${gst?.nome || 'Hóspede'} (#${res.codigo_reserva})`,
          location: `Quarto ${rm?.numero || ''} (${rm?.nome || ''})`,
          reservation_id: res.id,
          room_number: rm?.numero,
          guest_name: gst?.nome,
          priority: 'normal',
          sla_target_minutes: 15,
          created_at: nowIso,
          amount: res.valor_total,
          origin_department: 'Motor de Reservas PMS',
          summary_category: 'Check-in Agendado:',
          order_items: [
            `Período: ${res.checkin} a ${res.checkout}`,
            `Adultos: ${res.adultos}, Crianças: ${res.criancas}`,
            `Valor Total: R$ ${res.valor_total.toFixed(2)}`
          ],
          comments: [
            {
              id: `c_srec_${Date.now()}`,
              author_name: 'Motor de Sincronização PMS',
              content: `Reserva confirmada no PMS. Check-in previsto para ${res.checkin}.`,
              created_at: nowIso,
              is_system: true
            }
          ],
          checklist: [
            { id: 'srck1', text: 'Conferir documento / FNRH Digital', completed: false },
            { id: 'srck2', text: 'Emitir chave / PIN Smart Lock', completed: false },
            { id: 'srck3', text: 'Entregar boas-vindas e efetivar check-in', completed: false }
          ],
          tags: ['Reserva', 'Check-in'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    } else if (res.status === 'checkin_realizado') {
      const existing = cards.find(
        (c) => c.board_id === 'recepcao' && (c.reservation_id === res.id || c.title.includes(res.codigo_reserva))
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_inhouse_${res.id}_${Date.now()}`,
          board_id: 'recepcao',
          column_id: 'rec_atendimento',
          title: `Hóspede In-House: ${gst?.nome || 'Hóspede'}`,
          location: `Quarto ${rm?.numero || ''}`,
          reservation_id: res.id,
          room_number: rm?.numero,
          guest_name: gst?.nome,
          priority: 'normal',
          sla_target_minutes: 20,
          created_at: nowIso,
          amount: res.valor_total,
          origin_department: 'Front Desk PMS',
          summary_category: 'Estadia Ativa:',
          order_items: [`Quarto ${rm?.numero}`, `Check-out: ${res.checkout}`],
          comments: [],
          checklist: [
            { id: 'sik1', text: 'Atendimento e suporte ao hóspede', completed: true },
            { id: 'sik2', text: 'Acompanhamento de consumos e solicitações', completed: false }
          ],
          tags: ['In-House', 'Hóspede Ativo'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    }
  });

  // 3. Sincronizar Pagamentos Pendentes com Financeiro
  payments.forEach((pay) => {
    if (pay.status === 'pendente') {
      const existing = cards.find(
        (c) => c.board_id === 'financeiro' && c.title.includes(pay.reserva_id)
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_fin_${pay.id}_${Date.now()}`,
          board_id: 'financeiro',
          column_id: 'fin_pendente',
          title: `Auditoria de Pagamento: Reserva #${pay.reserva_id.substring(0, 8)}`,
          location: 'Financeiro / Recepção',
          priority: 'critica',
          sla_target_minutes: 30,
          created_at: nowIso,
          amount: pay.valor,
          origin_department: 'Módulo Financeiro',
          summary_category: 'Auditoria de Recebimento:',
          order_items: [
            `Método: ${pay.metodo.toUpperCase()}`,
            `Valor: R$ ${pay.valor.toFixed(2)}`
          ],
          comments: [],
          checklist: [
            { id: 'fck1', text: 'Verificar comprovante bancário', completed: false },
            { id: 'fck2', text: 'Conciliar e dar baixa no PMS', completed: false }
          ],
          tags: ['Financeiro', 'PIX'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    }
  });

  // 4. Sincronizar Frigobares que precisam de reposição com o Almoxarifado
  roomMinibars.forEach((mb) => {
    const summary = getRoomMinibarSummary(mb.quarto_numero);
    if (summary.needsRestock) {
      const existing = cards.find(
        (c) => c.board_id === 'almoxarifado' && 
        (c.room_number === mb.quarto_numero || c.location.includes(mb.quarto_numero)) &&
        c.column_id !== 'alm_concluido'
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_alm_${mb.quarto_numero}_${Date.now()}`,
          board_id: 'almoxarifado',
          column_id: 'alm_reposicao',
          title: `Reposição Frigobar Quarto ${summary.quartoNumero}`,
          location: `Quarto ${summary.quartoNumero}`,
          room_number: summary.quartoNumero,
          priority: summary.status === 'critico_vazio' ? 'critica' : 'atencao',
          sla_target_minutes: 20,
          created_at: nowIso,
          origin_department: 'Frigobar & Almoxarifado',
          summary_category: `Itens em Falta (${summary.missingCount} un.):`,
          order_items: summary.missingList.map((m) => `${m.missing}x ${m.product.nome}`),
          comments: [
            {
              id: `c_alm_${Date.now()}`,
              author_name: 'Monitor de Frigobar PMS',
              content: `Quarto com nível de abastecimento em ${summary.percentage}%. ${summary.missingCount} itens pendentes de reposição.`,
              created_at: nowIso,
              is_system: true
            }
          ],
          checklist: summary.missingList.map((m, idx) => ({
            id: `alck_sync_${idx}_${Date.now()}`,
            text: `Repor ${m.missing}x ${m.product.nome}`,
            completed: false
          })),
          tags: ['Frigobar', 'Reposição', `Quarto ${summary.quartoNumero}`],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    }
  });

  // 5. Sincronizar Produtos com Estoque Baixo no Almoxarifado Central
  frigobarProducts.forEach((prod) => {
    if (prod.estoque_central <= prod.estoque_minimo) {
      const existing = cards.find(
        (c) => c.board_id === 'almoxarifado' && 
        c.column_id === 'alm_estoque_critico' &&
        c.title.includes(prod.nome)
      );
      if (!existing) {
        newCardsToAdd.push({
          id: `sync_alm_stk_${prod.id}_${Date.now()}`,
          board_id: 'almoxarifado',
          column_id: 'alm_estoque_critico',
          title: `Estoque Crítico: ${prod.nome} (${prod.estoque_central} ${prod.unidade})`,
          location: 'Almoxarifado Central',
          priority: prod.estoque_central === 0 ? 'critica' : 'atencao',
          sla_target_minutes: 60,
          created_at: nowIso,
          origin_department: 'Monitor de Estoque Central',
          summary_category: 'Alerta de Reposição de Compras:',
          order_items: [
            `Estoque Atual: ${prod.estoque_central} ${prod.unidade}`,
            `Estoque Mínimo: ${prod.estoque_minimo} ${prod.unidade}`,
            `Fornecedor: ${prod.fornecedor_padrao || 'Distribuidora Mantiqueira'}`
          ],
          comments: [
            {
              id: `c_stk_${Date.now()}`,
              author_name: 'Monitor de Almoxarifado',
              content: `Estoque central atingiu ${prod.estoque_central} unidades, abaixo do mínimo de segurança (${prod.estoque_minimo}).`,
              created_at: nowIso,
              is_system: true
            }
          ],
          checklist: [
            { id: `ck_stk_1_${Date.now()}`, text: `Emitir pedido de compra para ${prod.fornecedor_padrao || 'Fornecedor'}`, completed: false },
            { id: `ck_stk_2_${Date.now()}`, text: 'Receber lote, conferir NF e dar entrada no almoxarifado', completed: false }
          ],
          tags: ['Almoxarifado', 'Estoque Baixo', 'Compras'],
          order: 0,
          just_created: true
        });
        syncedCount++;
      }
    }
  });

  return { newCards: newCardsToAdd, syncedCount };
}
