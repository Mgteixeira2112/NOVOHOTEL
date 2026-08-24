import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  RotateCcw, 
  BedDouble, 
  Sparkles,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { 
  FrigobarProduct, 
  FrigobarTemplateQuarto 
} from '../../../types/frigobar';
import { TipoQuarto } from '../../../types';

interface FrigobarTemplatesTabProps {
  templates: FrigobarTemplateQuarto[];
  products: FrigobarProduct[];
  roomTypes: TipoQuarto[];
  onSaveTemplate: (template: FrigobarTemplateQuarto) => void;
  onApplyTemplateToAllRooms: (templateId: string) => void;
}

export const FrigobarTemplatesTab: React.FC<FrigobarTemplatesTabProps> = ({
  templates,
  products,
  roomTypes,
  onSaveTemplate,
  onApplyTemplateToAllRooms
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl-std');
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [currentItems, setCurrentItems] = useState<Array<{ produto_id: string; quantidade: number }>>(
    activeTemplate ? activeTemplate.itens_padrao : []
  );

  // Trocar template ativo
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setCurrentItems(tpl.itens_padrao);
    }
  };

  const handleUpdateQuantity = (produtoId: string, delta: number) => {
    setCurrentItems((prev) => {
      const existing = prev.find((i) => i.produto_id === produtoId);
      if (existing) {
        const nextQtd = Math.max(1, existing.quantidade + delta);
        return prev.map((i) => (i.produto_id === produtoId ? { ...i, quantidade: nextQtd } : i));
      }
      return prev;
    });
  };

  const handleRemoveProduct = (produtoId: string) => {
    setCurrentItems((prev) => prev.filter((i) => i.produto_id !== produtoId));
  };

  const handleAddProduct = (produtoId: string) => {
    if (currentItems.some((i) => i.produto_id === produtoId)) return;
    setCurrentItems((prev) => [...prev, { produto_id: produtoId, quantidade: 1 }]);
  };

  const handleSave = () => {
    if (!activeTemplate) return;
    onSaveTemplate({
      ...activeTemplate,
      itens_padrao: currentItems
    });
  };

  // Produtos que ainda não estão no template
  const availableProductsToAdd = products.filter(
    (p) => !currentItems.some((i) => i.produto_id === p.id)
  );

  // Valor total de produtos no template
  const valorTotalTemplate = currentItems.reduce((acc, item) => {
    const prod = products.find((p) => p.id === item.produto_id);
    return acc + (item.quantidade * (prod?.preco_venda || 0));
  }, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              Mix de Frigobar Padrão por Categoria de Quarto
            </h2>
            <p className="text-xs text-stone-500">
              Defina os produtos e quantidades ideais que devem compor o frigobar de cada tipo de acomodação
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onApplyTemplateToAllRooms(selectedTemplateId)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Sincronizar Mix em Todos os Quartos Desta Categoria</span>
            </button>
          </div>
        </div>

        {/* Seleção de Categoria / Template */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 overflow-x-auto">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedTemplateId === tpl.id
                  ? 'bg-stone-900 text-amber-300 shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>{tpl.tipo_quarto_nome}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor do Template Ativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1 & 2: Lista de Itens do Padrão */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Composição do Frigobar ({activeTemplate?.tipo_quarto_nome})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {activeTemplate?.descricao}
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                Valor Total do Mix: R$ {valorTotalTemplate.toFixed(2)}
              </span>
            </div>

            {/* Lista dos Itens */}
            <div className="space-y-2 pt-2">
              {currentItems.map((item) => {
                const prod = products.find((p) => p.id === item.produto_id);
                if (!prod) return null;

                return (
                  <div
                    key={item.produto_id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {prod.nome}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                          {prod.codigo}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Preço Venda: <strong className="text-stone-800">R$ {prod.preco_venda.toFixed(2)}</strong> • Subtotal: <strong className="text-emerald-800">R$ {(item.quantidade * prod.preco_venda).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.produto_id, -1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-stone-900">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.produto_id, 1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.produto_id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remover deste padrão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-400" />
                <span>Salvar Configuração do Padrão</span>
              </button>
            </div>

          </div>
        </div>

        {/* Coluna 3: Adicionar Novos Produtos ao Template */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              Adicionar Outros Produtos ao Mix
            </h3>
            <p className="text-[11px] text-stone-500">
              Selecione produtos do catálogo para incluir no padrão desta categoria:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pt-1">
              {availableProductsToAdd.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 flex items-center justify-between gap-2 transition"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-stone-900 truncate">
                      {p.nome}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      R$ {p.preco_venda.toFixed(2)} • Estoque: {p.estoque_central} un
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddProduct(p.id)}
                    className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-[11px] font-bold shrink-0 transition cursor-pointer"
                  >
                    + Incluir
                  </button>
                </div>
              ))}

              {availableProductsToAdd.length === 0 && (
                <p className="text-xs text-stone-400 italic text-center py-4">
                  Todos os produtos do catálogo já estão incluídos neste mix.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
