import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Truck, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Percent, 
  Calendar, 
  Barcode, 
  Filter, 
  Download, 
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { 
  FrigobarProduct, 
  FrigobarProductCategory 
} from '../../../types/frigobar';

interface FrigobarEstoqueCentralTabProps {
  products: FrigobarProduct[];
  onOpenProductModal: (product?: FrigobarProduct) => void;
  onOpenEntradaModal: () => void;
  onOpenAjusteModal: () => void;
  onDeleteProduct: (productId: string) => void;
}

export const FrigobarEstoqueCentralTab: React.FC<FrigobarEstoqueCentralTabProps> = ({
  products,
  onOpenProductModal,
  onOpenEntradaModal,
  onOpenAjusteModal,
  onDeleteProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [stockLevelFilter, setStockLevelFilter] = useState<'todos' | 'criticos' | 'normais'>('todos');

  // Filtros
  const filteredProducts = products.filter((p) => {
    const matchSearch = 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.includes(searchTerm)) ||
      (p.fornecedor_padrao && p.fornecedor_padrao.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedCategory !== 'todas' && p.categoria !== selectedCategory) return false;

    if (stockLevelFilter === 'criticos' && p.estoque_central > p.estoque_minimo) return false;
    if (stockLevelFilter === 'normais' && p.estoque_central <= p.estoque_minimo) return false;

    return true;
  });

  // Estatísticas do Catálogo
  const totalItensAlmoxarifado = products.reduce((acc, p) => acc + p.estoque_central, 0);
  const totalItensQuartos = products.reduce((acc, p) => acc + p.estoque_alocado_quartos, 0);
  const valorTotalCusto = products.reduce((acc, p) => acc + (p.estoque_central * p.preco_custo), 0);
  const valorTotalVenda = products.reduce((acc, p) => acc + (p.estoque_central * p.preco_venda), 0);
  const produtosCriticos = products.filter((p) => p.estoque_central <= p.estoque_minimo);

  // Exportar Balanço em CSV
  const handleExportCSV = () => {
    const headers = 'Codigo,Nome,Categoria,Preco_Custo,Preco_Venda,Margem_Lucro_Pct,Estoque_Almoxarifado,Estoque_Quartos,Estoque_Total,Estoque_Minimo,Status_Estoque\n';
    const rows = products.map((p) => {
      const margem = p.preco_venda > 0 ? (((p.preco_venda - p.preco_custo) / p.preco_venda) * 100).toFixed(1) : '0';
      const status = p.estoque_central <= p.estoque_minimo ? 'PONTO_DE_PEDIDO' : 'NORMAL';
      return `"${p.codigo}","${p.nome}","${p.categoria}",${p.preco_custo.toFixed(2)},${p.preco_venda.toFixed(2)},${margem}%,${p.estoque_central},${p.estoque_alocado_quartos},${p.estoque_central + p.estoque_alocado_quartos},${p.estoque_minimo},"${status}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `balanco_estoque_frigobar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header com Totais & Ações de Catálogo */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Catálogo de Produtos & Almoxarifado Central
            </h2>
            <p className="text-xs text-stone-500">
              Gerencie precificação, margens de lucro, alertas de ressuprimento e estoque físico
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Balanço CSV</span>
            </button>

            <button
              onClick={onOpenEntradaModal}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Entrada de Compra (NF-e)</span>
            </button>

            <button
              onClick={() => onOpenProductModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Mini Cards de Estatística do Estoque */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold block">Qtd em Almoxarifado</span>
            <span className="text-sm font-bold text-stone-900">{totalItensAlmoxarifado} unidades</span>
          </div>
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold block">Qtd nos Frigobares</span>
            <span className="text-sm font-bold text-stone-900">{totalItensQuartos} unidades</span>
          </div>
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold block">Valor Custo Central</span>
            <span className="text-sm font-bold text-stone-900">R$ {valorTotalCusto.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 font-bold block">Potencial de Venda</span>
            <span className="text-sm font-bold text-emerald-800">R$ {valorTotalVenda.toFixed(2)}</span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU, código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="bebidas_nao_alcoolicas">Bebidas Não Alcoólicas</option>
              <option value="cervejas">Cervejas & Artesanais</option>
              <option value="vinhos_espumantes">Vinhos & Espumantes</option>
              <option value="destilados">Destilados & Doses</option>
              <option value="snacks_salgados">Snacks Salgados</option>
              <option value="snacks_doces">Doces & Chocolates</option>
              <option value="conveniencia_higiene">Higiene & Conveniência</option>
              <option value="kits_especiais">Kits Especiais</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setStockLevelFilter('todos')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  stockLevelFilter === 'todos'
                    ? 'bg-stone-900 text-amber-300'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStockLevelFilter('criticos')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  stockLevelFilter === 'criticos'
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-100 text-rose-700 hover:bg-stone-200'
                }`}
              >
                ⚠️ Ponto de Pedido ({produtosCriticos.length})
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Tabela Completa de Produtos */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Código / Produto</th>
                <th className="px-4 py-3.5">Categoria</th>
                <th className="px-4 py-3.5">Preço Custo</th>
                <th className="px-4 py-3.5">Preço Venda</th>
                <th className="px-4 py-3.5">Margem / Lucro</th>
                <th className="px-4 py-3.5">Almoxarifado</th>
                <th className="px-4 py-3.5">Quartos</th>
                <th className="px-4 py-3.5">Status Estoque</th>
                <th className="px-4 py-3.5">Validade / Lote</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredProducts.map((prod) => {
                const lucro = Math.max(0, prod.preco_venda - prod.preco_custo);
                const margemPct = prod.preco_venda > 0 ? (lucro / prod.preco_venda) * 100 : 0;
                const isCritico = prod.estoque_central <= prod.estoque_minimo;

                return (
                  <tr key={prod.id} className="hover:bg-stone-50/80 transition">
                    
                    {/* Código e Nome */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-stone-900">{prod.nome}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2">
                        <span className="font-semibold text-stone-700">{prod.codigo}</span>
                        {prod.codigo_barras && (
                          <span className="text-stone-400">EAN: {prod.codigo_barras}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 capitalize">
                          {prod.unidade}
                        </span>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-3.5 capitalize text-stone-700">
                      {prod.categoria.replace(/_/g, ' ')}
                    </td>

                    {/* Preço de Custo */}
                    <td className="px-4 py-3.5 font-medium text-stone-600">
                      R$ {prod.preco_custo.toFixed(2)}
                    </td>

                    {/* Preço de Venda */}
                    <td className="px-4 py-3.5 font-bold text-stone-900">
                      R$ {prod.preco_venda.toFixed(2)}
                    </td>

                    {/* Margem */}
                    <td className="px-4 py-3.5">
                      <div className="text-emerald-700 font-bold">
                        +{margemPct.toFixed(0)}%
                      </div>
                      <span className="text-[10px] text-stone-400">
                        (R$ {lucro.toFixed(2)}/un)
                      </span>
                    </td>

                    {/* Estoque Almoxarifado */}
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${
                        isCritico ? 'text-rose-600' : 'text-stone-900'
                      }`}>
                        {prod.estoque_central} {prod.unidade}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Mín: {prod.estoque_minimo}
                      </span>
                    </td>

                    {/* Estoque Quartos */}
                    <td className="px-4 py-3.5 font-medium text-stone-700">
                      {prod.estoque_alocado_quartos} {prod.unidade}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {isCritico ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Ponto de Pedido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Estoque OK
                        </span>
                      )}
                    </td>

                    {/* Validade e Lote */}
                    <td className="px-4 py-3.5 text-[11px] text-stone-500">
                      <div>{prod.validade_proxima || '2027'}</div>
                      <span className="text-stone-400">{prod.lote_atual || 'Lote Padrão'}</span>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => onOpenProductModal(prod)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer"
                        title="Editar Produto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
