import React, { useState } from 'react';
import { 
  KanbanBoard, 
  KanbanColumn, 
  KanbanCard 
} from '../../../types/kanban';
import { 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Settings2, 
  Layers,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';
import { useHotel } from '../../../context/HotelContext';
import { KanbanCardItem } from './KanbanCardItem';
import { KanbanRoomMapBar } from './KanbanRoomMapBar';
import { KanbanAlmoxarifadoBar } from './KanbanAlmoxarifadoBar';
import { getTheme, getFontFamilyClass } from '../../../utils/themeHelper';

interface KanbanBoardViewProps {
  board: KanbanBoard;
}

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({ board }) => {
  const { 
    visibleCards, 
    moveCard, 
    setIsCreateCardModalOpen, 
    setIsCreateColumnModalOpen,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    slaFilter
  } = useKanban();

  const { currentUser, hotelConfig } = useHotel();

  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Filtragem de cartões pertencentes a este quadro (usando a lista filtrada por papel e setor)
  const filteredCards = visibleCards.filter((card) => {
    if (card.board_id !== board.id) return false;

    // Busca textual por título, quarto ou hóspede
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchLoc = card.location.toLowerCase().includes(q);
      const matchGuest = card.guest_name ? card.guest_name.toLowerCase().includes(q) : false;
      const matchTags = card.tags ? card.tags.some(t => t.toLowerCase().includes(q)) : false;
      if (!matchTitle && !matchLoc && !matchGuest && !matchTags) return false;
    }

    // Filtro por Prioridade
    if (priorityFilter !== 'all' && card.priority !== priorityFilter) {
      return false;
    }

    // Filtro por Responsável
    if (assigneeFilter === 'unassigned' && card.assigned_to) {
      return false;
    } else if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned') {
      if (card.assigned_to?.id !== assigneeFilter) return false;
    }

    // Filtro por SLA
    if (slaFilter !== 'all') {
      const start = new Date(card.created_at).getTime();
      const end = card.completed_at ? new Date(card.completed_at).getTime() : Date.now();
      const elapsedMins = (end - start) / 60000;
      const isOverdue = !card.completed_at && elapsedMins > card.sla_target_minutes;
      const isWarning = !card.completed_at && !isOverdue && elapsedMins >= card.sla_target_minutes * 0.75;

      if (slaFilter === 'overdue' && !isOverdue) return false;
      if (slaFilter === 'warning' && !isWarning) return false;
      if (slaFilter === 'normal' && (isOverdue || isWarning)) return false;
    }

    return true;
  });

  // Handlers de Drag & Drop
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (columnId: string) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      moveCard(cardId, columnId, board.id);
    }
  };

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const canManageColumns = userRole === 'admin' || userRole === 'gerente';

  // Grid layout responsivo sem scroll: número de colunas distribuídas igualmente na tela
  const columnCount = board.columns.length + (canManageColumns ? 1 : 0);
  const gridColsClass = 
    columnCount === 1 ? 'grid-cols-1' :
    columnCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
    columnCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
    columnCount === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  return (
    <div className="w-full select-none">
      {/* Mapa Minimalista dos Quartos e Status Operacional (Exclusivo da Recepção & Front Desk) */}
      {board.id === 'recepcao' && (
        <KanbanRoomMapBar />
      )}

      {/* Central Operacional de Suprimentos & Frigobar (Exclusivo do Almoxarifado) */}
      {board.id === 'almoxarifado' && (
        <KanbanAlmoxarifadoBar />
      )}

      {/* Contêiner de Colunas: Todas na MESMA LINHA ocupando 100% da largura de forma proporcional */}
      <div className="flex flex-row items-start gap-3 w-full">
        {board.columns
          .sort((a, b) => a.order - b.order)
          .map((column) => {
            const columnCards = filteredCards
              .filter((c) => c.column_id === column.id)
              .sort((a, b) => a.order - b.order);

            const isWipExceeded = column.wip_limit && columnCards.length > column.wip_limit;
            const isDragOver = dragOverColumnId === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => handleDragLeave(column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex-1 min-w-0 bg-stone-100/90 rounded-3xl p-3 sm:p-3.5 border transition-all duration-150 flex flex-col ${
                  isDragOver
                    ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/30'
                    : isWipExceeded
                    ? 'border-rose-300'
                    : 'border-stone-200/90 shadow-2xs'
                }`}
              >
                {/* Cabeçalho da Coluna com Tipografia Editorial */}
                <div className="flex items-center justify-between pb-2 px-1 border-b border-stone-200/80 mb-2 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                      style={{ backgroundColor: column.color || '#64748b' }}
                    />
                    <h3 className="font-bold text-stone-900 text-xs tracking-tight leading-snug line-clamp-1" title={column.title}>
                      {column.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {column.wip_limit && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          isWipExceeded
                            ? 'bg-rose-100 text-rose-700 animate-bounce'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                        title={`Limite de trabalho em progresso: ${column.wip_limit}`}
                      >
                        {columnCards.length}/{column.wip_limit}
                      </span>
                    )}

                    <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-stone-200 text-stone-800 text-[10px] font-black flex items-center justify-center shadow-2xs">
                      {columnCards.length}
                    </span>
                  </div>
                </div>

                {/* Lista de Etiquetas dos Cartões (Exibição Total sem barra de scroll interna) */}
                <div className="space-y-2.5 w-full">
                  {columnCards.length === 0 ? (
                    <div
                      className={`py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-3 text-center text-xs transition ${
                        isDragOver
                          ? 'border-amber-400 bg-amber-100/40 text-amber-900 font-bold'
                          : 'border-stone-300/80 text-stone-400 bg-white/40'
                      }`}
                    >
                      <Layers className="w-4 h-4 mb-1 opacity-40 text-stone-400" />
                      <span className="font-medium text-[11px]">Nenhuma tarefa</span>
                    </div>
                  ) : (
                    columnCards.map((card) => (
                      <KanbanCardItem
                        key={card.id}
                        card={card}
                        column={column}
                        board={board}
                        allColumns={board.columns}
                      />
                    ))
                  )}
                </div>

                {/* Botão Rápido: Adicionar Card nesta Coluna */}
                <div className="pt-2.5 border-t border-stone-200/80 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateCardModalOpen(true)}
                    className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 hover:text-stone-950 text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer hover:border-stone-300"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600 font-black flex-shrink-0" />
                    <span className="truncate">+ Nova Tarefa</span>
                  </button>
                </div>
              </div>
            );
          })}

        {/* Botão para Criar Nova Coluna (Admin / Gerente) alinhado na mesma linha */}
        {canManageColumns && (
          <div className="w-12 sm:w-16 flex-shrink-0 flex self-stretch">
            <button
              type="button"
              onClick={() => setIsCreateColumnModalOpen(true)}
              className="w-full h-full min-h-[140px] rounded-3xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/50 hover:bg-amber-50/30 text-stone-400 hover:text-amber-900 flex flex-col items-center justify-center gap-1.5 transition p-2 cursor-pointer text-center group"
              title="Adicionar Nova Coluna / Etapa"
            >
              <div className={`w-7 h-7 rounded-xl bg-white group-hover:${theme.primary} group-hover:text-stone-950 text-stone-600 flex items-center justify-center shadow-xs transition`}>
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold hidden sm:block">Etapa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
