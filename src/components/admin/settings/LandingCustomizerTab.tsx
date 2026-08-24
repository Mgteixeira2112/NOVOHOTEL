import React, { useState } from 'react';
import { useHotel } from '../../../context/HotelContext';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Palette, 
  Type, 
  Layers, 
  Eye, 
  Plus, 
  Trash2, 
  Star, 
  Check, 
  ExternalLink,
  MessageSquare,
  HelpCircle,
  MapPin,
  BedDouble,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Building2,
  Phone,
  Compass,
  FileText
} from 'lucide-react';
import { 
  ThemeColorPalette, 
  TypographyStyle, 
  PropertyType, 
  CustomAmenity, 
  CustomFaq, 
  CustomTestimonial,
  PointOfInterest 
} from '../../../types';
import { getTheme, getFontFamilyClass, getIconComponent } from '../../../utils/themeHelper';

// Presets de Imagem de Fundo (Wallpapers de Alta Resolução)
export const HERO_BACKGROUND_PRESETS = [
  {
    id: 'pousada_serra',
    name: 'Pousada de Montanha & Serra',
    category: 'Pousada / Serra',
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=80',
    description: 'Vista panorâmica de montanhas, chalés aconchegantes e natureza verdejante.'
  },
  {
    id: 'resort_tropical',
    name: 'Resort & Piscina Tropical',
    category: 'Resort / Litoral',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80',
    description: 'Piscina de borda infinita, espreguiçadeiras e clima de férias de luxo.'
  },
  {
    id: 'flat_executivo',
    name: 'Apart-Hotel Executivo Moderno',
    category: 'Flat / Urbano',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=2000&q=80',
    description: 'Ambiente executivo sofisticado, ideal para viagens a trabalho e estadias prolongadas.'
  },
  {
    id: 'chale_lareira',
    name: 'Chalé Rústico com Lareira',
    category: 'Chalé / Romântico',
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80',
    description: 'Madeira nobre, clima acolhedor de inverno e refúgio intimista.'
  },
  {
    id: 'hotel_fazenda',
    name: 'Hotel Fazenda & Ecoturismo',
    category: 'Fazenda / Campo',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80',
    description: 'Campos abertos, ar puro, haras e tranquilidade do interior.'
  },
  {
    id: 'suite_hidro',
    name: 'Suíte de Luxo com Banheira',
    category: 'Boutique / Luxo',
    url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=2000&q=80',
    description: 'Hidromassagem com vista, iluminação relaxante e acabamento nobre.'
  },
  {
    id: 'pousada_noite',
    name: 'Pousada Iluminada à Noite',
    category: 'Pousada / Noite',
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=80',
    description: 'Iluminação cênica noturna, piscina espelhada e charme romântico.'
  },
  {
    id: 'boutique_design',
    name: 'Hotel Boutique Contemporâneo',
    category: 'Design / Conceito',
    url: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=2000&q=80',
    description: 'Design de interiores exclusivo, peças autorais e elegância pura.'
  }
];

