import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { calculateNights } from '../../utils/availability';
import { Calendar, Users, Search, Sparkles } from 'lucide-react';

interface BookingSearchBarProps {
  compact?: boolean;
}

export const BookingSearchBar: React.FC<BookingSearchBarProps> = ({ compact = false }) => {
  const { bookingSearchFilters, setBookingSearchFilters, setBookingModalOpen } = useHotel();
  
  const [checkin, setCheckin] = useState(bookingSearchFilters.checkin);
  const [checkout, setCheckout] = useState(bookingSearchFilters.checkout);
  const [guests, setGuests] = useState(bookingSearchFilters.guests);

  const nights = calculateNights(checkin, checkout);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSearchFilters({
      checkin,
      checkout,
      guests: Number(guests),
    });
    setBookingModalOpen(true);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={`w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/80 transition-all ${
        compact ? 'p-4' : 'p-4 sm:p-6 lg:p-7'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        
        {/* Check-in Input */}
        <div className="flex-1 bg-stone-50 hover:bg-stone-100/80 rounded-xl p-3.5 border border-stone-200 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Check-in (Entrada)
          </label>
          <input
            type="date"
            value={checkin}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              setCheckin(e.target.value);
              // auto advance checkout if needed
              if (e.target.value >= checkout) {
                const nextDay = new Date(e.target.value + 'T00:00:00');
                nextDay.setDate(nextDay.getDate() + 2);
                setCheckout(nextDay.toISOString().split('T')[0]);
              }
            }}
            className="w-full bg-transparent text-stone-900 font-semibold text-sm sm:text-base focus:outline-none cursor-pointer"
            required
          />
        </div>

        {/* Check-out Input */}
        <div className="flex-1 bg-stone-50 hover:bg-stone-100/80 rounded-xl p-3.5 border border-stone-200 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Check-out (Saída)
            </label>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {nights} {nights === 1 ? 'diária' : 'diárias'}
            </span>
          </div>
          <input
            type="date"
            value={checkout}
            min={checkin}
            onChange={(e) => setCheckout(e.target.value)}
            className="w-full bg-transparent text-stone-900 font-semibold text-sm sm:text-base focus:outline-none cursor-pointer"
            required
          />
        </div>

        {/* Guests Selector */}
        <div className="flex-1 bg-stone-50 hover:bg-stone-100/80 rounded-xl p-3.5 border border-stone-200 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Número de Hóspedes
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent text-stone-900 font-semibold text-sm sm:text-base focus:outline-none cursor-pointer"
          >
            <option value={1}>1 Hóspede (Individual)</option>
            <option value={2}>2 Hóspedes (Casal / Duplo)</option>
            <option value={3}>3 Hóspedes (Triplo)</option>
            <option value={4}>4 Hóspedes (Família / Grupo)</option>
            <option value={5}>5 Hóspedes (Suíte Master / Grupo)</option>
          </select>
        </div>

        {/* Submit Search Button */}
        <div className="lg:w-auto">
          <button
            type="submit"
            className="w-full lg:w-auto h-full min-h-[58px] px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-stone-950 hover:text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
          >
            <Search className="w-5 h-5 text-stone-950" />
            <span className="whitespace-nowrap">Consultar Disponibilidade</span>
          </button>
        </div>

      </div>

      <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Melhor tarifa garantida em reserva direta no site</span>
        </div>
        <div className="flex items-center gap-4">
          <span>✓ Cancelamento flexível</span>
          <span>✓ Sem taxas ocultas</span>
          <span>✓ Confirmação imediata</span>
        </div>
      </div>
    </form>
  );
};
