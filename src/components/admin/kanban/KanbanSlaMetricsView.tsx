import React from 'react';
import { 
  KanbanSlaMetrics, 
  KanbanBoard, 
  KanbanCard 
} from '../../../types/kanban';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  Layers, 
  BarChart3, 
  ShieldCheck,
  UserCheck,
  Zap
} from 'lucide-react';
import { useKanban } from '../../../context/KanbanContext';

export const KanbanSlaMetricsView: React.FC = () => {
  const { slaMetrics, boards, cards } = useKanban();

  // Contagem por departamento
  const departmentStats = boards.map((board) => {
    const boardCards = cards.filter((c) => c.board_id === board.id);
    const completed = boardCards.filter((c) => {
      const col = board.columns.find((col) => col.id === c.column_id);
      return col?.is_final || !!c.completed_at;
    });

    let totalMins = 0;
    completed.forEach((c) => {
      const s = new Date(c.created_at).getTime();
      const e = c.completed_at ? new Date(c.completed_at).getTime() : Date.now();
      totalMins += (e - s) / 60000;
    });

    const avgMins = completed.length > 0 ? Math.round(totalMins / completed.length) : board.default_sla_minutes;

    return {
      id: board.id,
      title: board.title,
      total: boardCards.length,
      completed: completed.length,
      inProgress: boardCards.length - completed.length,
      avgMins,
      slaTarget: board.default_sla_minutes
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Chamados no Dia</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-luxury">
              {slaMetrics.total_cards_today}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {slaMetrics.completed_cards_today} concluídos
            </span>
          </div>
          <span className="text-[11px] text-stone-400 block">
            Todas as ordens e solicitações
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Cumprimento de SLA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-serif-luxury">
              {slaMetrics.on_time_percentage}%
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              dentro do prazo
            </span>
          </div>
          <span className="text-[11px] text-stone-400 block">
            Meta hoteleira: &gt; 90%
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Tempo Médio (TMT)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-luxury">
              {slaMetrics.avg_resolution_minutes} min
            </span>
            <span className="text-xs text-amber-600 font-bold">
              tempo médio
            </span>
          </div>
          <span className="text-[11px] text-stone-400 block">
            Desde a abertura até a entrega
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Chamados Críticos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 font-serif-luxury">
              {slaMetrics.active_urgent_count}
            </span>
            <span className="text-xs text-rose-600 font-bold">
              urgentes ativos
            </span>
          </div>
          <span className="text-[11px] text-stone-400 block">
            Exigem resolução imediata
          </span>
        </div>

      </div>

      {/* Grid de Gargalos e Indicadores por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Desempenho por Departamento */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            Desempenho por Departamento
          </h3>

          <div className="space-y-3">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">
                    {dept.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-stone-500">TMT: <strong className="text-stone-800">{dept.avgMins}m</strong></span>
                    <span className="text-stone-400">|</span>
                    <span className="text-stone-500">Meta: <strong className="text-stone-800">{dept.slaTarget}m</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span>Ativos: <strong>{dept.inProgress}</strong></span>
                  <span>Concluídos: <strong>{dept.completed}</strong></span>
                  <span>Total: <strong>{dept.total}</strong></span>
                </div>

                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${dept.total > 0 ? (dept.completed / dept.total) * 100 : 0}%` }}
                    title={`${dept.completed} concluídos`}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${dept.total > 0 ? (dept.inProgress / dept.total) * 100 : 0}%` }}
                    title={`${dept.inProgress} em andamento`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Análise de Gargalos (Filas com mais chamados pendentes) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            Principais Gargalos de Operação (Filas Acumuladas)
          </h3>

          <div className="space-y-3">
            {slaMetrics.bottlenecks_by_column.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                Nenhum gargalo identificado no momento. Todas as filas sob controle.
              </div>
            ) : (
              slaMetrics.bottlenecks_by_column.map((b, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm block">
                      {b.column_title}
                    </span>
                    <span className="text-[11px] text-amber-900/80 font-medium block">
                      Departamento: {b.department}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-amber-700 font-serif-luxury">
                      {b.count}
                    </span>
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      aguardando
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 leading-relaxed">
            <strong className="text-stone-800">Dica Gerencial:</strong> Ordens de serviço que ultrapassam o SLA acionam alertas sonoros nos terminais operacionais e são destacadas em vermelho no painel de supervisão.
          </div>
        </div>

      </div>

    </div>
  );
};