export const LandingCustomizerTab: React.FC = () => {
  const { hotelConfig, updateHotelConfig, setCurrentView } = useHotel();
  const [formData, setFormData] = useState({ ...hotelConfig });
  const [activeSection, setActiveSection] = useState<'hero_bg' | 'branding' | 'about' | 'amenities' | 'rooms' | 'testimonials' | 'faqs' | 'location' | 'contact' | 'visibility'>('hero_bg');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync formData with hotelConfig if it changes
  React.useEffect(() => {
    setFormData({ ...hotelConfig });
  }, [hotelConfig]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateHotelConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const theme = getTheme(formData.tema_cor);
  const fontClass = getFontFamilyClass(formData.tipografia);

  const colorPalettes: { id: ThemeColorPalette; label: string; bgClass: string; desc: string }[] = [
    { id: 'amber', label: 'Âmbar Dourado', bgClass: 'from-amber-400 to-amber-600', desc: 'Flats executivos, apart-hotéis e hotéis clássicos' },
    { id: 'emerald', label: 'Verde Esmeralda', bgClass: 'from-emerald-400 to-emerald-600', desc: 'Pousadas de montanha, eco-resorts e turismo verde' },
    { id: 'blue', label: 'Azul Safira & Mar', bgClass: 'from-blue-400 to-blue-600', desc: 'Resorts de praia, spas litorâneos e hotelaria moderna' },
    { id: 'rose', label: 'Ouro Rosa & Rosé', bgClass: 'from-rose-400 to-rose-600', desc: 'Hotéis boutique, celebrações e estadias românticas' },
    { id: 'purple', label: 'Púrpura & Lavanda', bgClass: 'from-purple-400 to-purple-600', desc: 'Chalés de inverno, refúgios da serra e bem-estar' },
    { id: 'slate', label: 'Grafite & Prata', bgClass: 'from-slate-300 to-slate-500', desc: 'Design minimalista, contemporâneo e executivo' },
    { id: 'terracotta', label: 'Terracotta Rústico', bgClass: 'from-orange-500 to-amber-700', desc: 'Hotéis fazenda, turismo rural, haras e vinícolas' },
  ];

  const typographyOptions: { id: TypographyStyle; label: string; sample: string; desc: string }[] = [
    { id: 'serif_luxury', label: 'Serifado Nobre (Playfair Display)', sample: 'Hospitalidade de Prestígio', desc: 'Elegante, refinado e sofisticado para hotelaria de alto padrão' },
    { id: 'modern_sans', label: 'Moderno Sans-Serif (Inter / Modern)', sample: 'Conforto & Praticidade', desc: 'Direto, tecnológico, limpo e de altíssima legibilidade' },
    { id: 'editorial', label: 'Editorial Clássico (Cinzel / Editorial)', sample: 'Experiências Inesquecíveis', desc: 'Charme acolhedor, tradicional e memorável' },
  ];

  const propertyTypes: { id: PropertyType; label: string }[] = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'pousada', label: 'Pousada' },
    { id: 'resort', label: 'Resort' },
    { id: 'flat', label: 'Flat & Apart-Hotel' },
    { id: 'boutique', label: 'Hotel Boutique' },
    { id: 'chales', label: 'Chalés de Montanha' },
    { id: 'fazenda', label: 'Hotel Fazenda' },
  ];

  // Amenities Handlers
  const handleAddAmenity = () => {
    const newAmenity: CustomAmenity = {
      id: `com-${Date.now()}`,
      icone: 'sparkles',
      titulo: 'Nova Comodidade',
      descricao: 'Descrição do serviço ou atrativo oferecido aos hóspedes.',
      destaque: false
    };
    setFormData(prev => ({
      ...prev,
      comodidades_personalizadas: [...prev.comodidades_personalizadas, newAmenity]
    }));
  };

  const handleUpdateAmenity = (id: string, updates: Partial<CustomAmenity>) => {
    setFormData(prev => ({
      ...prev,
      comodidades_personalizadas: prev.comodidades_personalizadas.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const handleDeleteAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      comodidades_personalizadas: prev.comodidades_personalizadas.filter(a => a.id !== id)
    }));
  };

  // Testimonials Handlers
  const handleAddTestimonial = () => {
    const newTestimonial: CustomTestimonial = {
      id: `dep-${Date.now()}`,
      nome: 'Nome do Hóspede',
      origem: 'Cidade - UF',
      avaliacao: 5,
      comentario: 'Experiência maravilhosa! Atendimento impecável, acomodações muito confortáveis e café da manhã delicioso.',
      data: new Date().toLocaleDateString('pt-BR'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      destaque: true
    };
    setFormData(prev => ({
      ...prev,
      depoimentos: [...(prev.depoimentos || []), newTestimonial]
    }));
  };

  const handleUpdateTestimonial = (id: string, updates: Partial<CustomTestimonial>) => {
    setFormData(prev => ({
      ...prev,
      depoimentos: (prev.depoimentos || []).map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleDeleteTestimonial = (id: string) => {
    setFormData(prev => ({
      ...prev,
      depoimentos: (prev.depoimentos || []).filter(t => t.id !== id)
    }));
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const newFaq: CustomFaq = {
      id: `faq-${Date.now()}`,
      pergunta: 'Qual é o horário de check-in e check-out?',
      resposta: 'O check-in inicia às 14h00 e o check-out deve ser realizado até às 12h00.',
      categoria: 'Geral'
    };
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), newFaq]
    }));
  };

  const handleUpdateFaq = (id: string, updates: Partial<CustomFaq>) => {
    setFormData(prev => ({
      ...prev,
      faqs: (prev.faqs || []).map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteFaq = (id: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter(f => f.id !== id)
    }));
  };

  // Points of Interest Handlers
  const handleAddPoi = () => {
    const newPoi: PointOfInterest = {
      id: `poi-${Date.now()}`,
      nome: 'Ponto Turístico ou Comercial',
      distancia: '500m (3 min)',
      tipo: 'lazer'
    };
    setFormData(prev => ({
      ...prev,
      pontos_interesse: [...(prev.pontos_interesse || []), newPoi]
    }));
  };

  const handleUpdatePoi = (id: string, updates: Partial<PointOfInterest>) => {
    setFormData(prev => ({
      ...prev,
      pontos_interesse: (prev.pontos_interesse || []).map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const handleDeletePoi = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pontos_interesse: (prev.pontos_interesse || []).filter(p => p.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Sub-Navegação dos Elementos da Landing Page */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveSection('hero_bg')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'hero_bg' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Plano de Fundo & Hero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('branding')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'branding' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span>Cores & Tipografia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('about')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'about' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Sobre o Estabelecimento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('amenities')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'amenities' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Comodidades ({formData.comodidades_personalizadas?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('rooms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'rooms' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BedDouble className="w-4 h-4 text-purple-400" />
            <span>Acomodações / Textos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('testimonials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'testimonials' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>Depoimentos ({formData.depoimentos?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('faqs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'faqs' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>FAQ ({formData.faqs?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('location')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'location' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Localização & POIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('contact')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'contact' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Phone className="w-4 h-4 text-indigo-400" />
            <span>Contato & Rodapé</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('visibility')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'visibility' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Exibir/Ocultar Seções</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Visualizar a landing page com as configurações atuais"
          >
            <Eye className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Ver Site</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Alterações da Landing Page salvas com sucesso! O site já está atualizado em tempo real.</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver no Site</span>
          </button>
        </div>
      )}

      {/* SEÇÃO 1: PLANO DE FUNDO (WALLPAPER) E APRESENTAÇÃO HERO */}
      {activeSection === 'hero_bg' && (
        <div className="space-y-6">
          
          {/* Card Principal de Fundo do Hero */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  Plano de Fundo Principal da Landing Page (Hero Wallpaper)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Selecione uma imagem de fundo de alta resolução dos modelos prontos ou cole a URL de qualquer foto do estabelecimento.
                </p>
              </div>
            </div>

            {/* Prévia Interativa do Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 aspect-[21/9] max-h-72 w-full flex items-center justify-center text-center p-6 shadow-inner">
              <img 
                src={formData.banner_hero} 
                alt="Prévia de Fundo" 
                referrerPolicy="no-referrer"
                style={{ opacity: (100 - (formData.hero_overlay_opacity !== undefined ? formData.hero_overlay_opacity : 70)) / 100 }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
              
              <div className="relative z-10 max-w-xl text-white space-y-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-sm border border-stone-700 text-[10px] text-amber-300 font-semibold mb-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{formData.hero_badge_custom || `${formData.bairro || 'Centro'}, ${formData.cidade} — ${formData.estado}`}</span>
                </div>
                <h4 className={`${fontClass} text-xl sm:text-3xl font-bold tracking-tight text-white drop-shadow`}>
                  {formData.hero_titulo_custom || formData.nome}
                </h4>
                <p className="text-xs sm:text-sm text-stone-300 font-light line-clamp-2 drop-shadow">
                  {formData.hero_subtitulo_custom || formData.slogan}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow">
                    Consultar Disponibilidade
                  </span>
                </div>
              </div>
            </div>

            {/* Campo para Inserir URL Direta */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL da Imagem de Fundo (Wallpaper)
                </label>
                <input
                  type="url"
                  value={formData.banner_hero}
                  onChange={(e) => setFormData({ ...formData, banner_hero: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-xs text-stone-900"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Escurecimento / Overlay:</span>
                  <span className="text-amber-600 font-black">{formData.hero_overlay_opacity || 70}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={formData.hero_overlay_opacity !== undefined ? formData.hero_overlay_opacity : 70}
                  onChange={(e) => setFormData({ ...formData, hero_overlay_opacity: Number(e.target.value) })}
                  className="w-full accent-amber-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Galeria de Wallpapers Prontos para 1-Clique */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ou escolha um Plano de Fundo de Alta Definição da Galeria:</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {HERO_BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = formData.banner_hero === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setFormData({ ...formData, banner_hero: preset.url })}
                      className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all aspect-[16/10] ${
                        isSelected 
                          ? 'border-amber-500 ring-2 ring-amber-400 shadow-md scale-[1.02]' 
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent p-2.5 flex flex-col justify-end">
                        <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">
                          {preset.category}
                        </span>
                        <strong className="text-xs text-white font-bold leading-tight truncate">
                          {preset.name}
                        </strong>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Textos Principais do Hero */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Textos & Selos de Destaque da Seção Hero
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nome Oficial do Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nome: e.target.value,
                      hero_titulo_custom: e.target.value 
                    })}
                    placeholder="Ex: Hotel Centenário Itajubá"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Selo / Badge de Localização (Superior)
                  </label>
                  <input
                    type="text"
                    value={formData.hero_badge_custom || ''}
                    onChange={(e) => setFormData({ ...formData, hero_badge_custom: e.target.value })}
                    placeholder="Ex: Centro Histórico, Itajubá — MG"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Slogan Oficial & Subtítulo de Impacto
                </label>
                <textarea
                  rows={2}
                  value={formData.slogan || formData.hero_subtitulo_custom || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    slogan: e.target.value,
                    hero_subtitulo_custom: e.target.value 
                  })}
                  placeholder="Ex: Tradição, acolhimento mineiro e a melhor localização em frente à Praça Central de Itajubá."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Classificação em Estrelas (1 a 5)
                  </label>
                  <select
                    value={formData.estrelas || 4}
                    onChange={(e) => setFormData({ ...formData, estrelas: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                  >
                    <option value={1}>★ 1 Estrela</option>
                    <option value={2}>★★ 2 Estrelas</option>
                    <option value={3}>★★★ 3 Estrelas</option>
                    <option value={4}>★★★★ 4 Estrelas (Padrão Superior)</option>
                    <option value={5}>★★★★★ 5 Estrelas (Luxo Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tipo de Estabelecimento
                  </label>
                  <select
                    value={formData.tipo_estabelecimento}
                    onChange={(e) => setFormData({ ...formData, tipo_estabelecimento: e.target.value as PropertyType })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                  >
                    {propertyTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SEÇÃO 2: IDENTIDADE VISUAL, CORES E TIPOGRAFIA */}
      {activeSection === 'branding' && (
        <div className="space-y-6">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-500" />
                Identidade Visual, Paleta de Cores e Tipografia
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Customize a cor de destaque da marca e a fonte para combinar perfeitamente com a identidade do cliente.
              </p>
            </div>

            {/* Seleção de Paleta de Cores */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Paleta de Cores do Tema (White-Label)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {colorPalettes.map((c) => {
                  const isSelected = formData.tema_cor === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setFormData({ ...formData, tema_cor: c.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                        isSelected 
                          ? 'border-stone-900 bg-stone-900 text-white shadow-md' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bgClass} flex-shrink-0 shadow-sm`} />
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-bold truncate">
                          {c.label}
                        </strong>
                        <span className={`text-[11px] block truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {c.desc}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-300 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seleção de Tipografia */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700">
                Estilo Tipográfico
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {typographyOptions.map((t) => {
                  const isSelected = formData.tipografia === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setFormData({ ...formData, tipografia: t.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${
                        isSelected 
                          ? 'border-stone-900 bg-stone-900 text-white shadow-md' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold">{t.label}</strong>
                        {isSelected && <Check className="w-4 h-4 text-amber-300" />}
                      </div>
                      <p className={`text-base font-bold truncate ${t.id === 'serif_luxury' ? 'font-serif-luxury' : t.id === 'editorial' ? 'font-editorial' : 'font-sans'}`}>
                        {t.sample}
                      </p>
                      <span className={`text-[10px] block ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {t.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logotipo ou Iniciais Monograma */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Logotipo & Iniciais da Marca
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    URL da Imagem da Logomarca (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://sua-hospedagem.com.br/logo.png"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Se vazio, o sistema gerará automaticamente um brasão elegante com as iniciais do nome.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Iniciais para o Brasão / Monograma
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.logo_iniciais || ''}
                    onChange={(e) => setFormData({ ...formData, logo_iniciais: e.target.value.toUpperCase() })}
                    placeholder="Ex: IFH, PVV, GBR"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold uppercase"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SEÇÃO 3: SOBRE O ESTABELECIMENTO */}
      {activeSection === 'about' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Seção Sobre o Estabelecimento & Diferenciais
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Personalize os títulos, a foto institucional, o texto da história e os tópicos de destaque que encantam os hóspedes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título Principal da Seção Sobre
                </label>
                <input
                  type="text"
                  value={formData.sobre_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, sobre_titulo: e.target.value })}
                  placeholder="Ex: Seu melhor endereço no coração de Itajubá"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior (Eyebrow)
                </label>
                <input
                  type="text"
                  value={formData.sobre_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, sobre_subtitulo: e.target.value })}
                  placeholder="Ex: Hospitalidade Mineira & Conforto"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Texto Completo da História / Apresentação
              </label>
              <textarea
                rows={5}
                value={formData.sobre_texto || ''}
                onChange={(e) => setFormData({ ...formData, sobre_texto: e.target.value })}
                placeholder="Conte a história, os diferenciais do atendimento e as comodidades..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL da Foto Institucional do Sobre
                </label>
                <input
                  type="url"
                  value={formData.sobre_foto_url || ''}
                  onChange={(e) => setFormData({ ...formData, sobre_foto_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nota Média
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={formData.nota_avaliacao || 9.4}
                    onChange={(e) => setFormData({ ...formData, nota_avaliacao: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Rótulo Nota
                  </label>
                  <input
                    type="text"
                    value={formData.nota_label || ''}
                    onChange={(e) => setFormData({ ...formData, nota_label: e.target.value })}
                    placeholder="Excelente"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Gerenciador de Diferenciais do Sobre */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Diferenciais & Destaques da Propriedade (Cards)
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const diffs = formData.sobre_diferenciais || [];
                    setFormData({
                      ...formData,
                      sobre_diferenciais: [...diffs, { titulo: 'Novo Diferencial', desc: 'Descrição do diferencial oferecido aos hóspedes.' }]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Diferencial</span>
                </button>
              </div>

              <div className="space-y-3">
                {(formData.sobre_diferenciais || []).map((diff, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <input
                        type="text"
                        value={diff.titulo}
                        onChange={(e) => {
                          const updated = [...(formData.sobre_diferenciais || [])];
                          updated[index] = { ...updated[index], titulo: e.target.value };
                          setFormData({ ...formData, sobre_diferenciais: updated });
                        }}
                        placeholder="Título do diferencial"
                        className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                      />
                      <input
                        type="text"
                        value={diff.desc}
                        onChange={(e) => {
                          const updated = [...(formData.sobre_diferenciais || [])];
                          updated[index] = { ...updated[index], desc: e.target.value };
                          setFormData({ ...formData, sobre_diferenciais: updated });
                        }}
                        placeholder="Descrição explicativa"
                        className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.sobre_diferenciais || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, sobre_diferenciais: updated });
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remover este diferencial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 4: COMODIDADES & SERVIÇOS */}
      {activeSection === 'amenities' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Comodidades & Estrutura da Hospedagem
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Gerencie todos os serviços oferecidos. Comodidades marcadas como "Destaque" aparecem também no topo do Hero!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Comodidade</span>
              </button>
            </div>

            {/* Títulos da Seção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção de Comodidades
                </label>
                <input
                  type="text"
                  value={formData.estrutura_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, estrutura_titulo: e.target.value })}
                  placeholder="Ex: Tudo o que você precisa em uma estadia inesquecível"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.estrutura_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, estrutura_subtitulo: e.target.value })}
                  placeholder="Ex: Estrutura Completa & Serviços"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Lista de Comodidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.comodidades_personalizadas || []).map((amenity) => {
                const Icon = getIconComponent(amenity.icone);
                return (
                  <div key={amenity.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-amber-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <select
                          value={amenity.icone}
                          onChange={(e) => handleUpdateAmenity(amenity.id, { icone: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-stone-300 bg-white text-[11px] font-bold"
                        >
                          <option value="coffee">Café da Manhã</option>
                          <option value="wifi">Wi-Fi / Internet</option>
                          <option value="utensils">Cozinha / Restaurante</option>
                          <option value="car">Estacionamento</option>
                          <option value="dumbbell">Academia / Fitness</option>
                          <option value="flame">Sauna / Lareira</option>
                          <option value="key">Fechadura Digital / PIN</option>
                          <option value="dog">Pet Friendly</option>
                          <option value="clock">Recepção 24h</option>
                          <option value="sparkles">Geral / Spa</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={amenity.destaque}
                            onChange={(e) => handleUpdateAmenity(amenity.id, { destaque: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>Destaque Hero</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteAmenity(amenity.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={amenity.titulo}
                      onChange={(e) => handleUpdateAmenity(amenity.id, { titulo: e.target.value })}
                      placeholder="Título da comodidade"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                    />

                    <textarea
                      rows={2}
                      value={amenity.descricao}
                      onChange={(e) => handleUpdateAmenity(amenity.id, { descricao: e.target.value })}
                      placeholder="Descrição detalhada do serviço..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 5: ACOMODAÇÕES & QUARTOS (TEXTOS DA VITRINE) */}
      {activeSection === 'rooms' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-purple-500" />
                Vitrine de Acomodações & Quartos
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Defina os textos institucionais que introduzem a galeria de quartos na página inicial. Os quartos em si podem ser gerenciados na aba "Quartos & Tarifas".
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção de Quartos
                </label>
                <input
                  type="text"
                  value={formData.quartos_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, quartos_titulo: e.target.value })}
                  placeholder="Ex: Espaço, privacidade e o conforto que você merece"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.quartos_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, quartos_subtitulo: e.target.value })}
                  placeholder="Ex: Suítes & Acomodações Charmosas"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Descrição Institucional da Vitrine
              </label>
              <textarea
                rows={3}
                value={formData.quartos_descricao || ''}
                onChange={(e) => setFormData({ ...formData, quartos_descricao: e.target.value })}
                placeholder="Ex: Acomodações completas, higienizadas e preparadas com carinho para momentos inesquecíveis..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 6: DEPOIMENTOS & AVALIAÇÕES */}
      {activeSection === 'testimonials' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Depoimentos & Avaliações dos Hóspedes
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Adicione e edite relatos autênticos de clientes para gerar máxima credibilidade e aumentar a conversão de reservas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Depoimento</span>
              </button>
            </div>

            {/* Títulos da Seção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção de Avaliações
                </label>
                <input
                  type="text"
                  value={formData.avaliacoes_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, avaliacoes_titulo: e.target.value })}
                  placeholder="Ex: Quem se hospeda, recomenda e volta"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.avaliacoes_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, avaliacoes_subtitulo: e.target.value })}
                  placeholder="Ex: Experiência dos Hóspedes"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Grade de Depoimentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(formData.depoimentos || []).map((dep) => (
                <div key={dep.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(dep.avaliacao || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(dep.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={dep.comentario}
                      onChange={(e) => handleUpdateTestimonial(dep.id, { comentario: e.target.value })}
                      placeholder="Comentário do hóspede..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 leading-relaxed italic"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <input
                      type="text"
                      value={dep.nome}
                      onChange={(e) => handleUpdateTestimonial(dep.id, { nome: e.target.value })}
                      placeholder="Nome do cliente"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={dep.origem}
                        onChange={(e) => handleUpdateTestimonial(dep.id, { origem: e.target.value })}
                        placeholder="Cidade - UF"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-[11px] text-stone-600"
                      />
                      <input
                        type="text"
                        value={dep.data}
                        onChange={(e) => handleUpdateTestimonial(dep.id, { data: e.target.value })}
                        placeholder="Data"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-[11px] text-stone-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 7: PERGUNTAS FREQUENTES (FAQ) */}
      {activeSection === 'faqs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-500" />
                  Perguntas Frequentes (FAQ)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Esclareça as dúvidas mais comuns dos hóspedes sobre horários, pagamentos, café da manhã e cancelamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Pergunta</span>
              </button>
            </div>

            {/* Títulos da Seção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção FAQ
                </label>
                <input
                  type="text"
                  value={formData.faq_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, faq_titulo: e.target.value })}
                  placeholder="Ex: Perguntas Frequentes"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.faq_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, faq_subtitulo: e.target.value })}
                  placeholder="Ex: Tire Suas Dúvidas"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Lista de FAQs */}
            <div className="space-y-3">
              {(formData.faqs || []).map((faq) => (
                <div key={faq.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={faq.pergunta}
                      onChange={(e) => handleUpdateFaq(faq.id, { pergunta: e.target.value })}
                      placeholder="Pergunta"
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                    />
                    <input
                      type="text"
                      value={faq.categoria || 'Geral'}
                      onChange={(e) => handleUpdateFaq(faq.id, { categoria: e.target.value })}
                      placeholder="Categoria"
                      className="w-32 px-3 py-2 rounded-xl border border-stone-300 bg-white text-[11px] text-stone-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={faq.resposta}
                    onChange={(e) => handleUpdateFaq(faq.id, { resposta: e.target.value })}
                    placeholder="Resposta detalhada..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 leading-relaxed"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 8: LOCALIZAÇÃO & PONTOS DE INTERESSE */}
      {activeSection === 'location' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Localização & Pontos de Interesse Próximos
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Informe o endereço exato e cadastre pontos turísticos, restaurantes, universidades e atrações com suas distâncias.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPoi}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Ponto</span>
              </button>
            </div>

            {/* Títulos da Seção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção de Localização
                </label>
                <input
                  type="text"
                  value={formData.localizacao_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, localizacao_titulo: e.target.value })}
                  placeholder="Ex: Fácil acesso aos principais pontos da região"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.localizacao_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, localizacao_subtitulo: e.target.value })}
                  placeholder="Ex: Localização Privilegiada"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Endereço Físico Completo */}
            <div className="space-y-4 pb-4 border-b border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Endereço Físico do Estabelecimento
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Logradouro / Rua e Número
                  </label>
                  <input
                    type="text"
                    value={formData.endereco || ''}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Ex: Rua Coronel Renó, 137"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.bairro || ''}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Ex: Centro"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.cep || ''}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="37500-010"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>

                <div className="md:col-span-8">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade || ''}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ex: Itajubá"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.estado || ''}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    placeholder="MG"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Grade de Pontos de Interesse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(formData.pontos_interesse || []).map((poi) => (
                <div key={poi.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={poi.nome}
                      onChange={(e) => handleUpdatePoi(poi.id, { nome: e.target.value })}
                      placeholder="Nome do local"
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={poi.distancia}
                        onChange={(e) => handleUpdatePoi(poi.id, { distancia: e.target.value })}
                        placeholder="Ex: 500m (3 min)"
                        className="w-1/2 px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px] text-stone-600"
                      />
                      <select
                        value={poi.tipo}
                        onChange={(e) => handleUpdatePoi(poi.id, { tipo: e.target.value as any })}
                        className="w-1/2 px-2 py-1 rounded-lg border border-stone-300 bg-white text-[11px] font-bold"
                      >
                        <option value="lazer">Lazer / Turismo</option>
                        <option value="gastronomia">Gastronomia</option>
                        <option value="educacao">Educação / UNIFEI</option>
                        <option value="negocios">Negócios / Empresas</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePoi(poi.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 9: CONTATO, REDES SOCIAIS & RODAPÉ */}
      {activeSection === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-500" />
                Canais de Atendimento, Redes Sociais & Rodapé
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Configure os canais diretos de contato pelo WhatsApp, e-mail, telefone e os links das redes sociais oficiais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título da Seção de Contato
                </label>
                <input
                  type="text"
                  value={formData.contato_titulo || ''}
                  onChange={(e) => setFormData({ ...formData, contato_titulo: e.target.value })}
                  placeholder="Ex: Fale com a nossa equipe"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtítulo Superior
                </label>
                <input
                  type="text"
                  value={formData.contato_subtitulo || ''}
                  onChange={(e) => setFormData({ ...formData, contato_subtitulo: e.target.value })}
                  placeholder="Ex: Atendimento & Reservas"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp Oficial (com DDD)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(35) 99876-2210"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Telefone Fixo / Central
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(35) 3622-2210"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  E-mail de Reservas
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="reservas@hotel.com.br"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Mensagem Padrão ao Iniciar Conversa no WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsapp_msg_padrao || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_msg_padrao: e.target.value })}
                placeholder="Ex: Olá! Gostaria de consultar tarifas e disponibilidade no hotel."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
              />
            </div>

            {/* Redes Sociais */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Redes Sociais & Perfis de Avaliação
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Instagram Oficial (@ ou link)
                  </label>
                  <input
                    type="text"
                    value={formData.redes_sociais?.instagram || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      redes_sociais: { ...formData.redes_sociais, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/seuhotel"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Facebook Page
                  </label>
                  <input
                    type="text"
                    value={formData.redes_sociais?.facebook || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      redes_sociais: { ...formData.redes_sociais, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/seuhotel"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Textos do Rodapé */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Rodapé Institucional (Footer)
              </h4>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Texto Resumido do Rodapé
                </label>
                <textarea
                  rows={2}
                  value={formData.rodape_descricao || ''}
                  onChange={(e) => setFormData({ ...formData, rodape_descricao: e.target.value })}
                  placeholder="Hospitalidade premium, conforto e excelência no atendimento com reservas instantâneas e seguras."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Copyright / Direitos Autorais
                </label>
                <input
                  type="text"
                  value={formData.rodape_copyright || ''}
                  onChange={(e) => setFormData({ ...formData, rodape_copyright: e.target.value })}
                  placeholder={`© ${new Date().getFullYear()} ${formData.nome}. Todos os direitos reservados.`}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs text-stone-900"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEÇÃO 10: INTERRUPTORES DE VISIBILIDADE DAS SEÇÕES */}
      {activeSection === 'visibility' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Exibir ou Ocultar Seções na Landing Page
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Ligue ou desligue qualquer bloco da página pública com 1 clique para adequar a estrutura ao modelo de negócio do cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'show_hero', label: '1. Seção Principal (Hero & Fundo)', desc: 'Apresentação com foto de fundo e título' },
                { key: 'show_search_bar', label: '2. Barra de Busca de Diárias', desc: 'Motor de consulta rápida por datas e hóspedes' },
                { key: 'show_highlights', label: '3. Cards de Destaque no Hero', desc: 'Mini-cards de comodidades chave no topo' },
                { key: 'show_about', label: '4. Seção Sobre Nós & História', desc: 'Apresentação institucional e foto ilustrativa' },
                { key: 'show_rooms', label: '5. Vitrine de Acomodações', desc: 'Galeria de quartos e botão de reserva' },
                { key: 'show_amenities', label: '6. Comodidades & Infraestrutura', desc: 'Grade completa de serviços do hotel' },
                { key: 'show_testimonials', label: '7. Avaliações & Depoimentos', desc: 'Comentários e notas de hóspedes' },
                { key: 'show_faq', label: '8. Dúvidas Frequentes (FAQ)', desc: 'Accordions com perguntas e respostas' },
                { key: 'show_location', label: '9. Localização & Pontos Chave', desc: 'Endereço e distâncias com Google Maps' },
                { key: 'show_contact', label: '10. Formulário & Contato Direto', desc: 'Canais oficiais de atendimento e envio' },
                { key: 'show_whatsapp_float', label: '11. Botão Flutuante do WhatsApp', desc: 'Ícone fixo no canto inferior da tela' },
              ].map((item) => {
                const isVisible = formData.secoes_visibilidade?.[item.key as keyof typeof formData.secoes_visibilidade] !== false;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        secoes_visibilidade: {
                          ...formData.secoes_visibilidade,
                          [item.key]: !isVisible
                        }
                      });
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isVisible 
                        ? 'border-emerald-300 bg-emerald-50/50 text-stone-900' 
                        : 'border-stone-200 bg-stone-50 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-bold block">{item.label}</strong>
                      <span className="text-[11px] text-stone-500 block mt-0.5">{item.desc}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold ${
                      isVisible ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}>
                      {isVisible ? <Check className="w-3.5 h-3.5" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Botão Inferior de Salvar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <span className="text-xs text-stone-500">
          As alterações entram em vigor imediatamente após salvar.
        </span>
        <button
          type="button"
          onClick={() => handleSave()}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Salvar Todas as Configurações</span>
        </button>
      </div>

    </div>
  );
};
