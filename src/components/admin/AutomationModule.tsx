import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Bot, 
  MessageSquare, 
  Key, 
  Mail, 
  Send, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Smartphone, 
  Sliders, 
  Play 
} from 'lucide-react';
import { AutomacaoRegra } from '../../types';
import { generateWhatsAppLink } from '../../utils/formatters';

// Componente de Automação de Comunicação (WhatsApp/E-mail) e Gestão de Fechaduras Digitais
export const AutomationModule: React.FC = () => {
  const { automations, reservations, guests, rooms, updateAutomation, simulateMessageDispatch, hotelConfig } = useHotel();

  const [selectedResId, setSelectedResId] = useState<string>(reservations[0]?.id || '');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(automations[0]?.id || '');
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    messageText: string;
    recipient: string;
  } | null>(null);

  const handleRunSimulation = () => {
    if (!selectedRuleId || !selectedResId) return;
    const res = simulateMessageDispatch(selectedRuleId, selectedResId);
    setDispatchResult(res);
  };

  const toggleAutomation = (id: string) => {
    const auto = automations.find((a) => a.id === id);
    if (auto) {
      updateAutomation(id, { ativo: !auto.ativo });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Automação de Mensagens & Fechaduras Inteligentes
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Disparos automáticos via WhatsApp/E-mail, geração de senhas digitais e réguas de relacionamento com o hóspede.
          </p>
        </div>
      </div>

      {/* Layout em Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Réguas de Automação Configuradas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-600" />
              Réguas de Comunicação Automática
            </h3>

            <div className="space-y-3">
              {automations.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition ${
                    rule.ativo ? 'bg-stone-50/80 border-stone-300' : 'bg-stone-100/50 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg text-xs font-bold ${
                          rule.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rule.canal === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm">{rule.titulo}</h4>
                      </div>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        Gatilho: <strong>{rule.gatilho.replace('_', ' ').toUpperCase()}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => toggleAutomation(rule.id)}
                      className="p-1 text-stone-700 hover:text-stone-900 cursor-pointer"
                    >
                      {rule.ativo ? (
                        <ToggleRight className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-stone-400" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 p-3 bg-white rounded-lg border border-stone-200/80 text-xs font-mono text-stone-700 whitespace-pre-line leading-relaxed">
                    {rule.template || rule.template_mensagem}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel Informativo sobre Fechaduras Inteligentes */}
          <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Key className="w-5 h-5" />
              <span>Automação de Fechaduras Digitais (Smart Locks)</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              O sistema gera automaticamente um <strong>PIN de 6 dígitos</strong> exclusivo no momento em que a reserva é confirmada.
              A chave digital é enviada ao hóspede via WhatsApp e se torna ativa às <strong>14:00h</strong> do dia do check-in, sendo revogada automaticamente às <strong>12:00h</strong> do check-out.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Criptografia ponta a ponta e integração com hubs Zigbee / Wi-Fi.</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Simulador Interativo de Disparos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-600" />
              Simulador de Disparo em Tempo Real
            </h3>
            <p className="text-xs text-stone-500">
              Teste as variáveis dinâmicas ({'{hospede}'}, {'{pin_fechadura}'}, etc.) simulando o envio de mensagens para qualquer reserva ativa.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Selecione a Reserva</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                >
                  {reservations.map((r) => {
                    const g = guests.find((guest) => guest.id === r.hospede_id);
                    const rm = rooms.find((room) => room.id === r.quarto_id);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.codigo} - {g?.nome} (Quarto {rm?.numero})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Modelo de Mensagem / Régua</label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                >
                  {automations.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.canal.toUpperCase()}] {r.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunSimulation}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Renderizar & Simular Disparo</span>
              </button>
            </div>

            {/* Resultado da Simulação de Disparo */}
            {dispatchResult && (
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Mensagem Formatada
                  </span>
                  <span className="text-stone-500 font-mono">Destino: {dispatchResult.recipient}</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-900 text-stone-100 text-xs font-sans whitespace-pre-line leading-relaxed border border-stone-800">
                  {dispatchResult.messageText}
                </div>

                <a
                  href={generateWhatsAppLink(dispatchResult.recipient, dispatchResult.messageText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar para WhatsApp Real Agora</span>
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
