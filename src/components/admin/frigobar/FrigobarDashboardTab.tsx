import React from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  Receipt, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  BedDouble,
  BarChart3,
  Search,
  Plus
} from 'lucide-react';
import { 
  FrigobarProduct, 
  FrigobarQuarto, 
  FrigobarMovimentacao,
  FrigobarAuditoriaRegistro
} from '../../../types/frigobar';
import { Quarto, Reserva } from '../../../types';

interface FrigobarDashboardTabProps {
  products: FrigobarProduct[];
  roomMinibars: FrigobarQuarto[];
  rooms: Quarto[];
  reservations: Reserva[];
  movements: FrigobarMovimentacao[];
  audits: FrigobarAuditoriaRegistro[];
  onOpenAuditModal: (room: FrigobarQuarto) => void;
  onOpenEntradaModal: () => void;
  onOpenAjusteModal: () => void;
  onOpenNewProductModal: () => void;
  onRestockAllRooms: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const FrigobarDashboardTab: React.FC<FrigobarDashboardTabProps> = ({
  products,
  roomMinibars,
  rooms,
  reservations,
  movements,
  audits,
  onOpenAuditModal,
  onOpenEntradaModal,
  onOpenAjusteModal,
  onOpenNewProductModal,
  onRestockAllRooms,
  onNavigateTab
}) => {
  // Cálculos Financeiros e de Estoque
  const valorEstoqueCentralCusto = products.reduce(
    (acc, p) => acc + (p.estoque_central * p.preco_custo),
    0
  );

  const valorEstoqueCentralVenda = products.reduce(
    (acc, p) => acc + (p.estoque_central * p.preco_venda),
    0
  );

  const valorEstoqueQuartosVenda = products.reduce(
    (acc, p) => acc + (p.estoque_alocado_quartos * p.preco_venda),
    0
  );

  // Faturamento e Movimentações de Saída
  const saidasConsumo = movements.filter((m) => m.tipo === 'saida_consumo_hospede');
  const faturamentoTotalConsumo = saidasConsumo.reduce((acc, m) => acc + m.valor_total, 0);
  const custoTotalConsumido = saidasConsumo.reduce(
    (acc, m) => acc + (m.quantidade * m.valor_unitario_custo),
    0
  );
  const lucroBrutoConsumo = faturamentoTotalConsumo - custoTotalConsumido;
  const margemMediaLucro = faturamentoTotalConsumo > 0 
    ? (lucroBrutoConsumo / faturamentoTotalConsumo) * 100 
    : 62.5;

  // Status dos Quartos
  const totalQuartos = roomMinibars.length || 1;
  const quartosPrecisamReposicao = roomMinibars.filter((r) => r.status === 'precisa_reposicao');
  const quartosAbastecidos = roomMinibars.filter((r) => r.status === 'abastecido');
  const percentAbastecido = Math.round((quartosAbastecidos.length / totalQuartos) * 100);

  // Produtos abaixo do estoque mínimo
  const produtosAbaixoMinimo = products.filter((p) => p.estoque_central <= p.estoque_minimo);

  // Ranking de produtos mais consumidos
  const rankingConsumo = products.map((prod) => {
    const totalQtd = movements
      .filter((m) => m.produto_id === prod.id && m.tipo === 'saida_consumo_hospede')
      .reduce((acc, m) => acc + m.quantidade, 0);
    const totalReceita = totalQtd * prod.preco_venda;
    return {
      produto: prod,
      quantidadeConsumida: totalQtd,
      receitaGerada: totalReceita
    };
  }).sort((a, b) => b.quantidadeConsumida - a.quantidadeConsumida);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Barra Superior com Resumo de Status & Ações Rápidas */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CRM de Frigobar & Estoque Hoteleiro</span>
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              Controle Integrado de Frigobares & Almoxarifado
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Monitore o abastecimento dos quartos em tempo real, efetue baixas automáticas na conta do hóspede e mantenha o estoque central sob controle rigoroso.
            </p>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('quartos')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <BedDouble className="w-4 h-4" />
              <span>Conferir Quartos ({quartosPrecisamReposicao.length} pendentes)</span>
            </button>

            <button
              onClick={onOpenEntradaModal}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Entrada NF-e</span>
            </button>

            <button
              onClick={onOpenAjusteModal}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Baixa / Avaria</span>
            </button>

            <button
              onClick={onOpenNewProductModal}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Faturamento Frigobar */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Faturamento de Frigobar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">
              R$ {faturamentoTotalConsumo.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{margemMediaLucro.toFixed(0)}%
              </span>
              <span>Margem Bruta (R$ {lucroBrutoConsumo.toFixed(2)})</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Valor Almoxarifado Central */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Estoque Almoxarifado
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">
              R$ {valorEstoqueCentralVenda.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Custo de aquisição: <strong className="text-stone-700">R$ {valorEstoqueCentralCusto.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Frigobares nos Quartos */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Alocado nos Quartos
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">
              R$ {valorEstoqueQuartosVenda.toFixed(2)}
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <span className="font-bold text-stone-800">{quartosAbastecidos.length} de {totalQuartos}</span>
              <span>quartos 100% abastecidos</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Alertas de Reposição */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Alertas de Compra
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              produtosAbaixoMinimo.length > 0 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">
              {produtosAbaixoMinimo.length} {produtosAbaixoMinimo.length === 1 ? 'item crítico' : 'itens críticos'}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {produtosAbaixoMinimo.length > 0 ? (
                <span className="text-rose-700 font-bold">Abaixo do ponto de pedido</span>
              ) : (
                <span className="text-emerald-700 font-medium">Estoque saudável e abastecido</span>
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Seção Central com 2 Colunas: Status dos Quartos vs Ranking e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1 e 2: Status dos Quartos e Auditorias Pendentes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card Status dos Quartos */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-stone-900 flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-amber-600" />
                  Status de Abastecimento dos Frigobares
                </h3>
                <p className="text-xs text-stone-500">
                  Visão rápida do mapa de frigobares do hotel
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRestockAllRooms}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Repor Todos 100%</span>
                </button>
                <button
                  onClick={() => onNavigateTab('quartos')}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Ver Todos →
                </button>
              </div>
            </div>

            {/* Barra de Progresso Geral */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-stone-600">
                <span>Nível de Abastecimento Geral</span>
                <span className="font-bold text-stone-900">{percentAbastecido}% Completo</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentAbastecido}%` }}
                />
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${100 - percentAbastecido}%` }}
                />
              </div>
            </div>

            {/* Mini Grid de Quartos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {roomMinibars.slice(0, 6).map((minibar) => {
                const roomData = rooms.find((r) => r.id === minibar.quarto_id || r.numero === minibar.quarto_numero);
                const isOccupied = roomData?.status === 'ocupado';
                const needsRestock = minibar.status === 'precisa_reposicao';

                return (
                  <div
                    key={minibar.quarto_id}
                    className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between gap-3 ${
                      needsRestock
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900">
                          Quarto {minibar.quarto_numero}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isOccupied 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {isOccupied ? 'Hóspede' : 'Livre'}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500 mt-1">
                        {needsRestock ? (
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Consumo pendente de reposição
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            100% Abastecido
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenAuditModal(minibar)}
                      className="w-full py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Auditar / Lançar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Últimas Movimentações e Lançamentos */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-stone-700" />
                Últimos Consumos e Movimentações
              </h3>
              <button
                onClick={() => onNavigateTab('movimentacoes')}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Extrato Completo →
              </button>
            </div>

            <div className="space-y-2.5">
              {movements.slice(0, 5).map((mov) => {
                const isConsumo = mov.tipo === 'saida_consumo_hospede';
                const isEntrada = mov.tipo === 'entrada_fornecedor';
                const isAvaria = mov.tipo === 'avaria_quebra';

                return (
                  <div
                    key={mov.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isConsumo 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : isEntrada 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isConsumo ? <DollarSign className="w-4 h-4" /> : isEntrada ? <Truck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 truncate">
                          {mov.produto_nome}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {mov.quarto_numero ? `Quarto ${mov.quarto_numero}` : ''} 
                          {mov.hospede_nome ? ` • ${mov.hospede_nome}` : ''}
                          {mov.nota_fiscal ? ` • ${mov.nota_fiscal}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-bold block ${
                        isConsumo ? 'text-emerald-700' : isEntrada ? 'text-blue-700' : 'text-rose-700'
                      }`}>
                        {isConsumo ? `+R$ ${mov.valor_total.toFixed(2)}` : `${mov.quantidade} un`}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {mov.data_hora.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Coluna 3: Alertas de Compra & Produtos Mais Vendidos */}
        <div className="space-y-6">
          
          {/* Card Alertas de Estoque Mínimo */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Ponto de Pedido (Críticos)
              </h3>
              <button
                onClick={onOpenEntradaModal}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Comprar +
              </button>
            </div>

            {produtosAbaixoMinimo.length > 0 ? (
              <div className="space-y-2.5">
                {produtosAbaixoMinimo.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block truncate">
                        {prod.nome}
                      </span>
                      <span className="text-[11px] text-rose-700 font-semibold">
                        Estoque Central: {prod.estoque_central} {prod.unidade} (Mín: {prod.estoque_minimo})
                      </span>
                    </div>
                    <button
                      onClick={onOpenEntradaModal}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition cursor-pointer shrink-0"
                    >
                      Repor Estoque
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="font-bold">Todos os itens com estoque seguro!</p>
                <p className="text-[11px] text-emerald-700">Nenhum produto abaixo do limite mínimo.</p>
              </div>
            )}
          </div>

          {/* Card Top Produtos Mais Consumidos */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Mais Consumidos (Volume)
              </h3>
              <button
                onClick={() => onNavigateTab('estoque')}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Catálogo →
              </button>
            </div>

            <div className="space-y-3">
              {rankingConsumo.slice(0, 5).map((item, idx) => (
                <div key={item.produto.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-800 truncate">
                      {idx + 1}. {item.produto.nome}
                    </span>
                    <span className="font-bold text-stone-900 shrink-0">
                      {item.quantidadeConsumida} un
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, (item.quantidadeConsumida / (rankingConsumo[0]?.quantidadeConsumida || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 text-right">
                    Receita: R$ {item.receitaGerada.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
