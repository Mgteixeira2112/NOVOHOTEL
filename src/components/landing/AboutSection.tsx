import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { Award, CheckCircle2, Building } from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Seção institucional "Sobre o Estabelecimento" 100% Personalizável (White-Label)
export const AboutSection: React.FC = () => {
  const { hotelConfig, openBookingWithRoom } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  if (hotelConfig.secoes_visibilidade?.show_about === false) return null;

  const differentials = hotelConfig.sobre_diferenciais || [
    { titulo: 'Acomodações Completas e Higienizadas', desc: 'Espaços confortáveis com itens modernos para o seu máximo bem-estar.' },
    { titulo: 'Localização Estratégica & Fácil Acesso', desc: 'Próximo aos principais pontos turísticos, comerciais e gastronômicos.' },
    { titulo: 'Atendimento Ágil e Seguro', desc: 'Equipe cordial e check-in descomplicado para uma estadia sem preocupações.' }
  ];

  const photoUrl = hotelConfig.sobre_foto_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
  const sobreTitulo = hotelConfig.sobre_titulo || `Seu melhor endereço em ${hotelConfig.cidade}`;
  const sobreSubtitulo = hotelConfig.sobre_subtitulo || 'Hospitalidade & Conforto';

  return (
    <section id="sobre" className="py-24 bg-stone-50 text-stone-900 relative border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Coluna de Fotos e Destaques Visuais */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 aspect-[4/3]">
              <img
                src={photoUrl}
                alt={hotelConfig.nome}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Card flutuante com nota de avaliação */}
            {hotelConfig.nota_avaliacao && (
              <div className="hidden sm:block absolute -bottom-8 -right-8 w-72 bg-stone-950 text-stone-100 p-6 rounded-3xl shadow-2xl border border-stone-800 z-20">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-lg font-bold ${fontClass} ${theme.textAccentClass}`}>
                      Nota {hotelConfig.nota_avaliacao} / 10
                    </span>
                    <span className="block text-[11px] text-stone-400">
                      {hotelConfig.nota_label || 'Preferência dos Hóspedes'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Excelência comprovada em conforto, hospitalidade acolhedora e serviços de qualidade.
                </p>
              </div>
            )}

            {/* Padrão de fundo decorativo */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-stone-200/80 rounded-3xl -z-10" />
          </div>

          {/* Coluna de Conteúdo Narrativo e Benefícios */}
          <div className="lg:col-span-6 space-y-6">
            <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block`}>
              {sobreSubtitulo}
            </span>

            <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.15]`}>
              {sobreTitulo}
            </h2>

            <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
              {hotelConfig.sobre_texto}
            </p>

            <div className="space-y-3.5 pt-2">
              {differentials.map((diff, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center flex-shrink-0`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{diff.titulo}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{diff.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => openBookingWithRoom()}
                className={`px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 ${theme.buttonClass}`}
              >
                <Building className="w-4 h-4" />
                <span>Consultar Tarifas & Reservar</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
