import React from 'react';
import { getWidgetKdsSuitability } from '../../workspace-engine/widgetCatalog';
import { normalizeWidgetPresentation } from '../../workspace-engine/presentation';
import {
  WorkspaceDevicePresentationMode,
  WorkspaceWidgetDefinition,
  WorkspaceWidgetDisplay,
  WorkspaceWidgetHeaderStyle,
  WorkspaceWidgetHeight,
  WorkspaceWidgetSpan,
  WorkspaceWidgetVisualStyle,
  WorkspaceWidgetWidth,
} from '../../workspace-engine/types';

interface WorkspaceWidgetPresentationControlsProps {
  widget: WorkspaceWidgetDefinition;
  defaultSpan?: WorkspaceWidgetSpan;
  desktopMode: WorkspaceDevicePresentationMode;
  mobileMode: WorkspaceDevicePresentationMode;
  kdsMode: WorkspaceDevicePresentationMode;
  onChange: (patch: Partial<WorkspaceWidgetDefinition>) => void;
}

const widthOptions: Array<{ value: WorkspaceWidgetWidth; label: string }> = [
  { value: 'small', label: 'Pequena' },
  { value: 'medium', label: 'Média' },
  { value: 'large', label: 'Grande' },
  { value: 'full', label: 'Total' },
];

