import React, { useEffect, useMemo, useState } from 'react';
import { UserRound, UsersRound } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { getOperationalSectorLabel, type OperationalSectorId } from '../../domain/operationalSectors';
import { fetchUserOperationalSectorsState } from '../../services/userSectorService';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

type UserSectorState = {
  sectorIds: OperationalSectorId[];
  principalSectorId: OperationalSectorId | null;
};

export const TeamWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const { users } = useHotel();
  const activeUsers = useMemo(
    () => users.filter(user => user.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [users],
  );
  const sectors = workspace.sectors.length ? workspace.sectors : ['operacao'];
  const [directory, setDirectory] = useState<Record<string, UserSectorState>>({});
  const [directoryAvailable, setDirectoryAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (activeUsers.length === 0) {
      setDirectory({});
      setDirectoryAvailable(false);
      setLoading(false);
      return () => { cancelled = true; };
    }

    void Promise.all(activeUsers.map(async user => ({
      userId: user.id,
      state: await fetchUserOperationalSectorsState(user.id),
    }))).then(results => {
      if (cancelled) return;
      const next: Record<string, UserSectorState> = {};
      let available = false;
      results.forEach(({ userId, state }) => {
        if (!state.available) return;
        available = true;
        next[userId] = {
          sectorIds: state.assignment.sectorIds,
          principalSectorId: state.assignment.principalSectorId,
        };
      });
      setDirectory(next);
      setDirectoryAvailable(available);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeUsers]);

  const visibleUsers = useMemo(() => {
    if (!directoryAvailable) return activeUsers;
    return activeUsers.filter(user => directory[user.id]?.sectorIds.some(sector => sectors.includes(sector)));
  }, [activeUsers, directory, directoryAvailable, sectors]);

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" data-team-widget data-team-sectors={sectors.join(',')}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Equipe</p>
        <h2 className="mt-1 text-sm font-black text-slate-900">{widget.title || 'Equipe do setor'}</h2>
        <p className="mt-1 text-[10px] text-slate-500">{sectors.map(getOperationalSectorLabel).join(' · ')}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600"><UsersRound className="h-3.5 w-3.5" />{visibleUsers.length}</span>
    </div>

    {loading ? <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-[10px] text-slate-500">Carregando equipe…</div>
      : visibleUsers.length === 0 ? <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-[10px] text-slate-500">Nenhum usuário ativo vinculado a este setor.</div>
        : <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visibleUsers.map(user => {
              const assignment = directory[user.id];
              const principal = assignment?.principalSectorId;
              return <div key={user.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3" data-team-user={user.id}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><UserRound className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[11px] text-slate-900">{user.nome}</strong>
                  <span className="block truncate text-[9px] text-slate-500">{user.tipo_usuario || 'Usuário'}</span>
                  {principal && <span className="mt-1 block truncate text-[9px] font-bold text-amber-700">{getOperationalSectorLabel(principal)}</span>}
                </div>
              </div>;
            })}
          </div>}

    {!loading && !directoryAvailable && activeUsers.length > 0 && <p className="mt-3 text-[9px] text-amber-700">Diretório setorial indisponível; exibindo usuários ativos como fallback operacional.</p>}
  </div>;
};
