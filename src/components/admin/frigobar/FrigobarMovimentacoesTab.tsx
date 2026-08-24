import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Truck, 
  DollarSign, 
  RotateCcw, 
  AlertTriangle, 
  Gift, 
  ShoppingBag,
  User,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  FrigobarMovimentacao, 
  TipoMovimentacaoEstoque 
} from '../../../types/frigobar';

interface FrigobarMovimentacoesTabProps {
  movements: FrigobarMovimentacao[];
}

export const FrigobarMovimentacoesTab: React.FC<FrigobarMovimentacoesTabProps> = ({
  movements
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  // Filtros de movimentação
  const filteredMovements = movements.filter((m) => {
    const matchSearch = 
      m.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.quarto_numero && m.quarto_numero.includes(searchTerm)) ||
      (m.hospede_nome && m.hospede_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.responsavel_nome && m.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.nota_fiscal && m.nota_fiscal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.motivo && m.motivo.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (typeFilter !== 'todos' && m.tipo !== typeFilter) return false;

    return true;
  });

  // Totais
  const totalEntradasValor = movements
    .filter((m) => m.tipo === 'entrada_fornecedor')
    .reduce((acc, m) => acc + m.valor_total, 0);

  const totalConsumosValor = movements
    .filter((m) => m.tipo === 'saida_consumo_hospede')
    .reduce((acc, m) => acc + m.valor_total, 0);

  const totalPerdasValor = movements
    .filter((m) => m.tipo === 'avaria_quebra' || m.tipo === 'vencimento_descarte')
    .reduce((acc, m) => acc + m.valor_total, 0);

  const handleExportCSV = () => {
    const headers = 'Data_Hora,Tipo,Produto,Quantidade,Custo_Unit,Venda_Unit,Valor_Total,Quarto,Hospede,Reserva,Responsavel,Nota_Fiscal,Motivo\n';
    const rows = movements.map((m) => {
      return `"${m.data_hora}","${m.tipo}","${m.produto_nome}",${m.quantidade},${m.valor_unitario_custo.toFixed(2)},${m.valor_unitario_venda.toFixed(2)},${m.valor_total.toFixed(2)},"${m.quarto_numero || ''}","${m.hospede_nome || ''}","${m.codigo_reserva || ''}","${m.responsavel_nome}","${m.nota_fiscal || ''}","${m.motivo || ''}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extrato_movimentacoes_frigobar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (tipo: TipoMovimentacaoEstoque) => {
    switch (tipo) {
      case 'saida_consumo_hospede':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Consumo Hóspede',
          icon: DollarSign
        };
      case 'entrada_fornecedor':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Entrada Compra NF-e',
          icon: Truck
        };
      case 'transferencia_reposicao':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Reposição Quarto',
          icon: RotateCcw
        };
      case 'avaria_quebra':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Avaria / Quebra',
          icon: AlertTriangle
        };
      case 'vencimento_descarte':
        return {
          bg: 'bg-stone-200 text-stone-800 border-stone-300',
          label: 'Vencimento',
          icon: AlertTriangle
        };
      case 'cortesia_gerencia':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Cortesia VIP',
          icon: Gift
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          label: 'Ajuste Inventário',
          icon: History
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Extrato & Razão de Movimentações de Estoque
            </h2>
            <p className="text-xs text-stone-500">
              Auditoria em tempo real de todas as entradas, consumos de hóspedes, reposições e perdas
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Extrato CSV</span>
          </button>
        </div>

        {/* Badges de Resumo Financeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Receita Frigobar</span>
              <span className="text-base font-bold text-emerald-950">R$ {totalConsumosValor.toFixed(2)}</span>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Compras Almoxarifado</span>
              <span className="text-base font-bold text-blue-950">R$ {totalEntradasValor.toFixed(2)}</span>
            </div>
            <Truck className="w-5 h-5 text-blue-600" />
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Perdas, Quebras & Descartes</span>
              <span className="text-base font-bold text-rose-950">R$ {totalPerdasValor.toFixed(2)}</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por produto, quarto, hóspede, NF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'saida_consumo_hospede', label: '💵 Consumos de Hóspede' },
              { id: 'entrada_fornecedor', label: '📦 Entradas NF-e' },
              { id: 'transferencia_reposicao', label: '🔄 Reposições' },
              { id: 'avaria_quebra', label: '⚠️ Quebras/Avarias' },
              { id: 'cortesia_gerencia', label: '🎁 Cortesias' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Data / Hora</th>
                <th className="px-4 py-3.5">Tipo de Movimento</th>
                <th className="px-4 py-3.5">Produto Movimentado</th>
                <th className="px-4 py-3.5">Quantidade</th>
                <th className="px-4 py-3.5">Valor Total</th>
                <th className="px-4 py-3.5">Origem / Destino (Quarto)</th>
                <th className="px-4 py-3.5">Hóspede / Reserva</th>
                <th className="px-4 py-3.5">Responsável / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredMovements.map((mov) => {
                const badge = getBadgeStyle(mov.tipo);
                const BadgeIcon = badge.icon;
                const isConsumo = mov.tipo === 'saida_consumo_hospede';

                return (
                  <tr key={mov.id} className="hover:bg-stone-50/80 transition">
                    
                    {/* Data */}
                    <td className="px-5 py-3.5 text-stone-500 whitespace-nowrap font-medium">
                      {mov.data_hora}
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>

                    {/* Produto */}
                    <td className="px-4 py-3.5 font-bold text-stone-900">
                      {mov.produto_nome}
                    </td>

                    {/* Quantidade */}
                    <td className="px-4 py-3.5 font-bold text-stone-800">
                      {mov.quantidade} un
                    </td>

                    {/* Valor */}
                    <td className="px-4 py-3.5 font-bold">
                      <span className={isConsumo ? 'text-emerald-700' : 'text-stone-900'}>
                        {isConsumo ? '+' : ''}R$ {mov.valor_total.toFixed(2)}
                      </span>
                    </td>

                    {/* Quarto */}
                    <td className="px-4 py-3.5">
                      {mov.quarto_numero ? (
                        <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                          Quarto {mov.quarto_numero}
                        </span>
                      ) : (
                        <span className="text-stone-400">Almoxarifado Central</span>
                      )}
                    </td>

                    {/* Hóspede */}
                    <td className="px-4 py-3.5">
                      {mov.hospede_nome ? (
                        <div>
                          <span className="font-bold text-stone-800 block">{mov.hospede_nome}</span>
                          <span className="text-[10px] text-stone-400">Reserva {mov.codigo_reserva}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* Responsável e Motivo */}
                    <td className="px-4 py-3.5 text-stone-600 text-[11px]">
                      <div><strong>{mov.responsavel_nome}</strong></div>
                      {mov.motivo && <span className="text-stone-400 italic block">{mov.motivo}</span>}
                      {mov.nota_fiscal && <span className="text-blue-700 font-medium block">{mov.nota_fiscal}</span>}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