const heightOptions: Array<{ value: WorkspaceWidgetHeight; label: string }> = [
  { value: 'auto', label: 'Automática' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const visualOptions: Array<{ value: WorkspaceWidgetVisualStyle; label: string }> = [
  { value: 'minimal', label: 'Minimalista' },
  { value: 'standard', label: 'Padrão' },
  { value: 'highlight', label: 'Destaque' },
];

const headerOptions: Array<{ value: WorkspaceWidgetHeaderStyle; label: string }> = [
  { value: 'full', label: 'Completo' },
  { value: 'compact', label: 'Compacto' },
  { value: 'hidden', label: 'Oculto' },
];

const selectClass = 'mt-1 h-9 w-full rounded-xl border border-stone-200 bg-white px-2 text-xs';
const labelClass = 'text-[10px] font-bold text-stone-600';

export const WorkspaceWidgetPresentationControls: React.FC<WorkspaceWidgetPresentationControlsProps> = ({ widget, defaultSpan, desktopMode, mobileMode, kdsMode, onChange }) => {
  const presentation = normalizeWidgetPresentation(widget, defaultSpan);
  const desktop = presentation.desktop || {};
  const mobile = presentation.mobile || {};
  const kds = presentation.kds || {};
  const kdsSuitability = getWidgetKdsSuitability(widget.type);

  const updateBase = (patch: Partial<typeof presentation>) => onChange({ presentation: { ...presentation, ...patch } });
  const updateDevice = (device: 'desktop' | 'mobile' | 'kds', patch: Record<string, unknown>) => onChange({ presentation: { ...presentation, [device]: { ...(presentation[device] || {}), ...patch } } });

  return <div className="space-y-3 border-t border-stone-100 pt-4" data-widget-presentation-controls>
    <div>
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Apresentação geral</p>
      <div className="mt-2 grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <label className={labelClass}>EXIBIÇÃO<select value={presentation.display || 'panel'} onChange={e => updateBase({ display: e.target.value as WorkspaceWidgetDisplay })} className={selectClass}><option value="panel">Painel</option><option value="button">Botão / popup</option></select></label>
        <label className={labelClass}>LARGURA<select value={presentation.width || 'full'} onChange={e => updateBase({ width: e.target.value as WorkspaceWidgetWidth })} className={selectClass}>{widthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className={labelClass}>ALTURA<select value={presentation.height || 'auto'} onChange={e => updateBase({ height: e.target.value as WorkspaceWidgetHeight })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className={labelClass}>VISUAL<select value={presentation.visual || 'standard'} onChange={e => updateBase({ visual: e.target.value as WorkspaceWidgetVisualStyle })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className={labelClass}>CABEÇALHO<select value={presentation.header || 'full'} onChange={e => updateBase({ header: e.target.value as WorkspaceWidgetHeaderStyle })} className={selectClass}>{headerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </div>
    </div>

    <div className="grid xl:grid-cols-3 gap-3">
      <div className={`rounded-2xl border border-stone-200 bg-white p-3 ${desktopMode !== 'custom' ? 'opacity-70' : ''}`}>
        <div className="flex items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-wider text-stone-500">DESKTOP</p><span className="text-[8px] font-bold text-stone-400">Workspace: {desktopMode === 'custom' ? 'personalizar' : 'automático'}</span></div>
        <label className={`${labelClass} mt-2 block`}>Estratégia<select value={desktop.mode || 'auto'} onChange={e => updateDevice('desktop', { mode: e.target.value })} className={selectClass}><option value="auto">Automático</option><option value="custom">Personalizar</option></select></label>
        {desktop.mode === 'custom' && <div className="mt-2 grid grid-cols-2 gap-2">
          <label className={labelClass}>Exibição<select value={desktop.display === 'button' ? 'button' : 'panel'} onChange={e => updateDevice('desktop', { display: e.target.value })} className={selectClass}><option value="panel">Painel</option><option value="button">Botão / popup</option></select></label>
          <label className={labelClass}>Largura<select value={desktop.width || presentation.width || 'full'} onChange={e => updateDevice('desktop', { width: e.target.value })} className={selectClass}>{widthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={labelClass}>Altura<select value={desktop.height || presentation.height || 'auto'} onChange={e => updateDevice('desktop', { height: e.target.value })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={labelClass}>Visual<select value={desktop.visual || presentation.visual || 'standard'} onChange={e => updateDevice('desktop', { visual: e.target.value })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>}
      </div>

      <div className={`rounded-2xl border border-stone-200 bg-stone-50 p-3 ${mobileMode !== 'custom' ? 'opacity-70' : ''}`}>
        <div className="flex items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-wider text-stone-500">MOBILE</p><span className="text-[8px] font-bold text-stone-400">Workspace: {mobileMode === 'custom' ? 'personalizar' : 'adaptar'}</span></div>
        <label className={`${labelClass} mt-2 block`}>Estratégia<select value={mobile.mode || 'auto'} onChange={e => updateDevice('mobile', { mode: e.target.value })} className={selectClass}><option value="auto">Adaptar automaticamente</option><option value="custom">Personalizar</option></select></label>
        {mobile.mode === 'custom' && <div className="mt-2 grid grid-cols-2 gap-2">
          <label className={labelClass}>Exibição<select value={mobile.display || 'panel'} onChange={e => updateDevice('mobile', { display: e.target.value })} className={selectClass}><option value="panel">Painel</option><option value="summary">Resumo</option><option value="button">Botão / popup</option></select></label>
          <label className={labelClass}>Ordem<input type="number" value={mobile.order ?? widget.order ?? 0} onChange={e => updateDevice('mobile', { order: Number(e.target.value) })} className={selectClass} /></label>
          <label className={labelClass}>Altura<select value={mobile.height || presentation.height || 'auto'} onChange={e => updateDevice('mobile', { height: e.target.value })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={labelClass}>Visual<select value={mobile.visual || presentation.visual || 'standard'} onChange={e => updateDevice('mobile', { visual: e.target.value })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-stone-600"><input type="checkbox" checked={mobile.hidden === true} onChange={e => updateDevice('mobile', { hidden: e.target.checked })} /> Ocultar no celular</label>
        </div>}
      </div>

      <div className={`rounded-2xl border border-stone-200 bg-slate-50 p-3 ${kdsMode !== 'custom' ? 'opacity-70' : ''}`}>
        <div className="flex items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">KDS / TV</p><span className="text-[8px] font-bold text-slate-400">Workspace: {kdsMode}</span></div>
        {kdsSuitability.suitability !== 'supported' && <p className={`mt-2 rounded-xl border px-2 py-1.5 text-[9px] font-bold ${kdsSuitability.suitability === 'unsupported' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{kdsSuitability.suitability === 'unsupported' ? 'Incompatível no KDS automático: ' : 'Atenção no KDS: '}{kdsSuitability.reason}</p>}
        <label className={`${labelClass} mt-2 block`}>Estratégia<select value={kds.mode || 'auto'} onChange={e => updateDevice('kds', { mode: e.target.value })} className={selectClass}><option value="auto">Adaptar automaticamente</option><option value="custom">Personalizar</option></select></label>
        {kds.mode === 'custom' && <div className="mt-2 grid grid-cols-2 gap-2">
          <label className={labelClass}>Largura<select value={kds.width || presentation.width || 'full'} onChange={e => updateDevice('kds', { width: e.target.value })} className={selectClass}>{widthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={labelClass}>Ordem<input type="number" value={kds.order ?? widget.order ?? 0} onChange={e => updateDevice('kds', { order: Number(e.target.value) })} className={selectClass} /></label>
          <label className={labelClass}>Altura<select value={kds.height || presentation.height || 'auto'} onChange={e => updateDevice('kds', { height: e.target.value })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={labelClass}>Visual<select value={kds.visual || (kds.display === 'highlight' ? 'highlight' : presentation.visual || 'standard')} onChange={e => updateDevice('kds', { visual: e.target.value, display: 'panel' })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-stone-600"><input type="checkbox" checked={kds.hidden === true} onChange={e => updateDevice('kds', { hidden: e.target.checked })} /> Ocultar no KDS</label>
        </div>}
      </div>
    </div>
  </div>;
};
