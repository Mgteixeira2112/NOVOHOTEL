import React, { useState, useMemo } from 'react';
import { useHotel } from '../../../context/HotelContext';
import { useKanban } from '../../../context/KanbanContext';
import { useFrigobar } from '../../../context/FrigobarContext';
import { 
  Package, 
  Boxes, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ShoppingBag, 
  Truck, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../../utils/themeHelper';

export const KanbanAlmoxarifadoBar: React.FC = () => {
  const { hotelConfig, setAdminActiveTab, currentUser } = useHotel();
  const { syncAllFromPMS, isSyncing, cards, quickRestockFrigobarCard } = useKanban();
  const { 
    products, 
    roomMinibars, 
    getRoomMinibarSummary, 
    reabastecerTodosQuartos,
    quickRestockRoom 
  } = useFrigobar();

  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [isExpanded, setIsExpanded] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'needs_restock' | 'critical' | 'stocked'>('all');

  // Cálculos de Status dos Frigobares nos Quartos
  const roomSummaries = useMemo(() => {
    return roomMinibars.map((mb) => ({
      minibar: mb,
      summary: getRoomMinibarSummary(mb.quarto_numero)
    }));
  }, [roomMinibars, getRoomMinibarSummary]);

  const stats = useMemo(() => {
    const totalRooms = roomSummaries.length;
    const stockedRooms = roomSummaries.filter((r) => r.summary.isFullyStocked).length;
    const needRestockRooms = roomSummaries.filter((r) => r.summary.needsRestock && r.summary.status !== 'critico_vazio').length;
    const criticalRooms = roomSummaries.filter((r) => r.summary.status === 'critico_vazio').length;
    
    // Produtos em estoque central
    const lowStockProducts = products.filter((p) => p.estoque_central <= p.estoque_minimo);
    const zeroStockProducts = products.filter((p) => p.estoque_central === 0);

    return {
      totalRooms,
      stockedRooms,
      needRestockRooms,
      criticalRooms,
      totalProducts: products.length,
      lowStockProducts,
      zeroStockProducts
    };
  }, [roomSummaries, products]);

  // Quartos filtrados
  const filteredRooms = useMemo(() => {
    return roomSummaries.filter((r) => {
      if (filterType === 'needs_restock') return r.summary.needsRestock;
      if (filterType === 'critical') return r.summary.status === 'critico_vazio';
      if (filterType === 'stocked') return r.summary.isFullyStocked;
      return true;
    });
  }, [roomSummaries, filterType]);

  // Ação Rápida: Repor todos os frigobares pendentes e concluir cartões
  const handleRestockAll = () => {
    if (confirm('Deseja reabastecer todos os frigobares dos quartos pendentes a partir do estoque do almoxarifado?')) {
      const res = reabastecerTodosQuartos(currentUser?.nome || 'Operador Almoxarifado');
      
      // Conclui todos os cards pendentes de reposição no Kanban
      cards
        .filter((c) => c.board_id === 'almoxarifado' && c.column_id !== 'alm_concluido' && (c.column_id === 'alm_reposicao' || c.column_id === 'alm_separacao'))
        .forEach((c) => {
          quickRestockFrigobarCard(c.id);
        });

      syncAllFromPMS();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 md:p-5 border border-stone-200 shadow-xs space-y-4 mb-4">
      {/* Barra de Topo com Indicadores Executivos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Identificação do Módulo Integrado */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${theme.bgSubtleClass} border ${theme.primaryBorder} flex items-center justify-center shadow-xs flex-shrink-0`}>
            <Package className={`w-6 h-6 ${theme.textAccentClass}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-sm md:text-base font-black ${fontClass} text-stone-900 tracking-tight`}>
                Central Operacional: Almoxarifado & Frigobar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" />
                Sincronizado em Tempo Real
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Fluxo unificado de reposição de quartos, controle de consumo e monitoramento do estoque central
            </p>
          </div>
        </div>

        {/* Métricas e Ações Executivas Rápidas */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          
          {/* Card Resumo: Frigobares */}
          <div className="px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-bold text-[11px]">Quartos:</span>
            <span className="font-extrabold text-emerald-700 flex items-center gap-1" title="Abastecidos">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.stockedRooms} OK
            </span>
            {(stats.needRestockRooms > 0 || stats.criticalRooms > 0) && (
              <span className="font-extrabold text-rose-600 flex items-center gap-1" title="Precisam de Reposição">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                {stats.needRestockRooms + stats.criticalRooms} Repor
              </span>
            )}
          </div>

          {/* Card Resumo: Estoque Crítico */}
          {stats.lowStockProducts.length > 0 && (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-xs text-amber-900 font-extrabold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{stats.lowStockProducts.length} itens no mínimo</span>
            </div>
          )}

          {/* Botão: Reabastecer Todos os Frigobares */}
          {stats.needRestockRooms + stats.criticalRooms > 0 && (
            <button
              type="button"
              onClick={handleRestockAll}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Baixar do estoque central e abastecer todos os frigobares pendentes"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repor Todos os Quartos</span>
              <span className="sm:hidden">Repor Todos</span>
            </button>
          )}

          {/* Botão: Acessar Módulo Completo */}
          <button
            type="button"
            onClick={() => setAdminActiveTab('frigobar')}
            className={`px-3 py-2 rounded-xl ${theme.buttonClass} text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer`}
            title="Abrir o módulo completo de Frigobar & Almoxarifado (Gestão de Produtos, Movimentações, Fornecedores e Auditorias)"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Gestão de Estoque Completa</span>
            <span className="md:hidden">Estoque</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>

          {/* Alternador de Expansão */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
            title={isExpanded ? 'Recolher painel rápido' : 'Expandir painel rápido'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Conteúdo Expansível: Grid de Monitoramento Rápido */}
      {isExpanded && (
        <div className="pt-3 border-t border-stone-100 space-y-4">
          
          {/* Seção 1: Alerta de Produtos com Estoque Crítico no Almoxarifado Central */}
          {stats.lowStockProducts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Alerta de Compras & Suprimentos: {stats.lowStockProducts.length} itens abaixo do estoque mínimo
                </span>
                <span className="text-[11px] text-amber-700/90 font-medium">
                  Almoxarifado Central
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {stats.lowStockProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-stone-900 block truncate" title={prod.nome}>
                        {prod.nome}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                        <span className="font-extrabold text-rose-600">
                          {prod.estoque_central} {prod.unidade}
                        </span>
                        <span>•</span>
                        <span>Mín: {prod.estoque_minimo}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                      prod.estoque_central === 0
                        ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prod.estoque_central === 0 ? 'Esgotado' : 'Crítico'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 2: Monitor Rápido dos Frigobares nos Quartos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700">
                  Status dos Frigobares por Quarto:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      filterType === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Todos ({roomSummaries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('needs_restock')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      filterType === 'needs_restock' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Reposição ({stats.needRestockRooms + stats.criticalRooms})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('stocked')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      filterType === 'stocked' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    100% Abastecido ({stats.stockedRooms})
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-stone-400">
                Clique no quarto para abastecer rapidamente
              </span>
            </div>

            {/* Grid dos Quartos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredRooms.map(({ minibar, summary }) => {
                const isNeed = summary.needsRestock;
                const isCrit = summary.status === 'critico_vazio';

                return (
                  <div
                    key={minibar.quarto_id}
                    className={`p-2.5 rounded-2xl border transition shadow-2xs flex flex-col justify-between gap-1.5 ${
                      isCrit
                        ? 'bg-rose-50 border-rose-200 hover:border-rose-400'
                        : isNeed
                        ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-stone-900">
                        Quarto {summary.quartoNumero}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isCrit
                          ? 'bg-rose-600 text-white'
                          : isNeed
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {summary.percentage}%
                      </span>
                    </div>

                    {/* Itens em falta ou status */}
                    <div className="text-[10px] text-stone-500">
                      {isNeed ? (
                        <span className="text-rose-700 font-bold block truncate" title={summary.missingList.map((m) => `${m.missing}x ${m.product.nome}`).join(', ')}>
                          {summary.missingCount} {summary.missingCount === 1 ? 'item faltando' : 'itens faltando'}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Completo
                        </span>
                      )}
                    </div>

                    {/* Botão de Reposição Direta */}
                    {isNeed ? (
                      <button
                        type="button"
                        onClick={() => {
                          quickRestockRoom(summary.quartoNumero, currentUser?.nome);
                          syncAllFromPMS();
                        }}
                        className="w-full mt-0.5 py-1 px-1.5 rounded-lg bg-white hover:bg-emerald-600 hover:text-white border border-amber-300 hover:border-emerald-600 text-amber-900 text-[10px] font-black transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                        title={`Abastecer Frigobar do Quarto ${summary.quartoNumero}`}
                      >
                        <Zap className="w-3 h-3 text-amber-600 group-hover:text-white" />
                        <span>Abastecer</span>
                      </button>
                    ) : (
                      <div className="text-[9px] text-stone-400 text-center py-0.5">
                        Padrão OK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
