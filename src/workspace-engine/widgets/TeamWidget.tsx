import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { getOperationalSectorLabel, type OperationalSectorId } from '../../domain/operationalSectors';
import { fetchUserOperationalSectorsState } from '../../services/userSectorService';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

type Assignment = { userId: string; sectors: OperationalSectorId[] };

export const TeamWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const { users } = useHotel();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const sectors = workspace.sectors.length ? workspace.sectors : ['operacao'];

  useEffect(() => {
    let mounted = true;
    Promise.all(users.filter(user => user.ativo !== false).map(async user => {
      const state = await fetchUserOperationalSectorsState(user.id);
      return { userId: user.id, sectors: state.assignment.sectorIds };
    })).then(rows => { if (mounted) setAssignments(rows); });
    return () => { mounted = false; };
  }, [users]);

  const visibleUsers = useMemo(() => {
    const byUser = new Map(assignments.map(item => [item.userId, item.sectors]));
    return users.filter(user => {
      if (user.ativo === false) return false;
      const assigned = byUser.get(user.id) || [];
      return sectors.includes('operacao') || assigned.some(sector => sectors.includes(sector));
    });
  }, [assignments, sectors, users]);

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" data-team-widget-sector={sectors.join(',')}>
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700"><Users className="h-4 w-4" /></span>
      <div><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Equipe</p><h2 className="text-sm font-black text-slate-900">{widget.title || sectors.map(getOperationalSectorLabel).join(' · ')}</h2></div>
    </div>
    {visibleUsers.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleUsers.map(user => <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><strong className="block truncate text-[11px] text-slate-900">{user.nome}</strong><span className="block truncate text-[9px] text-slate-500">{user.cargo_titulo || user.tipo_usuario}</span></div>)}</div> : <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-[10px] text-slate-500">Nenhum integrante ativo vinculado a este setor.</div>}
  </div>;
};
