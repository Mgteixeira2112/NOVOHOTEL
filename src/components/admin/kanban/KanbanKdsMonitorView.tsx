import React, { useState, useEffect } from 'react';
import { 
  KanbanBoard, 
  KanbanCard, 
  KanbanColumn 
} from '../../../types/kanban';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Sparkles, 
  UtensilsCrossed,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';
import { useHotel } from '../../../context/HotelContext';
import { getTheme, getFontFamilyClass } from '../../../utils/themeHelper';
import { KanbanCardItem } from './KanbanCardItem';

interface KanbanKdsMonitorViewProps {
  board: KanbanBoard;
}

export const KanbanKdsMonitorView: React.FC<KanbanKdsMonitorViewProps> = ({ board }) => {
  const { 
    visibleCards, 
    visibleBoards,
    soundEnabled, 
    setSoundEnabled, 
    isAdmin,
    userDepartment
  } = useKanban();

  const { hotelConfig } = useHotel();

  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>(board.id);

  // Sincronizar com o evento nativo de fullscreen do navegador (incluindo tecla ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Quadros a serem renderizados (individual ou todos dentro dos quadros visíveis ao usuário)
  const isAllBoards = filterDepartment === 'all';
  const displayedBoards = isAllBoards 
    ? visibleBoards 
    : [visibleBoards.find((b) => b.id === filterDepartment) || visibleBoards[0] || board];

  return (
    <div className={`text-white transition-all duration-200 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 w-screen h-screen overflow-y-auto bg-stone-950 p-4 sm:p-6 space-y-6' 
        : 'bg-stone-950 rounded-3xl p-4 sm:p-6 border border-stone-800 shadow-2xl space-y-6'
    }`}>
      
      {/* Barra de Controle do Monitor KDS / Painel TV */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900 border border-stone-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${theme.primary} text-stone-950 flex items-center justify-center font-black shadow-md shrink-0`}>
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-sm sm:text-base font-bold tracking-wide text-white uppercase ${fontClass}`}>
                Display Operacional (KDS / Monitor TV)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black tracking-widest uppercase border border-rose-500/40 animate-pulse">
                AO VIVO
              </span>
              {isFullscreen && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                  TELA CHEIA
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              Otimizado para toque em tablets de bancada e monitores suspensos de alta visibilidade
            </p>
          </div>
        </div>

        {/* Seletores & Ações */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Setor no Monitor com Opção 'Todos os Painéis' */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">{isAdmin ? '🌐 Todos os Painéis (Multissetorial)' : '🏢 Todos os Meus Painéis'}</option>
            {visibleBoards.map((b) => (
              <option key={b.id} value={b.id}>
                Painel: {b.title}
              </option>
            ))}
          </select>

          {/* Toggle de Som */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              soundEnabled
                ? `${theme.buttonClass} font-black shadow-xs`
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
            }`}
            title="Alternar alertas sonoros automáticos"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          {/* Tela Cheia */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Fullscreen' : 'Tela Cheia'}</span>
          </button>
        </div>
      </div>

      {/* Renderização dos Painéis (Individual ou Multissetorial) */}
      <div className="space-y-8">
        {displayedBoards.map((b) => {
          const boardActiveCards = visibleCards.filter((c) => {
            if (c.board_id !== b.id) return false;
            const col = b.columns.find((col) => col.id === c.column_id);
            return !col?.is_final;
          });

          return (
            <div key={b.id} className="space-y-3">
              {/* Título do Setor quando estiver em modo Multissetorial */}
              {isAllBoards && (
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className={`w-2.5 h-2.5 rounded-full ${theme.primary}`} />
                  <h3 className={`text-sm font-black uppercase tracking-wider text-stone-200 ${fontClass}`}>
                    {b.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 text-[10px] font-bold">
                    {boardActiveCards.length} tarefas ativas
                  </span>
                </div>
              )}

              {/* Colunas do Monitor KDS em Linha Única */}
              <div className="flex flex-row items-start gap-3.5 w-full">
                {b.columns
                  .filter((col) => !col.is_final)
                  .map((col) => {
                    const colCards = boardActiveCards.filter((c) => c.column_id === col.id);

                    return (
                      <div
                        key={col.id}
                        className="flex-1 min-w-0 bg-stone-900 rounded-3xl p-3 sm:p-3.5 border border-stone-800/90 flex flex-col space-y-3"
                      >
                        {/* Header da Coluna KDS com tipografia e alinhamento ajustados */}
                        <div className="flex items-center justify-between pb-2 border-b border-stone-800 gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                              style={{ backgroundColor: col.color || '#f59e0b' }}
                            />
                            <h3 
                              className={`font-bold text-xs sm:text-sm text-stone-100 tracking-tight leading-snug line-clamp-1 ${fontClass}`} 
                              title={col.title}
                            >
                              {col.title}
                            </h3>
                          </div>
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-stone-800 text-stone-300 font-bold text-[10px] sm:text-[11px] flex items-center justify-center border border-stone-700 shrink-0">
                            {colCards.length}
                          </span>
                        </div>

                        {/* Cards Padronizados no Display Operacional */}
                        <div className="space-y-2.5">
                          {colCards.length === 0 ? (
                            <div className="h-36 border-2 border-dashed border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-stone-600">
                              <Sparkles className="w-5 h-5 mb-1 opacity-30 text-stone-500" />
                              <span className="text-xs font-semibold text-stone-500">Fila Vazia</span>
                            </div>
                          ) : (
                            colCards.map((card) => (
                              <KanbanCardItem
                                key={card.id}
                                card={card}
                                column={col}
                                board={b}
                                allColumns={b.columns}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
