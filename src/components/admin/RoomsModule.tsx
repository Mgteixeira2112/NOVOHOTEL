import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  BedDouble, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Users, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Key, 
  Wrench, 
  X, 
  Image as ImageIcon 
} from 'lucide-react';
import { Quarto, TipoQuarto } from '../../types';
import { MultiImageGalleryUploader } from '../common/media/MultiImageGalleryUploader';

const ROOM_PHOTO_PRESETS = [
  {
    id: 'suite_king',
    title: 'Suíte King Luxo',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
    category: 'Quarto'
  },
  {
    id: 'banheiro_hidro',
    title: 'Banheiro com Hidro',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
    category: 'Banheiro'
  },
  {
    id: 'sacada_vista',
    title: 'Sacada & Vista Panorâmica',
    url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
    category: 'Vista'
  },
  {
    id: 'decoracao_detalhe',
    title: 'Acolhimento & Detalhes',
    url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
    category: 'Decoração'
  },
  {
    id: 'living_suite',
    title: 'Sala de Estar / Living',
    url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80',
    category: 'Estar'
  },
  {
    id: 'cafe_quarto',
    title: 'Café da Manhã Exclusivo',
    url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=1000&q=80',
    category: 'Café'
  }
];

// Componente de Gestão de Quartos, Tarifas, Fotos e Status de Publicação
export const RoomsModule: React.FC = () => {
  const { rooms, roomTypes, addRoom, updateRoom, deleteRoom, addRoomType, setRoomStatus } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<'rooms' | 'types'>('rooms');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Quarto | null>(null);

  // Estado dos Campos do Formulário de Acomodação
  const [formData, setFormData] = useState({
    numero: '',
    nome: '',
    tipo_quarto_id: roomTypes[0]?.id || '',
    capacidade: 2,
    valor_diaria: 500,
    descricao: '',
    andar: 1,
    tamanho_m2: 35,
    vista: 'Vista para os Jardins',
    cama: '1 Cama Queen Size',
    fechadura_pin: '849201',
    fotos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
    ] as string[],
    comodidadesStr: 'Wi-Fi 6, Ar-condicionado, Smart TV, Frigobar, Cofre Eletrônico',
    ativo: true,
  });

  const handleOpenNew = () => {
    setEditingRoom(null);
    setFormData({
      numero: '',
      nome: '',
      tipo_quarto_id: roomTypes[0]?.id || '',
      capacidade: 2,
      valor_diaria: 550,
      descricao: '',
      andar: 1,
      tamanho_m2: 36,
      vista: 'Vista Panorâmica',
      cama: '1 Cama King Size',
      fechadura_pin: Math.floor(100000 + Math.random() * 900000).toString(),
      fotos: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      ],
      comodidadesStr: 'Wi-Fi 6, Ar-condicionado Split, Smart TV 55", Frigobar, Cofre Digital, Enxoval Premium',
      ativo: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (room: Quarto) => {
    setEditingRoom(room);
    setFormData({
      numero: room.numero,
      nome: room.nome,
      tipo_quarto_id: room.tipo_quarto_id,
      capacidade: room.capacidade,
      valor_diaria: room.valor_diaria,
      descricao: room.descricao,
      andar: room.andar,
      tamanho_m2: room.tamanho_m2,
      vista: room.vista,
      cama: room.cama,
      fechadura_pin: room.fechadura_pin || '849201',
      fotos: room.fotos && room.fotos.length > 0 ? room.fotos : [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      ],
      comodidadesStr: room.comodidades.join(', '),
      ativo: room.ativo,
    });
    setModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const fotos = formData.fotos.map((s) => s.trim()).filter(Boolean);
    const comodidades = formData.comodidadesStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        numero: formData.numero,
        nome: formData.nome,
        tipo_quarto_id: formData.tipo_quarto_id,
        capacidade: Number(formData.capacidade),
        valor_diaria: Number(formData.valor_diaria),
        descricao: formData.descricao,
        andar: Number(formData.andar),
        tamanho_m2: Number(formData.tamanho_m2),
        vista: formData.vista,
        cama: formData.cama,
        fechadura_pin: formData.fechadura_pin,
        fotos: fotos.length > 0 ? fotos : editingRoom.fotos,
        comodidades: comodidades.length > 0 ? comodidades : editingRoom.comodidades,
        ativo: formData.ativo,
      });
    } else {
      addRoom({
        numero: formData.numero,
        nome: formData.nome,
        tipo_quarto_id: formData.tipo_quarto_id,
        capacidade: Number(formData.capacidade),
        valor_diaria: Number(formData.valor_diaria),
        descricao: formData.descricao,
        status: 'disponivel',
        ativo: formData.ativo,
        andar: Number(formData.andar),
        tamanho_m2: Number(formData.tamanho_m2),
        vista: formData.vista,
        cama: formData.cama,
        fechadura_pin: formData.fechadura_pin,
        fotos: fotos.length > 0 ? fotos : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        comodidades: comodidades.length > 0 ? comodidades : ['Wi-Fi', 'Ar-condicionado'],
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Gestão de Quartos & Acomodações
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Cadastre, edite tarifas, gerencie fotos e publique quartos diretamente na Landing Page e no Motor de Reservas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Quarto</span>
          </button>
        </div>
      </div>

      {/* Lista de Acomodações em Tabela / Cartões */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Acomodações Cadastradas ({rooms.length})
          </span>
          <span className="text-xs text-stone-500">
            * Alterações refletem instantaneamente no site público.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/80 text-[11px] font-bold uppercase text-stone-600 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Nº / Quarto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Capacidade</th>
                <th className="py-3 px-4">Diária</th>
                <th className="py-3 px-4">Status Operacional</th>
                <th className="py-3 px-4">Visibilidade no Site</th>
                <th className="py-3 px-4">PIN Fechadura</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rooms.map((room) => {
                const type = roomTypes.find((t) => t.id === room.tipo_quarto_id);
                const photo = room.fotos[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=100&q=80';

                return (
                  <tr key={room.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={photo}
                          alt={room.nome}
                          referrerPolicy="no-referrer"
                          className="w-12 h-10 rounded-lg object-cover bg-stone-900 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 text-sm">#{room.numero}</span>
                            <span className="font-bold text-stone-800">{room.nome}</span>
                          </div>
                          <span className="text-[11px] text-stone-500">{room.andar}º Andar • {room.vista}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      {type?.nome || 'Standard'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded bg-stone-100 text-stone-700 font-medium">
                        Até {room.capacidade} pessoas
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-sm">
                      {formatCurrency(room.valor_diaria)}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={room.status}
                        onChange={(e) => setRoomStatus(room.id, e.target.value as any)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          room.status === 'disponivel'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : room.status === 'ocupado'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : room.status === 'limpeza'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <option value="disponivel">Disponível</option>
                        <option value="ocupado">Ocupado</option>
                        <option value="limpeza">Em Limpeza</option>
                        <option value="manutencao">Manutenção</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => updateRoom(room.id, { ativo: !room.ativo })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          room.ativo
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {room.ativo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{room.ativo ? 'Público / Ativo' : 'Oculto'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-700">
                      🔑 {room.fechadura_pin || '---'}#
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition"
                          title="Editar Quarto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir o Quarto ${room.numero}?`)) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                          title="Excluir Quarto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal de Criação / Edição de Acomodação */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
              <div>
                <h3 className="font-serif-luxury text-2xl font-bold text-stone-900">
                  {editingRoom ? `Editar Acomodação #${editingRoom.numero}` : 'Cadastrar Nova Acomodação'}
                </h3>
                <span className="text-xs text-stone-500">
                  Defina fotos, tarifas e características do quarto.
                </span>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 overflow-y-auto flex-1 pr-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Número do Quarto *</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ex: 204"
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Nome Comercial do Quarto *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Suíte Luxo Vista Panorâmica"
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Categoria / Tipo</label>
                  <select
                    value={formData.tipo_quarto_id}
                    onChange={(e) => setFormData({ ...formData, tipo_quarto_id: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  >
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Valor da Diária (R$) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.valor_diaria}
                    onChange={(e) => setFormData({ ...formData, valor_diaria: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Capacidade Máxima</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Andar</label>
                  <input
                    type="number"
                    value={formData.andar}
                    onChange={(e) => setFormData({ ...formData, andar: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Área (m²)</label>
                  <input
                    type="number"
                    value={formData.tamanho_m2}
                    onChange={(e) => setFormData({ ...formData, tamanho_m2: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">PIN Fechadura Digital</label>
                  <input
                    type="text"
                    value={formData.fechadura_pin}
                    onChange={(e) => setFormData({ ...formData, fechadura_pin: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Vista do Quarto</label>
                  <input
                    type="text"
                    value={formData.vista}
                    onChange={(e) => setFormData({ ...formData, vista: e.target.value })}
                    placeholder="Ex: Frente Mar, Jardim, Piscina"
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Configuração de Camas</label>
                  <input
                    type="text"
                    value={formData.cama}
                    onChange={(e) => setFormData({ ...formData, cama: e.target.value })}
                    placeholder="Ex: 1 Cama King + 1 Sofá-cama"
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição exibida no site para os hóspedes..."
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                />
              </div>

              {/* Galeria de Fotos do Quarto com Upload, Recorte, Reordenação e Presets */}
              <div className="pt-1">
                <MultiImageGalleryUploader
                  label="Galeria de Fotos da Acomodação"
                  description="A primeira foto será utilizada como Capa Principal da acomodação. Reordene, corte ou exclua imagens conforme desejar."
                  images={formData.fotos}
                  onChange={(newPhotos) => setFormData({ ...formData, fotos: newPhotos })}
                  maxImages={12}
                  aspectRatioHint="16:10 / 4:3"
                  defaultAspectRatio={16 / 10}
                  presets={ROOM_PHOTO_PRESETS}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Comodidades (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.comodidadesStr}
                  onChange={(e) => setFormData({ ...formData, comodidadesStr: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="ativoCheckbox" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Publicar e ativar quarto imediatamente na Landing Page e no Motor de Reservas
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md"
                >
                  Salvar Acomodação
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
