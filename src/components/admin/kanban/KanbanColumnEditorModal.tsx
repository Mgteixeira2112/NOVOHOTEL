import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';

export const KanbanColumnEditorModal: React.FC = () => {
  const { 
    isCreateColumnModalOpen, 
    setIsCreateColumnModalOpen, 
    activeBoard, 
    addColumn, 
    updateColumn, 
    deleteColumn 
  } = useKanban();

  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newWipLimit, setNewWipLimit] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);

  if (!isCreateColumnModalOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addColumn(
      activeBoard.id,
      newTitle.trim(),
      newColor,
      isFinal,
      isInProgress
    );

    setNewTitle('');
    setIsFinal(false);
    setIsInProgress(false);
    setIsCreateColumnModalOpen(false);
  };

  const presetColors = [
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#64748b'  // Slate
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-luxury text-white">
                Personalização de Colunas • {activeBoard.title}
              </h2>
              <p className="text-xs text-stone-400">
                Ajuste o fluxo de etapas e crie novas colunas para a equipe
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateColumnModalOpen(false)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* Colunas Existentes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Colunas Atuais deste Quadro:
            </label>
            <div className="space-y-2">
              {activeBoard.columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-stone-400 w-4">{idx + 1}.</span>
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: col.color || '#64748b' }}
                    />
                    <span className="text-xs font-bold text-stone-900">{col.title}</span>
                    {col.is_in_progress && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Em Execução
                      </span>
                    )}
                    {col.is_final && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Conclusão
                      </span>
                    )}
                  </div>

                  {activeBoard.columns.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja excluir a coluna "${col.title}"?`)) {
                          deleteColumn(col.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Excluir Coluna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Criar Nova Coluna */}
          <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              Adicionar Nova Coluna ao Fluxo:
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Nome da Coluna: *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Em Auditoria, Aguardando Fornecedor, Revisão Noturna..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Cor de Identificação */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                Cor Indicativa:
              </label>
              <div className="flex gap-2 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition cursor-pointer ${
                      newColor === c ? 'ring-3 ring-amber-500 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Opções Especiais de Comportamento */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInProgress}
                  onChange={(e) => {
                    setIsInProgress(e.target.checked);
                    if (e.target.checked) setIsFinal(false);
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Marcar como etapa "Em Execução" (auto-atribui o colaborador ao puxar o card)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFinal}
                  onChange={(e) => {
                    setIsFinal(e.target.checked);
                    if (e.target.checked) setIsInProgress(false);
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Marcar como etapa final (grava o tempo de conclusão e emite som de sucesso)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Nova Coluna no Quadro</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
