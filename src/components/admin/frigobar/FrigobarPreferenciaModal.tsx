import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Heart, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2,
  Tag
} from 'lucide-react';
import { FrigobarProduct, FrigobarPreferenciaHospede } from '../../../types/frigobar';
import { Hospede } from '../../../types';

interface FrigobarPreferenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Hospede;
  existingPreference?: FrigobarPreferenciaHospede | null;
  products: FrigobarProduct[];
  onSavePreference: (preference: FrigobarPreferenciaHospede) => void;
}

export const FrigobarPreferenciaModal: React.FC<FrigobarPreferenciaModalProps> = ({
  isOpen,
  onClose,
  guest,
  existingPreference,
  products,
  onSavePreference
}) => {
  if (!isOpen) return null;

  const [itensFavoritos, setItensFavoritos] = useState<string[]>(
    existingPreference?.itens_favoritos || []
  );
  const [temperatura, setTemperatura] = useState(
    existingPreference?.temperatura_preferida || 'Bebidas bem geladas'
  );
  const [notasVip, setNotasVip] = useState(
    existingPreference?.notas_vip || ''
  );
  const [restricoes, setRestricoes] = useState<string[]>(
    existingPreference?.restricoes_alimentares || []
  );

  const toggleFavorite = (productId: string) => {
    setItensFavoritos((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleRestricao = (tag: string) => {
    setRestricoes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSavePreference({
      hospede_id: guest.id,
      hospede_nome: guest.nome,
      hospede_documento: guest.documento,
      hospede_telefone: guest.telefone,
      itens_favoritos: itensFavoritos,
      restricoes_alimentares: restricoes,
      temperatura_preferida: temperatura,
      notas_vip: notasVip,
      total_gasto_frigobar: existingPreference?.total_gasto_frigobar || 0,
      total_itens_consumidos: existingPreference?.total_itens_consumidos || 0,
      ultima_compra_data: existingPreference?.ultima_compra_data
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
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-luxury">
                Perfil de Frigobar VIP • {guest.nome}
              </h2>
              <p className="text-xs text-stone-400">
                Personalização do frigobar antes do check-in e histórico de preferências
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
          
          {/* Restrições / Filtros Especiais */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Restrições e Preferências Alimentares
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'zero_acucar', label: '🥤 Preferência Zero Açúcar / Diet' },
                { id: 'sem_alcool', label: '🚫 Não Consome Bebidas Alcoólicas' },
                { id: 'sem_gluten', label: '🌾 Celíaco / Sem Glúten' },
                { id: 'sem_lactose', label: '🥛 Intolerante a Lactose' },
                { id: 'vegano', label: '🌱 Vegano / Vegetariano' },
                { id: 'artesanal', label: '🍺 Apreciador de Cervejas Artesanais' },
                { id: 'vinhos_premium', label: '🍷 Apreciador de Vinhos & Espumantes' }
              ].map((tag) => {
                const isSelected = restricoes.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleRestricao(tag.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Produtos Favoritos */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Itens Favoritos para Abastecer no Frigobar
            </label>
            <p className="text-[11px] text-stone-500 mb-2">
              Clique nos produtos que o hóspede mais gosta para que a camareira receba alerta no pré-check-in:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-2xl">
              {products.map((p) => {
                const isFav = itensFavoritos.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleFavorite(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isFav
                        ? 'bg-amber-50/80 border-amber-400 text-stone-900'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block text-xs font-bold truncate">{p.nome}</span>
                      <span className="text-[10px] text-stone-400">R$ {p.preco_venda.toFixed(2)}</span>
                    </div>
                    {isFav ? (
                      <Heart className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                    ) : (
                      <Heart className="w-4 h-4 text-stone-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperatura e Posição */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Preferência de Temperatura / Armazenamento
            </label>
            <input
              type="text"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              placeholder="Ex: Cervejas no compartimento superior bem geladas, água natural"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Notas do Hóspede VIP */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Notas da Recepção & Governança (CRM Frigobar)
            </label>
            <textarea
              rows={3}
              value={notasVip}
              onChange={(e) => setNotasVip(e.target.value)}
              placeholder="Ex: Hóspede frequente a trabalho. Solicita sempre 4 águas com gás extras na véspera da chegada."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none"
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
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>Salvar Perfil VIP</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
