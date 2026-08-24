import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Rodapé institucional oficial (Footer) 100% Personalizável e Multi-Tenant
export const Footer: React.FC = () => {
  const { hotelConfig, setCurrentView, openBookingWithRoom } = useHotel();

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-stone-800">
          
          {/* Coluna 1: Identidade da Marca, Razão Social e CNPJ */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {hotelConfig.logo_url ? (
                <img 
                  src={hotelConfig.logo_url} 
                  alt={hotelConfig.nome} 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-2xl object-cover border border-stone-700 shadow-md"
                />
              ) : (
                <div className={`w-11 h-11 rounded-2xl ${theme.badgeClass} flex items-center justify-center font-black shadow-md border border-stone-700`}>
                  <span className={`${fontClass} text-lg tracking-tighter font-black`}>
                    {getInitials(hotelConfig.nome)}
                  </span>
                </div>
              )}
              <div>
                <span className={`${fontClass} text-lg font-bold ${theme.textAccentClass} block leading-tight`}>
                  {hotelConfig.nome}
                </span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block">
                  {hotelConfig.cidade} • {hotelConfig.estado}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              {hotelConfig.rodape_descricao || hotelConfig.sobre_resumo || hotelConfig.descricao_completa || hotelConfig.sobre_texto || 'Hospitalidade premium, conforto e excelência no atendimento com reservas instantâneas e seguras.'}
            </p>

            <div className="text-[11px] text-stone-500 space-y-0.5 pt-2">
              {hotelConfig.cnpj && <p>CNPJ: {hotelConfig.cnpj}</p>}
              <p>Sistema Hoteleiro White-Label Homologado</p>
            </div>
          </div>

          {/* Coluna 2: Links de Navegação Rápida */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textAccentClass}`}>
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-stone-100 transition-colors">
                  Início
                </a>
              </li>
              {hotelConfig.secoes_visibilidade?.show_about !== false && (
                <li>
                  <a href="#sobre" className="hover:text-stone-100 transition-colors">
                    Sobre o Estabelecimento
                  </a>
                </li>
              )}
              {hotelConfig.secoes_visibilidade?.show_rooms !== false && (
                <li>
                  <a href="#quartos" className="hover:text-stone-100 transition-colors">
                    Acomodações & Tarifas
                  </a>
                </li>
              )}
              {hotelConfig.secoes_visibilidade?.show_amenities !== false && (
                <li>
                  <a href="#estrutura" className="hover:text-stone-100 transition-colors">
                    Comodidades & Serviços
                  </a>
                </li>
              )}
              {hotelConfig.secoes_visibilidade?.show_testimonials !== false && (
                <li>
                  <a href="#depoimentos" className="hover:text-stone-100 transition-colors">
                    Avaliações dos Hóspedes
                  </a>
                </li>
              )}
              {hotelConfig.secoes_visibilidade?.show_faq !== false && (
                <li>
                  <a href="#faq" className="hover:text-stone-100 transition-colors">
                    Perguntas Frequentes
                  </a>
                </li>
              )}
              {hotelConfig.secoes_visibilidade?.show_contact !== false && (
                <li>
                  <a href="#contato" className="hover:text-stone-100 transition-colors">
                    Localização & Contato
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Coluna 3: Contatos Diretos da Recepção */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textAccentClass}`}>
              Central de Atendimento
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <p className="flex items-center gap-2">
                <Phone className={`w-3.5 h-3.5 ${theme.textAccentClass} flex-shrink-0`} />
                <span>{hotelConfig.telefone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className={`w-3.5 h-3.5 ${theme.textAccentClass} flex-shrink-0`} />
                <span>{hotelConfig.email}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className={`w-3.5 h-3.5 ${theme.textAccentClass} flex-shrink-0 mt-0.5`} />
                <span>{hotelConfig.endereco}, {hotelConfig.bairro} - {hotelConfig.cidade}/{hotelConfig.estado}</span>
              </p>
            </div>
          </div>

          {/* Coluna 4: Ações Rápidas de Reserva e Painel */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textAccentClass}`}>
              Acesso
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => openBookingWithRoom()}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${theme.buttonClass}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reservar Online</span>
              </button>

              <button
                onClick={() => setCurrentView('admin')}
                className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold text-center border border-stone-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                <span>Painel PMS</span>
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé inferior com direitos autorais */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} {hotelConfig.nome}. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            <span>{hotelConfig.cidade} - {hotelConfig.estado}</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
