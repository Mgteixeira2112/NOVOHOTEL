import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  FileText, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { FrigobarProduct, FornecedorFrigobar } from '../../../types/frigobar';

interface FrigobarEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FrigobarProduct[];
  suppliers: FornecedorFrigobar[];
  currentUserName: string;
  onConfirmEntrada: (entradaData: {
    notaFiscal: string;
    fornecedorNome: string;
    itens: Array<{
      produtoId: string;
      produtoNome: string;
      quantidade: number;
      valorUnitarioCusto: number;
      valorTotal: number;
      lote?: string;
      validade?: string;
    }>;
    valorTotalNota: number;
    observacoes?: string;
  }) => void;
}

export const FrigobarEntradaModal: React.FC<FrigobarEntradaModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  currentUserName,
  onConfirmEntrada
}) => {
  if (!isOpen) return null;

  const [notaFiscal, setNotaFiscal] = useState('');
  const [fornecedorNome, setFornecedorNome] = useState(suppliers[0]?.nome_fantasia || 'Distribuidora Vale do Sapucaí');
  const [observacoes, setObservacoes] = useState('');

  const [itens, setItens] = useState<Array<{
    produtoId: string;
    quantidade: number;
    valorUnitarioCusto: number;
    lote?: string;
    validade?: string;
  }>>([
    {
      produtoId: products[0]?.id || '',
      quantidade: 24,
      valorUnitarioCusto: products[0]?.preco_custo || 3.00,
      lote: '',
      validade: ''
    }
  ]);

  const handleAddItem = () => {
    setItens((prev) => [
      ...prev,
      {
        produtoId: products[0]?.id || '',
        quantidade: 12,
        valorUnitarioCusto: products[0]?.preco_custo || 3.00,
        lote: '',
        validade: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, produtoId: string) => {
    const prod = products.find((p) => p.id === produtoId);
    setItens((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              produtoId,
              valorUnitarioCusto: prod ? prod.preco_custo : item.valorUnitarioCusto
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, quantidade: number) => {
    setItens((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantidade: Math.max(1, quantidade) } : item
      )
    );
  };

  const handleCustoChange = (index: number, custo: number) => {
    setItens((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, valorUnitarioCusto: Math.max(0, custo) } : item
      )
    );
  };

  const handleLoteChange = (index: number, lote: string) => {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, lote } : item))
    );
  };

  const handleValidadeChange = (index: number, validade: string) => {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, validade } : item))
    );
  };

  const calculatedItems = itens.map((item) => {
    const prod = products.find((p) => p.id === item.produtoId);
    return {
      produtoId: item.produtoId,
      produtoNome: prod?.nome || 'Produto Selecionado',
      quantidade: item.quantidade,
      valorUnitarioCusto: item.valorUnitarioCusto,
      valorTotal: item.quantidade * item.valorUnitarioCusto,
      lote: item.lote,
      validade: item.validade
    };
  });

  const valorTotalNota = calculatedItems.reduce((acc, item) => acc + item.valorTotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedItems.length === 0) return;

    onConfirmEntrada({
      notaFiscal: notaFiscal.trim() || `NF-${Math.floor(10000 + Math.random() * 90000)}`,
      fornecedorNome,
      itens: calculatedItems,
      valorTotalNota,
      observacoes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-luxury">
                Entrada de Mercadoria / Compra Fornecedor (NF-e)
              </h2>
              <p className="text-xs text-stone-400">
                Abastecimento do Almoxarifado Central com atualização de custos e lotes
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
          
          {/* Dados da Nota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Número da Nota Fiscal / Pedido *
              </label>
              <input
                type="text"
                required
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                placeholder="Ex: NF-e 44920 / Pedido 108"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Fornecedor *</label>
              <select
                value={fornecedorNome}
                onChange={(e) => setFornecedorNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.nome_fantasia}>
                    {s.nome_fantasia} ({s.cnpj})
                  </option>
                ))}
                <option value="Outro Fornecedor / Compra Direta">Outro Fornecedor / Compra Direta</option>
              </select>
            </div>
          </div>

          {/* Lista de Itens para Entrada */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Produtos Comprados para o Almoxarifado
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Outro Produto
              </button>
            </div>

            <div className="space-y-2">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    
                    {/* Seleção do Produto */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Produto</label>
                      <select
                        value={item.produtoId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium text-stone-900"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.codigo}] {p.nome} (Atual: {p.estoque_central} un)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Qtd Comprada</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantidade}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-900 bg-white"
                      />
                    </div>

                    {/* Custo Unitário */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Custo Unit (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.valorUnitarioCusto}
                        onChange={(e) => handleCustoChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-900 bg-white"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="sm:col-span-2 text-right">
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Subtotal</label>
                      <span className="text-xs font-bold text-emerald-800">
                        R$ {(item.quantidade * item.valorUnitarioCusto).toFixed(2)}
                      </span>
                    </div>

                    {/* Excluir Linha */}
                    <div className="sm:col-span-1 flex justify-end">
                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lote e Validade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-200/60">
                    <input
                      type="text"
                      placeholder="Lote do Fornecedor (opcional)"
                      value={item.lote || ''}
                      onChange={(e) => handleLoteChange(index, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] bg-white"
                    />
                    <input
                      type="date"
                      title="Validade do Lote"
                      value={item.validade || ''}
                      onChange={(e) => handleValidadeChange(index, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações / Condições de Recebimento
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Mercadoria conferida e descarregada no Almoxarifado Principal"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Totalizador */}
          <div className="p-4 rounded-2xl bg-stone-900 text-white flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 block">Total da Nota de Entrada</span>
              <span className="text-xs text-stone-300">
                Registrado por: <strong>{currentUserName}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-amber-300">
                R$ {valorTotalNota.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
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
              <PackageCheck className="w-4 h-4 text-amber-400" />
              <span>Concluir Entrada no Almoxarifado</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
