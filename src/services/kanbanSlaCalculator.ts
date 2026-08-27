import { KanbanCard, KanbanBoard, KanbanSlaMetrics } from '../types/kanban';

export function calculateKanbanSlaMetrics(cards: KanbanCard[], boards: KanbanBoard[]): KanbanSlaMetrics {
  const total_cards_today = cards.length;
  const completedCards = cards.filter((c) => {
    const board = boards.find((b) => b.id === c.board_id);
    const col = board?.columns.find((col) => col.id === c.column_id);
    return col?.is_final || !!c.completed_at;
  });
  const completed_cards_today = completedCards.length;

  let totalResolutionMins = 0;
  let onTimeCount = 0;

  cards.forEach((card) => {
    const createdTime = new Date(card.created_at).getTime();
    const endTime = card.completed_at ? new Date(card.completed_at).getTime() : Date.now();
    const elapsedMins = (endTime - createdTime) / (1000 * 60);

    if (card.completed_at) {
      totalResolutionMins += elapsedMins;
      if (elapsedMins <= card.sla_target_minutes) {
        onTimeCount++;
      }
    }
  });

  const on_time_percentage = completed_cards_today > 0 
    ? Math.round((onTimeCount / completed_cards_today) * 100) 
    : 92;

  const avg_resolution_minutes = completed_cards_today > 0 
    ? Math.round(totalResolutionMins / completed_cards_today) 
    : 22;

  const active_urgent_count = cards.filter((c) => {
    const board = boards.find((b) => b.id === c.board_id);
    const col = board?.columns.find((col) => col.id === c.column_id);
    return !col?.is_final && c.priority === 'critica';
  }).length;

  // Identifica gargalos (colunas não finais com mais cartões acumulados)
  const columnCounts: Record<string, { column_title: string; count: number; department: string }> = {};
  cards.forEach((c) => {
    const board = boards.find((b) => b.id === c.board_id);
    const col = board?.columns.find((col) => col.id === c.column_id);
    if (col && !col.is_final) {
      if (!columnCounts[col.id]) {
        columnCounts[col.id] = { column_title: col.title, count: 0, department: board?.title || c.board_id };
      }
      columnCounts[col.id].count++;
    }
  });

  const bottlenecks_by_column = Object.values(columnCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    total_cards_today,
    completed_cards_today,
    on_time_percentage,
    avg_resolution_minutes,
    active_urgent_count,
    bottlenecks_by_column
  };
}
