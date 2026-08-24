import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Seção de Avaliações & Depoimentos dos Hóspedes (Totalmente personalizável)
export const TestimonialsSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const testimonials = hotelConfig.depoimentos || [];

  if (testimonials.length === 0) return null;

  return (
    <section id="depoimentos" className="py-24 bg-stone-900 text-stone-100 relative overflow-hidden border-t border-stone-800 scroll-mt-24">
      {/* Anchor alias para compatibilidade */}
      <span id="avaliacoes" className="absolute -top-24" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
            {hotelConfig.avaliacoes_subtitulo || 'Experiência dos Hóspedes'}
          </span>
          <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight`}>
            {hotelConfig.avaliacoes_titulo || 'Quem se hospeda, recomenda e volta'}
          </h2>
          <p className="mt-4 text-stone-300 text-base sm:text-lg">
            {hotelConfig.avaliacoes_descricao || 'Avaliações autênticas de hóspedes que viveram momentos especiais em nossa hospedagem.'}
          </p>

          {/* Selo com nota média */}
          {hotelConfig.nota_avaliacao && (
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-stone-800/90 border border-stone-700 text-xs">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 fill-current ${theme.textAccentClass}`} />
                ))}
              </div>
              <span className="font-bold text-white text-sm">{hotelConfig.nota_avaliacao} / 10</span>
              <span className="text-stone-400">• {hotelConfig.nota_label || 'Excelente'}</span>
            </div>
          )}
        </div>

        {/* Grade de Depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((dep) => (
            <div
              key={dep.id}
              className={`bg-stone-950/80 border border-stone-800 rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 group hover:bg-stone-950 ${theme.cardHighlight}`}
            >
              <div>
                {/* Estrelas & Ícone de Aspas */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(dep.avaliacao || 5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 fill-current ${theme.textAccentClass}`} />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-stone-700 group-hover:text-stone-500 transition-colors" />
                </div>

                {/* Comentário */}
                <p className="text-stone-300 text-sm leading-relaxed italic mb-6">
                  "{dep.comentario}"
                </p>
              </div>

              {/* Autor */}
              <div className="flex items-center gap-3 pt-4 border-t border-stone-800/80">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-stone-800 flex-shrink-0">
                  <img
                    src={dep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={dep.nome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold text-stone-100 truncate">
                    {dep.nome}
                  </strong>
                  <span className="text-xs text-stone-400 block truncate">
                    {dep.origem} • <span className="text-stone-500">{dep.data}</span>
                  </span>
                </div>
                <div title="Estadia verificada" className="text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
