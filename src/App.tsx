import React, { useEffect, useState } from 'react';
import { HotelProvider, useHotel } from './context/HotelContext';
import { FrigobarProvider } from './context/FrigobarContext';
import { Navbar } from './components/navigation/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { RoomsShowcase } from './components/landing/RoomsShowcase';
import { AmenitiesSection } from './components/landing/AmenitiesSection';
import { AboutSection } from './components/landing/AboutSection';
import { LocationSection } from './components/landing/LocationSection';
import { TestimonialsSection } from './components/landing/TestimonialsSection';
import { FaqSection } from './components/landing/FaqSection';
import { ContactSection } from './components/landing/ContactSection';
import { Footer } from './components/landing/Footer';
import { FloatingWhatsapp } from './components/landing/FloatingWhatsapp';
import { BookingModal } from './components/booking/BookingModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/auth/AdminLogin';
import { SecurityVerificationModal } from './components/security/SecurityVerificationModal';
import { ConnectionStatus } from './components/device/ConnectionStatus';
import { fetchUserOperationalSectorsState } from './services/userSectorService';
import { OperationalSectorId } from './domain/operationalSectors';
import { resolveWorkspaceForSectors } from './workspace-engine/registry';
import { WorkspaceRuntime } from './workspace-engine/WorkspaceRuntime';
import { DEFAULT_WORKSPACE_HOTEL_ID, hydrateWorkspaceOverridesFromSupabase, subscribeWorkspaceConfig } from './workspace-engine/workspaceConfigStore';

const AuthenticatedWorkspaceRouter: React.FC = () => {
  const { currentUser, hotelConfig } = useHotel();
  const [sectorIds, setSectorIds] = useState<OperationalSectorId[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setWorkspaceRevision] = useState(0);
  const role = currentUser?.tipo_usuario || '';
  const management = role === 'admin' || role === 'gerente';
  const hotelId = hotelConfig?.id || DEFAULT_WORKSPACE_HOTEL_ID;

  useEffect(() => {
    let cancelled = false;
    if (!currentUser?.id || management) {
      setSectorIds([]);
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    void Promise.all([
      fetchUserOperationalSectorsState(currentUser.id),
      hydrateWorkspaceOverridesFromSupabase(hotelId),
    ]).then(([state]) => {
      if (cancelled) return;
      setSectorIds(state.available ? state.assignment.sectorIds : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [currentUser?.id, management, hotelId]);

  useEffect(() => subscribeWorkspaceConfig(() => {
    setWorkspaceRevision(current => current + 1);
  }), []);

  if (management) return <AdminLayout />;
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-600 text-sm font-bold">Carregando ambiente operacional…</div>;

  const workspace = resolveWorkspaceForSectors(sectorIds, hotelId);
  if (workspace) return <WorkspaceRuntime definition={workspace} />;
  return <AdminLayout />;
};

const MainContent: React.FC = () => {
  const { currentView, isAuthenticated } = useHotel();
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {currentView === 'landing' ? (
        <div className="flex flex-col min-h-screen relative">
          <Navbar /><main className="flex-1"><HeroSection /><RoomsShowcase /><AmenitiesSection /><AboutSection /><LocationSection /><TestimonialsSection /><FaqSection /><ContactSection /></main><Footer /><FloatingWhatsapp />
        </div>
      ) : !isAuthenticated ? <AdminLogin /> : <AuthenticatedWorkspaceRouter />}
      <BookingModal />
      <SecurityVerificationModal />
      <ConnectionStatus />
    </div>
  );
};

export default function App() {
  return <HotelProvider><FrigobarProvider><MainContent /></FrigobarProvider></HotelProvider>;
}
