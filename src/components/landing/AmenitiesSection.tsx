import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { getTheme, getFontFamilyClass, getIconComponent } from '../../utils/themeHelper';

// Seção de comodidades, infraestrutura e serviços 100% Personalizável (White-Label)
export const AmenitiesSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const amenities = hotelConfig.comodidades_personalizadas || [];

  if (hotelConfig.secoes_visibilidade?.show_amenities === false || amenities.length === 0) {
    return null;
  }

  return (
    <section id="estrutura" className="py-24 bg-stone-900 text-stone-100 relative overflow-hidden border-t border-stone-800 scroll-mt-24">
      {/* Anchor alias para compatibilidade */}
      <span id="comodidades" className="absolute -top-24" aria-hidden="true" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
            {hotelConfig.estrutura_subtitulo || 'Estrutura Completa & Serviços'}
          </span>
          <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight`}>
            {hotelConfig.estrutura_titulo || 'Tudo o que você precisa em uma estadia inesquecível'}
          </h2>
          <p className="mt-4 text-stone-300 text-base sm:text-lg">
            {hotelConfig.estrutura_descricao || `Pensado nos mínimos detalhes para oferecer máxima comodidade, relaxamento e bem-estar no ${hotelConfig.nome}.`}
          </p>
        </div>

        {/* Grade de comodidades e serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {amenities.map((item) => {
            const Icon = getIconComponent(item.icone);
            return (
              <div 
                key={item.id}
                className={`bg-stone-950/80 border border-stone-800 rounded-2xl p-7 transition-all duration-300 group hover:bg-stone-950 ${theme.cardHighlight}`}
              >
                <div className={`w-12 h-12 rounded-xl ${theme.bgSubtleClass} border ${theme.borderAccentClass} ${theme.textAccentClass} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-bold text-stone-100 mb-2 transition-colors`}>
                  {item.titulo}
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  {item.descricao}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
