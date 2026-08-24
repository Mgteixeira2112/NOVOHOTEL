import { HotelConfig, ThemeColorPalette, TypographyStyle } from '../types';
import { 
  Coffee, 
  UtensilsCrossed, 
  Wifi, 
  Car, 
  Dumbbell, 
  Flame, 
  ShieldCheck, 
  Key, 
  Dog, 
  Sparkles, 
  Tv, 
  Clock, 
  Waves, 
  Mountain, 
  Sun, 
  Bath, 
  Wine, 
  Heart, 
  Trees, 
  Umbrella, 
  Bed, 
  Users, 
  Compass, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  LucideIcon 
} from 'lucide-react';

// Mapeamento dinâmico de ícones para comodidades personalizáveis
export const ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  utensils: UtensilsCrossed,
  wifi: Wifi,
  car: Car,
  dumbbell: Dumbbell,
  flame: Flame,
  shield: ShieldCheck,
  key: Key,
  dog: Dog,
  sparkles: Sparkles,
  tv: Tv,
  clock: Clock,
  waves: Waves,
  mountain: Mountain,
  sun: Sun,
  bath: Bath,
  wine: Wine,
  heart: Heart,
  trees: Trees,
  umbrella: Umbrella,
  bed: Bed,
  users: Users,
  compass: Compass,
  award: Award,
  mappin: MapPin,
  phone: Phone,
  mail: Mail,
  check: CheckCircle2
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function getIconComponent(iconName: string): LucideIcon {
  const cleanName = (iconName || '').toLowerCase().trim();
  return ICON_MAP[cleanName] || Sparkles;
}

// Definições de Estilo e Paleta de Cores do Sistema White-Label
export interface ThemeStyles {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  primaryBadge: string;
  accentGradient: string;
  glowEffect: string;
  cardHighlight: string;
  pillActive: string;
  buttonClass: string;
  badgeClass: string;
  textAccentClass: string;
  borderAccentClass: string;
  bgSubtleClass: string;
  ringClass: string;
}

