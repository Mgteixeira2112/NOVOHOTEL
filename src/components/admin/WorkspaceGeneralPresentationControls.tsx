import React from 'react';
import { getWorkspaceDeviceMode } from '../../workspace-engine/presentation';
import { WorkspaceDefinition, WorkspaceDevicePresentationMode, WorkspaceViewport } from '../../workspace-engine/types';

interface WorkspaceGeneralPresentationControlsProps {
  definition: WorkspaceDefinition;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

const fieldClass = 'mt-2 h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900';

export const WorkspaceGeneralPresentationControls: React.FC<WorkspaceGeneralPresentationControlsProps> = ({ definition, onChange }) => {
  const presentation = definition.presentation || {};
  const header = presentation.header || {};
  const kds = presentation.kds || {};
  const devices = presentation.devices || {};
  const desktopMode = getWorkspaceDeviceMode(definition, 'desktop');
  const mobileMode = getWorkspaceDeviceMode(definition, 'mobile');
  const kdsMode = getWorkspaceDeviceMode(definition, 'kds');

  const updateHeader = (patch: typeof header) => onChange({ presentation: { ...presentation, header: { ...header, ...patch } } });
  const updateKds = (patch: typeof kds) => onChange({ presentation: { ...presentation, kds: { ...kds, ...patch } } });
  const updateDeviceMode = (viewport: WorkspaceViewport, mode: WorkspaceDevicePresentationMode) => {
    const nextDevices = { ...devices, [viewport]: mode };
    onChange({ presentation: { ...presentation, devices: nextDevices, kds: viewport === 'kds' ? { ...kds, enabled: mode !== 'disabled' } : kds } });
  };

  return <div className="rounded-3xl border border-stone-200 bg-white p-5" data-workspace-general-presentation>
    <div><h3 className="text-sm font-black text-stone-900">Aparência do Workspace</h3><p className="mt-1 text-[10px] text-stone-500">A aparência padrão vale para todos os dispositivos. Personalizações por dispositivo só aparecem nos widgets quando o dispositivo estiver em Personalizar.</p></div>

    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">Apresentação por dispositivo</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-bold text-stone-600">Desktop<select value={desktopMode} onChange={e => updateDeviceMode('desktop', e.target.value as WorkspaceDevicePresentationMode)} className={fieldClass}><option value="auto">Automático</option><option value="custom">Personalizar</option></select></label>
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
