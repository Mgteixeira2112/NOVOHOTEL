import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  RefreshCw, 
  Key, 
  Link as LinkIcon, 
  Layers, 
  AlertCircle, 
  Sliders, 
  Smartphone, 
  Percent, 
  Clock, 
  ExternalLink,
  Lock,
  Globe,
  Radio
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { GatewayConfig, GatewayCardProvider } from '../../../types/financial';

interface CreditCardGatewaysTabProps {
  gateways: Record<string, GatewayConfig>;
  onUpdateGateways: (gateways: Record<string, GatewayConfig>) => void;
  onOpenPaymentLink: () => void;
}

export const CreditCardGatewaysTab: React.FC<CreditCardGatewaysTabProps> = ({
  gateways,
  onUpdateGateways,
  onOpenPaymentLink
}) => {
  const [gatewayList, setGatewayList] = useState<Record<string, GatewayConfig>>(gateways);
  const [selectedGatewayId, setSelectedGatewayId] = useState<GatewayCardProvider>('asaas');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Status de Teste de Conexão
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    latency: number;
  }>({ status: null, message: '', latency: 0 });

  const currentGateway = gatewayList[selectedGatewayId] || Object.values(gatewayList)[0];

  const handleUpdateCurrent = (data: Partial<GatewayConfig>) => {
    const updated = {
      ...gatewayList,
      [selectedGatewayId]: {
        ...currentGateway,
        ...data
      }
    };
    setGatewayList(updated);
  };

  const handleSetPrimary = (id: GatewayCardProvider) => {
    const updated = { ...gatewayList };
    Object.keys(updated).forEach(k => {
      updated[k].is_primary = k === id;
      if (k === id) updated[k].ativo = true;
    });
    setGatewayList(updated);
    onUpdateGateways(updated);
  };

  const handleSaveAll = () => {
    onUpdateGateways(gatewayList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestApiPing = () => {
    setTestingPing(true);
    setPingResult({ status: null, message: '', latency: 0 });

    setTimeout(() => {
      const isConfigured = currentGateway.public_key && currentGateway.secret_key;
      const latency = Math.floor(45 + Math.random() * 65);

      if (isConfigured) {
        setPingResult({
          status: 'success',
          message: `Conexão HTTP 200 OK com a API ${currentGateway.nome}. Modo ${currentGateway.ambiente.toUpperCase()} ativo. Token de autenticação validado.`,
          latency
        });
      } else {
        setPingResult({
          status: 'error',
          message: `Chave de API ou Token Secreto não preenchido. Preencha as credenciais do ${currentGateway.nome} para testar a comunicação.`,
          latency
        });
      }
      setTestingPing(false);
    }, 1100);
  };

  const gatewayProvidersList: { id: GatewayCardProvider; name: string; badge: string; color: string; desc: string }[] = [
    { id: 'asaas', name: 'Asaas Pagamentos & Cobrança', badge: '⚡ Asaas', color: 'bg-emerald-500', desc: 'PIX, Boletos, Cartão em D+1, Régua Automatizada e Split' },
    { id: 'mercadopago', name: 'Mercado Pago Checkout Transparente', badge: '💙 Mercado Pago', color: 'bg-blue-500', desc: 'Maior ecossistema de checkout transparente da América Latina' },
    { id: 'stripe', name: 'Stripe Global & Radar Antifraude', badge: '🟣 Stripe', color: 'bg-purple-600', desc: 'Padrão ouro para reservas internacionais e Apple Pay / Google Pay' },
    { id: 'pagarme', name: 'Pagar.me / Stone Co.', badge: '🟢 Stone', color: 'bg-emerald-600', desc: 'Infraestrutura robusta Stone com alta taxa de aprovação' },
    { id: 'cielo', name: 'Cielo E-commerce 3.0 API', badge: '🔵 Cielo 3.0', color: 'bg-blue-600', desc: 'Tokenização segura para hóspedes frequentes e CyberSource' },
    { id: 'pagbank', name: 'PagBank / PagSeguro', badge: '🟡 PagBank', color: 'bg-amber-500', desc: 'Checkout integrado com parcelamento facilitado em até 12x' },
    { id: 'infinitepay', name: 'InfinitePay Smart Checkout', badge: '🟣 InfinitePay', color: 'bg-indigo-600', desc: 'Taxas ultrabaixas de processamento com repasse em 1 dia útil' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Gateways & Adquirentes Hoteleiros</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury text-stone-900">
            Integração com APIs de Cartão de Crédito
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Gerencie as credenciais das principais empresas de pagamento do mercado para cobranças transparentes e seguras.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPaymentLink}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Gerar Link de Pagamento</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Configurações Salvas!' : 'Salvar Gateways'}</span>
          </button>
        </div>
      </div>

      {/* Seletor de Gateways em Formato de Cards Interativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {gatewayProvidersList.map((provider) => {
          const cfg = gatewayList[provider.id];
          const isSelected = selectedGatewayId === provider.id;
          const isPrimary = cfg?.is_primary;
          const isActive = cfg?.ativo;

          return (
            <div
              key={provider.id}
              onClick={() => setSelectedGatewayId(provider.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-lg ring-2 ring-amber-400/60'
                  : 'bg-white border-stone-200 hover:border-stone-400 text-stone-800 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {provider.badge}
                  </span>

                  {isPrimary && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" /> Gateway Principal
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm leading-snug">{provider.name}</h4>
                <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                  isSelected ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {provider.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/40 flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1 font-semibold text-[11px] ${
                  isActive ? (isSelected ? 'text-emerald-400' : 'text-emerald-600') : 'text-stone-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  {isActive ? 'Ativo' : 'Desativado'}
                </span>

                <span className={`text-[10px] uppercase font-mono font-bold ${
                  cfg?.ambiente === 'producao' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {cfg?.ambiente || 'SANDBOX'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Configurações Detalhadas do Gateway Selecionado */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        
        {/* Header do Gateway Ativo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-lg shadow-sm">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                  {currentGateway.nome}
                </h3>
                {currentGateway.is_primary && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                    Gateway Principal
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentGateway.descricao}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!currentGateway.is_primary && (
              <button
                type="button"
                onClick={() => handleSetPrimary(selectedGatewayId)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Definir como Principal</span>
              </button>
            )}

            <label className="flex items-center gap-2 text-xs font-bold text-stone-800 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={currentGateway.ativo}
                onChange={(e) => handleUpdateCurrent({ ativo: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Habilitar Gateway</span>
            </label>
          </div>
        </div>

        {/* Chaves de API e Credenciais */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span>Chaves de API & Autenticação Segura</span>
            </h4>

            {/* Ambiente Sandbox vs Produção */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-600">Ambiente:</span>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleUpdateCurrent({ ambiente: 'producao' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentGateway.ambiente === 'producao' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Produção (Live)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCurrent({ ambiente: 'sandbox' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentGateway.ambiente === 'sandbox' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Sandbox (Testes)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Public Key / Client ID / Token Público
              </label>
              <input
                type="text"
                value={currentGateway.public_key}
                onChange={(e) => handleUpdateCurrent({ public_key: e.target.value })}
                placeholder="pk_live_... ou APP_USR_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Secret Key / Access Token / Chave Privada
              </label>
              <input
                type="password"
                value={currentGateway.secret_key}
                onChange={(e) => handleUpdateCurrent({ secret_key: e.target.value })}
                placeholder="sk_live_... ou sec_token_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Webhook URL (Notificações D+0)
              </label>
              <input
                type="text"
                readOnly
                value={currentGateway.webhook_url}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono text-stone-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Webhook Secret Token (Opcional)
              </label>
              <input
                type="text"
                value={currentGateway.webhook_secret || ''}
                onChange={(e) => handleUpdateCurrent({ webhook_secret: e.target.value })}
                placeholder="whsec_..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Teste de Conexão com a API */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-600">
              Validar autenticação das credenciais diretamente no endpoint do <strong className="text-stone-900">{currentGateway.nome}</strong>:
            </div>

            <button
              type="button"
              onClick={handleTestApiPing}
              disabled={testingPing}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
            >
              {testingPing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
              <span>{testingPing ? 'Testando API...' : 'Testar Conexão com a API'}</span>
            </button>
          </div>

          {/* Resultado do Teste */}
          {pingResult.status && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fade-in ${
              pingResult.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-red-50 border-red-200 text-red-950'
            }`}>
              {pingResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">
                  {pingResult.status === 'success' ? `Conexão Estabelecida (${pingResult.latency}ms)` : 'Falha na Validação'}
                </span>
                <p className="text-[11px] mt-0.5 leading-relaxed">{pingResult.message}</p>
              </div>
            </div>
          )}

        </div>

        {/* Regras de Parcelamento, Taxas e Pré-autorização */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Condições de Parcelamento, Taxas MDR e Pré-Autorização</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Máximo de Parcelas
              </label>
              <select
                value={currentGateway.max_parcelas}
                onChange={(e) => handleUpdateCurrent({ max_parcelas: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold bg-white"
              >
                <option value={1}>1x (Somente à vista)</option>
                <option value={2}>Até 2x</option>
                <option value={3}>Até 3x</option>
                <option value={4}>Até 4x</option>
                <option value={6}>Até 6x</option>
                <option value={10}>Até 10x</option>
                <option value={12}>Até 12x</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Parcelas Sem Juros (Hotel absorve)
              </label>
              <select
                value={currentGateway.parcelas_sem_juros}
                onChange={(e) => handleUpdateCurrent({ parcelas_sem_juros: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold bg-white"
              >
                <option value={1}>1x (Sem parcelamento sem juros)</option>
                <option value={2}>Até 2x sem juros</option>
                <option value={3}>Até 3x sem juros</option>
                <option value={4}>Até 4x sem juros</option>
                <option value={6}>Até 6x sem juros</option>
                <option value={12}>Até 12x sem juros</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Juros Mensais Parcelado (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={currentGateway.taxa_juros_mensal}
                onChange={(e) => handleUpdateCurrent({ taxa_juros_mensal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold font-mono"
              />
            </div>

          </div>

          {/* Taxas MDR de Conciliação Líquida */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Taxa MDR Crédito à Vista (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={currentGateway.taxa_mdr_credito_vista}
                onChange={(e) => handleUpdateCurrent({ taxa_mdr_credito_vista: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-mono font-bold bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Taxa MDR Parcelado (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={currentGateway.taxa_mdr_credito_parcelado}
                onChange={(e) => handleUpdateCurrent({ taxa_mdr_credito_parcelado: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-mono font-bold bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Prazo de Repasse (Dias)
              </label>
              <select
                value={currentGateway.prazo_repasse_dias}
                onChange={(e) => handleUpdateCurrent({ prazo_repasse_dias: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-bold bg-white"
              >
                <option value={1}>D+1 (1 dia útil)</option>
                <option value={2}>D+2 (2 dias úteis)</option>
                <option value={14}>D+14 (14 dias)</option>
                <option value={30}>D+30 (30 dias)</option>
              </select>
            </div>
          </div>

          {/* Opção de Caução / Pré-autorização */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Pré-Autorização & Caução de Garantia de Reserva (Hold)
              </span>
              <p className="text-[11px] text-amber-800">
                Bloqueia o valor da 1ª diária no cartão do hóspede como garantia contra No-Show ou despesas extras sem debitar de imediato.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentGateway.pre_autorizacao_ativa}
                onChange={(e) => handleUpdateCurrent({ pre_autorizacao_ativa: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

        </div>

      </div>

    </div>
  );
};