export const THEME_PALETTES: Record<ThemeColorPalette, ThemeStyles> = {
  amber: {
    primary: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-400',
    primaryLight: 'bg-amber-500/10',
    primaryBorder: 'border-amber-500/40',
    primaryText: 'text-amber-400',
    primaryBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accentGradient: 'from-amber-500 to-amber-600',
    glowEffect: 'shadow-amber-500/20',
    cardHighlight: 'hover:border-amber-500/50',
    pillActive: 'bg-amber-500 text-stone-950 font-bold',
    buttonClass: 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shadow-lg shadow-amber-500/20',
    badgeClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-300',
    textAccentClass: 'text-amber-400',
    borderAccentClass: 'border-amber-500',
    bgSubtleClass: 'bg-amber-500/10',
    ringClass: 'focus:ring-amber-500'
  },
  emerald: {
    primary: 'bg-emerald-500',
    primaryHover: 'hover:bg-emerald-400',
    primaryLight: 'bg-emerald-500/10',
    primaryBorder: 'border-emerald-500/40',
    primaryText: 'text-emerald-400',
    primaryBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accentGradient: 'from-emerald-500 to-teal-600',
    glowEffect: 'shadow-emerald-500/20',
    cardHighlight: 'hover:border-emerald-500/50',
    pillActive: 'bg-emerald-500 text-stone-950 font-bold',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold transition shadow-lg shadow-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300',
    textAccentClass: 'text-emerald-400',
    borderAccentClass: 'border-emerald-500',
    bgSubtleClass: 'bg-emerald-500/10',
    ringClass: 'focus:ring-emerald-500'
  },
  blue: {
    primary: 'bg-sky-500',
    primaryHover: 'hover:bg-sky-400',
    primaryLight: 'bg-sky-500/10',
    primaryBorder: 'border-sky-500/40',
    primaryText: 'text-sky-400',
    primaryBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    accentGradient: 'from-sky-500 to-blue-600',
    glowEffect: 'shadow-sky-500/20',
    cardHighlight: 'hover:border-sky-500/50',
    pillActive: 'bg-sky-500 text-stone-950 font-bold',
    buttonClass: 'bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold transition shadow-lg shadow-sky-500/20',
    badgeClass: 'bg-sky-500/10 border border-sky-500/30 text-sky-300',
    textAccentClass: 'text-sky-400',
    borderAccentClass: 'border-sky-500',
    bgSubtleClass: 'bg-sky-500/10',
    ringClass: 'focus:ring-sky-500'
  },
  rose: {
    primary: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-400',
    primaryLight: 'bg-rose-500/10',
    primaryBorder: 'border-rose-500/40',
    primaryText: 'text-rose-400',
    primaryBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    accentGradient: 'from-rose-500 to-pink-600',
    glowEffect: 'shadow-rose-500/20',
    cardHighlight: 'hover:border-rose-500/50',
    pillActive: 'bg-rose-500 text-white font-bold',
    buttonClass: 'bg-rose-500 hover:bg-rose-400 text-white font-bold transition shadow-lg shadow-rose-500/20',
    badgeClass: 'bg-rose-500/10 border border-rose-500/30 text-rose-300',
    textAccentClass: 'text-rose-400',
    borderAccentClass: 'border-rose-500',
    bgSubtleClass: 'bg-rose-500/10',
    ringClass: 'focus:ring-rose-500'
  },
  purple: {
    primary: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-400',
    primaryLight: 'bg-purple-500/10',
    primaryBorder: 'border-purple-500/40',
    primaryText: 'text-purple-400',
    primaryBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    accentGradient: 'from-purple-500 to-indigo-600',
    glowEffect: 'shadow-purple-500/20',
    cardHighlight: 'hover:border-purple-500/50',
    pillActive: 'bg-purple-500 text-white font-bold',
    buttonClass: 'bg-purple-500 hover:bg-purple-400 text-white font-bold transition shadow-lg shadow-purple-500/20',
    badgeClass: 'bg-purple-500/10 border border-purple-500/30 text-purple-300',
    textAccentClass: 'text-purple-400',
    borderAccentClass: 'border-purple-500',
    bgSubtleClass: 'bg-purple-500/10',
    ringClass: 'focus:ring-purple-500'
  },
  terracotta: {
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-500',
    primaryLight: 'bg-orange-600/10',
    primaryBorder: 'border-orange-600/40',
    primaryText: 'text-orange-400',
    primaryBadge: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
    accentGradient: 'from-orange-600 to-amber-700',
    glowEffect: 'shadow-orange-600/20',
    cardHighlight: 'hover:border-orange-600/50',
    pillActive: 'bg-orange-600 text-white font-bold',
    buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-600/20',
    badgeClass: 'bg-orange-600/10 border border-orange-600/30 text-orange-300',
    textAccentClass: 'text-orange-400',
    borderAccentClass: 'border-orange-600',
    bgSubtleClass: 'bg-orange-600/10',
    ringClass: 'focus:ring-orange-600'
  },
  slate: {
    primary: 'bg-slate-200',
    primaryHover: 'hover:bg-white',
    primaryLight: 'bg-slate-700/50',
    primaryBorder: 'border-slate-500/40',
    primaryText: 'text-slate-200',
    primaryBadge: 'bg-slate-800 text-slate-200 border-slate-700',
    accentGradient: 'from-slate-700 to-slate-900',
    glowEffect: 'shadow-slate-500/10',
    cardHighlight: 'hover:border-slate-400',
    pillActive: 'bg-slate-200 text-slate-950 font-bold',
    buttonClass: 'bg-white hover:bg-slate-100 text-slate-950 font-bold transition shadow-lg shadow-white/10',
    badgeClass: 'bg-slate-800 border border-slate-700 text-slate-300',
    textAccentClass: 'text-slate-200',
    borderAccentClass: 'border-slate-400',
    bgSubtleClass: 'bg-slate-800',
    ringClass: 'focus:ring-slate-400'
  }
};

export function getTheme(palette?: ThemeColorPalette): ThemeStyles {
  return THEME_PALETTES[palette || 'amber'] || THEME_PALETTES.amber;
}

export function getFontFamilyClass(font?: TypographyStyle): string {
  switch (font) {
    case 'modern_sans':
      return 'font-sans';
    case 'editorial':
      return 'font-serif';
    case 'serif_luxury':
    default:
      return 'font-serif-luxury';
  }
}

