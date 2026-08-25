import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Building2, 
  Settings, 
  Users, 
  RotateCcw, 
  Save, 
  Check, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Percent, 
  AlertTriangle,
  Database,
  Cloud,
  RefreshCw,
  UploadCloud,
  Code2,
  Copy,
  CheckCheck,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  KeyRound,
  Link,
  ShieldAlert,
  Server,
  Layers,
  Palette,
  Sparkles,
  Eye,
  FileText
} from 'lucide-react';
import { getStoredSupabaseUrl, getStoredSupabaseKey, SeedAllResponse, TableHealthStatus, SUPABASE_SQL_SCRIPT } from '../../services/supabase';
import { LandingCustomizerTab } from './settings/LandingCustomizerTab';
import { PresetsPortabilityTab } from './settings/PresetsPortabilityTab';
import { MediaGalleryExplorer } from '../common/media/MediaGalleryExplorer';
import { extractAllLocalImages } from '../../services/mediaService';

export const SettingsModule: React.FC = () => {
  const { 
    hotelConfig, 
    updateHotelConfig, 
    resetDatabase, 
    users, 
    setAdminActiveTab,
    setCurrentView,
    supabaseStatus,
    supabaseLatency,
    supabaseMessage,
    supabaseUrl,
    lastSyncTime,
    healthReport,
    syncFromSupabase,
    exportAllToSupabase,
    checkSupabaseHealth,
    updateSupabaseCredentials,
    resetSupabaseCredentials,
    rooms,
    reservations,
    guests,
    payments,
    blocks,
    automations,
    roomTypes
  } = useHotel();

  const [activeMainTab, setActiveMainTab] = useState<'landing' | 'general' | 'presets' | 'supabase' | 'media' | 'team'>('landing');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({ ...hotelConfig });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportReport, setExportReport] = useState<SeedAllResponse | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Estados do formulário de credenciais
  const [inputUrl, setInputUrl] = useState(getStoredSupabaseUrl());
  const [inputKey, setInputKey] = useState(getStoredSupabaseKey());
  const [credFeedback, setCredFeedback] = useState<string | null>(null);

  // Sync formData when hotelConfig changes
  React.useEffect(() => {
    setFormData({ ...hotelConfig });
  }, [hotelConfig]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotelConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncFromSupabase();
    setIsSyncing(false);
  };

  const handleExportNow = async () => {
    setIsExporting(true);
    setExportReport(null);
    setExportModalOpen(true);
    
    const res = await exportAllToSupabase();
    setIsExporting(false);
    setExportReport(res);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSupabaseCredentials(inputUrl, inputKey);
    setCredFeedback(res.message);
    if (res.success) {
      setTimeout(() => {
        setCredFeedback(null);
        setCredentialsModalOpen(false);
      }, 1500);
    }
  };

  const handleResetCredentials = () => {
    if (confirm('Deseja restaurar as credenciais padrão do Supabase?')) {
      resetSupabaseCredentials();
      setInputUrl(getStoredSupabaseUrl());
      setInputKey(getStoredSupabaseKey());
      setCredFeedback('Credenciais restauradas para o padrão.');
      setTimeout(() => setCredFeedback(null), 3000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar o banco de dados inicial do hotel com todas as reservas e acomodações de demonstração?')) {
      resetDatabase();
      alert('Dados restaurados com sucesso para o padrão de demonstração!');
    }
  };

  const allMediaRecords = extractAllLocalImages(hotelConfig, rooms, users);

  const allTables = [
    { key: 'hotel_config', label: 'Configurações do Hotel', localCount: 1 },
    { key: 'tipos_quarto', label: 'Categorias de Quarto', localCount: roomTypes.length },
    { key: 'quartos', label: 'Acomodações / Quartos', localCount: rooms.length },
    { key: 'hospedes', label: 'Cadastro de Hóspedes (CRM)', localCount: guests.length },
    { key: 'reservas', label: 'Reservas do Sistema', localCount: reservations.length },
    { key: 'pagamentos', label: 'Transações de Pagamento', localCount: payments.length },
    { key: 'bloqueios', label: 'Bloqueios & Manutenções', localCount: blocks.length },
    { key: 'automacoes', label: 'Automações de Mensagens', localCount: automations.length },
    { key: 'usuarios', label: 'Usuários do Painel', localCount: users.length },
    { key: 'logs_seguranca', label: 'Logs de Segurança & 2FA', localCount: 3 },
    { key: 'media_uploads', label: 'Fotos & Mídias (Storage)', localCount: allMediaRecords.length },
  ];

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo de Configurações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury text-stone-900">
              Central de Configurações & Personalização
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              White-Label & Cloud
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Personalize a Landing Page, planos de fundo da capa, identidade visual, dados do estabelecimento e banco Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
            title="Abrir o site público do cliente em tempo real"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Landing Page Ao Vivo</span>
          </button>
        </div>
      </div>

      {/* Abas Principais de Navegação das Configurações */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveMainTab('landing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'landing' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>🎨 Personalizar Landing Page & Fundo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('presets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'presets' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>🚀 Modelos Prontos & Portabilidade JSON</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'general' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>🏨 Dados Cadastrais & Políticas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('supabase')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'supabase' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>☁️ Banco de Dados Supabase</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('media')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'media' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>🖼️ Fotos & Mídias (Storage)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('team')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeMainTab === 'team' 
              ? 'bg-stone-900 text-amber-300 shadow-sm' 
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          <span>👥 Equipe & Demonstração</span>
        </button>
      </div>

      {/* ABA 1: PERSONALIZADOR COMPLETO DA LANDING PAGE */}
      {activeMainTab === 'landing' && (
        <LandingCustomizerTab />
      )}

      {/* ABA 2: PRESETS DE CLIENTES EM 1-CLIQUE & IMPORT/EXPORT JSON */}
      {activeMainTab === 'presets' && (
        <PresetsPortabilityTab />
      )}

      {/* ABA 3: DADOS CADASTRAIS & REGRAS OPERACIONAIS */}
      {activeMainTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Dados Cadastrais & Regras Operacionais
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Informações fiscais, horários de diária, café da manhã, taxas de serviço e chave PIX para pagamentos automáticos.
              </p>
            </div>

            {savedSuccess && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                <Check className="w-4 h-4" />
                <span>Salvo com sucesso!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-5 text-xs">
            
            {/* Bloco de Destaque para Letreiro / Título do Hero */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <span>Título de Destaque na Capa (Letreiro Principal do Hero na Landing Page)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('landing')}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Editor Visual & Fundo →</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.hero_titulo_custom !== undefined ? formData.hero_titulo_custom : formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, hero_titulo_custom: e.target.value })}
                placeholder="Ex: Hotel Centenário"
                className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-sm font-bold text-stone-900 focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-[11px] text-stone-600">
                Texto gigante de apresentação exibido na foto principal da Landing Page pública.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Nome Fantasia Oficial</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => {
                    const newNome = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      nome: newNome,
                      hero_titulo_custom: !prev.hero_titulo_custom || prev.hero_titulo_custom === prev.nome ? newNome : prev.hero_titulo_custom
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Usado em relatórios, vouchers, cabeçalhos do sistema e rodapés.
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Slogan Curto</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">WhatsApp Atendimento</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold uppercase text-stone-600 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={formData.cidade_uf}
                  onChange={(e) => setFormData({ ...formData, cidade_uf: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            <h4 className="font-serif-luxury text-base font-bold text-stone-900 pt-3 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Políticas Operacionais, Horários & Pagamentos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Horário Check-in</label>
                <input
                  type="text"
                  value={formData.horario_checkin}
                  onChange={(e) => setFormData({ ...formData, horario_checkin: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Horário Check-out</label>
                <input
                  type="text"
                  value={formData.horario_checkout}
                  onChange={(e) => setFormData({ ...formData, horario_checkout: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Taxa de Serviço (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={formData.taxa_servico_percentual}
                  onChange={(e) => setFormData({ ...formData, taxa_servico_percentual: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Desconto PIX (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="1"
                  value={formData.desconto_pix_percentual}
                  onChange={(e) => setFormData({ ...formData, desconto_pix_percentual: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Horário do Café da Manhã</label>
                <input
                  type="text"
                  value={formData.horario_cafe}
                  onChange={(e) => setFormData({ ...formData, horario_cafe: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Chave PIX do Estabelecimento</label>
                <input
                  type="text"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Política de Cancelamento</label>
              <textarea
                rows={3}
                value={formData.politica_cancelamento}
                onChange={(e) => setFormData({ ...formData, politica_cancelamento: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-900/10 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Dados Cadastrais</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ABA 4: BANCO DE DADOS SUPABASE */}
      {activeMainTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-stone-900 text-stone-100 p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold font-serif-luxury text-white">
                      Integração Supabase PostgreSQL
                    </h3>
                    {supabaseStatus === 'connected' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Conectado ({supabaseLatency}ms)
                      </span>
                    ) : supabaseStatus === 'syncing' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Processando...
                      </span>
                    ) : supabaseStatus === 'needs_tables' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Tabelas Pendentes de Criação
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Falha de Conexão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5 font-mono truncate max-w-xl">
                    Host: <span className="text-emerald-400">{supabaseUrl}</span>
                  </p>
                </div>
              </div>

              {/* Ações Rápidas do Supabase */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => checkSupabaseHealth()}
                  title="Testar Conexão e Latência"
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCredentialsModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chaves & URL</span>
                </button>

                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Buscando...' : 'Baixar do Supabase'}</span>
                </button>

                <button
                  onClick={handleExportNow}
                  disabled={isExporting}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exportando...' : 'Exportar Base Local → Supabase'}</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('media')}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Galeria de Fotos</span>
                </button>

                <button
                  onClick={() => setSqlModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Script SQL DDL</span>
                </button>
              </div>
            </div>

            {/* Diagnóstico do Driver */}
            <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Status: <strong className="text-white">{supabaseMessage}</strong>
                </span>
              </div>
              {lastSyncTime && (
                <span className="text-stone-400 text-[11px]">
                  Última sincronização: <strong className="text-stone-200">{lastSyncTime}</strong>
                </span>
              )}
            </div>

            {/* Status Detalhado das 11 Tabelas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">Diagnóstico das {allTables.length} Tabelas no Supabase (incluindo Fotos & Mídias)</span>
                <span>{healthReport ? `${(Object.values(healthReport.tables) as TableHealthStatus[]).filter((t) => t.accessible).length} de ${allTables.length} prontas` : 'Carregando status...'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {allTables.map((tbl) => {
                  const status = healthReport?.tables[tbl.key];
                  const isReady = status?.accessible;
                  const isMissing = status?.exists === false;

                  return (
                    <div
                      key={tbl.key}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                        isReady
                          ? 'bg-stone-950/80 border-emerald-500/30'
                          : isMissing
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-rose-950/30 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[11px] font-bold text-stone-200 truncate">{tbl.key}</span>
                        {isReady ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>Local: {tbl.localCount}</span>
                        <span>Remoto: {status?.rowCount !== undefined ? status.rowCount : isReady ? '0' : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerta de Tabelas Faltantes com Ação Direta */}
            {healthReport && !healthReport.allTablesReady && healthReport.missingTables.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-100 block font-semibold">Tabelas pendentes no Supabase</strong>
                    <p className="text-amber-300/80 text-[11px]">
                      Para que a exportação e sincronização funcionem, você precisa executar o script SQL no Supabase uma única vez.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setSqlModalOpen(true)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Ver & Copiar SQL</span>
                  </button>
                  <a
                    href="https://supabase.com/dashboard/project/awyxubhwtdgwnssvajnr/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-700"
                  >
                    <span>Abrir SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ABA 5: BANCO DE MÍDIAS & FOTOS SUPABASE */}
      {activeMainTab === 'media' && (
        <MediaGalleryExplorer />
      )}

      {/* ABA 6: EQUIPE, ACESSOS E DEMONSTRAÇÃO */}
      {activeMainTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Cartão da Equipe / Usuários */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Usuários & Operadores do Sistema ({users.length})
              </h4>
              <button
                onClick={() => setAdminActiveTab('users')}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Gerenciar no Módulo Usuários →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map((u) => (
                <div key={u.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.nome}
                      className="w-10 h-10 rounded-full object-cover border border-stone-300"
                    />
                    <div>
                      <strong className="text-stone-900 block font-bold">{u.nome}</strong>
                      <span className="text-[11px] text-stone-500">{u.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    {u.tipo_usuario}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cartão de Restauração de Banco de Dados Demo */}
          <div className="lg:col-span-4 bg-rose-50 border border-rose-200 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Zona de Demonstração & Reset</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Restaura todas as reservas, acomodações, hóspedes e transações de teste para o estado original de fábrica.
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Base de Demonstração</span>
            </button>
          </div>

        </div>
      )}

      {/* Modal de Progresso e Resultado da Exportação */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 text-stone-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Exportação de Dados para o Supabase</h3>
                  <p className="text-xs text-stone-400">Gravação em massa das 10 tabelas e sincronização da nuvem</p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {isExporting ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-stone-200">Enviando registros para o Supabase...</p>
                <p className="text-xs text-stone-400">Gravando hotel_config, quartos, reservas, hóspedes e usuários.</p>
              </div>
            ) : exportReport ? (
              <div className="space-y-4 overflow-auto">
                {exportReport.success ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <strong className="font-bold text-emerald-100 block text-sm">Exportação concluída com sucesso!</strong>
                      <p className="text-emerald-300/90 text-xs mt-0.5">
                        Todos os {exportReport.totalExported} registros foram persistidos no banco Supabase e sincronizados com a nuvem.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                    <div className="flex items-start gap-2.5">
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-100 block text-sm">Falhas na exportação</strong>
                        <p className="text-rose-300/90 text-xs mt-0.5">
                          Algumas tabelas não puderam ser gravadas. Verifique se o script SQL foi executado no Supabase.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabela de Resultados por Entidade */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Relatório por Tabela</span>
                  <div className="space-y-1 max-h-56 overflow-auto pr-1">
                    {exportReport.tableResults.map((tr) => (
                      <div
                        key={tr.table}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          tr.success
                            ? 'bg-stone-950/60 border-emerald-500/30'
                            : 'bg-rose-950/30 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tr.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                          <span className="font-mono font-bold text-stone-200">{tr.table}</span>
                        </div>

                        {tr.success ? (
                          <span className="text-emerald-400 font-semibold text-[11px]">{tr.count} registro(s) gravado(s)</span>
                        ) : (
                          <span className="text-rose-300 text-[10px] max-w-xs truncate" title={tr.error}>
                            {tr.error || 'Erro desconhecido'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {!exportReport.success && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                    <span>Deseja executar o script SQL para criar as tabelas faltantes?</span>
                    <button
                      onClick={() => {
                        setExportModalOpen(false);
                        setSqlModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer"
                    >
                      Copiar Script SQL
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Credenciais Supabase */}
      {credentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 text-stone-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Credenciais do Supabase</h3>
                  <p className="text-xs text-stone-400">Edite ou insira chaves personalizadas do seu projeto</p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-400 mb-1">Project URL (Supabase)</label>
                <input
                  type="text"
                  required
                  placeholder="https://exemplo.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-400 mb-1">Anon / Publishable Key ou Service Role Key</label>
                <textarea
                  rows={3}
                  required
                  placeholder="sb_publishable_... ou eyJhbGciOiJIUzI1NiIsIn..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none"
                />
              </div>

              {credFeedback && (
                <div className="p-2.5 rounded-xl bg-stone-800 text-amber-300 text-xs font-medium">
                  {credFeedback}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleResetCredentials}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 font-semibold text-xs cursor-pointer"
                >
                  Restaurar Padrão
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar & Testar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualizar / Copiar Script SQL do Supabase */}
      {sqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-4 text-stone-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Script SQL DDL para o Supabase</h3>
                  <p className="text-xs text-stone-400">Execute este código no SQL Editor do seu projeto Supabase para criar as 10 tabelas com RLS</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSql ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
                <button
                  onClick={() => setSqlModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-400 text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs font-mono text-emerald-400 whitespace-pre leading-relaxed select-all">
              {SUPABASE_SQL_SCRIPT}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800">
              <span>Link do painel: <a href="https://supabase.com/dashboard/project/awyxubhwtdgwnssvajnr/sql" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-1">SQL Editor Supabase <ExternalLink className="w-3 h-3" /></a></span>
              <button
                onClick={() => setSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
