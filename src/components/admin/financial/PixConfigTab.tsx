import React, { useState } from 'react';
import { 
  QrCode, 
  Key, 
  Building2, 
  ShieldCheck, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Sparkles, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Percent, 
  Server,
  Radio,
  Printer
} from 'lucide-react';
import { formatCurrency, generateWhatsAppLink } from '../../../utils/formatters';
import { generatePixPayload, generateQrCodeUrl } from '../../../utils/pixHelper';
import { PixKeyConfig, PixPspConfig, PixKeyType, PixPspProvider } from '../../../types/financial';

interface PixConfigTabProps {
  pixKeys: PixKeyConfig[];
  pixPsp: PixPspConfig;
  onUpdatePixKeys: (keys: PixKeyConfig[]) => void;
  onUpdatePixPsp: (psp: PixPspConfig) => void;
  onSimulateWebhookPixReceived?: (amount: number, txId: string) => void;
}

export const PixConfigTab: React.FC<PixConfigTabProps> = ({
  pixKeys,
  pixPsp,
  onUpdatePixKeys,
  onUpdatePixPsp,
  onSimulateWebhookPixReceived
}) => {
  // Estado para Edição de Chaves
  const [keysList, setKeysList] = useState<PixKeyConfig[]>(pixKeys);
  const [pspConfig, setPspConfig] = useState<PixPspConfig>(pixPsp);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Nova Chave Modal / Form
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyType, setNewKeyType] = useState<PixKeyType>('cnpj');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyBank, setNewKeyBank] = useState('Banco Inter S.A.');
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [newKeyDiscount, setNewKeyDiscount] = useState<number>(5);

  // Testador / Simulador de QR Code
  const primaryKey = keysList.find(k => k.ativo) || keysList[0];
  const [simAmount, setSimAmount] = useState<number>(230.00);
  const [simTxId, setSimTxId] = useState<string>('RES-84920');
  const [simDesc, setSimDesc] = useState<string>('Diária Flat Studio - Itajubá Flat');
  const [copiedPix, setCopiedPix] = useState(false);

  // Simulador de Webhook
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  // Payload gerado em tempo real
  const generatedPayload = primaryKey ? generatePixPayload({
    chave: primaryKey.chave,
    nomeTitular: primaryKey.titular_nome,
    cidade: primaryKey.cidade,
    valor: simAmount,
    txId: simTxId,
    descricao: simDesc
  }) : '';

  const handleSaveAll = () => {
    onUpdatePixKeys(keysList);
    onUpdatePixPsp(pspConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue) return;

    const newK: PixKeyConfig = {
      id: 'pix-key-' + Date.now(),
      tipo: newKeyType,
      chave: newKeyValue,
      titular_nome: primaryKey?.titular_nome || 'ITAJUBA FLAT HOTEL LTDA',
      titular_documento: primaryKey?.titular_documento || '28.491.029/0001-84',
      banco_nome: newKeyBank,
      cidade: primaryKey?.cidade || 'Itajuba',
      desconto_percentual: newKeyDiscount,
      ativo: true,
      descricao: newKeyDesc || 'Chave Adicional'
    };

    const updated = [...keysList, newK];
    setKeysList(updated);
    onUpdatePixKeys(updated);
    setShowNewKeyForm(false);
    setNewKeyValue('');
  };

  const handleToggleKey = (id: string) => {
    const updated = keysList.map(k => k.id === id ? { ...k, ativo: !k.ativo } : k);
    setKeysList(updated);
    onUpdatePixKeys(updated);
  };

  const handleDeleteKey = (id: string) => {
    if (keysList.length <= 1) {
      alert('É necessário manter pelo menos uma chave PIX cadastrada.');
      return;
    }
    const updated = keysList.filter(k => k.id !== id);
    setKeysList(updated);
    onUpdatePixKeys(updated);
  };

  const handleCopyPixString = () => {
    if (!generatedPayload) return;
    navigator.clipboard.writeText(generatedPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleTestWebhook = () => {
    setWebhookTestStatus('testing');
    setTimeout(() => {
      setWebhookTestStatus('success');
      if (onSimulateWebhookPixReceived) {
        onSimulateWebhookPixReceived(simAmount, simTxId);
      }
      setTimeout(() => setWebhookTestStatus('idle'), 4000);
    }, 1200);
  };

  const pspProvidersList: { id: PixPspProvider; name: string; badge: string }[] = [
    { id: 'inter', name: 'Banco Inter Empresas (API Bacen)', badge: '🧡 Inter' },
    { id: 'banco_brasil', name: 'Banco do Brasil (Developers BB)', badge: '💛 BB' },
    { id: 'itau', name: 'Itaú Empresas (API PIX)', badge: '🟠 Itaú' },
    { id: 'bradesco', name: 'Bradesco Net Empresa (API)', badge: '🔴 Bradesco' },
    { id: 'santander', name: 'Santander Open Banking', badge: '🔴 Santander' },
    { id: 'sicoob', name: 'Sicoob Cooperativa (API PIX)', badge: '🟢 Sicoob' },
    { id: 'sicredi', name: 'Sicredi Empresas (API Bacen)', badge: '🟢 Sicredi' },
    { id: 'mercadopago', name: 'Mercado Pago PIX Instantâneo', badge: '💙 Mercado Pago' },
    { id: 'efi', name: 'EFI / Gerencianet Bank', badge: '🟠 EFI' },
    { id: 'asaas', name: 'Asaas Gestão Financeira PIX', badge: '⚡ Asaas' },
    { id: 'nubank', name: 'Nubank PJ Open Finance', badge: '🟣 Nubank' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            <span>Módulo de Pagamentos Instantâneos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury text-stone-900">
            Configuração de Chaves PIX & PSP Bancário
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Defina as chaves para recebimento no balcão e integre a API bancária para confirmação automática em D+0.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer shrink-0"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Grid: Chaves Cadastradas + Gerador de QR Code Balcão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Chaves PIX Cadastradas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                Chaves PIX do Estabelecimento
              </h3>
              <p className="text-xs text-stone-500">
                Chaves oficiais vinculadas à conta bancária do hotel
              </p>
            </div>

            <button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Chave</span>
            </button>
          </div>

          {/* Formulário de Adicionar Nova Chave */}
          {showNewKeyForm && (
            <form onSubmit={handleAddKey} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-fade-in">
              <div className="font-bold text-xs text-stone-800">Cadastrar Nova Chave PIX</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Tipo de Chave
                  </label>
                  <select
                    value={newKeyType}
                    onChange={(e) => setNewKeyType(e.target.value as PixKeyType)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white font-medium"
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone Celular</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Chave PIX (Exato)
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="28.491.029/0001-84 ou email@hotel.com"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Banco Emissor
                  </label>
                  <input
                    type="text"
                    value={newKeyBank}
                    onChange={(e) => setNewKeyBank(e.target.value)}
                    placeholder="Ex: Banco Inter (077)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Desconto no PIX (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={newKeyDiscount}
                    onChange={(e) => setNewKeyDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Descrição / Rótulo
                  </label>
                  <input
                    type="text"
                    value={newKeyDesc}
                    onChange={(e) => setNewKeyDesc(e.target.value)}
                    placeholder="Ex: Reservas Site Balcão"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewKeyForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Adicionar Chave
                </button>
              </div>
            </form>
          )}

          {/* Cards de Chaves */}
          <div className="space-y-3">
            {keysList.map((key) => (
              <div 
                key={key.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  key.ativo ? 'bg-white border-emerald-200 shadow-xs' : 'bg-stone-50 border-stone-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase font-mono">
                      {key.tipo}
                    </span>
                    <span className="font-mono font-bold text-sm text-stone-900">
                      {key.chave}
                    </span>
                    {key.desconto_percentual > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" /> {key.desconto_percentual}% OFF
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Titular: <strong className="text-stone-800">{key.titular_nome}</strong></span>
                    <span>•</span>
                    <span>Banco: <strong className="text-stone-800">{key.banco_nome}</strong></span>
                    <span>•</span>
                    <span>Cidade: <strong className="text-stone-800">{key.cidade}</strong></span>
                  </div>

                  {key.descricao && (
                    <div className="text-[11px] text-stone-400 italic">
                      {key.descricao}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleKey(key.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      key.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {key.ativo ? 'Ativa' : 'Inativa'}
                  </button>

                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition cursor-pointer"
                    title="Excluir chave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Gerador e Visualizador em Tempo Real de QR Code Balcão */}
        <div className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="font-serif-luxury text-sm font-bold text-white">
                    Simulador & QR Code Balcão
                  </h3>
                  <p className="text-[10px] text-stone-400">Padrão EMV Banco Central</p>
                </div>
              </div>
              
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Dinâmico
              </span>
            </div>

            {/* Configuração rápida do simulador */}
            <div className="grid grid-cols-2 gap-2.5 pt-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs font-mono font-bold text-amber-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Identificador / TXID
                </label>
                <input
                  type="text"
                  value={simTxId}
                  onChange={(e) => setSimTxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Imagem do QR Code */}
            <div className="my-4 p-4 bg-white rounded-2xl flex flex-col items-center justify-center text-stone-900 shadow-inner">
              <img
                src={generateQrCodeUrl(generatedPayload, 170)}
                alt="QR Code PIX Balcão"
                className="w-36 h-36 object-contain rounded-lg"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mt-2">
                Escaneie com qualquer app bancário
              </span>
              <span className="text-base font-bold font-mono text-emerald-700">
                {formatCurrency(simAmount)}
              </span>
            </div>

          </div>

          <div className="space-y-2">
            <button
              onClick={handleCopyPixString}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPix ? 'Copia e Cola Copiado!' : 'Copiar Código PIX Copia e Cola'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Plaquinha Balcão</span>
            </button>
          </div>

        </div>

      </div>

      {/* Seção 2: Integração com PSP Bancário e Webhooks de Confirmação Automática */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                Integração API com Provedor PSP (Recebimento Automático)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Conecte a API bancária oficial para que o PMS confirme a reserva e libere o PIN da fechadura digital instantaneamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">Ambiente:</span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPspConfig({ ...pspConfig, ambiente: 'producao' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pspConfig.ambiente === 'producao' ? 'bg-emerald-600 text-white' : 'text-stone-600'
                }`}
              >
                Produção (Live)
              </button>
              <button
                type="button"
                onClick={() => setPspConfig({ ...pspConfig, ambiente: 'sandbox' })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pspConfig.ambiente === 'sandbox' ? 'bg-amber-500 text-stone-950' : 'text-stone-600'
                }`}
              >
                Sandbox (Testes)
              </button>
            </div>
          </div>
        </div>

        {/* Seleção do Provedor PSP */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Selecione o seu Banco ou Provedor de Serviços de Pagamento (PSP)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pspProvidersList.map((p) => {
              const isSelected = pspConfig.provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPspConfig({ ...pspConfig, provider: p.id, nome_exibicao: p.name })}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.badge}</div>
                    <div className={`text-[10px] truncate max-w-[140px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {p.name}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Credenciais de API do Banco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Client ID / Chave da Aplicação Bancária
            </label>
            <input
              type="text"
              value={pspConfig.client_id}
              onChange={(e) => setPspConfig({ ...pspConfig, client_id: e.target.value })}
              placeholder="cli_inter_9820194820194820"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Client Secret / Token Privado
            </label>
            <input
              type="password"
              value={pspConfig.client_secret}
              onChange={(e) => setPspConfig({ ...pspConfig, client_secret: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:border-stone-900 focus:outline-none"
            />
          </div>

        </div>

        {/* Webhook URL e Notificação Automática */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                Webhook de Notificação Instantânea de Pagamento (IPN)
              </span>
              <p className="text-[11px] text-stone-500">
                Copie este endpoint e cadastre no portal de desenvolvedores do {pspConfig.nome_exibicao}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={pspConfig.auto_confirmar_reserva}
                onChange={(e) => setPspConfig({ ...pspConfig, auto_confirmar_reserva: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Auto-confirmar reserva no PMS</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={pspConfig.webhook_url}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-700"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(pspConfig.webhook_url);
                alert('URL do Webhook copiada com sucesso!');
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar URL</span>
            </button>
          </div>

          {/* Testador do Webhook */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200">
            <div className="text-xs text-stone-600">
              Teste o disparo de notificação simulando um pagamento recebido de <strong className="text-stone-900 font-mono">{formatCurrency(simAmount)}</strong>.
            </div>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={webhookTestStatus === 'testing'}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {webhookTestStatus === 'testing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : webhookTestStatus === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>
                {webhookTestStatus === 'testing' 
                  ? 'Testando Webhook...' 
                  : webhookTestStatus === 'success' 
                  ? 'Webhook Recebido com Sucesso (200 OK)!' 
                  : 'Simular Recebimento PIX via Webhook'}
              </span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
