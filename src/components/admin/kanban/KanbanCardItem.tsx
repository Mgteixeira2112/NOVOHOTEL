import React, { useState, useEffect } from 'react';
import { 
  KanbanCard, 
  KanbanColumn, 
  KanbanBoard 
} from '../../../types/kanban';
import { 
  Clock, 
  MapPin, 
  CheckSquare, 
  MessageSquare, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  CheckCircle2, 
  ChevronRight, 
  UtensilsCrossed,
  Zap,
  Package
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';
import { useHotel } from '../../../context/HotelContext';
import { getTheme } from '../../../utils/themeHelper';

interface KanbanCardItemProps {
  card: KanbanCard;
  column: KanbanColumn;
  board: KanbanBoard;
  allColumns: KanbanColumn[];
}

export const KanbanCardItem: React.FC<KanbanCardItemProps> = ({
  card,
  column,
  board,
  allColumns
}) => {
  const { 
    setSelectedCard, 
    moveCard, 
    quickRestockFrigobarCard
  } = useKanban();

  const {
    currentUser, 
    hotelConfig 
  } = useHotel();

  const theme = getTheme(hotelConfig?.tema_cor);

  // Cronômetro dinâmico de SLA
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(() => {
    const start = new Date(card.created_at).getTime();
    const end = card.completed_at ? new Date(card.completed_at).getTime() : Date.now();
    return Math.max(0, Math.floor((end - start) / 60000));
  });

  useEffect(() => {
    if (card.completed_at) return;
    const interval = setInterval(() => {
      const start = new Date(card.created_at).getTime();
      setElapsedMinutes(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    }, 30000);
    return () => clearInterval(interval);
  }, [card.created_at, card.completed_at]);

  // Status de SLA
  const isOverdue = !card.completed_at && elapsedMinutes > card.sla_target_minutes;
  const isWarning = !card.completed_at && !isOverdue && elapsedMinutes >= card.sla_target_minutes * 0.75;

  // Checklist
  const totalChecklist = card.checklist.length;
  const completedChecklist = card.checklist.filter((i) => i.completed).length;

  // Índices para movimentação rápida
  const currentColIndex = allColumns.findIndex((c) => c.id === column.id);
  const prevColumn = currentColIndex > 0 ? allColumns[currentColIndex - 1] : null;
  const nextColumn = currentColIndex < allColumns.length - 1 ? allColumns[currentColIndex + 1] : null;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Cores e estilos de prioridade
  const priorityConfig = {
    critica: {
      label: 'URGENTE',
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      borderClass: 'border-l-[3.5px] border-l-rose-500'
    },
    atencao: {
      label: 'ATENÇÃO',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      borderClass: 'border-l-[3.5px] border-l-amber-500'
    },
    normal: {
      label: 'NORMAL',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borderClass: 'border-l-[3.5px] border-l-emerald-500'
    }
  }[card.priority] || {
    label: 'NORMAL',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderClass: 'border-l-[3.5px] border-l-emerald-500'
  };

  const displayItems = card.order_items || card.service_details || [];

  const isAssignedToMe = Boolean(
    currentUser && (
      (card.assigned_to?.id && card.assigned_to.id === currentUser.id) ||
      (card.assigned_to?.name && currentUser.nome && card.assigned_to.name.toLowerCase() === currentUser.nome.toLowerCase())
    )
  );

  return (
    <div
      id={`kanban-card-${card.id}`}
      draggable
      onDragStart={handleDragStart}
      onClick={() => setSelectedCard(card)}
      className={`w-full overflow-hidden bg-white rounded-2xl p-2.5 sm:p-3 border shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer select-none space-y-2 relative group hover:border-amber-400 ${priorityConfig.borderClass} ${
        isAssignedToMe ? 'border-indigo-400 ring-1 ring-indigo-300 bg-indigo-50/20' : 'border-stone-200'
      } ${
        card.just_created ? 'ring-2 ring-amber-400 animate-pulse' : ''
      }`}
    >
      {/* Linha 1: Localização + Prioridade + Badge 'Minha Tarefa' */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0 flex-wrap">
        <div className="flex items-center gap-1 min-w-0 max-w-[70%]">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-stone-900 text-amber-300 font-bold text-[10px] min-w-0 truncate shadow-2xs">
            <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate">{card.location}</span>
          </span>
          {isAssignedToMe && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-black text-[9px] border border-indigo-200 shrink-0" title="Tarefa atribuída a você">
              Minha
            </span>
          )}
        </div>

        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border shrink-0 tracking-tight ml-auto ${priorityConfig.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotClass}`} />
          <span>{priorityConfig.label}</span>
        </span>
      </div>

      {/* Linha 2: Cronômetro SLA */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold">
        <Clock className={`w-3 h-3 shrink-0 ${
          isOverdue ? 'text-rose-600 animate-spin' : isWarning ? 'text-amber-500' : 'text-stone-400'
        }`} />
        <span className={
          isOverdue 
            ? 'text-rose-600 font-black' 
            : isWarning 
            ? 'text-amber-600 font-bold' 
            : 'text-stone-500'
        }>
          {elapsedMinutes}m
        </span>
        {isOverdue && (
          <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-700 text-[8px] font-black uppercase shrink-0">
            Atraso
          </span>
        )}
      </div>

      {/* Linha 3: Título Principal */}
      <div className="space-y-0.5 min-w-0">
        <h4 className="font-bold text-stone-900 text-xs leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors break-words">
          {card.title}
        </h4>
        {card.guest_name && (
          <p className="text-[10px] text-stone-500 truncate">
            Hóspede: <span className="font-semibold text-stone-700">{card.guest_name}</span>
          </p>
        )}
      </div>

      {/* Linha 4: Micro-Tags Resumo (Itens / Valor / Origem) */}
      {(displayItems.length > 0 || card.amount !== undefined || card.origin_department) && (
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          {displayItems.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-semibold truncate max-w-full">
              <UtensilsCrossed className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              <span>{displayItems.length} {displayItems.length === 1 ? 'item' : 'itens'}</span>
            </span>
          )}

          {card.amount !== undefined && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold shrink-0">
              R$ {card.amount.toFixed(2)}
            </span>
          )}

          {card.origin_department && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 text-[9px] truncate max-w-full">
              <Share2 className="w-2 h-2 text-stone-400 shrink-0" />
              <span className="truncate">De: {card.origin_department}</span>
            </span>
          )}
        </div>
      )}

      {/* Linha 5: Rodapé com Responsável + Indicadores + Ação */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-stone-100 text-[10px] w-full min-w-0">
        
        {/* Responsável */}
        <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
          {card.assigned_to ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <div className={`w-4 h-4 rounded-full ${theme.primary} text-stone-950 flex items-center justify-center text-[8px] font-black shrink-0`}>
                {card.assigned_to.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] text-stone-600 truncate font-medium">
                {card.assigned_to.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-stone-400 italic flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-stone-300 shrink-0" />
              <span className="truncate">Disponível</span>
            </span>
          )}
        </div>

        {/* Indicadores & Botão Detalhes */}
        <div className="flex items-center gap-1 shrink-0 text-stone-400">
          {totalChecklist > 0 && (
            <span 
              className={`flex items-center gap-0.5 text-[9px] font-bold ${
                completedChecklist === totalChecklist ? 'text-emerald-600' : 'text-stone-500'
              }`}
              title={`Checklist: ${completedChecklist}/${totalChecklist}`}
            >
              <CheckSquare className="w-2.5 h-2.5" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </span>
          )}

          {card.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-stone-500 font-bold" title={`${card.comments.length} mensagens`}>
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{card.comments.length}</span>
            </span>
          )}

          <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>

      </div>

      {/* Ação Especial: Reposição Imediata de Frigobar no Almoxarifado */}
      {card.board_id === 'almoxarifado' && (card.room_number || card.tags.includes('Frigobar') || card.tags.includes('Reposição')) && !card.completed_at && column.id !== 'alm_concluido' && (
        <div className="pt-1 border-t border-amber-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              quickRestockFrigobarCard(card.id);
            }}
            className="w-full py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-200 hover:border-emerald-600 text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs group/rst"
            title="Abastecer frigobar e dar baixa no cartão instantaneamente"
          >
            <Zap className="w-3 h-3 text-emerald-600 group-hover/rst:text-white" />
            <span>Repor e Concluir</span>
          </button>
        </div>
      )}

      {/* Ações Rápidas de Avanço */}
      {(prevColumn || nextColumn) && (
        <div className="pt-1 flex items-center justify-between gap-1 border-t border-stone-100 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {prevColumn ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveCard(card.id, prevColumn.id, board.id);
              }}
              className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] font-semibold flex items-center gap-0.5 transition cursor-pointer truncate max-w-[45%]"
              title={`Voltar para ${prevColumn.title}`}
            >
              <ArrowLeft className="w-2 h-2 shrink-0" />
              <span className="truncate">{prevColumn.title}</span>
            </button>
          ) : <div />}

          {nextColumn ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveCard(card.id, nextColumn.id, board.id);
              }}
              className={`px-2 py-0.5 rounded ${theme.buttonClass} text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer ml-auto shadow-2xs truncate max-w-[55%]`}
              title={`Avançar para ${nextColumn.title}`}
            >
              <span className="truncate">{nextColumn.title}</span>
              <ArrowRight className="w-2 h-2 shrink-0" />
            </button>
          ) : (
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 ml-auto shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" /> Concluído
            </span>
          )}
        </div>
      )}
    </div>
  );
};
