import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  DollarSign, 
  Percent, 
  Building2, 
  Calendar, 
  Barcode, 
  Check, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { FrigobarProduct, FrigobarProductCategory, ProductUnit } from '../../../types/frigobar';

interface FrigobarProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: FrigobarProduct | null;
  onSaveProduct: (product: Omit<FrigobarProduct, 'id'> & { id?: string }) => void;
}

export const FrigobarProductModal: React.FC<FrigobarProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaveProduct
}) => {
  if (!isOpen) return null;

  const [codigo, setCodigo] = useState(productToEdit?.codigo || '');
  const [nome, setNome] = useState(productToEdit?.nome || '');
  const [categoria, setCategoria] = useState<FrigobarProductCategory>(
    productToEdit?.categoria || 'bebidas_nao_alcoolicas'
  );
  const [unidade, setUnidade] = useState<ProductUnit>(productToEdit?.unidade || 'un');
  const [precoCusto, setPrecoCusto] = useState<number>(productToEdit?.preco_custo || 0);
  const [precoVenda, setPrecoVenda] = useState<number>(productToEdit?.preco_venda || 0);
  const [estoqueCentral, setEstoqueCentral] = useState<number>(productToEdit?.estoque_central || 0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(productToEdit?.estoque_minimo || 10);
  const [estoqueMaximo, setEstoqueMaximo] = useState<number>(productToEdit?.estoque_maximo || 100);
  const [validadeProxima, setValidadeProxima] = useState(productToEdit?.validade_proxima || '');
  const [loteAtual, setLoteAtual] = useState(productToEdit?.lote_atual || '');
  const [fornecedorPadrao, setFornecedorPadrao] = useState(productToEdit?.fornecedor_padrao || '');
  const [temperaturaServico, setTemperaturaServico] = useState<'gelada' | 'ambiente' | 'congelada'>(
    productToEdit?.temperatura_servico || 'gelada'
  );
  const [codigoBarras, setCodigoBarras] = useState(productToEdit?.codigo_barras || '');
  const [descricao, setDescricao] = useState(productToEdit?.descricao || '');
  const [ativo, setAtivo] = useState(productToEdit ? productToEdit.ativo : true);

  // Cálculos de Margem e Lucro Bruto
  const lucroBrutoReais = Math.max(0, precoVenda - precoCusto);
  const margemLucroPercent = precoVenda > 0 ? ((lucroBrutoReais / precoVenda) * 100) : 0;
  const markupPercent = precoCusto > 0 ? ((lucroBrutoReais / precoCusto) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSaveProduct({
      id: productToEdit?.id,
      codigo: codigo.trim() || `PRD-${Math.floor(100 + Math.random() * 900)}`,
      nome: nome.trim(),
      categoria,
      unidade,
      preco_custo: Number(precoCusto) || 0,
      preco_venda: Number(precoVenda) || 0,
      estoque_central: Number(estoqueCentral) || 0,
      estoque_alocado_quartos: productToEdit?.estoque_alocado_quartos || 0,
      estoque_minimo: Number(estoqueMinimo) || 0,
      estoque_maximo: Number(estoqueMaximo) || 100,
      validade_proxima: validadeProxima || undefined,
      lote_atual: loteAtual || undefined,
      fornecedor_padrao: fornecedorPadrao || undefined,
      temperatura_servico: temperaturaServico,
      codigo_barras: codigoBarras || undefined,
      descricao: descricao || undefined,
      ativo
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-luxury">
                {productToEdit ? 'Editar Produto de Frigobar' : 'Cadastrar Novo Item no Frigobar'}
              </h2>
              <p className="text-xs text-stone-400">
                Parâmetros de precificação, controle de estoque central e alertas mínimos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Identificação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Código / SKU *</label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: BEB-01"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cerveja Heineken Long Neck 330ml"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Categoria *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as FrigobarProductCategory)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="bebidas_nao_alcoolicas">Bebidas Não Alcoólicas</option>
                <option value="cervejas">Cervejas & Artesanais</option>
                <option value="vinhos_espumantes">Vinhos & Espumantes</option>
                <option value="destilados">Destilados & Doses</option>
                <option value="snacks_salgados">Snacks Salgados</option>
                <option value="snacks_doces">Doces & Chocolates</option>
                <option value="conveniencia_higiene">Higiene & Conveniência</option>
                <option value="kits_especiais">Kits Especiais / Românticos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Unidade de Medida</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="un">Unidade (un)</option>
                <option value="lata">Lata</option>
                <option value="garrafa">Garrafa</option>
                <option value="pacote">Pacote</option>
                <option value="dose">Dose</option>
                <option value="kit">Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Temperatura</label>
              <select
                value={temperaturaServico}
                onChange={(e) => setTemperaturaServico(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="gelada">❄️ Servir Gelada</option>
                <option value="ambiente">🌡️ Temperatura Ambiente</option>
                <option value="congelada">🧊 Congelador</option>
              </select>
            </div>
          </div>

          {/* Precificação e Lucro */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Precificação, Custos e Margem de Lucro
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Preço de Custo (Compra) (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precoCusto || ''}
                    onChange={(e) => setPrecoCusto(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Preço de Venda no Frigobar (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precoVenda || ''}
                    onChange={(e) => setPrecoVenda(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Simulador de Rentabilidade */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 text-center">
              <div className="p-2 rounded-xl bg-white border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Lucro Bruto Unit.</span>
                <span className="text-xs font-bold text-emerald-700">
                  R$ {lucroBrutoReais.toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Margem Bruta</span>
                <span className="text-xs font-bold text-stone-900">
                  {margemLucroPercent.toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Markup / Ganho</span>
                <span className="text-xs font-bold text-amber-700">
                  {markupPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Controle de Estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estoque Almoxarifado *
              </label>
              <input
                type="number"
                min="0"
                required
                value={estoqueCentral}
                onChange={(e) => setEstoqueCentral(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estoque Mínimo (Alerta) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estoque Máximo
              </label>
              <input
                type="number"
                min="0"
                value={estoqueMaximo}
                onChange={(e) => setEstoqueMaximo(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Fornecedor, Lote e Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Fornecedor Padrão</label>
              <input
                type="text"
                value={fornecedorPadrao}
                onChange={(e) => setFornecedorPadrao(e.target.value)}
                placeholder="Ex: Distribuidora Mantiqueira"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Lote Atual</label>
              <input
                type="text"
                value={loteAtual}
                onChange={(e) => setLoteAtual(e.target.value)}
                placeholder="Ex: LT-2026-90"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Validade Mais Próxima</label>
              <input
                type="date"
                value={validadeProxima}
                onChange={(e) => setValidadeProxima(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Código de barras e Descrição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Código de Barras (EAN)</label>
              <input
                type="text"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                placeholder="7890000000000"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                />
                <span>Produto Ativo para Distribuição nos Quartos</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Descrição / Notas do Produto</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Água mineral natural da fonte pura das montanhas de Minas"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