// 6 Presets Completos Prontos para Vender para Várias Empresas (Multi-Tenant White-Label)
export interface TemplatePreset {
  id: string;
  name: string;
  tagline: string;
  category: string;
  previewImage: string;
  badge: string;
  config: Partial<HotelConfig>;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'hotel-centenario-itajuba',
    name: 'Hotel Centenário Itajubá',
    tagline: 'Hotel Tradicional & Executivo no Centro Histórico de Itajubá - MG',
    category: 'Hotel Tradicional & Executivo',
    previewImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    badge: 'Tradicional & Central',
    config: {
      nome: 'Hotel Centenário Itajubá',
      tipo_estabelecimento: 'hotel',
      slogan: 'Tradição, hospitalidade mineira e a localização mais nobre no coração de Itajubá - MG.',
      estrelas: 4,
      cnpj: '21.849.321/0001-90',
      telefone: '(35) 3622-0312',
      whatsapp: '(35) 99876-0312',
      email: 'reservas@hotelcentenarioitajuba.com.br',
      endereco: 'Rua Coronel Renó, 137',
      bairro: 'Centro',
      cidade: 'Itajubá',
      estado: 'MG',
      cep: '37500-010',
      tema_cor: 'blue',
      tema_estilo: 'luxury',
      tipografia: 'serif_luxury',
      logo_iniciais: 'HCI',
      banner_hero: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Hotel Centenário Itajubá',
      hero_subtitulo_custom: 'Tradição, acolhimento mineiro e a melhor localização em frente à Praça Central de Itajubá.',
      hero_badge_custom: 'Centro Histórico, Itajubá — MG | Hotel Tradicional & Executivo',
      sobre_titulo: 'Tradição e Hospitalidade no Coração de Itajubá',
      sobre_subtitulo: 'O Ponto de Encontro da História e do Conforto',
      sobre_texto: 'O Hotel Centenário é a principal referência em tradição, conforto e localização privilegiada em Itajubá - Minas Gerais. Localizado estrategicamente no centro comercial e histórico da cidade, em frente à Praça Theodomiro Santiago e a poucos passos dos principais bancos, restaurantes, cafés e repartições públicas. Oferecemos café da manhã colonial mineiro com pão de queijo quentinho, recepção 24h, quartos com ar-condicionado, Wi-Fi fibra e estacionamento privativo.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 8.8,
      nota_label: 'Fabuloso (Booking.com & Tripadvisor)',
      horario_checkin: '14:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento gratuito com até 24 horas de antecedência do check-in.',
      taxa_servico_percentual: 5,
      pet_friendly: true,
      pet_politica: 'Aceitamos animais de pequeno porte mediante aviso prévio.',
      estacionamento_politica: 'Estacionamento privativo e monitorado no centro de Itajubá.'
    }
  },
  {
    id: 'itajuba-flat',
    name: 'Itajubá Flat Hotel',
    tagline: 'Apart-Hotel Executivo & Urbano no Sul de Minas',
    category: 'Apart-Hotel / Executivo',
    previewImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    badge: 'Urbano & Executivo',
    config: {
      nome: 'Itajubá Flat Hotel',
      tipo_estabelecimento: 'flat',
      slogan: 'Conforto de hotel com a praticidade de um flat no coração de Itajubá - Sul de Minas.',
      estrelas: 4,
      cnpj: '08.452.912/0001-38',
      telefone: '(35) 3622-2210',
      whatsapp: '(35) 99876-2210',
      email: 'reservas@itajubaflat.com.br',
      endereco: 'Rua Antônio Corrêa Cardoso, 164',
      bairro: 'Centro',
      cidade: 'Itajubá',
      estado: 'MG',
      cep: '37501-064',
      tema_cor: 'amber',
      tema_estilo: 'luxury',
      tipografia: 'serif_luxury',
      logo_iniciais: 'IFH',
      banner_hero: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Itajubá Flat Hotel',
      hero_subtitulo_custom: 'Conforto de hotel com a praticidade de um flat no coração de Itajubá - Sul de Minas.',
      hero_badge_custom: 'Centro, Itajubá — Sul de Minas | Apart-Hotel Executivo',
      sobre_titulo: 'Seu melhor endereço no coração de Itajubá',
      sobre_subtitulo: 'Hospitalidade Mineira & Praticidade Executiva',
      sobre_texto: 'O Itajubá Flat Hotel é a principal referência em hospedagem prática, confortável e acolhedora em Itajubá - Minas Gerais. Nossas acomodações unem a liberdade de um flat mobiliado com serviços de excelência.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.4,
      nota_label: 'Preferência Executiva em Itajubá',
      horario_checkin: '14:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento gratuito até 24 horas antes do check-in com estorno integral.',
      taxa_servico_percentual: 5,
      pet_friendly: true,
      pet_politica: 'Aceitamos cães de pequeno porte mediante aviso prévio.',
      estacionamento_politica: 'Estacionamento privativo e coberto 100% gratuito para hóspedes.'
    }
  },
  {
    id: 'pousada-vila-sonhos',
    name: 'Pousada Vila dos Sonhos',
    tagline: 'Refúgio de Charme e Natureza na Serra da Mantiqueira',
    category: 'Pousada de Charme',
    previewImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    badge: 'Eco & Serra',
    config: {
      nome: 'Pousada Vila dos Sonhos',
      tipo_estabelecimento: 'pousada',
      slogan: 'Desconecte-se da rotina e viva momentos inesquecíveis cercado por montanhas, lareiras e ar puro.',
      estrelas: 5,
      cnpj: '19.824.512/0001-44',
      telefone: '(12) 3662-8890',
      whatsapp: '(12) 99744-8890',
      email: 'contato@pousadaviladosonhos.com.br',
      endereco: 'Estrada das Hortênsias, km 4.5',
      bairro: 'Vale das Araucárias',
      cidade: 'Campos do Jordão',
      estado: 'SP',
      cep: '12460-000',
      tema_cor: 'emerald',
      tema_estilo: 'eco',
      tipografia: 'serif_luxury',
      logo_iniciais: 'PVS',
      banner_hero: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Pousada Vila dos Sonhos',
      hero_subtitulo_custom: 'Charme, lareira crepitante e natureza exuberante na Serra da Mantiqueira.',
      hero_badge_custom: 'Campos do Jordão — Serra da Mantiqueira | Pousada Boutique 5 Estrelas',
      sobre_titulo: 'O refúgio perfeito em meio às montanhas',
      sobre_subtitulo: 'Aconchego, Gastronomia e Bem-Estar',
      sobre_texto: 'A Pousada Vila dos Sonhos nasceu com o propósito de proporcionar uma experiência autêntica de paz e sofisticação na serra. Nossos chalés privativos contam com lareira, hidromassagem com vista para a mata e café da manhã colonial servido até as 12h.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.8,
      nota_label: 'Top 10 Melhores Pousadas de Charme do Brasil',
      horario_checkin: '15:00',
      horario_checkout: '13:00',
      politica_cancelamento: 'Cancelamento sem multas com até 7 dias de antecedência da data de entrada.',
      taxa_servico_percentual: 0,
      pet_friendly: true,
      pet_politica: 'Pet Friendly com kit de boas-vindas para seu pet!',
      estacionamento_politica: 'Estacionamento privativo no local com carregadores para veículos elétricos.'
    }
  },
  {
    id: 'grand-riviera-resort',
    name: 'Grand Riviera Resort & Spa',
    tagline: 'Experiência Premium Pé na Areia & Ocean Club',
    category: 'Resort & Spa',
    previewImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    badge: 'Resort 5 Estrelas',
    config: {
      nome: 'Grand Riviera Resort & Spa',
      tipo_estabelecimento: 'resort',
      slogan: 'Onde o luxo contemporâneo encontra o mar esmeralda em uma experiência all-inclusive inesquecível.',
      estrelas: 5,
      cnpj: '24.118.903/0001-92',
      telefone: '(48) 3288-5000',
      whatsapp: '(48) 99122-5000',
      email: 'concierge@grandrivieraresort.com.br',
      endereco: 'Avenida Beira Mar Norte, 2800',
      bairro: 'Jurerê Internacional',
      cidade: 'Florianópolis',
      estado: 'SC',
      cep: '88053-300',
      tema_cor: 'blue',
      tema_estilo: 'coastal',
      tipografia: 'editorial',
      logo_iniciais: 'GRR',
      banner_hero: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Grand Riviera Resort & Spa',
      hero_subtitulo_custom: 'Viva o melhor do litoral com piscinas infinitas, alta gastronomia e spa sensorial.',
      hero_badge_custom: 'Jurerê Internacional, Florianópolis | Beach Resort & Spa de Luxo',
      sobre_titulo: 'O mais exclusivo resort pé na areia do Sul',
      sobre_subtitulo: 'Lazer Completo, Alta Gastronomia e Bem-Estar',
      sobre_texto: 'O Grand Riviera Resort & Spa combina arquitetura contemporânea, serviço de concierge internacional e acesso direto à praia com serviço de garçom privativo na areia. Piscinas aquecidas, spa com tratamentos franceses e três restaurantes premiados.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.7,
      nota_label: 'Prêmio Travellers Choice Best of the Best',
      horario_checkin: '15:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento gratuito até 48 horas antes da data de check-in.',
      taxa_servico_percentual: 10,
      pet_friendly: false,
      pet_politica: 'Não são permitidos animais de estimação na área do resort.',
      estacionamento_politica: 'Serviço de valet parking privativo com manobrista 24 horas.'
    }
  },
  {
    id: 'solar-hortensias-boutique',
    name: 'Solar das Hortênsias Boutique Hotel',
    tagline: 'Charme Europeu, Adega Exclusiva e Romance em Gramado',
    category: 'Hotel Boutique Romântico',
    previewImage: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    badge: 'Boutique & Romance',
    config: {
      nome: 'Solar das Hortênsias Boutique Hotel',
      tipo_estabelecimento: 'boutique',
      slogan: 'Cada detalhe pensado para criar memórias inesquecíveis a dois no coração da Serra Gaúcha.',
      estrelas: 5,
      cnpj: '31.229.400/0001-18',
      telefone: '(54) 3286-9900',
      whatsapp: '(54) 99655-9900',
      email: 'reservas@solarhortensias.com.br',
      endereco: 'Rua das Flores Europeias, 420',
      bairro: 'Planalto',
      cidade: 'Gramado',
      estado: 'RS',
      cep: '95670-000',
      tema_cor: 'rose',
      tema_estilo: 'boutique',
      tipografia: 'serif_luxury',
      logo_iniciais: 'SHB',
      banner_hero: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Solar das Hortênsias Boutique Hotel',
      hero_subtitulo_custom: 'Uma experiência romântica intimista inspirada nos châteaux franceses em Gramado.',
      hero_badge_custom: 'Bairro Planalto, Gramado — Serra Gaúcha | Hotel Boutique 5 Estrelas',
      sobre_titulo: 'Sofisticação e acolhimento incomparáveis na serra',
      sobre_subtitulo: 'Romance, Vinhos Selecionados e Alta Confeitaria',
      sobre_texto: 'Localizado a poucos passos do centro de Gramado, o Solar das Hortênsias reúne suítes com banheira vitoriana, menu de travesseiros, café da manhã servido à mesa e um aconchegante wine bar com lareira para suas noites.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.9,
      nota_label: 'Eleito o Hotel Mais Romântico da Serra Gaúcha',
      horario_checkin: '14:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento flexível até 72h antes da chegada.',
      taxa_servico_percentual: 5,
      pet_friendly: false,
      pet_politica: 'Hotel exclusivo para adultos e casais.',
      estacionamento_politica: 'Estacionamento privativo cortesia.'
    }
  },
  {
    id: 'chales-valle-imperial',
    name: 'Chalés Valle da Mantiqueira',
    tagline: 'Aconchego nas Alturas, Banheira de Hidro e Vista Panorâmica',
    category: 'Chalés de Montanha',
    previewImage: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
    badge: 'Chalés & Lareira',
    config: {
      nome: 'Chalés Valle da Mantiqueira',
      tipo_estabelecimento: 'chales',
      slogan: 'Viva o silêncio da serra com hidromassagem panorâmica, lareira e café da manhã entregue na cesta.',
      estrelas: 4,
      cnpj: '44.810.200/0001-05',
      telefone: '(35) 3438-1120',
      whatsapp: '(35) 99888-1120',
      email: 'contato@chalesvallemantiqueira.com.br',
      endereco: 'Estrada do Mirante da Pedra, s/n',
      bairro: 'Vila da Montanha',
      cidade: 'Monte Verde',
      estado: 'MG',
      cep: '37653-000',
      tema_cor: 'terracotta',
      tema_estilo: 'rustic',
      tipografia: 'serif_luxury',
      logo_iniciais: 'CVM',
      banner_hero: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Chalés Valle da Mantiqueira',
      hero_subtitulo_custom: 'Chalés alpinos exclusivos com vista para as montanhas e café da manhã colonial.',
      hero_badge_custom: 'Monte Verde, Minas Gerais | Chalés Alpinos com Hidromassagem',
      sobre_titulo: 'O refúgio alpino mais charmoso de Minas',
      sobre_subtitulo: 'Fogueira sob as estrelas e aconchego serrano',
      sobre_texto: 'Nossos chalés privativos foram esculpidos em madeira e pedra no alto de Monte Verde, garantindo privacidade absoluta, hidromassagem dupla com vista para o pôr do sol e café da manhã colonial mineiro entregue pontualmente em cestas artesanais.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.6,
      nota_label: 'Nota Máxima em Privacidade e Conforto',
      horario_checkin: '14:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento gratuito até 5 dias antes da reserva.',
      taxa_servico_percentual: 0,
      pet_friendly: true,
      pet_politica: 'Pet Friendly para todas as raças e portes!',
      estacionamento_politica: 'Garagem individual privativa ao lado de cada chalé.'
    }
  },
  {
    id: 'urban-loft-hotel',
    name: 'Urban Loft Hotel & Suites',
    tagline: 'Design Contemporâneo, Smart Living e Coworking Central',
    category: 'Hotel Urbano & Loft',
    previewImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    badge: 'Design & Tecnologia',
    config: {
      nome: 'Urban Loft Hotel & Suites',
      tipo_estabelecimento: 'hotel',
      slogan: 'Hospedagem inteligente para o viajante moderno, unindo design sofisticado e autonomia digital.',
      estrelas: 4,
      cnpj: '50.119.330/0001-67',
      telefone: '(11) 3100-4400',
      whatsapp: '(11) 98900-4400',
      email: 'stay@urbanlofthotel.com.br',
      endereco: 'Rua Oscar Freire, 1100',
      bairro: 'Jardins',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01426-001',
      tema_cor: 'slate',
      tema_estilo: 'modern',
      tipografia: 'modern_sans',
      logo_iniciais: 'ULH',
      banner_hero: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=2000&q=80',
      hero_titulo_custom: 'Urban Loft Hotel & Suites',
      hero_subtitulo_custom: 'Smart Check-in, Lofts com Cozinha Completa e Coworking 24h nos Jardins.',
      hero_badge_custom: 'Jardins, São Paulo | Smart Stay & Lofts Corporativos',
      sobre_titulo: 'O novo padrão de hospitalidade urbana conectada',
      sobre_subtitulo: 'Praticidade, Alta Velocidade e Liberdade',
      sobre_texto: 'Projetado para profissionais dinâmicos e viajantes cosmopolitas. Nossos lofts oferecem fechaduras inteligentes por smartphone, internet de 1Gbps dedicada, café especial ilimitado e estúdio de gravação para podcasts e reuniões executivas.',
      sobre_foto_url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      nota_avaliacao: 9.5,
      nota_label: 'Top Escolha de Nômades Digitais e Executivos',
      horario_checkin: '14:00',
      horario_checkout: '12:00',
      politica_cancelamento: 'Cancelamento gratuito até 24 horas antes do check-in.',
      taxa_servico_percentual: 5,
      pet_friendly: true,
      pet_politica: 'Aceitamos gatos e cães com amenidades especiais.',
      estacionamento_politica: 'Estacionamento com serviço de manobrista no subsolo.'
    }
  }
];
