import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  CalendarDays, 
  Phone, 
  Menu, 
  X, 
  BedDouble, 
  MapPin,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Info,
  Star
} from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Componente de barra de navegação pública (Navbar) 100% Personalizável e Multi-Tenant
export const Navbar: React.FC = () => {
  const { hotelConfig, setCurrentView, openBookingWithRoom } = useHotel();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);

    // Mapeamento abrangente de aliases para encontrar o elemento correto
    const targetIds = [id];
    if (id === 'sobre') targetIds.push('about');
    if (id === 'quartos') targetIds.push('acomodacoes', 'rooms');
    if (id === 'estrutura' || id === 'comodidades') targetIds.push('estrutura', 'comodidades', 'amenities');
    if (id === 'depoimentos' || id === 'avaliacoes') targetIds.push('depoimentos', 'avaliacoes', 'testimonials');
    if (id === 'faq' || id === 'duvidas') targetIds.push('faq', 'duvidas', 'perguntas');
    if (id === 'contato') targetIds.push('contact', 'localizacao');

    let element: HTMLElement | null = null;
    for (const targetId of targetIds) {
      element = document.getElementById(targetId);
      if (element) break;
    }

    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Generate dynamic initials for logo emblem if no logo image
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
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-stone-100 transition-all shadow-lg">
      
      {/* Faixa superior de informações de contato rápido */}
      <div className="bg-stone-900/90 text-stone-300 text-[11px] py-1.5 px-4 border-b border-stone-800 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className={`flex items-center gap-1.5 ${theme.textAccentClass} font-medium`}>
              <MapPin className="w-3.5 h-3.5" />
              {hotelConfig.endereco} — {hotelConfig.bairro}, {hotelConfig.cidade}/{hotelConfig.estado}
            </span>
            <span className="text-stone-600">|</span>
            <span className="flex items-center gap-1.5">
              <Phone className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
              Central: <strong className="text-white">{hotelConfig.telefone}</strong>
            </span>
            <span className="text-stone-600">|</span>
            <span className="text-emerald-400 font-medium">
              WhatsApp: {hotelConfig.whatsapp}
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            {hotelConfig.slogan && (
              <span className="italic text-[11px] text-stone-300">
                "{hotelConfig.slogan}"
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo e identidade oficial dinâmica */}
          <div 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            {hotelConfig.logo_url ? (
              <img 
                src={hotelConfig.logo_url} 
                alt={hotelConfig.nome} 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-stone-700 shadow-md group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className={`relative w-12 h-12 rounded-2xl ${theme.badgeClass} flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform border border-stone-700`}>
                <span className={`${fontClass} text-xl tracking-tighter font-black`}>
                  {getInitials(hotelConfig.nome)}
                </span>
              </div>
            )}
            
            <div className="flex flex-col">
              <span className={`${fontClass} text-lg sm:text-xl font-bold tracking-wide ${theme.textAccentClass} group-hover:opacity-90 transition-opacity leading-tight`}>
                {hotelConfig.nome}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                {hotelConfig.cidade} / {hotelConfig.estado}
              </span>
            </div>
          </div>

          {/* Links de navegação para Desktop */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-300">
            {hotelConfig.secoes_visibilidade?.show_about !== false && (
              <button 
                onClick={() => scrollToSection('sobre')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <Info className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Sobre</span>
              </button>
            )}
            {hotelConfig.secoes_visibilidade?.show_rooms !== false && (
              <button 
                onClick={() => scrollToSection('quartos')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <BedDouble className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Acomodações</span>
              </button>
            )}
            {hotelConfig.secoes_visibilidade?.show_amenities !== false && (
              <button 
                onClick={() => scrollToSection('estrutura')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <Sparkles className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Comodidades</span>
              </button>
            )}
            {hotelConfig.secoes_visibilidade?.show_testimonials !== false && (
              <button 
                onClick={() => scrollToSection('depoimentos')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <Star className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Avaliações</span>
              </button>
            )}
            {hotelConfig.secoes_visibilidade?.show_faq !== false && (
              <button 
                onClick={() => scrollToSection('faq')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <HelpCircle className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Dúvidas</span>
              </button>
            )}
            {hotelConfig.secoes_visibilidade?.show_contact !== false && (
              <button 
                onClick={() => scrollToSection('contato')}
                className={`hover:${theme.textAccentClass} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <Phone className={`w-4 h-4 ${theme.textAccentClass}`} />
                <span>Contato</span>
              </button>
            )}
          </nav>

          {/* Botões de Ação Direta (CTAs) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Botão de acesso direto ao painel PMS */}
            <button
              onClick={() => setCurrentView('admin')}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-2 border border-stone-700 transition-all cursor-pointer"
              title="Acesso exclusivo para administradores e equipe"
            >
              <ShieldCheck className={`w-4 h-4 ${theme.textAccentClass}`} />
              <span>Painel PMS</span>
            </button>

            {/* Botão para abrir o motor de reservas */}
            <button
              onClick={() => openBookingWithRoom()}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide shadow-lg flex items-center gap-2 transition-all cursor-pointer transform active:scale-95 ${theme.buttonClass}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Reservar Online</span>
            </button>
          </div>

          {/* Menu Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setCurrentView('admin')}
              className={`p-2 rounded-xl bg-stone-900 ${theme.textAccentClass} hover:bg-stone-800 text-xs flex items-center gap-1 border border-stone-700`}
              aria-label="Painel Administrativo"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-900 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu suspenso para dispositivos móveis */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <button 
            onClick={() => scrollToSection('sobre')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <Info className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Sobre</span>
          </button>
          <button 
            onClick={() => scrollToSection('quartos')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <BedDouble className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Acomodações</span>
          </button>
          <button 
            onClick={() => scrollToSection('estrutura')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Comodidades</span>
          </button>
          <button 
            onClick={() => scrollToSection('depoimentos')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <Star className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Avaliações</span>
          </button>
          <button 
            onClick={() => scrollToSection('faq')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <HelpCircle className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Perguntas Frequentes (FAQ)</span>
          </button>
          <button 
            onClick={() => scrollToSection('contato')}
            className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-900 text-stone-200 font-medium flex items-center gap-2"
          >
            <Phone className={`w-4 h-4 ${theme.textAccentClass}`} />
            <span>Contato & Localização</span>
          </button>

          <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openBookingWithRoom();
              }}
              className={`w-full py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-md ${theme.buttonClass}`}
            >
              <CalendarDays className="w-4 h-4" />
              Reservar Online
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentView('admin');
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-sm font-semibold text-center flex items-center justify-center gap-2 border border-stone-700 cursor-pointer"
            >
              <ShieldCheck className={`w-4 h-4 ${theme.textAccentClass}`} />
              Acessar Painel PMS
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
