import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Eye, 
  Save, 
  Check, 
  RotateCcw, 
  Download, 
  Upload, 
  Building2, 
  Type, 
  Image as ImageIcon, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Star, 
  Compass, 
  MessageSquare,
  BedDouble,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  ThemeColorPalette, 
  TypographyStyle, 
  PropertyType, 
  CustomAmenity, 
  CustomFaq, 
  CustomTestimonial,
  PointOfInterest 
} from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

export const WhiteLabelCustomizerModule: React.FC = () => {
  const { 
    hotelConfig, 
    updateHotelConfig, 
    applyTemplatePreset, 
    importConfigJson, 
    setCurrentView 
  } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'branding' | 'sections' | 'content' | 'amenities' | 'portability'>('presets');
  const [formData, setFormData] = useState({ ...hotelConfig });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Sync formData when hotelConfig changes externally
  React.useEffect(() => {
    setFormData({ ...hotelConfig });
  }, [hotelConfig]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateHotelConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePresetSelect = (preset: 'pousada' | 'resort' | 'fazenda' | 'flat' | 'boutique' | 'chale') => {
    applyTemplatePreset(preset);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hotelConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hotel-whitelabel-config-${hotelConfig.nome.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Por favor cole o código JSON da configuração.');
      return;
    }
    const success = importConfigJson(importJsonText);
    if (success) {
      setSavedSuccess(true);
      setImportJsonText('');
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setImportError('JSON inválido ou corrompido. Verifique a estrutura e tente novamente.');
    }
  };

  const colorPalettes: { id: ThemeColorPalette; label: string; bgClass: string; desc: string }[] = [
    { id: 'amber', label: 'Âmbar Dourado', bgClass: 'from-amber-400 to-amber-600', desc: 'Elegância clássica, flats, hotéis urbanos e executivos' },
    { id: 'emerald', label: 'Verde Esmeralda', bgClass: 'from-emerald-400 to-emerald-600', desc: 'Pousadas de charme, natureza, eco-resorts e pousadas' },
    { id: 'blue', label: 'Azul Safira & Mar', bgClass: 'from-blue-400 to-blue-600', desc: 'Resorts de praia, spas litorâneos e hotéis modernos' },
    { id: 'rose', label: 'Ouro Rosa & Rosé', bgClass: 'from-rose-400 to-rose-600', desc: 'Hotéis boutique, celebrações românticas e luxo intimista' },
    { id: 'purple', label: 'Púrpura & Lavanda', bgClass: 'from-purple-400 to-purple-600', desc: 'Chalés de montanha, retiros de bem-estar e inverno' },
    { id: 'slate', label: 'Grafite & Prata', bgClass: 'from-slate-300 to-slate-500', desc: 'Design minimalista contemporâneo e executivo premium' },
    { id: 'terracotta', label: 'Terracotta Rústico', bgClass: 'from-orange-500 to-amber-700', desc: 'Hotéis fazenda, vinícolas, campo e turismo rural' },
  ];

  const typographyOptions: { id: TypographyStyle; label: string; sample: string; desc: string }[] = [
    { id: 'serif_luxury', label: 'Serifado Nobre (Playfair Luxury)', sample: 'Hospitalidade de Prestígio', desc: 'Elegante, refinado e sofisticado para hotelaria de alto padrão' },
    { id: 'modern_sans', label: 'Moderno Sans-Serif', sample: 'Conforto & Praticidade', desc: 'Direto, tecnológico, limpo e excelente legibilidade' },
    { id: 'editorial', label: 'Editorial Clássico', sample: 'Experiências Inesquecíveis', desc: 'Charme aconchegante, tradicional e acolhedor' },
  ];

  const propertyTypes: { id: PropertyType; label: string }[] = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'pousada', label: 'Pousada' },
    { id: 'resort', label: 'Resort' },
    { id: 'flat', label: 'Flat & Apart Hotel' },
    { id: 'boutique', label: 'Hotel Boutique' },
    { id: 'chales', label: 'Chalés & Cabanas' },
    { id: 'fazenda', label: 'Hotel Fazenda' },
  ];

  const heroImagePresets = [
    { label: 'Hotel Executivo Moderno', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80' },
    { label: 'Pousada de Charme Verde', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80' },
    { label: 'Resort com Piscina Luxo', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80' },
    { label: 'Chalé Romântico na Montanha', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1920&q=80' },
    { label: 'Hotel Fazenda Rústico', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Estúdio White-Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
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
              Personalize 100% das cores, tipografia, seções visíveis, textos e dados da empresa para vender a qualquer hotel, pousada ou resort.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Abrir o site público do cliente em nova aba ou visualização"
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>Visualizar Site</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>

          <button
            onClick={() => handleSave()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Configurações do Layout salvas com sucesso! O site foi atualizado em tempo real.</span>
          </div>
          <button 
            onClick={() => setCurrentView('landing')} 
            className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition text-[11px]"
          >
            Conferir Resultado →
          </button>
        </div>
      )}

      {/* Navegação por Sub-Abas do Estúdio */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('presets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'presets' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Modelos Prontos (Presets)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'branding' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>2. Cores & Tipografia</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sections' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Seções do Layout</span>
        </button>

        <button
          onClick={() => setActiveSubTab('content')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'content' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>4. Textos & Dados</span>
        </button>

        <button
          onClick={() => setActiveSubTab('amenities')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'amenities' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>5. Comodidades & FAQs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('portability')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'portability' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>6. Exportar / Importar JSON</span>
        </button>
      </div>

      {/* SUB-ABA 1: MODELOS PRONTOS (PRESETS EM 1-CLIQUE) */}
      {activeSubTab === 'presets' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900">
                Escolha um Modelo Pré-Configurado para Transformar o Site Instantaneamente
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Ao selecionar um modelo, todas as paletas de cores, fontes, títulos, fotos do hero e comodidades se adaptam automaticamente ao nicho do cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Preset 1: Pousada Charme */}
              <div 
                onClick={() => handlePresetSelect('pousada')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80" 
                    alt="Pousada" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Pousada de Charme
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700">
                    Pousada Villa Verde & Charme
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Verde Esmeralda, tipografia editorial, foco em café colonial, piscina aquecida e tranquilidade.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

              {/* Preset 2: Resort Litoral */}
              <div 
                onClick={() => handlePresetSelect('resort')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-blue-500 bg-white hover:bg-blue-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80" 
                    alt="Resort" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    Resort & Spa
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-blue-700">
                    Grand Blue Ocean Resort & Spa
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Azul Safira, tipografia serif luxo, complexo aquático, all inclusive e lazer de alto padrão.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

              {/* Preset 3: Hotel Fazenda */}
              <div 
                onClick={() => handlePresetSelect('fazenda')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-700 bg-white hover:bg-amber-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80" 
                    alt="Hotel Fazenda" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-bold">
                    Hotel Fazenda
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-800">
                    Hotel Fazenda & Haras Imperial
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Terracotta Rústico, pensão completa, passeios a cavalo, pesca esportiva e vida no campo.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

              {/* Preset 4: Flat & Apart Hotel */}
              <div 
                onClick={() => handlePresetSelect('flat')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-500 bg-white hover:bg-amber-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" 
                    alt="Flat Executivo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold">
                    Flat & Apart Hotel
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-600">
                    Itajubá Flat Hotel Executivo
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Âmbar Dourado, apartamentos mobiliados com cozinha compacta, coworking e localização central.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

              {/* Preset 5: Hotel Boutique */}
              <div 
                onClick={() => handlePresetSelect('boutique')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-rose-500 bg-white hover:bg-rose-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80" 
                    alt="Boutique" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    Hotel Boutique
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-rose-700">
                    Boutique Hotel & Bistrô Maison
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Rose Champagne, enogastronomia, adega climatizada, suítes exclusivas e atendimento intimista.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

              {/* Preset 6: Chalés de Montanha */}
              <div 
                onClick={() => handlePresetSelect('chale')}
                className="group p-5 rounded-2xl border-2 border-stone-200 hover:border-purple-500 bg-white hover:bg-purple-50/30 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80" 
                    alt="Chalés" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    Chalés & Cabanas
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-purple-700">
                    Chalés & Cabanas da Mantiqueira
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Tema Púrpura & Lavanda, hidromassagem com vista panorâmica, lareira ecológica e fondue.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                  <span>Aplicar este Modelo</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: CORES & TIPOGRAFIA */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          
          {/* Seletor de Paleta de Cores */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-600" />
                Paleta de Cores Primária da Marca
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Altera simultaneamente os botões, emblemas, destaques, bordas e detalhes em toda a Landing Page e Painel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {colorPalettes.map((p) => {
                const isSelected = formData.tema_cor === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setFormData({ ...formData, tema_cor: p.id })}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2.5 ${
                      isSelected 
                        ? 'border-stone-950 bg-stone-50 ring-2 ring-stone-950/20' 
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.bgClass} shadow-md`} />
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-950 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ativo
                        </span>
                      )}
                    </div>
                    <div>
                      <strong className="text-xs text-stone-900 block">{p.label}</strong>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">{p.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seletor de Tipografia */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-amber-600" />
                Estilo Tipográfico
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Define a família de fontes para títulos principais, cabeçalhos de seções e identidade da marca.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {typographyOptions.map((t) => {
                const isSelected = formData.tipografia === t.id;
                const fontClass = getFontFamilyClass(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => setFormData({ ...formData, tipografia: t.id })}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                      isSelected 
                        ? 'border-stone-950 bg-stone-50 ring-2 ring-stone-950/20' 
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-stone-800">{t.label}</strong>
                      {isSelected && <Check className="w-4 h-4 text-stone-900" />}
                    </div>
                    <div className={`${fontClass} text-base font-bold text-stone-900 py-1`}>
                      "{t.sample}"
                    </div>
                    <p className="text-[11px] text-stone-500">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Imagem de Fundo do Banner Hero */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                Imagem de Fundo do Banner Principal (Hero)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Escolha uma imagem de alta resolução da biblioteca ou insira a URL personalizada do hotel.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">URL da Imagem de Fundo</label>
                <input
                  type="text"
                  value={formData.banner_hero}
                  onChange={(e) => setFormData({ ...formData, banner_hero: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-stone-600 block mb-2">Sugestões de Fotos de Alta Resolução em 1-Clique:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {heroImagePresets.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, banner_hero: img.url })}
                      className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                        formData.banner_hero === img.url ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-stone-950/40 flex items-end p-1.5">
                        <span className="text-[10px] text-white font-medium truncate">{img.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-ABA 3: VISIBILIDADE DAS SEÇÕES DO LAYOUT */}
      {activeSubTab === 'sections' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Ativação & Desativação das Seções da Landing Page
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Escolha exatamente quais módulos e blocos serão exibidos para os visitantes do site. Ideal para adaptar o site de acordo com o plano contratado pelo hotel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {[
              { key: 'show_hero' as const, label: 'Hero Banner com Foto de Capa', desc: 'Banner cinematográfico com títulos, chamada de boas-vindas e slogan' },
              { key: 'show_search_bar' as const, label: 'Barra de Busca Rápida de Reservas', desc: 'Motor de pesquisa com seleção de datas de check-in/out e hóspedes' },
              { key: 'show_highlights' as const, label: 'Faixa de Destaques e Diferenciais', desc: 'Selo de avaliação, localização privilegiada e vantagens inclusas' },
              { key: 'show_rooms' as const, label: 'Acomodações & Quartos Disponíveis', desc: 'Vitrine de quartos com fotos, tarifas diárias, comodidades e botão de reserva' },
              { key: 'show_amenities' as const, label: 'Comodidades & Estrutura do Hotel', desc: 'Cards visuais com ícones das facilidades (Piscina, Café, Wi-Fi, Estacionamento)' },
              { key: 'show_about' as const, label: 'Sobre o Estabelecimento & História', desc: 'Texto de apresentação, fotografia do espaço e pilares de hospitalidade' },
              { key: 'show_location' as const, label: 'Localização & Pontos Turísticos Próximos', desc: 'Mapa integrado, endereço completo e distâncias para atrações da região' },
              { key: 'show_testimonials' as const, label: 'Avaliações & Depoimentos de Hóspedes', desc: 'Depoimentos reais com estrelas, nome do hóspede e notas de satisfação' },
              { key: 'show_faq' as const, label: 'Perguntas Frequentes (FAQ Acordeão)', desc: 'Respostas para dúvidas comuns sobre horários, cancelamento e animais de estimação' },
              { key: 'show_contact' as const, label: 'Canais de Contato & Recepção', desc: 'Telefones, e-mail oficial, horários da recepção e formulário direto' },
              { key: 'show_whatsapp_float' as const, label: 'Botão Flutuante de WhatsApp com Chat', desc: 'Ícone no canto da tela com mensagem rápida pré-configurada' },
            ].map((section) => {
              const isVisible = formData.secoes_visibilidade?.[section.key] !== false;
              return (
                <div
                  key={section.key}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      secoes_visibilidade: {
                        ...formData.secoes_visibilidade,
                        [section.key]: !isVisible
                      }
                    });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    isVisible 
                      ? 'border-emerald-200 bg-emerald-50/40 text-stone-900' 
                      : 'border-stone-200 bg-stone-50/60 opacity-60 text-stone-500'
                  }`}
                >
                  <div className="space-y-1">
                    <strong className="text-xs font-bold block">{section.label}</strong>
                    <p className="text-[11px] text-stone-500 leading-snug">{section.desc}</p>
                  </div>

                  <div className="flex-shrink-0 pt-0.5">
                    {isVisible ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Visível
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-stone-300 text-stone-700 text-[10px] font-bold">
                        Oculto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* SUB-ABA 4: TEXTOS & CONTEÚDO EDITÁVEL */}
      {activeSubTab === 'content' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Identificação & Conteúdos da Landing Page
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Edite todos os textos que aparecem no site para refletir fielmente a proposta de valor do hotel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Nome do Estabelecimento</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Tipo de Propriedade</label>
              <select
                value={formData.tipo_estabelecimento}
                onChange={(e) => setFormData({ ...formData, tipo_estabelecimento: e.target.value as PropertyType })}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-semibold capitalize"
              >
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold uppercase text-stone-600 mb-1">Slogan Curto</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Badge de Destaque no Topo do Hero</label>
              <input
                type="text"
                value={formData.hero_badge_custom || ''}
                onChange={(e) => setFormData({ ...formData, hero_badge_custom: e.target.value })}
                placeholder="Ex: ★ 4.9 de Avaliação • Melhor Escolha"
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Título de Impacto no Hero</label>
              <input
                type="text"
                value={formData.hero_titulo_custom || ''}
                onChange={(e) => setFormData({ ...formData, hero_titulo_custom: e.target.value })}
                placeholder="Ex: Sua Estadia Perfeita no Coração da Cidade"
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold uppercase text-stone-600 mb-1">Texto de Apresentação da Seção Sobre</label>
              <textarea
                rows={4}
                value={formData.sobre_texto || ''}
                onChange={(e) => setFormData({ ...formData, sobre_texto: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Cidade / Estado</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                />
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="UF (Ex: MG)"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-semibold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Telefone & WhatsApp</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="Telefone"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-mono"
                />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="WhatsApp"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-mono"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-ABA 5: COMODIDADES & FAQS */}
      {activeSubTab === 'amenities' && (
        <div className="space-y-6">
          
          {/* Comodidades Personalizadas */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900">
                  Comodidades & Serviços do Estabelecimento ({formData.comodidades_personalizadas?.length || 0})
                </h3>
                <p className="text-xs text-stone-500">
                  Itens exibidos na seção de estrutura com ícone, título e descrição.
                </p>
              </div>

              <button
                onClick={() => {
                  const newAmenity: CustomAmenity = {
                    id: `amenity-${Date.now()}`,
                    titulo: 'Nova Comodidade',
                    descricao: 'Descrição breve da comodidade e conveniência.',
                    icone: 'Sparkles',
                    destaque: true
                  };
                  setFormData({
                    ...formData,
                    comodidades_personalizadas: [...(formData.comodidades_personalizadas || []), newAmenity]
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Comodidade</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formData.comodidades_personalizadas?.map((amenity, idx) => (
                <div key={amenity.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2 relative">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={amenity.titulo}
                      onChange={(e) => {
                        const updated = [...formData.comodidades_personalizadas];
                        updated[idx].titulo = e.target.value;
                        setFormData({ ...formData, comodidades_personalizadas: updated });
                      }}
                      className="font-bold text-xs text-stone-900 bg-white px-2 py-1 rounded border border-stone-300 w-full"
                    />
                    <button
                      onClick={() => {
                        const updated = formData.comodidades_personalizadas.filter((_, i) => i !== idx);
                        setFormData({ ...formData, comodidades_personalizadas: updated });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={amenity.descricao}
                    onChange={(e) => {
                      const updated = [...formData.comodidades_personalizadas];
                      updated[idx].descricao = e.target.value;
                      setFormData({ ...formData, comodidades_personalizadas: updated });
                    }}
                    placeholder="Descrição breve..."
                    className="text-[11px] text-stone-600 bg-white px-2 py-1 rounded border border-stone-300 w-full"
                  />
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>Ícone: <strong>{amenity.icone}</strong></span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={amenity.destaque}
                        onChange={(e) => {
                          const updated = [...formData.comodidades_personalizadas];
                          updated[idx].destaque = e.target.checked;
                          setFormData({ ...formData, comodidades_personalizadas: updated });
                        }}
                      />
                      <span>Destaque</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perguntas Frequentes (FAQ) */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900">
                  Perguntas Frequentes (FAQ) ({formData.faqs?.length || 0})
                </h3>
                <p className="text-xs text-stone-500">
                  Respostas automáticas para esclarecer dúvidas de reservas e políticas.
                </p>
              </div>

              <button
                onClick={() => {
                  const newFaq: CustomFaq = {
                    id: `faq-${Date.now()}`,
                    pergunta: 'Pergunta Frequente...',
                    resposta: 'Resposta completa detalhada para o hóspede.',
                    categoria: 'Geral'
                  };
                  setFormData({
                    ...formData,
                    faqs: [...(formData.faqs || []), newFaq]
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-900 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Pergunta</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.faqs?.map((faq, idx) => (
                <div key={faq.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={faq.pergunta}
                      onChange={(e) => {
                        const updated = [...formData.faqs];
                        updated[idx].pergunta = e.target.value;
                        setFormData({ ...formData, faqs: updated });
                      }}
                      className="font-bold text-xs text-stone-900 bg-white px-2 py-1.5 rounded border border-stone-300 w-full"
                    />
                    <button
                      onClick={() => {
                        const updated = formData.faqs.filter((_, i) => i !== idx);
                        setFormData({ ...formData, faqs: updated });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={faq.resposta}
                    onChange={(e) => {
                      const updated = [...formData.faqs];
                      updated[idx].resposta = e.target.value;
                      setFormData({ ...formData, faqs: updated });
                    }}
                    className="text-xs text-stone-700 bg-white px-2 py-1.5 rounded border border-stone-300 w-full"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-ABA 6: PORTABILIDADE & EXPORTAÇÃO JSON */}
      {activeSubTab === 'portability' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-600" />
                Portabilidade White-Label & Clonagem de Configurações
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Exporte todo o perfil visual, seções e dados deste hotel em um único arquivo JSON para fazer backup ou replicar a mesma estrutura em novos clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Card Exportação */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Exportar Configuração Atual</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Baixe o arquivo JSON contendo todas as cores, tipografia, seções visíveis, comodidades e textos configurados para <strong>{hotelConfig.nome}</strong>.
                </p>
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Configuração JSON</span>
                </button>
              </div>

              {/* Card Importação */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Importar Configuração JSON</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cole abaixo o JSON de outro hotel ou backup para carregar todo o layout instantaneamente:
                </p>
                
                {importError && (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {importError}
                  </p>
                )}

                <textarea
                  rows={3}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"nome": "Meu Novo Hotel", "tema_cor": "emerald", ...}'
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono bg-white"
                />

                <button
                  onClick={handleImportJson}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Aplicar JSON Importado</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
