import React, { useMemo, useState } from 'react';
import { Plus, Play, Trash2 } from 'lucide-react';
import { WorkspaceWidgetDefinition } from '../../workspace-engine/types';
import { WORKSPACE_BOARD_OPTIONS } from '../../workspace-engine/workspaceFactory';

export type KanbanAutomationEvent = 'card_created';
export type KanbanAutomationAction = 'create_card';

export interface KanbanAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  event: KanbanAutomationEvent;
  condition: {
    field: string;
    operator: 'equals';
    value: string;
  };
  action: {
    type: KanbanAutomationAction;
    targetBoardId: string;
  };
}

interface KanbanWidgetAutomationSettings {
  version: 1;
  rules: KanbanAutomationRule[];
}

interface Props {
  widget: WorkspaceWidgetDefinition;
  onChange: (patch: Partial<WorkspaceWidgetDefinition>) => void;
}

const emptySettings: KanbanWidgetAutomationSettings = { version: 1, rules: [] };

const readSettings = (widget: WorkspaceWidgetDefinition): KanbanWidgetAutomationSettings => {
  const raw = widget.settings?.kanbanAutomation;
  if (!raw || typeof raw !== 'object') return emptySettings;
  const candidate = raw as Partial<KanbanWidgetAutomationSettings>;
  return {
    version: 1,
    rules: Array.isArray(candidate.rules) ? candidate.rules : [],
  };
};

const makeRule = (sourceBoardId?: string): KanbanAutomationRule => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: 'Nova automação',
  enabled: false,
  event: 'card_created',
  condition: { field: 'category', operator: 'equals', value: '' },
  action: {
    type: 'create_card',
    targetBoardId: WORKSPACE_BOARD_OPTIONS.find(board => board.id !== sourceBoardId)?.id || '',
  },
});

export const KanbanWidgetAutomationEditor: React.FC<Props> = ({ widget, onChange }) => {
  const settings = useMemo(() => readSettings(widget), [widget]);
  const [simulation, setSimulation] = useState<Record<string, string>>({});

  const commit = (rules: KanbanAutomationRule[]) => {
    onChange({
      settings: {
        ...(widget.settings || {}),
        kanbanAutomation: { version: 1, rules },
      },
    });
  };

  const updateRule = (ruleId: string, patch: Partial<KanbanAutomationRule>) => {
    commit(settings.rules.map(rule => rule.id === ruleId ? { ...rule, ...patch } : rule));
  };

  const updateCondition = (ruleId: string, patch: Partial<KanbanAutomationRule['condition']>) => {
    commit(settings.rules.map(rule => rule.id === ruleId ? { ...rule, condition: { ...rule.condition, ...patch } } : rule));
  };

  const updateAction = (ruleId: string, patch: Partial<KanbanAutomationRule['action']>) => {
    commit(settings.rules.map(rule => rule.id === ruleId ? { ...rule, action: { ...rule.action, ...patch } } : rule));
  };

  const simulate = (rule: KanbanAutomationRule) => {
    if (!rule.condition.value.trim()) {
      setSimulation(current => ({ ...current, [rule.id]: 'Informe um valor de condição para testar.' }));
      return;
    }
    if (!rule.action.targetBoardId) {
      setSimulation(current => ({ ...current, [rule.id]: 'Selecione um Kanban de destino.' }));
      return;
    }
    if (rule.action.targetBoardId === widget.boardId) {
      setSimulation(current => ({ ...current, [rule.id]: 'Bloqueado: origem e destino não podem ser o mesmo Kanban neste protótipo.' }));
      return;
    }
    const target = WORKSPACE_BOARD_OPTIONS.find(board => board.id === rule.action.targetBoardId)?.label || rule.action.targetBoardId;
    setSimulation(current => ({ ...current, [rule.id]: `Teste válido: ao criar um card com ${rule.condition.field} = ${rule.condition.value}, será criado um card em ${target}. Nenhuma alteração real foi executada.` }));
  };

  return <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-xs font-black text-stone-900">Automações deste Kanban</p>
        <p className="mt-1 text-[10px] leading-relaxed text-stone-600">A inteligência fica armazenada neste widget. Protótipo inicial: card criado → condição → criar card em outro Kanban.</p>
      </div>
      <button type="button" onClick={() => commit([...settings.rules, makeRule(widget.boardId)])} className="h-9 px-3 rounded-xl bg-stone-950 text-white text-[10px] font-black inline-flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Nova automação</button>
    </div>

    {settings.rules.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-white px-3 py-4 text-[10px] text-stone-500">Nenhuma automação configurada neste Kanban.</div> : <div className="mt-3 space-y-3">
      {settings.rules.map(rule => <div key={rule.id} className="rounded-2xl border border-stone-200 bg-white p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <input value={rule.name} onChange={e => updateRule(rule.id, { name: e.target.value })} className="h-9 flex-1 rounded-xl border border-stone-200 px-3 text-xs font-bold" />
          <button type="button" onClick={() => updateRule(rule.id, { enabled: !rule.enabled })} className={`h-9 px-3 rounded-xl text-[10px] font-black ${rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{rule.enabled ? 'Ativa' : 'Inativa'}</button>
          <button type="button" onClick={() => commit(settings.rules.filter(item => item.id !== rule.id))} className="h-9 w-9 grid place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700" title="Excluir automação"><Trash2 className="w-4 h-4" /></button>
        </div>

        <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-4 gap-2">
          <label className="text-[9px] font-black uppercase tracking-wide text-stone-500">Quando<select value={rule.event} disabled className="mt-1 h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs"><option value="card_created">Card criado</option></select></label>
          <label className="text-[9px] font-black uppercase tracking-wide text-stone-500">Campo<input value={rule.condition.field} onChange={e => updateCondition(rule.id, { field: e.target.value })} className="mt-1 h-9 w-full rounded-xl border border-stone-200 px-2 text-xs" placeholder="category" /></label>
          <label className="text-[9px] font-black uppercase tracking-wide text-stone-500">Igual a<input value={rule.condition.value} onChange={e => updateCondition(rule.id, { value: e.target.value })} className="mt-1 h-9 w-full rounded-xl border border-stone-200 px-2 text-xs" placeholder="manutencao" /></label>
          <label className="text-[9px] font-black uppercase tracking-wide text-stone-500">Criar card em<select value={rule.action.targetBoardId} onChange={e => updateAction(rule.id, { targetBoardId: e.target.value })} className="mt-1 h-9 w-full rounded-xl border border-stone-200 bg-white px-2 text-xs"><option value="">Selecione</option>{WORKSPACE_BOARD_OPTIONS.map(board => <option key={board.id} value={board.id} disabled={board.id === widget.boardId}>{board.label}{board.id === widget.boardId ? ' — origem' : ''}</option>)}</select></label>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <button type="button" onClick={() => simulate(rule)} className="h-9 px-3 rounded-xl border border-stone-200 bg-white text-[10px] font-black inline-flex items-center gap-2"><Play className="w-3.5 h-3.5" /> Testar regra</button>
          {simulation[rule.id] && <p className="text-[10px] leading-relaxed text-stone-600">{simulation[rule.id]}</p>}
        </div>
      </div>)}
    </div>}
  </div>;
};
