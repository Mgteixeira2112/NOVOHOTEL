import React from 'react';
import { AlertTriangle, ClipboardCheck, Sparkles, UserRoundCheck, Users } from 'lucide-react';
import { WorkspaceWidgetDefinition } from '../../workspace-engine/types';
import { KanbanV2Card } from '../../services/kanbanV2';
import { buildGovernancaWorkspaceAlerts, GovernancaStageFilter } from './governancaWorkspaceModel';

export const GovernancaAlertsWidget: React.FC<{
  widget: WorkspaceWidgetDefinition;
  cards: KanbanV2Card[];
  onStageFilter: (stage: GovernancaStageFilter) => void;
}> = ({ widget, cards, onStageFilter }) => {
  const alerts = buildGovernancaWorkspaceAlerts(cards);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs h-full">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-black text-slate-900">{widget.title || 'Alertas do setor'}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.map(alert => (
          <button
            key={alert.id}
            type="button"
            onClick={() => alert.stage && onStageFilter(alert.stage)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:bg-slate-100 transition-colors disabled:cursor-default"
            disabled={!alert.stage}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-800">{alert.label}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{alert.description}</p>
              </div>
              <span className={`min-w-8 h-8 px-2 rounded-xl grid place-items-center text-xs font-black ${alert.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{alert.count}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export const GovernancaQuickActionsWidget: React.FC<{
  widget: WorkspaceWidgetDefinition;
  onShowMine: () => void;
  onShowSector: () => void;
  onStageFilter: (stage: GovernancaStageFilter) => void;
}> = ({ widget, onShowMine, onShowSector, onStageFilter }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs h-full">
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-amber-500" />
      <h2 className="text-sm font-black text-slate-900">{widget.title || 'Ações rápidas'}</h2>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button onClick={onShowMine} className="rounded-2xl bg-slate-950 p-3 text-left text-white hover:bg-slate-800"><UserRoundCheck className="w-4 h-4 mb-2 text-amber-300" /><span className="block text-xs font-black">Meu trabalho</span><span className="block mt-1 text-[10px] text-slate-300">Somente tarefas atribuídas a mim</span></button>
      <button onClick={onShowSector} className="rounded-2xl bg-slate-100 p-3 text-left text-slate-800 hover:bg-slate-200"><Users className="w-4 h-4 mb-2" /><span className="block text-xs font-black">Meu setor</span><span className="block mt-1 text-[10px] text-slate-500">Toda a operação da Governança</span></button>
      <button onClick={() => onStageFilter('pending')} className="rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"><Sparkles className="w-4 h-4 mb-2 text-slate-500" /><span className="block text-xs font-black">A limpar</span><span className="block mt-1 text-[10px] text-slate-500">Focar quartos aguardando início</span></button>
      <button onClick={() => onStageFilter('inspection')} className="rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"><ClipboardCheck className="w-4 h-4 mb-2 text-slate-500" /><span className="block text-xs font-black">Inspeções</span><span className="block mt-1 text-[10px] text-slate-500">Focar quartos aguardando conferência</span></button>
    </div>
  </section>
);
