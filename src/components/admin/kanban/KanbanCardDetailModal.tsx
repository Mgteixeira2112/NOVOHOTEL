import React, { useState } from 'react';
import { 
  KanbanCard, 
  KanbanBoard, 
  KanbanPriority 
} from '../../../types/kanban';
import { 
  X, 
  Clock, 
  MapPin, 
  CheckSquare, 
  MessageSquare, 
  User, 
  AlertTriangle, 
  Send, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  Flame, 
  Plus, 
  ArrowRight, 
  Shield, 
  Tag, 
  DollarSign,
  UtensilsCrossed,
  Zap,
  Package
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';
import { useHotel } from '../../../context/HotelContext';
import { getTheme, getFontFamilyClass } from '../../../utils/themeHelper';

export const KanbanCardDetailModal: React.FC = () => {
  const { 
    selectedCard, 
    setSelectedCard, 
    boards, 
    cards, 
    updateCard, 
    deleteCard, 
    addCardComment, 
    toggleChecklistItem, 
    addChecklistItem, 
    assignCard, 
    delegateCard, 
    moveCard,
    quickRestockFrigobarCard
  } = useKanban();

  const { users, currentUser, hotelConfig } = useHotel();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [commentInput, setCommentInput] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateTargetDept, setDelegateTargetDept] = useState('');
  const [delegateNotes, setDelegateNotes] = useState('');

  if (!selectedCard) return null;

  // Board e Coluna atuais
  const currentBoard = boards.find((b) => b.id === selectedCard.board_id) || boards[0];
  const currentColumn = currentBoard?.columns.find((c) => c.id === selectedCard.column_id);

  // Cálculo de SLA
  const start = new Date(selectedCard.created_at).getTime();
  const end = selectedCard.completed_at ? new Date(selectedCard.completed_at).getTime() : Date.now();
  const elapsedMinutes = Math.max(0, Math.floor((end - start) / 60000));
  const isOverdue = !selectedCard.completed_at && elapsedMinutes > selectedCard.sla_target_minutes;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addCardComment(selectedCard.id, commentInput);
    setCommentInput('');
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(selectedCard.id, newChecklistText);
    setNewChecklistText('');
  };

  const handleConfirmDelegate = () => {
    if (!delegateTargetDept) return;
    delegateCard(selectedCard.id, delegateTargetDept, delegateNotes);
    setIsDelegating(false);
    setSelectedCard(null);
  };

  const displayItems = selectedCard.order_items || selectedCard.service_details || [];
  const summaryCategory = selectedCard.summary_category || (
    currentBoard.id === 'cozinha' 
      ? `Pedido (${displayItems.length || 1} itens):`
      : currentBoard.id === 'governanca'
      ? 'Serviço de Higienização:'
      : currentBoard.id === 'manutencao'
      ? 'Chamado Técnico:'
      : currentBoard.id === 'almoxarifado'
      ? 'Itens de Suprimento / Frigobar:'
      : 'Atendimento Front Desk:'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-1 shadow-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedCard.location}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-bold text-xs">
                Setor: {currentBoard?.title}
              </span>

              {selectedCard.origin_department && (
                <span className="px-2.5 py-1 rounded-lg bg-stone-800/80 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-stone-700">
                  <Share2 className="w-3 h-3 text-amber-400" />
                  Origem: {selectedCard.origin_department}
                </span>
              )}
            </div>

            <h2 className={`text-lg sm:text-xl font-bold ${fontClass} text-white`}>
              {selectedCard.title}
            </h2>

            {selectedCard.guest_name && (
              <p className="text-xs text-amber-200/90 font-medium">
                Hóspede Solicitante: <strong className="text-white font-bold">{selectedCard.guest_name}</strong>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedCard(null)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Grid de Duas Colunas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Alerta de Delegação Rápida (se acionado) */}
          {isDelegating ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-600" />
                  Transferir / Repassar Chamado para Outro Setor
                </span>
                <button
                  type="button"
                  onClick={() => setIsDelegating(false)}
                  className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Departamento de Destino:
                  </label>
                  <select
                    value={delegateTargetDept}
                    onChange={(e) => setDelegateTargetDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Selecione o setor...</option>
                    {boards
                      .filter((b) => b.id !== selectedCard.board_id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Instrução / Nota de Transferência:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Hóspede aguardando no quarto"
                    value={delegateNotes}
                    onChange={(e) => setDelegateNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmDelegate}
                disabled={!delegateTargetDept}
                className="w-full py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Confirmar Envio e Sincronizar em Tempo Real</span>
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna Principal: Detalhes, Checklist & Chat */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Caixa Amarela/Âmbar Padronizada de Itens do Pedido ou Serviço */}
              {displayItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between font-bold text-amber-950 text-xs">
                    <span>{summaryCategory}</span>
                    {selectedCard.amount !== undefined && (
                      <span className="text-emerald-700 font-extrabold text-sm">
                        Total: R$ {selectedCard.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {displayItems.map((item, idx) => (
                      <div key={idx} className="text-xs text-stone-800 font-medium pl-2.5 border-l-2 border-amber-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist Interativo */}
              <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                    Procedimentos & Checklist de Execução
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    {selectedCard.checklist.filter((i) => i.completed).length} de {selectedCard.checklist.length} concluídos
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedCard.checklist.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-1">Nenhum item de checklist cadastrado.</p>
                  ) : (
                    selectedCard.checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                          item.completed
                            ? 'bg-emerald-50/60 border-emerald-200 text-stone-500 line-through'
                            : 'bg-white border-stone-200 text-stone-800 hover:border-amber-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(selectedCard.id, item.id)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="flex-1 font-medium">{item.text}</span>
                        {item.completed && item.completed_by && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                            {item.completed_by}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>

                {/* Adicionar novo item no checklist */}
                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar tarefa rápida ao checklist..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold transition cursor-pointer"
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              {/* Feed de Chat & Comentários Internos */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Chat Interno & Histórico do Atendimento
                </span>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedCard.comments.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2 text-center">Nenhuma nota interna registrada.</p>
                  ) : (
                    selectedCard.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          comm.is_system
                            ? 'bg-stone-200/70 border border-stone-300 text-stone-600'
                            : 'bg-white border border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-500">
                          <span className="font-bold text-stone-700">
                            {comm.author_name} {comm.author_role ? `(${comm.author_role})` : ''}
                          </span>
                          <span>{new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed">{comm.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Input de Novo Comentário */}
                <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Escreva uma nota rápida (ex: Hóspede pediu carne bem passada)..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl ${theme.buttonClass} text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Coluna Lateral: Status, SLA, Responsável e Ações */}
            <div className="space-y-4">
              
              {/* Painel do Cronômetro de SLA */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isOverdue ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Cronômetro & SLA
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${isOverdue ? 'text-rose-600 animate-spin' : 'text-amber-600'}`} />
                    <div>
                      <span className="text-base font-extrabold block">
                        {elapsedMinutes} minutos
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Meta SLA: {selectedCard.sla_target_minutes} min
                      </span>
                    </div>
                  </div>

                  {isOverdue ? (
                    <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 text-[10px] font-black uppercase">
                      Estourado
                    </span>
                  ) : selectedCard.completed_at ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Concluído
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Dentro da Meta
                    </span>
                  )}
                </div>
              </div>

              {/* Coluna / Status Atual */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700">
                  Etapa / Coluna Atual:
                </label>
                <select
                  value={selectedCard.column_id}
                  onChange={(e) => moveCard(selectedCard.id, e.target.value, selectedCard.board_id)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
                >
                  {currentBoard.columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsável Atribuído */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700">
                  Colaborador Responsável:
                </label>
                <select
                  value={selectedCard.assigned_to?.id || ''}
                  onChange={(e) => {
                    const foundUser = users.find((u) => u.id === e.target.value);
                    if (foundUser) {
                      assignCard(selectedCard.id, {
                        id: foundUser.id,
                        name: foundUser.nome,
                        role: foundUser.cargo_titulo || foundUser.tipo_usuario,
                        avatar: foundUser.avatar
                      });
                    } else {
                      assignCard(selectedCard.id, null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Nenhum (Disponível para a equipe)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.cargo_titulo || u.tipo_usuario})
                    </option>
                  ))}
                </select>

                {/* Botão rápido: "Assumir este Chamado" */}
                {currentUser && (!selectedCard.assigned_to || selectedCard.assigned_to.id !== currentUser.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      assignCard(selectedCard.id, {
                        id: currentUser.id,
                        name: currentUser.nome,
                        role: currentUser.cargo_titulo || currentUser.tipo_usuario,
                        avatar: currentUser.avatar
                      });
                    }}
                    className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <User className="w-3 h-3 text-amber-600" />
                    <span>Assumir como Responsável</span>
                  </button>
                )}
              </div>

              {/* Nível de Prioridade */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700">
                  Prioridade do Chamado:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['normal', 'atencao', 'critica'] as KanbanPriority[]).map((p) => {
                    const isActive = selectedCard.priority === p;
                    const labels = { normal: 'Normal', atencao: 'Atenção', critica: 'Urgente' };
                    const colors = {
                      normal: isActive ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600',
                      atencao: isActive ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600',
                      critica: isActive ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
                    };
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateCard(selectedCard.id, { priority: p })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${colors[p]}`}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ações de Gestão */}
              <div className="pt-3 border-t border-stone-200 space-y-2">
                {/* Botão Especial Almoxarifado / Frigobar */}
                {selectedCard.board_id === 'almoxarifado' && (selectedCard.room_number || selectedCard.tags.includes('Frigobar') || selectedCard.tags.includes('Reposição')) && !selectedCard.completed_at && (
                  <button
                    type="button"
                    onClick={() => {
                      quickRestockFrigobarCard(selectedCard.id);
                      setSelectedCard(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Zap className="w-4 h-4 text-emerald-200" />
                    <span>Abastecer Frigobar & Concluir Chamado</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDelegating(!isDelegating)}
                  className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Repassar para Outro Setor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja excluir permanentemente este cartão?')) {
                      deleteCard(selectedCard.id);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Cartão</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
