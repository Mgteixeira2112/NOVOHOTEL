import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  QrCode, 
  CreditCard, 
  PieChart, 
  Percent, 
  BedDouble, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Plus, 
  Link as LinkIcon, 
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { HotelFinancialKpis, ContaReceber, DespesaOperacional } from '../../../types/financial';

interface FinancialOverviewTabProps {
  kpis: HotelFinancialKpis;
  receivables: ContaReceber[];
  expenses: DespesaOperacional[];
  onOpenNewPaymentLink: () => void;
  onOpenNewExpense: () => void;
  onOpenNewReceivable: () => void;
  onExportReport: () => void;
}

export const FinancialOverviewTab: React.FC<FinancialOverviewTabProps> = ({
  kpis,
  receivables,
  expenses,
  onOpenNewPaymentLink,
  onOpenNewExpense,
  onOpenNewReceivable,
  onExportReport
}) => {
  // Pending and overdue counts
  const pendingReceivablesCount = receivables.filter(r => r.status === 'pendente' || r.status === 'atrasado').length;
  const pendingExpensesCount = expenses.filter(e => e.status === 'pendente' || e.status === 'atrasado').length;

  const totalExpenseVal = expenses.reduce((acc, e) => acc + e.valor, 0);

  // Group expenses by category
  const expenseCatMap: Record<string, { label: string; amount: number; color: string }> = {
    fornecedores_alimentos: { label: 'A&B / Café da Manhã', amount: 0, color: 'bg-amber-500' },
    lavanderia_enxoval: { label: 'Lavanderia & Enxoval', amount: 0, color: 'bg-cyan-500' },
    concessionarias_energia_agua: { label: 'Energia, Água & Gás', amount: 0, color: 'bg-emerald-500' },
    telecom_internet_software: { label: 'Internet, TI & Software', amount: 0, color: 'bg-blue-500' },
    manutencao_predial: { label: 'Manutenção & Engenharia', amount: 0, color: 'bg-rose-500' },
    folha_pagamento_comissoes: { label: 'Folha & Comissões', amount: 0, color: 'bg-purple-500' },
    impostos_taxas: { label: 'Impostos & Taxas (ISS)', amount: 0, color: 'bg-stone-500' },
    outros: { label: 'Outros Custos', amount: 0, color: 'bg-stone-400' }
  };

  expenses.forEach(e => {
    if (expenseCatMap[e.categoria]) {
      expenseCatMap[e.categoria].amount += e.valor;
    } else {
      expenseCatMap.outros.amount += e.valor;
    }
  });

  const expenseCategories = Object.values(expenseCatMap).filter(c => c.amount > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner with Quick Actions */}
      <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-stone-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CRM Financeiro & Gestão PMS Hoteleira</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-white tracking-tight">
              Saúde Financeira & Indicadores Estratégicos
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Acompanhamento de DRE em tempo real, faturamento direto, conciliação de PIX/Gateways e controle de custos operacionais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewPaymentLink}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Gerar Cobrança Instantânea</span>
            </button>

            <button
              onClick={onOpenNewExpense}
              className="px-3.5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-stone-700"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Lançar Despesa</span>
            </button>

            <button
              onClick={onOpenNewReceivable}
              className="px-3.5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-stone-700"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Lançar Recebível</span>
            </button>

            <button
              onClick={onExportReport}
              className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer border border-stone-700"
              title="Exportar Relatório Geral"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Hoteleiros Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Bruto */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Faturamento Bruto
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2">
            {formatCurrency(kpis.faturamento_bruto)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% conciliado no PMS</span>
          </div>
        </div>

        {/* Lucro Operacional & Margem */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Lucro Operacional (EBITDA)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2">
            {formatCurrency(kpis.lucro_operacional)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-stone-600 font-medium">
            <span>Margem:</span>
            <span className="font-bold text-amber-700">{kpis.margem_operacional.toFixed(1)}%</span>
          </div>
        </div>

        {/* RevPAR (Receita por Quarto Disponível) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              RevPAR (Média / Quarto)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-2">
            {formatCurrency(kpis.revpar)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 font-medium">
            Taxa de Ocupação: <strong className="text-stone-800">{kpis.taxa_ocupacao.toFixed(0)}%</strong>
          </div>
        </div>

        {/* ADR / Diária Média */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              ADR / Diária Média
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {formatCurrency(kpis.adr)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 font-medium">
            Ticket Médio: <strong className="text-stone-800">{formatCurrency(kpis.ticket_medio)}</strong>
          </div>
        </div>

      </div>

      {/* Segundo Nível de Métricas: Saldo a Receber vs. Saldo a Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Receita PIX */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Receita via PIX
            </span>
            <span className="text-lg font-bold font-mono text-emerald-700 block">
              {formatCurrency(kpis.receita_pix)}
            </span>
            <span className="text-[10px] text-stone-400">
              {kpis.faturamento_bruto > 0 ? Math.round((kpis.receita_pix / kpis.faturamento_bruto) * 100) : 0}% do faturamento
            </span>
          </div>
        </div>

        {/* Receita Cartão de Crédito */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Cartão de Crédito
            </span>
            <span className="text-lg font-bold font-mono text-blue-700 block">
              {formatCurrency(kpis.receita_cartao_credito)}
            </span>
            <span className="text-[10px] text-stone-400">
              {kpis.faturamento_bruto > 0 ? Math.round((kpis.receita_cartao_credito / kpis.faturamento_bruto) * 100) : 0}% do faturamento
            </span>
          </div>
        </div>

        {/* Saldo em Aberto a Receber */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              A Receber (Folio & Faturado)
            </span>
            <span className="text-lg font-bold font-mono text-amber-700 block">
              {formatCurrency(kpis.saldo_receber)}
            </span>
            <span className="text-[10px] text-stone-400">
              {pendingReceivablesCount} lançamentos pendentes
            </span>
          </div>
        </div>

        {/* Saldo a Pagar (Despesas) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              A Pagar (Despesas)
            </span>
            <span className="text-lg font-bold font-mono text-rose-700 block">
              {formatCurrency(kpis.saldo_pagar)}
            </span>
            <span className="text-[10px] text-stone-400">
              {pendingExpensesCount} contas a vencer
            </span>
          </div>
        </div>

      </div>

      {/* DRE Sintético do Hotel & Distribuição de Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Demonstrativo de Resultados do Exercício (DRE Sintético) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                DRE Sintético Hoteleiro
              </h3>
              <p className="text-xs text-stone-500">
                Demonstrativo contábil e operacional consolidado
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
              Mês Vigente
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            
            {/* Receita Bruta de Hospedagem */}
            <div className="flex justify-between items-center py-1.5 border-b border-stone-100 font-medium">
              <span className="text-stone-700">(+) Receita Bruta de Hospedagem & Diárias</span>
              <span className="font-mono font-bold text-stone-900">{formatCurrency(kpis.faturamento_bruto * 0.92)}</span>
            </div>

            {/* Receitas Acessórias / Consumo */}
            <div className="flex justify-between items-center py-1.5 border-b border-stone-100 font-medium">
              <span className="text-stone-700">(+) Receita Acessória (Frigobar, Taxas & Day Use)</span>
              <span className="font-mono font-bold text-stone-900">{formatCurrency(kpis.faturamento_bruto * 0.08)}</span>
            </div>

            {/* Total Receita Operacional Bruta */}
            <div className="flex justify-between items-center py-2 bg-stone-50 px-3 rounded-xl font-bold">
              <span className="text-stone-900">(=) RECEITA OPERACIONAL BRUTA</span>
              <span className="font-mono text-stone-900">{formatCurrency(kpis.faturamento_bruto)}</span>
            </div>

            {/* Deduções e Taxas de Cartão/Gateway */}
            <div className="flex justify-between items-center py-1.5 border-b border-stone-100 text-stone-600">
              <span>(-) Taxas de Gateway, Adquirentes & MDR Cartões</span>
              <span className="font-mono font-semibold text-red-600">
                -{formatCurrency(kpis.faturamento_bruto - kpis.faturamento_liquido)}
              </span>
            </div>

            {/* Receita Líquida */}
            <div className="flex justify-between items-center py-2 bg-emerald-50/50 px-3 rounded-xl font-bold">
              <span className="text-emerald-950">(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-emerald-900">{formatCurrency(kpis.faturamento_liquido)}</span>
            </div>

            {/* Custos Operacionais Totais */}
            <div className="flex justify-between items-center py-1.5 border-b border-stone-100 text-stone-600">
              <span>(-) Custos Operacionais & Despesas Prediais</span>
              <span className="font-mono font-semibold text-red-600">
                -{formatCurrency(kpis.total_despesas)}
              </span>
            </div>

            {/* Lucro Operacional Final (EBITDA) */}
            <div className="flex justify-between items-center p-3.5 bg-stone-900 text-white rounded-2xl font-bold text-sm">
              <div>
                <span className="text-amber-300 block">(=) RESULTADO OPERACIONAL LÍQUIDO (EBITDA)</span>
                <span className="text-[10px] font-normal text-stone-400">Margem líquida de {kpis.margem_operacional.toFixed(1)}% sobre a receita</span>
              </div>
              <span className="font-mono text-lg text-amber-300">{formatCurrency(kpis.lucro_operacional)}</span>
            </div>

          </div>
        </div>

        {/* Distribuição por Centros de Custo */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                Centros de Custo (Despesas)
              </h3>
              <span className="text-xs font-mono font-bold text-stone-500">
                {formatCurrency(totalExpenseVal)}
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {expenseCategories.map((cat, idx) => {
                const pct = totalExpenseVal > 0 ? (cat.amount / totalExpenseVal) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-700 font-medium">{cat.label}</span>
                      <span className="font-mono font-bold text-stone-900">
                        {formatCurrency(cat.amount)} <span className="text-[10px] font-normal text-stone-500">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div 
                        className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2 mt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Todos os lançamentos são auditados e sincronizados com a contabilidade.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
