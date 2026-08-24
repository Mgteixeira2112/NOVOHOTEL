import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Heart, 
  Sparkles, 
  DollarSign, 
  ShoppingBag, 
  MessageSquare, 
  Phone, 
  UserCheck, 
  Edit3,
  Calendar,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { 
  FrigobarProduct, 
  FrigobarPreferenciaHospede,
  FrigobarMovimentacao 
} from '../../../types/frigobar';
import { Hospede } from '../../../types';

interface FrigobarHospedesCrmTabProps {
  guests: Hospede[];
  products: FrigobarProduct[];
  preferences: FrigobarPreferenciaHospede[];
  movements: FrigobarMovimentacao[];
  onOpenPreferenceModal: (guest: Hospede, pref?: FrigobarPreferenciaHospede) => void;
}

export const FrigobarHospedesCrmTab: React.FC<FrigobarHospedesCrmTabProps> = ({
  guests,
  products,
  preferences,
  movements,
  onOpenPreferenceModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVipOnly, setFilterVipOnly] = useState(false);

  // Combinar dados de cada hóspede com seu perfil CRM de frigobar
  const enrichedGuests = guests.map((guest) => {
    const pref = preferences.find((p) => p.hospede_id === guest.id);
    
    // Movimentações de consumo do hóspede
    const guestMovements = movements.filter(
      (m) => (m.hospede_id === guest.id || (m.hospede_nome && m.hospede_nome.includes(guest.nome))) && m.tipo === 'saida_consumo_hospede'
    );

    const totalGastoCalculado = guestMovements.reduce((acc, m) => acc + m.valor_total, 0);
    const totalItensCalculado = guestMovements.reduce((acc, m) => acc + m.quantidade, 0);

    const totalGasto = Math.max(pref?.total_gasto_frigobar || 0, totalGastoCalculado);
    const totalItens = Math.max(pref?.total_itens_consumidos || 0, totalItensCalculado);

    // Mapear nomes dos itens favoritos
    const favoriteProductNames = (pref?.itens_favoritos || []).map((favId) => {
      const prod = products.find((p) => p.id === favId);
      return prod?.nome || 'Item Selecionado';
    });

    return {
      guest,
      pref,
      totalGasto,
      totalItens,
      favoriteProductNames,
      guestMovements
    };
  }).sort((a, b) => b.totalGasto - a.totalGasto);

  const filteredGuests = enrichedGuests.filter((item) => {
    const matchSearch = 
      item.guest.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.guest.telefone.includes(searchTerm) ||
      (item.guest.documento && item.guest.documento.includes(searchTerm));

    if (!matchSearch) return false;

    if (filterVipOnly && (!item.pref || item.totalGasto === 0)) return false;

    return true;
  });

  const totalFaturamentoCrm = enrichedGuests.reduce((acc, g) => acc + g.totalGasto, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600" />
              CRM de Consumo & Preferências de Hóspedes
            </h2>
            <p className="text-xs text-stone-500">
              Personalize o frigobar antes da chegada do hóspede e fidelize clientes com preferências customizadas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <span className="text-stone-500 block text-[10px] font-bold">LTV Total de Frigobar</span>
              <span className="text-sm font-bold text-amber-900">R$ {totalFaturamentoCrm.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterVipOnly(!filterVipOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterVipOnly
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apenas com Consumo / Perfil VIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cards dos Hóspedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGuests.map((item) => {
          const hasFavs = item.favoriteProductNames.length > 0;
          const hasRestrictions = item.pref?.restricoes_alimentares && item.pref.restricoes_alimentares.length > 0;

          return (
            <div
              key={item.guest.id}
              className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition"
            >
              <div className="space-y-3">
                
                {/* Nome e Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-300 font-bold flex items-center justify-center text-sm">
                      {item.guest.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 leading-tight">
                        {item.guest.nome}
                      </h3>
                      <span className="text-[11px] text-stone-500 block">
                        {item.guest.telefone}
                      </span>
                    </div>
                  </div>

                  {item.totalGasto > 200 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" /> VIP
                    </span>
                  )}
                </div>

                {/* Métricas de Consumo */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Total Gasto Frigobar</span>
                    <strong className="text-emerald-800 font-bold">R$ {item.totalGasto.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Itens Consumidos</span>
                    <strong className="text-stone-900 font-bold">{item.totalItens} un</strong>
                  </div>
                </div>

                {/* Itens Favoritos */}
                {hasFavs && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Itens Favoritos para o Frigobar:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.favoriteProductNames.map((fav, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium"
                        >
                          ★ {fav}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restrições */}
                {hasRestrictions && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Restrições & Preferências:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.pref?.restricoes_alimentares?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[10px] font-medium"
                        >
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas de Concierge */}
                {item.pref?.notas_vip && (
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 italic">
                    "{item.pref.notas_vip}"
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <a
                  href={`https://wa.me/55${item.guest.telefone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(item.guest.nome)},%20daqui%20%C3%A9%20da%20recep%C3%A7%C3%A3o%20do%20Itajub%C3%A1%20Flat%20Hotel!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => onOpenPreferenceModal(item.guest, item.pref)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personalizar Frigobar</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
