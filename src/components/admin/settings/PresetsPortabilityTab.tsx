import React, { useState } from 'react';
import { useHotel } from '../../../context/HotelContext';
import { 
  Sparkles, 
  Download, 
  Upload, 
  Check, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Layers,
  ArrowRight,
  Eye
} from 'lucide-react';
import { TEMPLATE_PRESETS } from '../../../utils/themeHelper';

export const PresetsPortabilityTab: React.FC = () => {
  const { 
    hotelConfig, 
    applyTemplatePreset, 
    importConfigJson, 
    setCurrentView 
  } = useHotel();

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const handlePresetSelect = (presetId: string, presetName: string) => {
    const success = applyTemplatePreset(presetId);
    if (success) {
      setSavedSuccess(`Modelo "${presetName}" aplicado com sucesso ao site e ao painel!`);
      setTimeout(() => setSavedSuccess(null), 4000);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hotelConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hotel-config-${(hotelConfig.nome || 'estabelecimento').toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSavedSuccess('Arquivo de configuração (.json) baixado com sucesso!');
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(hotelConfig, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleImportJson = () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Por favor, cole o código JSON da configuração do cliente no campo abaixo.');
      return;
    }
    const res = importConfigJson(importJsonText);
    if (res.success) {
      setSavedSuccess('Configurações do cliente importadas com sucesso!');
      setImportJsonText('');
      setTimeout(() => setSavedSuccess(null), 3500);
    } else {
      setImportError(res.message || 'JSON inválido ou corrompido. Verifique o formato.');
    }
  };

  return (
    <div className="space-y-6">
      
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{savedSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver no Site</span>
          </button>
        </div>
      )}

      {/* BLOCO 1: PRESETS DE CLIENTES EM 1-CLIQUE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Modelos Prontos de Clientes (Multi-Tenant em 1-Clique)
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Transforme todo o site instantaneamente para atender diferentes perfis de hotelaria com fotos, cores, fontes, títulos e comodidades pré-configuradas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar Site Atual</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATE_PRESETS.map((preset) => {
            const isCurrent = hotelConfig.nome?.toLowerCase() === preset.config.nome?.toLowerCase();
            return (
              <div 
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id, preset.name)}
                className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-sm hover:shadow-md ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-amber-500 bg-white hover:bg-amber-50/10'
                }`}
              >
                <div className="h-32 rounded-xl overflow-hidden relative">
                  <img 
                    src={preset.previewImage} 
                    alt={preset.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-stone-900/90 backdrop-blur-sm text-white text-[10px] font-bold shadow border border-stone-700">
                    {preset.badge}
                  </div>
                  {isCurrent && (
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Ativo</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-amber-700">
                    {preset.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                    {preset.tagline}
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                  <span>{isCurrent ? 'Modelo Ativo (Reaplicar)' : 'Aplicar este Modelo'}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCO 2: EXPORTAÇÃO E IMPORTAÇÃO DE CONFIGURAÇÃO (PORTABILIDADE JSON) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Exportar JSON */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Exportar Configuração do Cliente Atual (.JSON)
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Gere um arquivo de backup com todas as cores, imagens, textos, comodidades e configurações salvas do cliente atual.
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-stone-600">
              <span>Cliente: <strong>{hotelConfig.nome}</strong></span>
              <span>Tema: <strong>{hotelConfig.tema_cor}</strong></span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo .JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-stone-500" />
                <span>{copiedJson ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Importar JSON */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-bold font-serif-luxury text-stone-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              Importar Configuração de Outro Cliente (.JSON)
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Cole o código JSON de qualquer outro cliente para carregar instantaneamente todos os parâmetros no sistema.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Cole aqui o JSON: { "nome": "Pousada Nova", "tema_cor": "emerald", ... }'
              className="w-full p-3 rounded-2xl border border-stone-300 bg-stone-50 focus:bg-white text-xs font-mono text-stone-800"
            />

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleImportJson}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition shadow cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar & Aplicar ao Site Agora</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
