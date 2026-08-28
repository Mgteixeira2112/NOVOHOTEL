import React from 'react';
import { BedDouble, Eye, Settings2, ShieldCheck } from 'lucide-react';
import { WorkspaceWidgetDefinition } from '../../workspace-engine/types';
import {
  readRoomMapWidgetPresentation,
  ROOM_MAP_STATUS_OPTIONS,
  RoomMapStatusId,
  withRoomMapWidgetPresentation,
} from '../../workspace-engine/widgets/roomMapWidgetPresentation';

interface RoomMapWidgetEditorProps {
  widget: WorkspaceWidgetDefinition;
  onChange: (patch: Partial<WorkspaceWidgetDefinition>) => void;
}

const Toggle: React.FC<{ checked: boolean; label: string; description?: string; onChange: (checked: boolean) => void }> = ({ checked, label, description, onChange }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white p-3">
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300" />
    <span><strong className="block text-[11px] text-stone-800">{label}</strong>{description && <span className="mt-0.5 block text-[9px] leading-relaxed text-stone-500">{description}</span>}</span>
  </label>
);

export const RoomMapWidgetEditor: React.FC<RoomMapWidgetEditorProps> = ({ widget, onChange }) => {
  const presentation = readRoomMapWidgetPresentation(widget);
  const visibleStatusIds = presentation.visibleStatusIds;
  const isStatusVisible = (id: RoomMapStatusId) => !visibleStatusIds || visibleStatusIds.includes(id);

  const patchPresentation = (patch: Parameters<typeof withRoomMapWidgetPresentation>[1]) => {
    const next = withRoomMapWidgetPresentation(widget, patch);
    onChange({ settings: next.settings });
  };

  const toggleStatus = (id: RoomMapStatusId, checked: boolean) => {
    const current = visibleStatusIds || ROOM_MAP_STATUS_OPTIONS.map(option => option.id);
    const next = checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id);
    patchPresentation({ visibleStatusIds: next });
  };

  const setAction = (action: 'checkin' | 'checkout' | 'transferRoom' | 'editRoom' | 'deleteRoom', enabled: boolean) =>
    onChange({ actions: { ...(widget.actions || {}), [action]: enabled } });

  return <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><Settings2 className="h-4 w-4" /></span>
      <div><h4 className="text-xs font-black text-stone-900">Personalização do Widget Mapa de Quartos</h4><p className="mt-1 text-[10px] leading-relaxed text-stone-500">Defina o que este Workspace exibe e quais ações ficam disponíveis. A configuração não altera o cadastro dos quartos nem os fluxos do Supabase.</p></div>
    </div>

    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-blue-600" /><h5 className="text-[11px] font-black text-stone-800">Estados exibidos</h5></div>
        <p className="mt-1 text-[9px] text-stone-500">Desmarque os estados que não devem aparecer neste Workspace.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{ROOM_MAP_STATUS_OPTIONS.map(option => <Toggle key={option.id} checked={isStatusVisible(option.id)} label={option.label} onChange={checked => toggleStatus(option.id, checked)} />)}</div>
        <button type="button" onClick={() => patchPresentation({ visibleStatusIds: undefined })} className="mt-3 text-[9px] font-black text-blue-700 hover:underline">Exibir todos os estados</button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" /><h5 className="text-[11px] font-black text-stone-800">Informações nos cards</h5></div>
        <div className="mt-3 grid gap-2">
          <Toggle checked={presentation.showGuest} label="Hóspede" onChange={checked => patchPresentation({ showGuest: checked })} />
          <Toggle checked={presentation.showReservationDates} label="Período da reserva" onChange={checked => patchPresentation({ showReservationDates: checked })} />
          <Toggle checked={presentation.showRoomType} label="Tipo / categoria do quarto" onChange={checked => patchPresentation({ showRoomType: checked })} />
          <Toggle checked={presentation.showFloor} label="Andar" onChange={checked => patchPresentation({ showFloor: checked })} />
          <Toggle checked={presentation.showStatus} label="Status operacional" onChange={checked => patchPresentation({ showStatus: checked })} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><h5 className="text-[11px] font-black text-stone-800">Ações operacionais</h5></div>
        <div className="mt-3 grid gap-2">
          <Toggle checked={widget.actions?.checkin === true} label="Check-in" onChange={checked => setAction('checkin', checked)} />
          <Toggle checked={widget.actions?.checkout === true} label="Check-out" onChange={checked => setAction('checkout', checked)} />
          <Toggle checked={widget.actions?.transferRoom === true} label="Troca de quarto" onChange={checked => setAction('transferRoom', checked)} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-600" /><h5 className="text-[11px] font-black text-stone-800">Ações administrativas</h5></div>
        <p className="mt-1 text-[9px] text-stone-500">Ficam desligadas por padrão em novos Mapas de Quartos.</p>
        <div className="mt-3 grid gap-2">
          <Toggle checked={widget.actions?.editRoom === true} label="Editar cadastro do quarto" onChange={checked => setAction('editRoom', checked)} />
          <Toggle checked={widget.actions?.deleteRoom === true} label="Excluir quarto" description="Exclusão definitiva permanece com dupla confirmação." onChange={checked => setAction('deleteRoom', checked)} />
        </div>
      </section>
    </div>
  </div>;
};
