import React from 'react';
import { AlertTriangle, BedDouble, CalendarDays, LogIn, LogOut } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { WorkspaceWidgetDefinition } from './types';
import { WorkspaceShortcutSize } from './visualPresentation';
import {
  selectReceptionReservationItems,
  selectReceptionRoomAlerts,
  selectReceptionSummary,
} from './widgets/receptionPresentationSelectors';

interface WorkspaceShortcutSummaryProps {
  widget: WorkspaceWidgetDefinition;
  size: WorkspaceShortcutSize;
}

const density: Record<WorkspaceShortcutSize, { secondary: boolean; details: boolean }> = {
  s: { secondary: false, details: false },
  m: { secondary: true, details: false },
  l: { secondary: true, details: true },
  xl: { secondary: true, details: true },
};

const SummaryShell: React.FC<{
  title: string;
  value: number;
  subtitle: string;
  Icon: typeof CalendarDays;
  children?: React.ReactNode;
}> = ({ title, value, subtitle, Icon, children }) => <div className="min-h-0">
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0">
      <div className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 flex-none text-amber-600" /><strong className="block truncate text-[10px] text-stone-900">{title}</strong></div>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-stone-400">{subtitle}</p>
    </div>
    <strong className="text-xl font-black leading-none text-stone-950">{value}</strong>
  </div>
  {children}
</div>;

export const WorkspaceShortcutSummary: React.FC<WorkspaceShortcutSummaryProps> = ({ widget, size }) => {
  const { reservations, rooms } = useHotel();
  const level = density[size];

  if (widget.type === 'metrics') {
    const summary = selectReceptionSummary(rooms, reservations);
    return <SummaryShell title={widget.title || 'Resumo operacional'} value={summary.available} subtitle="quartos disponíveis" Icon={BedDouble}>
      {level.secondary && <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-bold text-stone-500"><span>{summary.totalRooms} quartos</span><span>·</span><span>{summary.occupied} hospedados</span></div>}
    </SummaryShell>;
  }

  if (widget.type === 'arrivals' || widget.type === 'departures') {
    const mode = widget.type === 'arrivals' ? 'arrivals' : 'departures';
    const items = selectReceptionReservationItems(reservations, mode);
    const Icon = mode === 'arrivals' ? LogIn : LogOut;
    return <SummaryShell title={widget.title || (mode === 'arrivals' ? 'Chegadas' : 'Saídas')} value={items.length} subtitle="hoje" Icon={Icon}>
      {level.details && <div className="mt-2 space-y-1 overflow-hidden">
        {items.slice(0, size === 'xl' ? 4 : 2).map(item => <div key={item.id} className="truncate rounded-md bg-stone-50 px-2 py-1 text-[8px] font-bold text-stone-600">{item.codigo || item.id}</div>)}
        {items.length === 0 && <span className="text-[8px] text-stone-400">Nenhum registro previsto.</span>}
      </div>}
    </SummaryShell>;
  }

  if (widget.type === 'alerts') {
    const alerts = selectReceptionRoomAlerts(rooms);
    return <SummaryShell title={widget.title || 'Alertas'} value={alerts.length} subtitle="quartos exigem atenção" Icon={AlertTriangle}>
      {level.details && <div className="mt-2 flex flex-wrap gap-1">
        {alerts.slice(0, size === 'xl' ? 6 : 3).map(({ room }) => <span key={room.id} className="rounded-md bg-rose-50 px-1.5 py-1 text-[8px] font-black text-rose-700">Q. {room.numero}</span>)}
      </div>}
    </SummaryShell>;
  }

  return <div className="min-h-0">
    <strong className="block truncate text-[10px] text-stone-900">{widget.title || widget.type}</strong>
    <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-stone-400">Atalho para widget completo</p>
    {level.secondary && <p className="mt-2 text-[8px] leading-relaxed text-stone-500">A apresentação resumida deste widget será conectada sem duplicar sua lógica de negócio.</p>}
  </div>;
};
