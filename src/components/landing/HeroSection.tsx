import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { BookingSearchBar } from './BookingSearchBar';
import { Star, MapPin } from 'lucide-react';
import { getTheme, getFontFamilyClass, getIconComponent } from '../../utils/themeHelper';

// Componente principal da Seção Hero (Apresentação de destaque) 100% Personalizável (White-Label)
export const HeroSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const heroTitle = hotelConfig.hero_titulo_custom || hotelConfig.nome;
  const heroSubtitle = hotelConfig.hero_subtitulo_custom || hotelConfig.slogan;
  const heroBadge = hotelConfig.hero_badge_custom || `${hotelConfig.bairro || 'Centro'}, ${hotelConfig.cidade} — ${hotelConfig.estado}`;
  
  // Destaques rápidos extraídos das comodidades marcadas como destaque (ou fallback)
  const highlightedAmenities = (hotelConfig.comodidades_personalizadas || [])
    .filter(c => c.destaque)
    .slice(0, 4);

  const opacityPercent = hotelConfig.hero_overlay_opacity !== undefined ? hotelConfig.hero_overlay_opacity : 70;
  const overlayAlpha = (100 - opacityPercent) / 100;

  const getEstablishmentLabel = () => {
    switch (hotelConfig.tipo_estabelecimento) {
      case 'pousada': return 'Pousada de Charme';
      case 'resort': return 'Resort & Spa';
      case 'boutique': return 'Hotel Boutique';
      case 'chales': return 'Chalés de Montanha';
      case 'fazenda': return 'Hotel Fazenda';
      case 'flat': return 'Apart-Hotel Executivo';
      default: return 'Hotel';
    }
  };

  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center justify-center pt-10 pb-20 overflow-hidden bg-stone-950">
      
      {/* Imagem de fundo panorâmica com sobreposição suave de gradiente escuro e opacidade configurável */}
      <div className="absolute inset-0 z-0">
        <img
          src={hotelConfig.banner_hero}
          alt={hotelConfig.nome}
          referrerPolicy="no-referrer"
          style={{ opacity: overlayAlpha }}
          className="w-full h-full object-cover object-center scale-105 transform animate-in fade-in duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center mt-4">
        
        {/* Selo de classificação e localização */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-stone-900/90 backdrop-blur-md border border-stone-700/80 text-xs font-semibold mb-6 shadow-xl">
          <div className="flex items-center gap-0.5">
            {[...Array(hotelConfig.estrelas || 4)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 fill-current ${theme.textAccentClass}`} />
            ))}
          </div>
          <span className="text-stone-600">|</span>
          <span className="flex items-center gap-1 text-stone-200">
            <MapPin className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
            {heroBadge}
          </span>
          <span className="text-stone-600">|</span>
          <span className={`${theme.textAccentClass} font-bold uppercase tracking-wider text-[10px]`}>
            {getEstablishmentLabel()}
          </span>
        </div>

        {/* Título principal do Estabelecimento */}
        <h1 className={`${fontClass} text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-5xl text-balance drop-shadow-md`}>
          {heroTitle}
        </h1>

        {/* Subtítulo e Slogan */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-stone-200 font-light max-w-3xl leading-relaxed drop-shadow">
          {heroSubtitle}
        </p>

        {/* Destaques rápidos dos serviços configuráveis */}
        {hotelConfig.secoes_visibilidade?.show_highlights !== false && highlightedAmenities.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-3xl w-full text-stone-200 text-xs sm:text-sm">
            {highlightedAmenities.map((amenity) => {
              const Icon = getIconComponent(amenity.icone);
              return (
                <div 
                  key={amenity.id} 
                  className={`bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-xl p-3.5 text-center transition ${theme.cardHighlight}`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${theme.textAccentClass}`} />
                  <span className={`block font-bold text-sm sm:text-base text-stone-100`}>
                    {amenity.titulo}
                  </span>
                  <span className="text-stone-400 text-xs line-clamp-1">
                    {amenity.descricao}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Barra de Busca e Consulta de Disponibilidade */}
        {hotelConfig.secoes_visibilidade?.show_search_bar !== false && (
          <div className="mt-10 w-full max-w-5xl">
            <BookingSearchBar />
          </div>
        )}

      </div>

    </section>
  );
};
