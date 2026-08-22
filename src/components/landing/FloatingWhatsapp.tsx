import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { MessageCircle } from 'lucide-react';

// Botão Flutuante de Atendimento Direto no WhatsApp
export const FloatingWhatsapp: React.FC = () => {
  const { hotelConfig } = useHotel();

  if (hotelConfig.secoes_visibilidade?.show_whatsapp_float === false) return null;

  const rawNumber = (hotelConfig.whatsapp || '').replace(/\D/g, '');
  if (!rawNumber) return null;

  const message = encodeURIComponent(
    hotelConfig.whatsapp_msg_padrao || `Olá! Gostaria de informações sobre reservas no ${hotelConfig.nome}.`
  );
  const whatsappUrl = `https://wa.me/55${rawNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in fade-in zoom-in duration-300">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Falar com nossa equipe no WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 cursor-pointer"
      >
        {/* Anel de Pulsação */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 group-hover:opacity-40" />

        {/* Ícone */}
        <MessageCircle className="w-7 h-7 text-stone-950 fill-stone-950/20" />

        {/* Tooltip no Hover */}
        <span className="absolute right-16 px-3 py-1.5 rounded-xl bg-stone-900 text-stone-100 text-xs font-semibold whitespace-nowrap shadow-xl border border-stone-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Dúvidas? Fale no WhatsApp
        </span>
      </a>
    </div>
  );
};
