import React from 'react';
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
import { GovernancaWorkspace } from './modules/governanca/GovernancaWorkspace';

const MainContent: React.FC = () => {
  const { currentView, isAuthenticated, currentUser } = useHotel();
  const authenticatedWorkspace = currentUser?.tipo_usuario === 'governanca'
    ? <GovernancaWorkspace />
    : <AdminLayout />;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {currentView === 'landing' ? (
        <div className="flex flex-col min-h-screen relative">
          <Navbar /><main className="flex-1"><HeroSection /><RoomsShowcase /><AmenitiesSection /><AboutSection /><LocationSection /><TestimonialsSection /><FaqSection /><ContactSection /></main><Footer /><FloatingWhatsapp />
        </div>
      ) : !isAuthenticated ? <AdminLogin /> : authenticatedWorkspace}
      <BookingModal />
      <SecurityVerificationModal />
      <ConnectionStatus />
    </div>
  );
};

export default function App() {
  return <HotelProvider><FrigobarProvider><MainContent /></FrigobarProvider></HotelProvider>;
}
