import React, { useEffect, useState } from 'react';
import { HotelProvider, useHotel } from './context/HotelContext';
import { SaaSTenantProvider, useSaaSTenant } from './context/SaaSTenantContext';
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
import { tenantService } from './services/tenantService';
import { OperationalSectorId } from './domain/operationalSectors';
import { resolveWorkspaceForUserAndSectors } from './workspace-engine/registry';
import { WorkspaceRuntime } from './workspace-engine/WorkspaceRuntime';
import { DEFAULT_WORKSPACE_HOTEL_ID, hydrateWorkspaceOverridesFromSupabase, subscribeWorkspaceConfig } from './workspace-engine/workspaceConfigStore';
import { resolveHotelRouteCompatibility } from './routes/saasRouteCompatibility';
import { permissionPolicyForRoute } from './routes/saasRoutePermissions';

const currentPathname = () => typeof window === 'undefined' ? '/app' : window.location.pathname;

type RouteAccessState = 'checking' | 'allowed' | 'denied';

const RouteAccessMessage: React.FC<{ checking?: boolean; onReturn?: () => void }> = ({ checking = false, onReturn }) => (
  <div className="min-h-screen grid place-items-center bg-stone-100 px-6 text-stone-900">
    <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-bold">{checking ? 'Validando acesso…' : 'Acesso restrito'}</h2>
      <p className="mt-2 text-sm text-stone-500">
        {checking ? 'Confirmando suas permissões para este hotel.' : 'Seu perfil não possui permissão para abrir esta rota.'}
      </p>
      {!checking && onReturn && (
        <button type="button" onClick={onReturn} className="mt-5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white">
          Voltar ao início
        </button>
      )}
    </div>
  </div>
);

const AuthenticatedWorkspaceRouter: React.FC = () => {
  const { currentUser, hotelConfig, adminActiveTab, setAdminActiveTab, hasTabAccess } = useHotel();
  const { available: tenantAvailable, activeHotelId, loading: tenantLoading } = useSaaSTenant();
  const [pathname, setPathname] = useState(currentPathname);
  const [sectorIds, setSectorIds] = useState<OperationalSectorId[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeAccess, setRouteAccess] = useState<RouteAccessState>('allowed');
  const [, setWorkspaceRevision] = useState(0);
  const role = currentUser?.tipo_usuario || 'recepcionista';
  const management = role === 'admin' || role === 'gerente';
  const hotelId = hotelConfig?.id || DEFAULT_WORKSPACE_HOTEL_ID;
  const routePlan = resolveHotelRouteCompatibility(pathname);
  const fixedAdminRoute = routePlan?.mode === 'admin-screen' && Boolean(routePlan.adminTab);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!fixedAdminRoute || !routePlan?.adminTab || adminActiveTab === routePlan.adminTab) return;
    setAdminActiveTab(routePlan.adminTab);
  }, [fixedAdminRoute, routePlan?.adminTab, adminActiveTab, setAdminActiveTab]);

  useEffect(() => {
    let cancelled = false;

    if (!fixedAdminRoute || !routePlan?.adminTab) {
      setRouteAccess('allowed');
      return () => { cancelled = true; };
    }

    if (!hasTabAccess(role, routePlan.adminTab)) {
      setRouteAccess('denied');
      return () => { cancelled = true; };
    }

    const backendPermission = permissionPolicyForRoute(routePlan.routeId).backendPermission;
    if (!backendPermission) {
      setRouteAccess('allowed');
      return () => { cancelled = true; };
    }

    if (tenantLoading) {
      setRouteAccess('checking');
      return () => { cancelled = true; };
    }

    if (!tenantAvailable || !activeHotelId) {
      setRouteAccess('allowed');
      return () => { cancelled = true; };
    }

    setRouteAccess('checking');
    void tenantService.can(backendPermission, activeHotelId)
      .then(allowed => {
        if (!cancelled) setRouteAccess(allowed ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setRouteAccess('denied');
      });

    return () => { cancelled = true; };
  }, [fixedAdminRoute, routePlan?.adminTab, routePlan?.routeId, role, hasTabAccess, tenantLoading, tenantAvailable, activeHotelId]);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser?.id || management || fixedAdminRoute) {
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
  }, [currentUser?.id, management, fixedAdminRoute, hotelId]);

  useEffect(() => subscribeWorkspaceConfig(() => {
    setWorkspaceRevision(current => current + 1);
  }), []);

  const returnToHome = () => {
    setAdminActiveTab('dashboard');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/app');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (fixedAdminRoute && routeAccess === 'checking') return <RouteAccessMessage checking />;
  if (fixedAdminRoute && routeAccess === 'denied') return <RouteAccessMessage onReturn={returnToHome} />;
  if (management || fixedAdminRoute) return <AdminLayout />;
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-600 text-sm font-bold">Carregando ambiente operacional…</div>;

  const workspace = resolveWorkspaceForUserAndSectors(currentUser?.id, sectorIds, hotelId);
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
  return (
    <HotelProvider>
      <SaaSTenantProvider>
        <FrigobarProvider>
          <MainContent />
        </FrigobarProvider>
      </SaaSTenantProvider>
    </HotelProvider>
  );
}
