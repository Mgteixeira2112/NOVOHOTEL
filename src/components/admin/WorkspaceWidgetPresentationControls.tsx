import React from 'react';
import { getWidgetKdsSuitability } from '../../workspace-engine/widgetCatalog';
import { normalizeWidgetPresentation } from '../../workspace-engine/presentation';
import {
  WorkspaceDevicePresentationMode,
  WorkspaceWidgetDefinition,
  WorkspaceWidgetDevicePresentation,
  WorkspaceWidgetDisplay,
  WorkspaceWidgetDisplayMode,
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

export const WorkspaceWidgetPresentationControls: React.FC<WorkspaceWidgetPresentationControlsProps> = ({ widget, defaultSpan, mobileMode, kdsMode, onChange }) => {
  const presentation = normalizeWidgetPresentation(widget, defaultSpan);
  const mobile: WorkspaceWidgetDevicePresentation = presentation.mobile?.mode === 'auto' ? {} : (presentation.mobile || {});
  const kds: WorkspaceWidgetDevicePresentation = presentation.kds?.mode === 'auto' ? {} : (presentation.kds || {});
  const kdsSuitability = getWidgetKdsSuitability(widget.type);
  const hasDeviceCustomizations = mobileMode === 'custom' || kdsMode === 'custom';

  const updateDevice = (device: 'tablet' | 'mobile' | 'kds', patch: Partial<WorkspaceWidgetDevicePresentation>) => {
    const current = presentation[device] || {};
    const base: WorkspaceWidgetDevicePresentation = current.mode === 'auto' ? {} : current;
    onChange({ presentation: { ...presentation, [device]: { ...base, mode: 'custom', ...patch } } });
  };

  return <div className="space-y-3 border-t border-stone-100 pt-4" data-widget-presentation-controls>
    <div>
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Configuração comum</p>
      <p className="mt-1 text-[9px] text-stone-400">Base visual compartilhada pelas estratégias. Overrides específicos continuam separados por dispositivo.</p>
      <div className="mt-2 grid sm:grid-cols-2 gap-3">
        <label className={labelClass}>EXIBIÇÃO<select value={presentation.desktop?.displayMode || (presentation.display === 'button' ? 'button' : 'full')} onChange={e => onChange({ presentation: { ...presentation, desktop: { ...(presentation.desktop || {}), displayMode: e.target.value as WorkspaceWidgetDisplayMode } } })} className={selectClass}><option value="full">Completo</option><option value="summary">Resumo</option><option value="shortcut">Atalho</option><option value="button">Botão</option><option value="hidden">Oculto</option></select></label>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(['tablet', 'mobile', 'kds'] as const).map(device => <label key={device} className={labelClass}>{device === 'kds' ? 'KDS / TV' : device.toUpperCase()}<select value={presentation[device]?.displayMode || 'full'} onChange={e => updateDevice(device, { displayMode: e.target.value as WorkspaceWidgetDisplayMode, hidden: e.target.value === 'hidden' })} className={selectClass}><option value="full">Completo</option><option value="summary">Resumo</option><option value="shortcut">Atalho</option><option value="button">Botão</option><option value="hidden">Oculto</option></select></label>)}
      </div>
    </div>

    {false && hasDeviceCustomizations && <div>
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Personalizações por dispositivo</p>
      <div className="mt-2 grid xl:grid-cols-2 gap-3">
        {mobileMode === 'custom' && <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3" data-widget-mobile-customization>
          <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">CELULAR</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className={labelClass}>Exibição<select value={mobile.display || presentation.display || 'panel'} onChange={e => updateDevice('mobile', { display: e.target.value as WorkspaceWidgetDevicePresentation['display'] })} className={selectClass}><option value="panel">Painel</option><option value="summary">Resumo</option><option value="button">Botão / popup</option></select></label>
            <label className={labelClass}>Ordem<input type="number" value={mobile.order ?? widget.order ?? 0} onChange={e => updateDevice('mobile', { order: Number(e.target.value) })} className={selectClass} /></label>
            <label className={labelClass}>Altura<select value={mobile.height || presentation.height || 'auto'} onChange={e => updateDevice('mobile', { height: e.target.value as WorkspaceWidgetHeight })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={labelClass}>Visual<select value={mobile.visual || presentation.visual || 'standard'} onChange={e => updateDevice('mobile', { visual: e.target.value as WorkspaceWidgetVisualStyle })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-stone-600"><input type="checkbox" checked={mobile.hidden === true} onChange={e => updateDevice('mobile', { hidden: e.target.checked })} /> Ocultar no celular</label>
          </div>
        </div>}

        {kdsMode === 'custom' && <div className="rounded-2xl border border-stone-200 bg-slate-50 p-3" data-widget-kds-customization>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">KDS / TV</p>
          {kdsSuitability.suitability !== 'supported' && <p className={`mt-2 rounded-xl border px-2 py-1.5 text-[9px] font-bold ${kdsSuitability.suitability === 'unsupported' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{kdsSuitability.suitability === 'unsupported' ? 'Incompatível no KDS: ' : 'Atenção no KDS: '}{kdsSuitability.reason}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className={labelClass}>Largura<select value={kds.width || presentation.width || 'full'} onChange={e => updateDevice('kds', { width: e.target.value as WorkspaceWidgetWidth })} className={selectClass}>{widthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={labelClass}>Ordem<input type="number" value={kds.order ?? widget.order ?? 0} onChange={e => updateDevice('kds', { order: Number(e.target.value) })} className={selectClass} /></label>
            <label className={labelClass}>Altura<select value={kds.height || presentation.height || 'auto'} onChange={e => updateDevice('kds', { height: e.target.value as WorkspaceWidgetHeight })} className={selectClass}>{heightOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={labelClass}>Visual<select value={kds.visual || (kds.display === 'highlight' ? 'highlight' : presentation.visual || 'standard')} onChange={e => updateDevice('kds', { visual: e.target.value as WorkspaceWidgetVisualStyle, display: 'panel' })} className={selectClass}>{visualOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-stone-600"><input type="checkbox" checked={kds.hidden === true} onChange={e => updateDevice('kds', { hidden: e.target.checked })} /> Ocultar no KDS</label>
          </div>
        </div>}
      </div>
    </div>}
  </div>;
};
