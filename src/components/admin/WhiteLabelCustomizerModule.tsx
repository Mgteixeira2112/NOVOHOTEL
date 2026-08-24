import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Eye, 
  Save, 
  Check, 
  Building2, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { LandingCustomizerTab } from './settings/LandingCustomizerTab';
import { PresetsPortabilityTab } from './settings/PresetsPortabilityTab';

export const WhiteLabelCustomizerModule: React.FC = () => {
  const { 
    hotelConfig, 
    setCurrentView 
  } = useHotel();

  const [activeTab, setActiveTab] = useState<'customizer' | 'presets'>('customizer');

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Estúdio White-Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif-luxury text-stone-900">
                Estúdio de Personalização White-Label
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Multi-Tenant Ready
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Personalize 100% dos planos de fundo, cores, tipografia, seções visíveis, textos e diferenciais para qualquer hotel ou pousada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
            title="Abrir o site público do cliente em tempo real"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Site Ao Vivo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Abas do Estúdio */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
        <button
          onClick={() => setActiveTab('customizer')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'customizer' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Editor Visual & Elementos da Landing Page</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'presets' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Modelos Prontos de Clientes (1-Clique Presets & JSON)</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'customizer' ? (
        <LandingCustomizerTab />
      ) : (
        <PresetsPortabilityTab />
      )}

    </div>
  );
};
