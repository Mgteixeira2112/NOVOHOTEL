import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatPhone, formatDateBR, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  MessageSquare, 
  Star, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { Hospede } from '../../types';

// Componente de Gestão e CRM de Hóspedes, Fichas de Estadias e Disparo Direto de Mensagens
export const GuestsModule: React.FC = () => {
  const { guests, reservations, addGuest, updateGuest, deleteGuest, hotelConfig } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Hospede | null>(null);
  const [selectedGuestHistory, setSelectedGuestHistory] = useState<Hospede | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    data_nascimento: '1990-01-01',
    cidade: 'São Paulo',
    estado: 'SP',
    nacionalidade: 'Brasileiro',
    notas_preferencias: '',
    vip: false,
  });

  const filteredGuests = guests.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.nome.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.documento.includes(term) ||
      g.telefone.includes(term)
    );
  });

  const handleOpenNew = () => {
    setEditingGuest(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      documento: '',
      data_nascimento: '1990-01-01',
      cidade: '',
      estado: 'SP',
      nacionalidade: 'Brasileira',
      notas_preferencias: '',
      vip: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (g: Hospede) => {
    setEditingGuest(g);
    setFormData({
      nome: g.nome,
      email: g.email,
      telefone: g.telefone,
      documento: g.documento,
      data_nascimento: g.data_nascimento,
      cidade: g.cidade || '',
      estado: g.estado || 'SP',
      nacionalidade: g.nacionalidade || 'Brasileiro',
      notas_preferencias: g.notas_preferencias || '',
      vip: !!g.vip,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuest) {
      updateGuest(editingGuest.id, formData);
    } else {
      addGuest(formData);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Cadastro & CRM de Hóspedes
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Histórico completo de estadias, dados de contato, documentos e notas de preferências.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Hóspede</span>
        </button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CPF, e-mail ou telefone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-stone-500 font-semibold">
          {filteredGuests.length} hóspedes registrados
        </span>
      </div>

      {/* Cartões dos Hóspedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => {
          const guestReservations = reservations.filter((r) => r.hospede_id === guest.id);
          const totalSpent = guestReservations.reduce((acc, r) => acc + r.valor_total, 0);

          return (
            <div
              key={guest.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm">
                      {guest.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-900 text-sm">{guest.nome}</h4>
                        {guest.vip && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 text-[9px] font-extrabold uppercase">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">CPF: {guest.documento}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(guest)}
                      className="p-1 rounded hover:bg-stone-100 text-stone-500"
                      title="Editar dados"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir hóspede ${guest.nome}?`)) deleteGuest(guest.id);
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-rose-500"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{guest.telefone}</span>
                  </div>
                  {guest.cidade && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{guest.cidade}/{guest.estado}</span>
                    </div>
                  )}
                </div>

                {guest.notas_preferencias && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-950">
                    <strong className="block text-[10px] uppercase text-amber-800">Preferências:</strong>
                    {guest.notas_preferencias}
                  </div>
                )}

                <div className="p-2.5 bg-stone-50 rounded-xl text-xs flex justify-between text-stone-600">
                  <span>Estadias: <strong>{guestReservations.length} reservas</strong></span>
                  <button
                    onClick={() => setSelectedGuestHistory(guest)}
                    className="text-amber-800 font-bold hover:underline"
                  >
                    Ver Histórico ({guestReservations.length}) →
                  </button>
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <a
                  href={generateWhatsAppLink(guest.telefone, `Olá ${guest.nome}, entramos em contato do ${hotelConfig.nome} sobre sua estadia.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => setSelectedGuestHistory(guest)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold"
                >
                  Ficha do Cliente
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL DE HISTÓRICO DE HOSPEDAGENS DO HÓSPEDE */}
      {selectedGuestHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold uppercase text-amber-700">Histórico de Hospedagens</span>
                <h4 className="font-serif-luxury text-xl font-bold text-stone-900">{selectedGuestHistory.nome}</h4>
              </div>
              <button onClick={() => setSelectedGuestHistory(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1">
              {reservations.filter((r) => r.hospede_id === selectedGuestHistory.id).map((res) => (
                <div key={res.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-900">{res.codigo}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-bold uppercase">
                      {res.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-stone-600">
                    Período: {formatDateBR(res.checkin)} a {formatDateBR(res.checkout)} ({res.quantidade_hospedes} hóspedes)
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-1">
                    <span>Valor: R$ {res.valor_total.toFixed(2)}</span>
                    <span className="font-mono text-stone-500">PIN: {res.pin_fechadura}#</span>
                  </div>
                </div>
              ))}

              {reservations.filter((r) => r.hospede_id === selectedGuestHistory.id).length === 0 && (
                <div className="text-center py-6 text-stone-400 text-xs">Nenhuma reserva registrada para este hóspede.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedGuestHistory(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DADOS DO HÓSPEDE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-serif-luxury text-xl font-bold text-stone-900">
                {editingGuest ? 'Editar Dados do Hóspede' : 'Novo Hóspede'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">CPF / Passaporte *</label>
                  <input
                    type="text"
                    required
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">Data Nascimento</label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-stone-600 mb-1">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-600 mb-1">Preferências & Restrições</label>
                <textarea
                  rows={2}
                  value={formData.notas_preferencias}
                  onChange={(e) => setFormData({ ...formData, notas_preferencias: e.target.value })}
                  placeholder="Ex: Alergias, preferência de andar alto..."
                  className="w-full p-2 rounded-lg border border-stone-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vipChk"
                  checked={formData.vip}
                  onChange={(e) => setFormData({ ...formData, vip: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="vipChk" className="font-bold text-stone-800 cursor-pointer">
                  Marcar como Hóspede VIP
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md"
                >
                  Salvar Hóspede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
