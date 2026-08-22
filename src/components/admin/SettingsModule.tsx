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
  AlertTriangle 
} from 'lucide-react';

// Componente de Configurações Gerais do Hotel, Regras de Check-in/out, Taxas e Restauração de Base
export const SettingsModule: React.FC = () => {
  const { hotelConfig, updateHotelConfig, resetDatabase, users, currentUser, setAdminActiveTab } = useHotel();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({ ...hotelConfig });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotelConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar o banco de dados inicial do hotel com todas as reservas e acomodações de demonstração?')) {
      resetDatabase();
      alert('Dados restaurados com sucesso para o padrão de demonstração!');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Configurações Gerais do Hotel
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Parâmetros do estabelecimento, políticas de check-in/out, regras de cancelamento e taxas.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulário Principal de Configurações do Hotel */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Identificação do Estabelecimento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Nome do Hotel / Resort</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Slogan / Subtítulo</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">WhatsApp Oficial</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-stone-600 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
              />
            </div>

            <h3 className="font-serif-luxury text-lg font-bold text-stone-900 pt-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Políticas de Hospedagem & Tarifas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Horário de Check-in Padrão</label>
                <input
                  type="text"
                  value={formData.checkin_horario_padrao}
                  onChange={(e) => setFormData({ ...formData, checkin_horario_padrao: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Horário de Check-out Padrão</label>
                <input
                  type="text"
                  value={formData.checkout_horario_padrao}
                  onChange={(e) => setFormData({ ...formData, checkout_horario_padrao: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Taxa de Serviço (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.taxa_servico_percentual}
                  onChange={(e) => setFormData({ ...formData, taxa_servico_percentual: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono text-center font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Chave PIX do Hotel</label>
                <input
                  type="text"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Moeda / Câmbio</label>
                <input
                  type="text"
                  value={formData.moeda}
                  onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>

          </form>
        </div>

        {/* Barra Lateral: Usuários, Cargos e Restauração de Base */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Cartão da Equipe / Usuários */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <h4 className="font-serif-luxury text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Equipe do Hotel ({users.length})
            </h4>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatar}
                      alt={u.nome}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <strong className="text-stone-900 block">{u.nome}</strong>
                      <span className="text-[10px] text-stone-500">{u.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    {u.tipo_usuario}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAdminActiveTab('users')}
              className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gerenciar Usuários & Acessos →</span>
            </button>
          </div>

          {/* Cartão de Restauração de Banco de Dados Demo */}
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Zona de Manutenção & Demonstração</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              Restaurar todas as reservas, quartos, hóspedes e transações para o estado inicial da demonstração interativa.
            </p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Base de Dados Demo</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
