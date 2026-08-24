import React, { useState } from 'react';
import { 
  BedDouble, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ShoppingBag, 
  User, 
  LayoutGrid, 
  List, 
  Calendar, 
  Sparkles,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { 
  FrigobarProduct, 
  FrigobarQuarto, 
  FrigobarItemQuarto 
} from '../../../types/frigobar';
import { Quarto, TipoQuarto, Reserva, Hospede } from '../../../types';

interface FrigobarQuartosTabProps {
  roomMinibars: FrigobarQuarto[];
  products: FrigobarProduct[];
  rooms: Quarto[];
  roomTypes: TipoQuarto[];
  reservations: Reserva[];
  guests: Hospede[];
  onOpenAuditModal: (room: FrigobarQuarto) => void;
  onRestockSingleRoom: (quartoId: string) => void;
  onRestockAllRooms: () => void;
}

export const FrigobarQuartosTab: React.FC<FrigobarQuartosTabProps> = ({
  roomMinibars,
  products,
  rooms,
  roomTypes,
  reservations,
  guests,
  onOpenAuditModal,
  onRestockSingleRoom,
  onRestockAllRooms
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'precisa_reposicao' | 'abastecido' | 'ocupados'>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Mapear cada quarto com sua reserva ativa e dados do hóspede
  const enrichedRooms = roomMinibars.map((minibar) => {
    const roomInfo = rooms.find((r) => r.id === minibar.quarto_id || r.numero === minibar.quarto_numero);
    const roomTypeInfo = roomTypes.find((t) => t.id === roomInfo?.tipo_quarto_id);
    
    // Buscar reserva ativa no quarto (checkin realizado ou confirmada para hoje)
    const activeRes = reservations.find(
      (res) => res.quarto_id === roomInfo?.id && (res.status === 'checkin_realizado' || res.status === 'confirmada')
    );
    const guestInfo = activeRes ? guests.find((g) => g.id === activeRes.hospede_id) : undefined;

    // Calcular itens faltantes
    const itensFaltantes = minibar.itens.filter(
      (item) => item.quantidade_atual < item.quantidade_padrao
    );

    const valorTotalItensFrigobar = minibar.itens.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.produto_id);
      return acc + (item.quantidade_atual * (prod?.preco_venda || 0));
    }, 0);

    return {
      minibar,
      roomInfo,
      roomTypeInfo,
      activeRes,
      guestInfo,
      itensFaltantes,
      valorTotalItensFrigobar
    };
  });

  // Filtros de busca
  const filteredRooms = enrichedRooms.filter((item) => {
    const matchSearch = 
      item.minibar.quarto_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.guestInfo?.nome && item.guestInfo.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.roomTypeInfo?.nome && item.roomTypeInfo.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (statusFilter === 'precisa_reposicao') return item.minibar.status === 'precisa_reposicao';
    if (statusFilter === 'abastecido') return item.minibar.status === 'abastecido';
    if (statusFilter === 'ocupados') return !!item.activeRes;

    return true;
  });

  const totalPendentes = enrichedRooms.filter((r) => r.minibar.status === 'precisa_reposicao').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header com Filtros & Ações */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-amber-600" />
              Mapa de Frigobares por Quarto
            </h2>
            <p className="text-xs text-stone-500">
              Controle em tempo real de itens disponíveis, reposições pendentes e auditoria por acomodação
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRestockAllRooms}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Repor Todos os Quartos ({totalPendentes} pendentes)</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por número do quarto ou hóspede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos os Quartos' },
              { id: 'precisa_reposicao', label: `⚠️ Precisa Reposição (${totalPendentes})` },
              { id: 'abastecido', label: '✅ 100% Abastecidos' },
              { id: 'ocupados', label: '👥 Com Hóspedes Ativos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Alternador de Visualização */}
            <div className="border-l border-stone-200 pl-2 ml-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Exibição em Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((item) => {
            const isNeedsRestock = item.minibar.status === 'precisa_reposicao';
            const isOccupied = !!item.activeRes;
            const isExpanded = expandedRoomId === item.minibar.quarto_id;

            return (
              <div
                key={item.minibar.quarto_id}
                className={`rounded-3xl border transition-all flex flex-col justify-between shadow-sm overflow-hidden ${
                  isNeedsRestock
                    ? 'bg-white border-amber-300 ring-1 ring-amber-300/50'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Topo do Card */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                        {item.minibar.quarto_numero}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">
                          Quarto {item.minibar.quarto_numero}
                        </h3>
                        <span className="text-[11px] text-stone-500 block">
                          {item.roomTypeInfo?.nome || 'Acomodação'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isOccupied 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {isOccupied ? 'Ocupado' : 'Disponível'}
                      </span>

                      {isNeedsRestock ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reposição Pendente
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Abastecido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informação do Hóspede (se ocupado) */}
                  {isOccupied && item.guestInfo && (
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="font-bold text-purple-950 truncate">
                          {item.guestInfo.nome}
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-700 font-semibold shrink-0">
                        Reserva {item.activeRes?.codigo}
                      </span>
                    </div>
                  )}

                  {/* Alerta de Itens Faltantes / Consumidos */}
                  {isNeedsRestock && item.itensFaltantes.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <span className="text-[11px] font-bold text-amber-900 block">
                        Faltando para o padrão do quarto:
                      </span>
                      <div className="space-y-0.5">
                        {item.itensFaltantes.map((f) => {
                          const prod = products.find((p) => p.id === f.produto_id);
                          const falta = f.quantidade_padrao - f.quantidade_atual;
                          return (
                            <div key={f.produto_id} className="text-[11px] text-amber-800 flex justify-between">
                              <span>• {prod?.nome}</span>
                              <strong className="font-bold">{falta} un</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resumo do Valor do Frigobar */}
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                    <span>Mix Atual ({item.minibar.itens.length} itens)</span>
                    <span className="font-bold text-stone-800">
                      Total: R$ {item.valorTotalItensFrigobar.toFixed(2)}
                    </span>
                  </div>

                  {/* Lista detalhada colapsável de todos os itens */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-stone-200 space-y-1.5 max-h-48 overflow-y-auto">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                        Conteúdo do Frigobar:
                      </span>
                      {item.minibar.itens.map((i) => {
                        const prod = products.find((p) => p.id === i.produto_id);
                        if (!prod) return null;
                        const isMissing = i.quantidade_atual < i.quantidade_padrao;

                        return (
                          <div
                            key={i.produto_id}
                            className={`p-1.5 rounded-lg text-xs flex items-center justify-between ${
                              isMissing ? 'bg-amber-100/60 text-amber-900' : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span className="truncate pr-2">{prod.nome}</span>
                            <span className="font-bold shrink-0">
                              {i.quantidade_atual}/{i.quantidade_padrao}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedRoomId(isExpanded ? null : item.minibar.quarto_id)}
                    className="w-full text-center text-[11px] text-stone-500 hover:text-stone-800 font-medium flex items-center justify-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Todos os Produtos'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Rodapé de Ações do Card */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuditModal(item.minibar)}
                    className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conferir / Lançar</span>
                  </button>

                  {isNeedsRestock && (
                    <button
                      onClick={() => onRestockSingleRoom(item.minibar.quarto_id)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Repor para 100% Padrão"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repor</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização em Tabela Compacta */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5">Quarto / Categoria</th>
                  <th className="px-4 py-3.5">Hóspede Ocupante</th>
                  <th className="px-4 py-3.5">Status Frigobar</th>
                  <th className="px-4 py-3.5">Itens Faltando</th>
                  <th className="px-4 py-3.5">Valor Total Presente</th>
                  <th className="px-4 py-3.5">Última Verificação</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRooms.map((item) => {
                  const isNeedsRestock = item.minibar.status === 'precisa_reposicao';

                  return (
                    <tr key={item.minibar.quarto_id} className="hover:bg-stone-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-stone-900">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center text-xs">
                            {item.minibar.quarto_numero}
                          </span>
                          <div>
                            <div>Quarto {item.minibar.quarto_numero}</div>
                            <span className="text-[11px] font-normal text-stone-500">
                              {item.roomTypeInfo?.nome}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {item.guestInfo ? (
                          <div>
                            <span className="font-bold text-stone-800 block">{item.guestInfo.nome}</span>
                            <span className="text-[11px] text-stone-400">Reserva {item.activeRes?.codigo}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Desocupado</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isNeedsRestock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Precisa Reposição
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 100% Abastecido
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {item.itensFaltantes.length > 0 ? (
                          <span className="text-amber-800 font-bold">
                            {item.itensFaltantes.length} produtos pendentes
                          </span>
                        ) : (
                          <span className="text-stone-400">Nenhum</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-stone-900">
                        R$ {item.valorTotalItensFrigobar.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-stone-500 text-[11px]">
                        {item.minibar.ultima_verificacao || 'Hoje 09:00'}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => onOpenAuditModal(item.minibar)}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs transition cursor-pointer"
                        >
                          Conferir
                        </button>
                        {isNeedsRestock && (
                          <button
                            onClick={() => onRestockSingleRoom(item.minibar.quarto_id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            Repor
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
