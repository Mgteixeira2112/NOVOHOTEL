import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Trash2, 
  Gift, 
  RefreshCw, 
  Check,
  Building2,
  BedDouble
} from 'lucide-react';
import { FrigobarProduct, TipoMovimentacaoEstoque } from '../../../types/frigobar';

interface FrigobarAjusteModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FrigobarProduct[];
  roomNumbers: string[];
  currentUserName: string;
  onConfirmAjuste: (ajusteData: {
    produtoId: string;
    produtoNome: string;
    quantidade: number;
    tipo: TipoMovimentacaoEstoque;
    motivo: string;
    quartoNumero?: string;
    localEstoque: 'almoxarifado' | 'quarto';
    observacoes?: string;
  }) => void;
}

export const FrigobarAjusteModal: React.FC<FrigobarAjusteModalProps> = ({
  isOpen,
  onClose,
  products,
  roomNumbers,
  currentUserName,
  onConfirmAjuste
}) => {
  if (!isOpen) return null;

  const [produtoId, setProdutoId] = useState(products[0]?.id || '');
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState<TipoMovimentacaoEstoque>('avaria_quebra');
  const [localEstoque, setLocalEstoque] = useState<'almoxarifado' | 'quarto'>('almoxarifado');
  const [quartoNumero, setQuartoNumero] = useState(roomNumbers[0] || '101');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const selectedProduct = products.find((p) => p.id === produtoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    onConfirmAjuste({
      produtoId: selectedProduct.id,
      produtoNome: selectedProduct.nome,
      quantidade: Number(quantidade) || 1,
      tipo,
      localEstoque,
      quartoNumero: localEstoque === 'quarto' ? quartoNumero : undefined,
      motivo: motivo.trim() || 'Ajuste operacional de inventário',
      observacoes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-luxury">
                Ajuste de Estoque & Baixa Especial
              </h2>
              <p className="text-xs text-stone-400">
                Registro de avarias, quebras, validade vencida ou cortesia VIP
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Motivo do Ajuste */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Tipo de Movimentação / Ajuste *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimentacaoEstoque)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white text-stone-900"
            >
              <option value="avaria_quebra">💥 Avaria / Quebra / Garrafa Danificada</option>
              <option value="vencimento_descarte">⏳ Vencimento / Descarte por Validade</option>
              <option value="cortesia_gerencia">🎁 Cortesia Gerência / Upgrade VIP</option>
              <option value="ajuste_inventario">⚖️ Ajuste Manual de Balanço (Correção)</option>
            </select>
          </div>

          {/* Seleção do Produto */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Produto *</label>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium text-stone-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nome} (Almoxarifado: {p.estoque_central} un)
                </option>
              ))}
            </select>
          </div>

          {/* Local do Estoque e Quantidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Local da Baixa *</label>
              <select
                value={localEstoque}
                onChange={(e) => setLocalEstoque(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="almoxarifado">Almoxarifado Central</option>
                <option value="quarto">Frigobar do Quarto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Quantidade *</label>
              <input
                type="number"
                min="1"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {localEstoque === 'quarto' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Número do Quarto *</label>
              <select
                value={quartoNumero}
                onChange={(e) => setQuartoNumero(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
              >
                {roomNumbers.map((num) => (
                  <option key={num} value={num}>
                    Quarto {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Justificativa */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Motivo / Justificativa da Ocorrência *
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Garrafa quebrou ao descarregar / Oferecido cortesia hóspede quarto 201"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Detalhes de custo */}
          {selectedProduct && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
              <span className="text-stone-500">Impacto Financeiro (Custo):</span>
              <strong className="text-rose-700 font-bold">
                R$ {(quantidade * selectedProduct.preco_custo).toFixed(2)}
              </strong>
            </div>
          )}

          {/* Footer */}
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
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>Registrar Baixa / Ajuste</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
