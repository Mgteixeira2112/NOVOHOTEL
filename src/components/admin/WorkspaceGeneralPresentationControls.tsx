import React from 'react';
import { getWorkspaceDeviceMode } from '../../workspace-engine/presentation';
import { WORKSPACE_BACKGROUND_PRESETS } from '../../workspace-engine/workspaceVisualPresets';
import {
  WorkspaceBackgroundFit,
  WorkspaceBackgroundPresetId,
  WorkspaceDefinition,
  WorkspaceDevicePresentationMode,
  WorkspaceSidebarItemSize,
  WorkspaceSidebarVisualStyle,
  WorkspaceViewport,
} from '../../workspace-engine/types';

interface WorkspaceGeneralPresentationControlsProps {
  definition: WorkspaceDefinition;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

const fieldClass = 'mt-2 h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900';

export const WorkspaceGeneralPresentationControls: React.FC<WorkspaceGeneralPresentationControlsProps> = ({ definition, onChange }) => {
  const presentation = definition.presentation || {};
  const header = presentation.header || {};
  const surface = presentation.surface || {};
  const sidebar = presentation.sidebar || {};
  const kds = presentation.kds || {};
  const devices = presentation.devices || {};
  const desktopMode = getWorkspaceDeviceMode(definition, 'desktop');
  const tabletMode = getWorkspaceDeviceMode(definition, 'tablet');
  const mobileMode = getWorkspaceDeviceMode(definition, 'mobile');
  const kdsMode = getWorkspaceDeviceMode(definition, 'kds');

  const updateHeader = (patch: typeof header) => onChange({ presentation: { ...presentation, header: { ...header, ...patch } } });
  const updateSurface = (patch: typeof surface) => onChange({ presentation: { ...presentation, surface: { ...surface, ...patch } } });
  const updateSidebar = (patch: typeof sidebar) => onChange({ presentation: { ...presentation, sidebar: { ...sidebar, ...patch } } });
  const updateKds = (patch: typeof kds) => onChange({ presentation: { ...presentation, kds: { ...kds, ...patch } } });
  const updateDeviceMode = (viewport: WorkspaceViewport, mode: WorkspaceDevicePresentationMode) => {
    const nextDevices = { ...devices, [viewport]: mode };
    onChange({ presentation: { ...presentation, devices: nextDevices, kds: viewport === 'kds' ? { ...kds, enabled: mode !== 'disabled' } : kds } });
  };

  return <div className="rounded-3xl border border-stone-200 bg-white p-5" data-workspace-general-presentation>
    <div><h3 className="text-sm font-black text-stone-900">Aparência do Workspace</h3><p className="mt-1 text-[10px] text-stone-500">Escolha a superfície visual e a estratégia de cada tela. A composição Desktop é editada diretamente em Visualizar Workspace.</p></div>

    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/30 p-4" data-workspace-surface-controls>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Superfície visual</p><p className="mt-1 text-[10px] text-stone-500">Fundos pré-carregados servem como base para posicionar widgets e menus no editor visual.</p></div><span className="text-[9px] font-bold text-stone-400">Visual 3.0</span></div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-stone-600">Fundo<select value={surface.backgroundPreset || 'none'} onChange={e => updateSurface({ backgroundPreset: e.target.value as WorkspaceBackgroundPresetId })} className={fieldClass}>{WORKSPACE_BACKGROUND_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
        <label className="text-xs font-bold text-stone-600">Encaixe<select value={surface.backgroundFit || 'cover'} onChange={e => updateSurface({ backgroundFit: e.target.value as WorkspaceBackgroundFit })} className={fieldClass}><option value="cover">Cobrir área</option><option value="contain">Exibir inteira</option></select></label>
        <label className="text-xs font-bold text-stone-600">Posição<select value={surface.backgroundPosition || 'center'} onChange={e => updateSurface({ backgroundPosition: e.target.value as 'center' | 'top' | 'bottom' })} className={fieldClass}><option value="center">Centro</option><option value="top">Topo</option><option value="bottom">Base</option></select></label>
        <label className="text-xs font-bold text-stone-600">Altura mínima<input type="number" min={480} max={2200} step={40} value={surface.minHeight || 760} onChange={e => updateSurface({ minHeight: Math.max(480, Number(e.target.value) || 760) })} className={fieldClass} /></label>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{WORKSPACE_BACKGROUND_PRESETS.map(preset => <button key={preset.id} type="button" onClick={() => updateSurface({ backgroundPreset: preset.id })} className={`rounded-xl border p-2 text-left transition ${(surface.backgroundPreset || 'none') === preset.id ? 'border-amber-400 bg-white shadow-sm' : 'border-stone-200 bg-white/60 hover:border-amber-300'}`} aria-pressed={(surface.backgroundPreset || 'none') === preset.id}><span className="block h-12 rounded-lg border border-black/5" style={{ backgroundColor: preset.backgroundColor, backgroundImage: preset.backgroundImage, backgroundSize: 'cover' }} /><strong className="mt-2 block text-[10px] text-stone-800">{preset.label}</strong><span className="mt-0.5 block text-[9px] leading-relaxed text-stone-500">{preset.description}</span></button>)}</div>
    </div>

    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/30 p-4" data-workspace-sidebar-controls>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[9px] font-black uppercase tracking-wider text-sky-700">Menu lateral Desktop</p><p className="mt-1 text-[10px] text-stone-500">Agrupa os widgets configurados como botão em um menu sobre a superfície. Desativado, o fluxo Desktop atual permanece igual.</p></div>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-700"><input type="checkbox" checked={sidebar.enabled === true} onChange={e => updateSidebar({ enabled: e.target.checked })} /> Ativar menu</label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-bold text-stone-600">Posição X (%)<input type="number" min={0} max={100} step={1} disabled={sidebar.enabled !== true} value={sidebar.x ?? 2} onChange={e => updateSidebar({ x: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className={fieldClass} /></label>
        <label className="text-xs font-bold text-stone-600">Posição Y (px)<input type="number" min={0} max={2200} step={10} disabled={sidebar.enabled !== true} value={sidebar.y ?? 110} onChange={e => updateSidebar({ y: Math.max(0, Number(e.target.value) || 0) })} className={fieldClass} /></label>
        <label className="text-xs font-bold text-stone-600">Largura (px)<input type="number" min={160} max={480} step={10} disabled={sidebar.enabled !== true} value={sidebar.width ?? 240} onChange={e => updateSidebar({ width: Math.min(480, Math.max(160, Number(e.target.value) || 240)) })} className={fieldClass} /></label>
        <label className="text-xs font-bold text-stone-600">Tamanho dos atalhos<select disabled={sidebar.enabled !== true} value={sidebar.itemSize || 'normal'} onChange={e => updateSidebar({ itemSize: e.target.value as WorkspaceSidebarItemSize })} className={fieldClass}><option value="compact">Compacto</option><option value="normal">Normal</option><option value="large">Ampliado</option></select></label>
        <label className="text-xs font-bold text-stone-600">Visual<select disabled={sidebar.enabled !== true} value={sidebar.visual || 'glass'} onChange={e => updateSidebar({ visual: e.target.value as WorkspaceSidebarVisualStyle })} className={fieldClass}><option value="solid">Sólido</option><option value="glass">Vidro</option><option value="transparent">Transparente</option></select></label>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Apresentação por dispositivo</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-stone-600">Desktop<select value={desktopMode} onChange={e => updateDeviceMode('desktop', e.target.value as WorkspaceDevicePresentationMode)} className={fieldClass}><option value="auto">Automático</option><option value="custom">Personalizar no preview</option></select></label>
        <label className="text-xs font-bold text-stone-600">Tablet<select value={tabletMode} onChange={e => updateDeviceMode('tablet', e.target.value as WorkspaceDevicePresentationMode)} className={fieldClass}><option value="auto">Herdar Desktop</option><option value="custom">Personalizar</option></select></label>
        <label className="text-xs font-bold text-stone-600">Celular<select value={mobileMode} onChange={e => updateDeviceMode('mobile', e.target.value as WorkspaceDevicePresentationMode)} className={fieldClass}><option value="auto">Adaptar automaticamente</option><option value="custom">Personalizar</option></select></label>
        <label className="text-xs font-bold text-stone-600">KDS / TV<select value={kdsMode} onChange={e => updateDeviceMode('kds', e.target.value as WorkspaceDevicePresentationMode)} className={fieldClass}><option value="disabled">Desativado</option><option value="auto">Adaptar automaticamente</option><option value="custom">Personalizar</option></select></label>
      </div>
    </div>

    <div className="mt-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Cabeçalho do Workspace</p>
      <div className="mt-3 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <label className="text-xs font-bold text-stone-600">Fuso horário<input value={header.timezone || 'America/Sao_Paulo'} onChange={e => updateHeader({ timezone: e.target.value })} className={fieldClass} /></label>
        <label className="text-xs font-bold text-stone-600">Formato da hora<select value={header.hourFormat || '24h'} onChange={e => updateHeader({ hourFormat: e.target.value as '24h' | '12h' })} className={fieldClass}><option value="24h">24 horas</option><option value="12h">12 horas</option></select></label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showHotel !== false} onChange={e => updateHeader({ showHotel: e.target.checked })} /> Nome do hotel</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showWorkspace !== false} onChange={e => updateHeader({ showWorkspace: e.target.checked })} /> Nome do Workspace</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showDate !== false} onChange={e => updateHeader({ showDate: e.target.checked })} /> Data</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showTime !== false} onChange={e => updateHeader({ showTime: e.target.checked })} /> Hora</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showUser !== false} onChange={e => updateHeader({ showUser: e.target.checked })} /> Usuário</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showStatus !== false} onChange={e => updateHeader({ showStatus: e.target.checked })} /> Status operacional</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={header.showOperationalDate === true} onChange={e => updateHeader({ showOperationalDate: e.target.checked })} /> Data operacional</label>
      </div>
    </div>

    {kdsMode !== 'disabled' && <div className="mt-5 border-t border-stone-200 pt-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Tela KDS / TV</p>
      <div className="mt-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-stone-600">Orientação<select value={kds.orientation || 'landscape'} onChange={e => updateKds({ orientation: e.target.value as 'landscape' | 'portrait' })} className={fieldClass}><option value="landscape">Horizontal</option><option value="portrait">Vertical</option></select></label>
        <label className="text-xs font-bold text-stone-600">Densidade<select value={kds.density || 'normal'} onChange={e => updateKds({ density: e.target.value as 'compact' | 'normal' | 'large' })} className={fieldClass}><option value="compact">Compacta</option><option value="normal">Normal</option><option value="large">Ampliada</option></select></label>
        <label className="text-xs font-bold text-stone-600">Distância de visualização<select value={kds.viewingDistance || 'medium'} onChange={e => updateKds({ viewingDistance: e.target.value as 'near' | 'medium' | 'far' })} className={fieldClass}><option value="near">Próxima</option><option value="medium">Média</option><option value="far">Longa</option></select></label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={kds.fullscreen === true} onChange={e => updateKds({ fullscreen: e.target.checked })} /> Tela cheia</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={kds.realtime !== false} onChange={e => updateKds({ realtime: e.target.checked })} /> Atualização em tempo real</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={kds.hideAdministrativeControls !== false} onChange={e => updateKds({ hideAdministrativeControls: e.target.checked })} /> Ocultar menus administrativos</label>
        <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={kds.hideEditingControls !== false} onChange={e => updateKds({ hideEditingControls: e.target.checked })} /> Ocultar controles de edição</label>
      </div>
    </div>}
  </div>;
};