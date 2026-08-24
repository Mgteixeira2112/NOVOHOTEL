import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Plus, 
  Minus, 
  Receipt, 
  Sparkles,
  ShoppingBag,
  User,
  BedDouble,
  DollarSign
} from 'lucide-react';
import { FrigobarProduct, FrigobarQuarto } from '../../../types/frigobar';
import { Reserva, Hospede } from '../../../types';

interface FrigobarAuditoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: FrigobarQuarto;
  products: FrigobarProduct[];
  activeReservation?: Reserva;
  activeGuest?: Hospede;
  currentUserName: string;
  onConfirmAudit: (
    auditData: {
      quarto_id: string;
      quarto_numero: string;
      itens_consumidos: Array<{
        produto_id: string;
        produto_nome: string;
        quantidade: number;
        valor_unitario: number;
        subtotal: number;
      }>;
      valor_total_consumo: number;
      lancado_na_reserva: boolean;
      reposicao_efetuada: boolean;
      observacoes?: string;
      newRoomItems: Array<{ produto_id: string; quantidade_padrao: number; quantidade_atual: number }>;
    }
  ) => void;
}

export const FrigobarAuditoriaModal: React.FC<FrigobarAuditoriaModalProps> = ({
  isOpen,
  onClose,
  room,
  products,
  activeReservation,
  activeGuest,
  currentUserName,
  onConfirmAudit
}) => {
  if (!isOpen) return null;

  // Estado das contagens aferidas no quarto
  const [currentCounts, setCurrentCounts] = useState<{ [produtoId: string]: number }>(() => {
    const initial: { [produtoId: string]: number } = {};
    room.itens.forEach((item) => {
      initial[item.produto_id] = item.quantidade_atual;
    });
    return initial;
  });

  const [reporAposAuditoria, setReporAposAuditoria] = useState<boolean>(true);
  const [lancarNaConta, setLancarNaConta] = useState<boolean>(!!activeReservation);
  const [observacoes, setObservacoes] = useState<string>('');

  // Atualizar a contagem de um item no quarto
  const handleUpdateCount = (produtoId: string, delta: number) => {
    setCurrentCounts((prev) => {
      const current = prev[produtoId] ?? 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [produtoId]: nextVal };
    });
  };

  // Calcular itens consumidos (Diferença entre a quantidade padrão/anterior e a aferida)
  const itensConsumidosCalculados = room.itens
    .map((item) => {
      const prod = products.find((p) => p.id === item.produto_id);
      const atualAferido = currentCounts[item.produto_id] ?? item.quantidade_atual;
      // O consumo é a diferença se o aferido for menor que o esperado/anterior
      const consumido = Math.max(0, item.quantidade_padrao - atualAferido);

      if (!prod || consumido <= 0) return null;

      return {
        produto_id: prod.id,
        produto_nome: prod.nome,
        quantidade: consumido,
        valor_unitario: prod.preco_venda,
        subtotal: consumido * prod.preco_venda
      };
    })
    .filter(Boolean) as Array<{
      produto_id: string;
      produto_nome: string;
      quantidade: number;
      valor_unitario: number;
      subtotal: number;
    }>;

  const valorTotalConsumo = itensConsumidosCalculados.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSave = () => {
    const newRoomItems = room.itens.map((item) => {
      const aferido = currentCounts[item.produto_id] ?? item.quantidade_atual;
      return {
        produto_id: item.produto_id,
        quantidade_padrao: item.quantidade_padrao,
        quantidade_atual: reporAposAuditoria ? item.quantidade_padrao : aferido
      };
    });

    onConfirmAudit({
      quarto_id: room.quarto_id,
      quarto_numero: room.quarto_numero,
      itens_consumidos: itensConsumidosCalculados,
      valor_total_consumo: valorTotalConsumo,
      lancado_na_reserva: lancarNaConta && !!activeReservation,
      reposicao_efetuada: reporAposAuditoria,
      observacoes,
      newRoomItems
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 font-serif-luxury">
                Conferência & Auditoria do Frigobar • Quarto {room.quarto_numero}
              </h2>
              <p className="text-xs text-stone-400">
                Aferição de itens consumidos com lançamento automático no extrato do hóspede
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações da Ocupação Atual */}
        <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-stone-500" />
            <span className="font-bold text-stone-700">Acomodação {room.quarto_numero}</span>
          </div>

          {activeGuest && activeReservation ? (
            <div className="flex items-center gap-2 bg-amber-100/80 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900 font-medium">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>Hóspede Ativo: <strong>{activeGuest.nome}</strong> ({activeReservation.codigo})</span>
            </div>
          ) : (
            <span className="text-stone-500 italic bg-stone-200/70 px-2.5 py-1 rounded-lg">
              Quarto Desocupado / Auditoria de Arrumação
            </span>
          )}

          <div className="text-stone-500">
            Aferidor: <strong className="text-stone-700">{currentUserName}</strong>
          </div>
        </div>

        {/* Corpo com a lista de itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Itens do Frigobar (Aferição de Estoque Físico)
              </h3>
              <span className="text-xs text-stone-400">
                Ajuste a quantidade que está fisicamente no frigobar agora
              </span>
            </div>

            <div className="space-y-2">
              {room.itens.map((item) => {
                const prod = products.find((p) => p.id === item.produto_id);
                if (!prod) return null;

                const countAferida = currentCounts[item.produto_id] ?? item.quantidade_atual;
                const diferencaConsumida = Math.max(0, item.quantidade_padrao - countAferida);

                return (
                  <div
                    key={item.produto_id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      diferencaConsumida > 0
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {prod.nome}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {prod.codigo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                        <span>Preço: <strong className="text-stone-800">R$ {prod.preco_venda.toFixed(2)}</strong></span>
                        <span>Padrão Quarto: <strong>{item.quantidade_padrao} {prod.unidade}</strong></span>
                        <span>Estoque Central: <strong className={prod.estoque_central <= prod.estoque_minimo ? 'text-rose-600 font-bold' : 'text-stone-700'}>{prod.estoque_central} {prod.unidade}</strong></span>
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(item.produto_id, -1)}
                          disabled={countAferida <= 0}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {countAferida}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(item.produto_id, 1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status de Consumo */}
                      <div className="w-28 text-right">
                        {diferencaConsumida > 0 ? (
                          <span className="inline-flex flex-col items-end text-amber-800">
                            <span className="text-xs font-bold">Consumiu: {diferencaConsumida} un</span>
                            <span className="text-[11px] font-semibold text-amber-700">
                              +R$ {(diferencaConsumida * prod.preco_venda).toFixed(2)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo do Consumo Apurado */}
          <div className="bg-stone-900 text-white p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                Resumo da Auditoria & Total a Cobrar
              </span>
              <span className="text-sm font-bold text-amber-300">
                R$ {valorTotalConsumo.toFixed(2)}
              </span>
            </div>

            {itensConsumidosCalculados.length > 0 ? (
              <div className="space-y-1.5 text-xs text-stone-300">
                {itensConsumidosCalculados.map((c) => (
                  <div key={c.produto_id} className="flex justify-between">
                    <span>{c.quantidade}x {c.produto_nome}</span>
                    <span className="text-stone-100 font-medium">R$ {c.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Nenhum item consumido detectado nesta conferência (frigobar intacto).
              </p>
            )}

            {/* Checkboxes de Ação Automática */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              {activeReservation && valorTotalConsumo > 0 && (
                <label className="flex items-center gap-2 text-xs cursor-pointer text-amber-200">
                  <input
                    type="checkbox"
                    checked={lancarNaConta}
                    onChange={(e) => setLancarNaConta(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                  <span>
                    Lançar automaticamente no extrato da <strong>Reserva {activeReservation.codigo}</strong> ({activeGuest?.nome})
                  </span>
                </label>
              )}

              <label className="flex items-center gap-2 text-xs cursor-pointer text-stone-300">
                <input
                  type="checkbox"
                  checked={reporAposAuditoria}
                  onChange={(e) => setReporAposAuditoria(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                />
                <span>
                  Marcar frigobar como <strong>100% reposto</strong> agora (dar baixa no Almoxarifado Central)
                </span>
              </label>
            </div>
          </div>

          {/* Campo de Observação */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações da Governança / Auditoria
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Hóspede solicitou reposição extra de água com gás / Conferência pós check-out"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-200 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Confirmar Auditoria {valorTotalConsumo > 0 ? `(R$ ${valorTotalConsumo.toFixed(2)})` : ''}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
