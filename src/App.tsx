import React from 'react';
import { HotelProvider, useHotel } from './context/HotelContext';
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

// Componente principal de renderização condicional (Landing Page vs Painel PMS Logado / Login)
const MainContent: React.FC = () => {
  const { currentView, isAuthenticated } = useHotel();

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {currentView === 'landing' ? (
        <div className="flex flex-col min-h-screen relative">
          <Navbar />
          <main className="flex-1">
            <HeroSection />
            <RoomsShowcase />
            <AmenitiesSection />
            <AboutSection />
            <LocationSection />
            <TestimonialsSection />
            <FaqSection />
            <ContactSection />
          </main>
          <Footer />
          <FloatingWhatsapp />
        </div>
      ) : !isAuthenticated ? (
        <AdminLogin />
      ) : (
        <AdminLayout />
      )}

      {/* Modal global do motor de reservas em tempo real com assistente passo a passo */}
      <BookingModal />

      {/* Modal global de confirmação com Senha + 2FA para operações administrativas */}
      <SecurityVerificationModal />
    </div>
  );
};

export default function App() {
  return (
    <HotelProvider>
      <MainContent />
    </HotelProvider>
  );
}
