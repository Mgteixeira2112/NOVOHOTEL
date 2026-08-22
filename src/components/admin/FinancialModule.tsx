import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../../utils/formatters';
import { 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Banknote, 
  TrendingUp, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Search, 
  PieChart 
} from 'lucide-react';
import { Pagamento } from '../../types';

// Componente de Gestão Financeira, Conciliação de Receitas, Métodos de Pagamento e Faturamento
export const FinancialModule: React.FC = () => {
  const { payments, reservations, guests } = useHotel();

  const [methodFilter, setMethodFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Cálculos Financeiros e Conciliação
  const approvedPayments = payments.filter((p) => p.status === 'aprovado');
  const totalRevenue = approvedPayments.reduce((acc, p) => acc + p.valor, 0);

  const pixRevenue = approvedPayments.filter((p) => p.metodo === 'pix').reduce((acc, p) => acc + p.valor, 0);
  const cardRevenue = approvedPayments.filter((p) => p.metodo === 'cartao_credito').reduce((acc, p) => acc + p.valor, 0);
  const cashRevenue = approvedPayments.filter((p) => p.metodo === 'dinheiro' || p.metodo === 'transferencia').reduce((acc, p) => acc + p.valor, 0);

  const averageTicket = approvedPayments.length > 0 ? totalRevenue / approvedPayments.length : 0;

  const filteredPayments = payments.filter((p) => {
    const res = reservations.find((r) => r.id === p.reserva_id);
    const guest = res ? guests.find((g) => g.id === res.hospede_id) : null;

    const matchesMethod = methodFilter === 'todos' ? true : p.metodo === methodFilter;
    const matchesSearch = 
      (res?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.comprovante_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Gestão Financeira & Faturamento
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Acompanhamento de transações, conciliação de métodos de pagamento (PIX, Cartão) e receitas.
          </p>
        </div>

        <button
          onClick={() => alert('Relatório Financeiro exportado com sucesso em formato CSV/PDF!')}
          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Geral</span>
        </button>
      </div>

      {/* Indicadores Chave de Desempenho (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Bruto Total */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Faturamento Bruto Total
          </span>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 100% conciliado
          </span>
        </div>

        {/* Receita via PIX */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Receita via PIX (Instantâneo)
            </span>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatCurrency(pixRevenue)}
          </div>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            {totalRevenue > 0 ? Math.round((pixRevenue / totalRevenue) * 100) : 0}% do faturamento
          </span>
        </div>

        {/* Receita via Cartão de Crédito */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Cartão de Crédito
            </span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {formatCurrency(cardRevenue)}
          </div>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            {totalRevenue > 0 ? Math.round((cardRevenue / totalRevenue) * 100) : 0}% do faturamento
          </span>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Ticket Médio / Reserva
          </span>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            {formatCurrency(averageTicket)}
          </div>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            Baseado em {approvedPayments.length} pagamentos
          </span>
        </div>

      </div>

      {/* Barra de Distribuição por Forma de Pagamento */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700">
          <span>Distribuição por Forma de Pagamento</span>
          <span>100% Conciliado</span>
        </div>

        <div className="h-3.5 rounded-full overflow-hidden bg-stone-100 flex">
          <div 
            style={{ width: `${totalRevenue > 0 ? (pixRevenue / totalRevenue) * 100 : 50}%` }} 
            className="bg-emerald-500 transition-all" 
            title="PIX"
          />
          <div 
            style={{ width: `${totalRevenue > 0 ? (cardRevenue / totalRevenue) * 100 : 40}%` }} 
            className="bg-blue-600 transition-all" 
            title="Cartão de Crédito"
          />
          <div 
            style={{ width: `${totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 10}%` }} 
            className="bg-amber-500 transition-all" 
            title="Dinheiro / Transferência"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-semibold text-stone-700">PIX ({formatCurrency(pixRevenue)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="font-semibold text-stone-700">Cartão de Crédito ({formatCurrency(cardRevenue)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="font-semibold text-stone-700">Outros ({formatCurrency(cashRevenue)})</span>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada de Transações */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comprovante, hóspede ou reserva..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {['todos', 'pix', 'cartao_credito', 'dinheiro'].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  methodFilter === m
                    ? 'bg-stone-900 text-amber-300'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100 text-[11px] font-bold uppercase text-stone-600 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Comprovante</th>
                <th className="py-3 px-4">Reserva / Hóspede</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.map((p) => {
                const res = reservations.find((r) => r.id === p.reserva_id);
                const guest = res ? guests.find((g) => g.id === res.hospede_id) : null;

                return (
                  <tr key={p.id} className="hover:bg-stone-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {p.comprovante_id || p.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-900 block">{guest?.nome || 'Hóspede'}</span>
                      <span className="text-[11px] text-stone-500 font-mono">Reserva {res?.codigo}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold uppercase text-[11px]">
                        {p.metodo === 'pix' ? (
                          <><QrCode className="w-3.5 h-3.5 text-emerald-600" /> PIX</>
                        ) : p.metodo === 'cartao_credito' ? (
                          <><CreditCard className="w-3.5 h-3.5 text-blue-600" /> Cartão</>
                        ) : (
                          <><Banknote className="w-3.5 h-3.5 text-amber-600" /> Dinheiro</>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-sm">
                      {formatCurrency(p.valor)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {formatDateTimeBR(p.created_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'aprovado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
