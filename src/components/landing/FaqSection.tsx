import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Seção de Perguntas Frequentes (FAQ) Interativa e Personalizável
export const FaqSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = hotelConfig.faqs || [];

  if (faqs.length === 0) return null;

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const whatsappNumber = (hotelConfig.whatsapp || '').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(hotelConfig.whatsapp_msg_padrao || 'Olá! Tenho uma dúvida sobre a hospedagem.')}`;

  return (
    <section id="faq" className="py-24 bg-stone-950 text-stone-100 relative overflow-hidden border-t border-stone-900 scroll-mt-24">
      {/* Anchor alias para compatibilidade */}
      <span id="duvidas" className="absolute -top-24" aria-hidden="true" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
            {hotelConfig.faq_subtitulo || 'Tire Suas Dúvidas'}
          </span>
          <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight`}>
            {hotelConfig.faq_titulo || 'Perguntas Frequentes'}
          </h2>
          <p className="mt-4 text-stone-400 text-base sm:text-lg">
            {hotelConfig.faq_descricao || 'Encontre respostas rápidas para as principais dúvidas sobre reservas, horários, pagamentos e comodidades.'}
          </p>
        </div>

        {/* Lista de Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? `bg-stone-900/90 ${theme.borderAccentClass} shadow-lg shadow-black/40`
                    : 'bg-stone-900/40 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`w-5 h-5 flex-shrink-0 ${isOpen ? theme.textAccentClass : 'text-stone-500'}`} />
                    <span className="font-bold text-base text-stone-100">
                      {faq.pergunta}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-stone-300 leading-relaxed border-t border-stone-800/50 animate-in fade-in">
                    <p>{faq.resposta}</p>
                    {faq.categoria && (
                      <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-stone-800 text-[11px] font-semibold text-stone-400">
                        Categoria: {faq.categoria}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Suporte Direto via WhatsApp */}
        <div className="mt-12 text-center bg-stone-900/60 border border-stone-800 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="font-bold text-stone-100 text-base">Ainda tem dúvidas?</h4>
            <p className="text-xs text-stone-400 mt-0.5">Nossa equipe de atendimento está disponível 24 horas no WhatsApp.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${theme.buttonClass}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
};
