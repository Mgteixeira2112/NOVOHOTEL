import React, { useState } from 'react';
import { Menu, X, Building2, ChevronDown } from 'lucide-react';
import { AdminHeader } from '../navigation/AdminHeader';
import { useHotel } from '../../context/HotelContext';
import { useSaaSTenant } from '../../context/SaaSTenantContext';

interface SaaSShellProps {
  renderNavigation: () => React.ReactNode;
  children: React.ReactNode;
}

export const SaaSShell: React.FC<SaaSShellProps> = ({ renderNavigation, children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { hotelConfig } = useHotel();
  const {
    snapshot,
    activeHotel,
    activeHotelId,
    canSwitchHotels,
    switchHotel,
    loading: tenantLoading,
  } = useSaaSTenant();

  const hotelName = activeHotel?.name || hotelConfig?.nome || 'Hotel';
  const hotels = snapshot?.hotels ?? [];

  const hotelContext = (
    <div className="border-b border-stone-200 px-3 pb-4 mb-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-bold text-stone-400 mb-2">
        <Building2 className="w-3.5 h-3.5" />
        Hotel ativo
      </div>
      {canSwitchHotels ? (
        <div className="relative">
          <select
            value={activeHotelId || ''}
            disabled={tenantLoading}
            onChange={(event) => { void switchHotel(event.target.value); }}
            className="w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 pr-8 text-sm font-bold text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
            aria-label="Selecionar hotel ativo"
          >
            {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
      ) : (
        <div className="truncate text-sm font-bold text-stone-800" title={hotelName}>{hotelName}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <AdminHeader />

      <div className="lg:hidden sticky top-16 z-20 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700"
          aria-label="Abrir menu do sistema"
        >
          <Menu className="h-4 w-4" /> Menu
        </button>
        <span className="max-w-[55%] truncate text-xs font-semibold text-stone-500">{hotelName}</span>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] items-start">
        <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-stone-200 bg-white px-3 py-5">
          {hotelContext}
          {renderNavigation()}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[86vw] max-w-xs overflow-y-auto bg-white p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-1 py-2">
              <strong className="text-sm text-stone-900">Navegação</strong>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                aria-label="Fechar menu do sistema"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {hotelContext}
            <div onClick={() => setDrawerOpen(false)}>{renderNavigation()}</div>
          </aside>
        </div>
      )}
    </div>
  );
};
