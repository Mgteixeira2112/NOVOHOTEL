import React, { useState } from 'react';
import { 
  KanbanPriority, 
  KanbanCardAssignee 
} from '../../../types/kanban';
import { 
  X, 
  Plus, 
  MapPin, 
  Clock, 
  User, 
  Tag, 
  UtensilsCrossed, 
  CheckSquare,
  Sparkles,
  Flame,
  AlertCircle,
  Share2,
  DollarSign,
  Layers
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';
import { useHotel } from '../../../context/HotelContext';
import { getTheme, getFontFamilyClass } from '../../../utils/themeHelper';

export const KanbanCreateCardModal: React.FC = () => {
  const { 
    isCreateCardModalOpen, 
    setIsCreateCardModalOpen, 
    boards, 
    activeBoardId, 
    createCard 
  } = useKanban();

  const { rooms, users, currentUser, hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [selectedBoardId, setSelectedBoardId] = useState<string>(activeBoardId || 'recepcao');
  const activeBoardObj = boards.find((b) => b.id === selectedBoardId) || boards[0];
  const [selectedColumnId, setSelectedColumnId] = useState<string>(activeBoardObj?.columns[0]?.id || '');
  
  // Localização
  const [locationType, setLocationType] = useState<'room' | 'common'>('room');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('Quarto 101');
  const [customLocation, setCustomLocation] = useState<string>('');

  // Dados do Chamado
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<KanbanPriority>('normal');
  const [slaMinutes, setSlaMinutes] = useState<number>(activeBoardObj?.default_sla_minutes || 25);
  const [guestName, setGuestName] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  
  // Itens de Detalhes / Pedido / Serviço
  const [summaryCategory, setSummaryCategory] = useState('');
  const [detailsText, setDetailsText] = useState('');
  const [amount, setAmount] = useState('');

  // Checklist inicial
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);

  if (!isCreateCardModalOpen) return null;

  const handleAddChecklistField = () => {
    setChecklistItems([...checklistItems, '']);
  };

  const handleChecklistChange = (index: number, val: string) => {
    const next = [...checklistItems];
    next[index] = val;
    setChecklistItems(next);
  };

  const handleRemoveChecklistField = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalLocation = locationType === 'room' ? selectedRoomNumber : (customLocation || 'Área Social');
    const assignedUser = users.find((u) => u.id === assignedUserId);

    const formattedChecklist = checklistItems
      .filter((t) => t.trim().length > 0)
      .map((t, idx) => ({
        id: `ck_${Date.now()}_${idx}`,
        text: t.trim(),
        completed: false
      }));

    const originDeptName = boards.find((b) => b.id === activeBoardId)?.title || 'Recepção';
    const splitDetails = detailsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    createCard({
      board_id: selectedBoardId,
      column_id: selectedColumnId || activeBoardObj.columns[0].id,
      title: title.trim(),
      location: finalLocation,
      priority,
      sla_target_minutes: Number(slaMinutes) || 25,
      guest_name: guestName.trim() || undefined,
      assigned_to: assignedUser ? {
        id: assignedUser.id,
        name: assignedUser.nome,
        role: assignedUser.cargo_titulo || assignedUser.tipo_usuario,
        avatar: assignedUser.avatar
      } : null,
      origin_department: originDeptName,
      summary_category: summaryCategory.trim() || undefined,
      order_items: splitDetails.length > 0 ? splitDetails : undefined,
      service_details: splitDetails.length > 0 ? splitDetails : undefined,
      amount: amount ? Number(amount) : undefined,
      checklist: formattedChecklist
    });

    setIsCreateCardModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${theme.badgeClass} flex items-center justify-center font-black shadow-sm`}>
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold ${fontClass} text-white`}>
                Novo Chamado / Ordem de Serviço
              </h2>
              <p className="text-xs text-stone-400">
                Geração em tempo real para os quadros departamentais com padrão unificado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateCardModalOpen(false)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Seleção do Quadro e Coluna */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Departamento de Destino:
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => {
                  const bId = e.target.value;
                  setSelectedBoardId(bId);
                  const bObj = boards.find((b) => b.id === bId);
                  if (bObj && bObj.columns.length > 0) {
                    setSelectedColumnId(bObj.columns[0].id);
                    setSlaMinutes(bObj.default_sla_minutes);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 ${theme.ringClass}`}
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Coluna / Status Inicial:
              </label>
              <select
                value={selectedColumnId}
                onChange={(e) => setSelectedColumnId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 ${theme.ringClass}`}
              >
                {activeBoardObj.columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Localização do Serviço */}
          <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                Localização do Chamado:
              </label>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLocationType('room')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    locationType === 'room' ? 'bg-stone-900 text-amber-300' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  Quarto / Chalé
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('common')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    locationType === 'common' ? 'bg-stone-900 text-amber-300' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  Área Comum
                </button>
              </div>
            </div>

            {locationType === 'room' ? (
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={`Quarto ${r.numero} (${r.nome})`}>
                    Quarto {r.numero} - {r.nome} (Andar {r.andar || 1})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Ex: Piscina Térmica, Restaurante, Recepção, Sauna, Spa..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          {/* Título / Ação Principal */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Título / Descrição da Ação: *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Filé Mignon ao Poivre, Vazamento no Banheiro, Troca de Toalhas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Detalhes do Serviço / Pedido / Caixa Âmbar */}
          <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                Itens de Pedido / Detalhes de Serviço (Caixa Destacada):
              </label>
              <span className="text-[10px] text-amber-800 font-medium">
                Padrão unificado para todos os quadros
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Rótulo da Categoria:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedido (3 itens):, Chamado Técnico:, Higienização:"
                  value={summaryCategory}
                  onChange={(e) => setSummaryCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Valor Total R$ (Opcional):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 198.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Itens Detalhados (um por linha):
              </label>
              <textarea
                rows={3}
                placeholder={"1x Medalhão de Mignon ao Molho Poivre\n1x Risoto de Parmesão Trufado\n1x Vinho Tinto Reserva 750ml"}
                value={detailsText}
                onChange={(e) => setDetailsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Hóspede e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Hóspede (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Alice Guimarães, Dr. Roberto Silveira"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Atribuir a um Colaborador:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Nenhum (Deixar aberto para a equipe)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.cargo_titulo || u.tipo_usuario})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prioridade & SLA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Nível de Prioridade:
              </label>
              <div className="flex gap-2">
                {(['normal', 'atencao', 'critica'] as KanbanPriority[]).map((p) => {
                  const isSel = priority === p;
                  const labels = { normal: 'Normal', atencao: 'Atenção', critica: 'Urgente' };
                  const colors = {
                    normal: isSel ? 'bg-emerald-600 text-white' : 'bg-white text-stone-700 border border-stone-300',
                    atencao: isSel ? 'bg-amber-500 text-white' : 'bg-white text-stone-700 border border-stone-300',
                    critica: isSel ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-stone-700 border border-stone-300'
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${colors[p]}`}
                    >
                      {p === 'critica' && <Flame className="w-3 h-3 inline mr-1 fill-white" />}
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>Tempo Limite SLA:</span>
                <span className="text-amber-600 font-extrabold">{slaMinutes} minutos</span>
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={slaMinutes}
                onChange={(e) => setSlaMinutes(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>5 min (Express)</span>
                <span>25 min (Padrão)</span>
                <span>120 min</span>
              </div>
            </div>
          </div>

          {/* Checklist Inicial de Tarefas */}
          <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                Checklist / Subtarefas da Operação:
              </label>
              <button
                type="button"
                onClick={handleAddChecklistField}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-stone-400 text-xs font-bold w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Etapa ${idx + 1} (ex: Selar carne, desobstruir dreno, aromatizar)...`}
                    value={item}
                    onChange={(e) => handleChecklistChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {checklistItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistField(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateCardModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl ${theme.buttonClass} text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>Criar Chamado & Notificar Setor</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
