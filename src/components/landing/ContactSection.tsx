import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { generateWhatsAppLink } from '../../utils/formatters';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Compass 
} from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Seção de Contato, Localização e Formulário Direto de Atendimento 100% Personalizável
export const ContactSection: React.FC = () => {
  const { hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: 'Dúvidas sobre Reserva / Hospedagem',
    mensagem: '',
  });

  if (hotelConfig.secoes_visibilidade?.show_contact === false) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        assunto: 'Dúvidas sobre Reserva / Hospedagem',
        mensagem: '',
      });
    }, 4000);
  };

  const whatsappUrl = generateWhatsAppLink(
    hotelConfig.whatsapp,
    `Olá! Gostaria de informações sobre reservas no ${hotelConfig.nome}.`
  );

  return (
    <section id="contato" className="py-24 bg-stone-50 text-stone-900 relative border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho da seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`text-xs font-bold uppercase tracking-widest ${theme.textAccentClass} block mb-2`}>
            Atendimento & Contato
          </span>
          <h2 className={`${fontClass} text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight`}>
            Fale com a nossa equipe
          </h2>
          <p className="mt-4 text-stone-600 text-base sm:text-lg">
            Estamos prontos para atender você, tirar dúvidas sobre tarifas e reservas ou organizar sua estadia em {hotelConfig.cidade}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Coluna Esquerda: Informações Diretas de Contato e Localização */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h3 className={`${fontClass} text-xl font-bold text-stone-900 border-b border-stone-100 pb-3`}>
                Canais de Atendimento
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">Endereço</strong>
                    <span className="text-stone-600">
                      {hotelConfig.endereco}, {hotelConfig.bairro}<br />
                      {hotelConfig.cidade} - {hotelConfig.estado}, CEP {hotelConfig.cep}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">Telefone</strong>
                    <span className="text-stone-600 font-medium">{hotelConfig.telefone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">WhatsApp Direto</strong>
                    <span className="text-stone-600">{hotelConfig.whatsapp}</span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-1 underline"
                    >
                      Conversar no WhatsApp agora →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">E-mail</strong>
                    <span className="text-stone-600">{hotelConfig.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl ${theme.bgSubtleClass} ${theme.textAccentClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">Horários de Recepção</strong>
                    <span className="text-stone-600">
                      Check-in: a partir das <strong>{hotelConfig.horario_checkin}</strong><br />
                      Check-out: até às <strong>{hotelConfig.horario_checkout}</strong><br />
                      Recepção: 24 horas disponível
                    </span>
                  </div>
                </div>
              </div>

              {/* CNPJ e Registro */}
              {hotelConfig.cnpj && (
                <div className="pt-3 border-t border-stone-100 text-xs text-stone-400">
                  <span>CNPJ: {hotelConfig.cnpj}</span>
                </div>
              )}

            </div>

          </div>

          {/* Coluna Direita: Formulário de Mensagem Direta */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className={`${fontClass} text-2xl font-bold text-stone-900 mb-2`}>
                Envie uma Mensagem
              </h3>
              <p className="text-sm text-stone-500 mb-8">
                Preencha o formulário para orçamentos, períodos prolongados ou dúvidas personalizadas.
              </p>

              {formSent ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center animate-in fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-lg font-bold">Mensagem enviada com sucesso!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Nossa equipe responderá ao seu contato por e-mail ou WhatsApp em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Seu Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Carlos Eduardo"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        WhatsApp / Celular *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(35) 99999-9999"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Assunto
                      </label>
                      <select
                        value={formData.assunto}
                        onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                      >
                        <option>Dúvidas sobre Reserva / Hospedagem</option>
                        <option>Estadia Corporativa / Empresas</option>
                        <option>Hospedagem Mensal / Long Stay</option>
                        <option>Outros Assuntos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mensagem *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                      placeholder="Descreva as datas de interesse, quantidade de pessoas ou dúvidas..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 ${theme.buttonClass}`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensagem</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
