import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  Users, 
  Maximize2, 
  Eye, 
  CalendarDays, 
  CheckCircle2, 
  Layers, 
  Bed, 
  X 
} from 'lucide-react';
import { Quarto } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

export const RoomsShowcase: React.FC = () => {
  const { rooms, roomTypes, openBookingWithRoom, hotelConfig } = useHotel();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [modalRoom, setModalRoom] = useState<Quarto | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  if (hotelConfig.secoes_visibilidade?.show_rooms === false) return null;

  // Dynamic filter: only show active rooms
  const activeRooms = rooms.filter((r) => r.ativo);

  const filteredRooms = selectedCategory === 'todos'
    ? activeRooms
    : activeRooms.filter((r) => r.tipo_quarto_id === selectedCategory);

  const getAccommodationSubtitle = () => {
    switch (hotelConfig.tipo_estabelecimento) {
      case 'pousada': return 'Suítes & Acomodações Charmosas';
      case 'resort': return 'Villas & Suítes Premium';
      case 'chales': return 'Chalés & Refúgios de Montanha';
      case 'fazenda': return 'Acomodações Rurais & Suítes';
      case 'boutique': return 'Quartos Conceito & Design';
      case 'flat': return 'Flats & Acomodações Mobiliadas';
      default: return 'Quartos & Acomodações';
    }
  };

  return (
    <section id="quartos" className="py-24 bg-stone-100/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
              {getAccommodationSubtitle()}
            </span>
            <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight`}>
              Espaço, privacidade e o conforto que você merece
            </h2>
            <p className="mt-3 text-stone-600 text-base leading-relaxed">
              Acomodações completas, higienizadas e preparadas com carinho para momentos inesquecíveis no {hotelConfig.nome}.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-2 text-xs font-medium text-stone-500 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeRooms.length} acomodações disponíveis</span>
          </div>
        </div>

        {/* Categories / Type Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200/80'
            }`}
          >
            Todas as Acomodações ({activeRooms.length})
          </button>
          {roomTypes.map((type) => {
            const count = activeRooms.filter((r) => r.tipo_quarto_id === type.id).length;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedCategory(type.id)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === type.id
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200/80'
                }`}
              >
                {type.nome} ({count})
              </button>
            );
          })}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.map((room) => {
            const type = roomTypes.find((t) => t.id === room.tipo_quarto_id);
            const mainPhoto = room.fotos[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80';

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Photo & Badge Area */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                  <img
                    src={mainPhoto}
                    alt={room.nome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md ${theme.textAccentClass} text-[11px] font-bold tracking-wider uppercase border border-stone-700`}>
                      {type?.nome || 'Acomodação'}
                    </span>
                  </div>

                  {/* Room Number Pill */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900/85 backdrop-blur-md text-stone-200 text-xs font-semibold border border-stone-700">
                      Nº {room.numero}
                    </span>
                  </div>

                  {/* Quick Photo count & View Details trigger */}
                  <button
                    onClick={() => {
                      setModalRoom(room);
                      setActivePhotoIndex(0);
                    }}
                    className="absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-900 text-stone-200 hover:text-white text-xs font-medium backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                    <span>Ver Detalhes ({room.fotos.length} fotos)</span>
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Room Title */}
                    <h3 className={`${fontClass} text-xl font-bold text-stone-900 group-hover:opacity-80 transition-opacity`}>
                      {room.nome}
                    </h3>

                    {/* Room Attributes */}
                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-600">
                      <span className="flex items-center gap-1">
                        <Users className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                        Até {room.capacidade} {room.capacidade === 1 ? 'hóspede' : 'hóspedes'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize2 className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                        {room.tamanho_m2} m²
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                        {room.andar}º Andar
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                        {room.cama}
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="mt-3 text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {room.descricao}
                    </p>

                    {/* Amenities tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {room.comodidades.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200/60"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.comodidades.length > 4 && (
                        <span className={`px-2 py-0.5 rounded-lg ${theme.badgeClass} text-[11px] font-medium`}>
                          +{room.comodidades.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Booking Action */}
                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                        Diária a partir de
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold text-stone-900 font-mono">
                          {formatCurrency(room.valor_diaria)}
                        </span>
                        <span className="text-xs text-stone-500 font-normal">/noite</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openBookingWithRoom(room.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer ${theme.buttonClass}`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Reservar</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
            <p className="text-stone-500 text-base">Nenhum quarto encontrado nesta categoria no momento.</p>
          </div>
        )}

      </div>

      {/* Room Details Lightbox Modal */}
      {modalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-stone-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.textAccentClass}`}>
                  Quarto {modalRoom.numero} • {modalRoom.vista}
                </span>
                <h3 className={`${fontClass} text-2xl font-bold text-stone-900`}>
                  {modalRoom.nome}
                </h3>
              </div>
              <button
                onClick={() => setModalRoom(null)}
                className="p-2 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Photo Showcase Carousel */}
              <div className="space-y-3">
                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900">
                  <img
                    src={modalRoom.fotos[activePhotoIndex] || modalRoom.fotos[0]}
                    alt={modalRoom.nome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                {modalRoom.fotos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {modalRoom.fotos.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          activePhotoIndex === idx ? theme.borderAccentClass : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description & Specs */}
              <div>
                <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-2">Sobre esta acomodação</h4>
                <p className="text-stone-600 text-sm leading-relaxed">{modalRoom.descricao}</p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
                <div>
                  <span className="text-stone-500 block">Capacidade</span>
                  <strong className="text-stone-900 text-sm">Até {modalRoom.capacidade} pessoas</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Área Total</span>
                  <strong className="text-stone-900 text-sm">{modalRoom.tamanho_m2} m²</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Configuração de Cama</span>
                  <strong className="text-stone-900 text-sm">{modalRoom.cama}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Localização</span>
                  <strong className="text-stone-900 text-sm">{modalRoom.andar}º Andar ({modalRoom.vista})</strong>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-3">Comodidades Inclusas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {modalRoom.comodidades.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">Tarifa por diária</span>
                <span className="text-2xl font-bold text-stone-900 font-mono">
                  {formatCurrency(modalRoom.valor_diaria)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalRoom(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const rId = modalRoom.id;
                    setModalRoom(null);
                    openBookingWithRoom(rId);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer ${theme.buttonClass}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Reservar este Quarto
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
