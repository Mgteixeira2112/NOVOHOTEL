import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { MapPin, Navigation, Compass, ExternalLink, Building2, GraduationCap, Briefcase, Utensils, Trees } from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Seção de Localização & Pontos de Interesse (Totalmente personalizável)
export const LocationSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const fullAddress = `${hotelConfig.endereco}, ${hotelConfig.bairro} - ${hotelConfig.cidade}, ${hotelConfig.estado} - CEP ${hotelConfig.cep}`;
  const points = hotelConfig.pontos_interesse || [];

  const getPointIcon = (tipo: string) => {
    switch (tipo) {
      case 'educacao': return GraduationCap;
      case 'negocios': return Briefcase;
      case 'gastronomia': return Utensils;
      case 'lazer': return Trees;
      default: return Building2;
    }
  };

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${hotelConfig.nome} ${fullAddress}`
  )}`;

  return (
    <section id="localizacao" className="py-24 bg-stone-900 text-stone-100 relative overflow-hidden border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
            Localização Privilegiada
          </span>
          <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight`}>
            Fácil acesso aos principais pontos da região
          </h2>
          <p className="mt-4 text-stone-300 text-base sm:text-lg">
            Posição estratégica para facilitar seu deslocamento a trabalho, estudos ou lazer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card de Endereço & Acesso */}
          <div className="lg:col-span-5 bg-stone-950 border border-stone-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${theme.bgSubtleClass} border ${theme.borderAccentClass} flex items-center justify-center flex-shrink-0`}>
                <MapPin className={`w-6 h-6 ${theme.textAccentClass}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{hotelConfig.nome}</h3>
                <p className="text-sm text-stone-400 mt-1 leading-relaxed">
                  {fullAddress}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-stone-800/80">
              <div className="flex items-center justify-between text-xs py-1 text-stone-300">
                <span className="text-stone-500">Bairro:</span>
                <strong className="text-stone-200">{hotelConfig.bairro}</strong>
              </div>
              <div className="flex items-center justify-between text-xs py-1 text-stone-300">
                <span className="text-stone-500">Cidade:</span>
                <strong className="text-stone-200">{hotelConfig.cidade} / {hotelConfig.estado}</strong>
              </div>
              <div className="flex items-center justify-between text-xs py-1 text-stone-300">
                <span className="text-stone-500">Estacionamento:</span>
                <strong className="text-emerald-400">Gratuito no local</strong>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${theme.buttonClass}`}
              >
                <Navigation className="w-4 h-4" />
                <span>Abrir no Google Maps / GPS</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>

          {/* Grade de Pontos de Referência / Distâncias */}
          <div className="lg:col-span-7 bg-stone-950/60 border border-stone-800 rounded-3xl p-6 sm:p-8">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <Compass className={`w-5 h-5 ${theme.textAccentClass}`} />
              <span>Pontos de Interesse Próximos:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {points.map((poi) => {
                const Icon = getPointIcon(poi.tipo);
                return (
                  <div
                    key={poi.id}
                    className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-stone-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-stone-200 truncate">
                        {poi.nome}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badgeClass} flex-shrink-0`}>
                      {poi.distancia}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Aviso de Proximidade */}
            <div className="mt-6 p-4 rounded-2xl bg-stone-900/40 border border-stone-800/60 text-xs text-stone-400 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span>
                {hotelConfig.tipo_estabelecimento === 'pousada' || hotelConfig.tipo_estabelecimento === 'chales'
                  ? 'Ambiente de ar puro e tranquilidade com fácil acesso rodoviário pavimentado.'
                  : 'Localização central com fácil acesso a pé a bancos, padarias, restaurantes e transporte.'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
