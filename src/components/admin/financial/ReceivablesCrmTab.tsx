import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Link as LinkIcon, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  MoreVertical,
  QrCode,
  CreditCard,
  Building2,
  Share2,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../../../utils/formatters';
import { ContaReceber, ReceivableStatus, PaymentMethod } from '../../../types/financial';

interface ReceivablesCrmTabProps {
  receivables: ContaReceber[];
  onOpenNewReceivable: () => void;
  onOpenPaymentLink: (receivable?: ContaReceber) => void;
  onViewReceipt: (receivable: ContaReceber) => void;
  onSettleReceivable: (id: string, method: PaymentMethod) => void;
  onDeleteReceivable: (id: string) => void;
}

export const ReceivablesCrmTab: React.FC<ReceivablesCrmTabProps> = ({
  receivables,
  onOpenNewReceivable,
  onOpenPaymentLink,
  onViewReceipt,
  onSettleReceivable,
  onDeleteReceivable
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('pix');

  // Cálculos de Totais
  const totalReceivables = receivables.reduce((acc, r) => acc + r.valor_total, 0);
  const totalReceived = receivables.filter(r => r.status === 'recebido').reduce((acc, r) => acc + r.valor_total, 0);
  const totalPending = receivables.filter(r => r.status === 'pendente' || r.status === 'parcial').reduce((acc, r) => acc + r.saldo_pendente, 0);
  const totalOverdue = receivables.filter(r => r.status === 'atrasado').reduce((acc, r) => acc + r.saldo_pendente, 0);

  // Filtragem
  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = 
      r.hospede_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.codigo_reserva || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.quarto_numero || '').includes(searchTerm) ||
      (r.hospede_telefone || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'todos' ? true : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmSettle = (id: string) => {
    onSettleReceivable(id, settleMethod);
    setSettlingId(null);
  };

  const getStatusBadge = (status: ReceivableStatus) => {
    switch (status) {
      case 'recebido':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Recebido
          </span>
        );
      case 'pendente':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Em Aberto
          </span>
        );
      case 'atrasado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Em Atraso
          </span>
        );
      case 'parcial':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pago Parcial
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header com Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Total em Recebíveis
          </span>
          <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
            {formatCurrency(totalReceivables)}
          </span>
          <span className="text-[10px] text-stone-400">{receivables.length} faturas lançadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Total Liquidado / Recebido
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {formatCurrency(totalReceived)}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {totalReceivables > 0 ? Math.round((totalReceived / totalReceivables) * 100) : 0}% conciliado
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
            Saldo Pendente a Receber
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
            {formatCurrency(totalPending)}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Hóspedes e Faturados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
            Inadimplência / Atrasos
          </span>
          <span className="text-xl font-bold font-mono text-red-700 mt-1 block">
            {formatCurrency(totalOverdue)}
          </span>
          <span className="text-[10px] text-red-600 font-medium">Requer cobrança</span>
        </div>

      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por hóspede, quarto ou código..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['todos', 'pendente', 'recebido', 'atrasado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {st === 'todos' ? 'Todos' : st === 'pendente' ? 'Em Aberto' : st === 'recebido' ? 'Recebidos' : 'Atrasados'}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewReceivable}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

      </div>

      {/* Tabela de Contas a Receber */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3.5 px-4">Hóspede / Cliente</th>
                <th className="py-3.5 px-4">Descrição / Origem</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações & Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    Nenhuma conta a receber encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((item) => {
                  const isSettling = settlingId === item.id;
                  const isPending = item.status === 'pendente' || item.status === 'atrasado';

                  // WhatsApp Cobrança URL
                  const whatsAppText = `Olá, ${item.hospede_nome}! 👋\n\nIdentificamos uma fatura em aberto no *Itajubá Flat Hotel*:\n\n` +
                    `🏢 *Descrição:* ${item.descricao}\n` +
                    (item.codigo_reserva ? `📌 *Reserva:* ${item.codigo_reserva}\n` : '') +
                    `💰 *Valor Pendente:* ${formatCurrency(item.saldo_pendente)}\n` +
                    `📅 *Vencimento:* ${formatDateBR(item.data_vencimento)}\n\n` +
                    `Gostaria de receber a chave PIX ou o link de cartão para quitação rápida? Estamos à disposição!`;

                  const whatsappUrl = item.hospede_telefone ? generateWhatsAppLink(item.hospede_telefone, whatsAppText) : '#';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition">
                      
                      {/* Hóspede */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{item.hospede_nome}</div>
                        <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                          {item.hospede_telefone && <span>{item.hospede_telefone}</span>}
                          {item.quarto_numero && <span className="bg-stone-100 px-1.5 py-0.2 rounded">Flat {item.quarto_numero}</span>}
                        </div>
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-stone-800 truncate" title={item.descricao}>
                          {item.descricao}
                        </div>
                        {item.codigo_reserva && (
                          <span className="text-[10px] font-mono font-semibold text-amber-700">
                            Reserva: {item.codigo_reserva}
                          </span>
                        )}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-stone-800">
                          {formatDateBR(item.data_vencimento)}
                        </div>
                      </td>

                      {/* Valor Total */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-stone-900">
                          {formatCurrency(item.valor_total)}
                        </div>
                        {item.saldo_pendente > 0 && item.status !== 'recebido' && (
                          <div className="text-[10px] text-amber-700 font-semibold">
                            Pendente: {formatCurrency(item.saldo_pendente)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        
                        {isSettling ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                            <select
                              value={settleMethod}
                              onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                              className="px-2 py-1 rounded-lg border border-stone-300 text-[11px] font-bold bg-white"
                            >
                              <option value="pix">PIX</option>
                              <option value="cartao_credito">Cartão Crédito</option>
                              <option value="cartao_debito">Cartão Débito</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="faturado">Faturado</option>
                            </select>

                            <button
                              onClick={() => handleConfirmSettle(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Confirmar Baixa
                            </button>

                            <button
                              onClick={() => setSettlingId(null)}
                              className="px-2 py-1 rounded-lg bg-stone-200 text-stone-700 text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Dar Baixa */}
                            {isPending && (
                              <button
                                onClick={() => setSettlingId(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-emerald-200"
                                title="Dar baixa em pagamento"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Baixar</span>
                              </button>
                            )}

                            {/* Gerar Link de Cobrança */}
                            {isPending && (
                              <button
                                onClick={() => onOpenPaymentLink(item)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer border border-amber-200"
                                title="Gerar Link de Pagamento / PIX"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Cobrar via WhatsApp */}
                            {isPending && item.hospede_telefone && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer border border-emerald-200"
                                title="Enviar lembrete no WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Ver Recibo Oficial */}
                            <button
                              onClick={() => onViewReceipt(item)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                              title="Visualizar / Imprimir Recibo Oficial"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja realmente remover esta conta a receber de ${item.hospede_nome}?`)) {
                                  onDeleteReceivable(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        )}

                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
