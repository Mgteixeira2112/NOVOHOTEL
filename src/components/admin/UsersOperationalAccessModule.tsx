import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Info, Loader2, ShieldCheck, Users, XCircle } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import {
  OPERATIONAL_SECTORS,
  OperationalSectorDefinition,
  OperationalSectorId,
  inferOperationalSectorFromRole,
} from '../../domain/operationalSectors';
import {
  fetchOperationalSectors,
  fetchUserOperationalSectors,
  saveUserOperationalSectors,
} from '../../services/userSectorService';
import { UsersModule } from './UsersModule';

export const UsersOperationalAccessModule: React.FC = () => {
  const { users, currentUser } = useHotel();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sectors, setSectors] = useState<OperationalSectorDefinition[]>([...OPERATIONAL_SECTORS]);
  const [selectedSectorIds, setSelectedSectorIds] = useState<OperationalSectorId[]>([]);
  const [principalSectorId, setPrincipalSectorId] = useState<OperationalSectorId | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeUsers = useMemo(() => users.filter(user => user.ativo), [users]);
  const selectedUser = users.find(user => user.id === selectedUserId) || null;

  useEffect(() => {
    if (selectedUserId && users.some(user => user.id === selectedUserId)) return;
    const preferred = users.find(user => user.id === currentUser?.id) || activeUsers[0] || users[0];
    setSelectedUserId(preferred?.id || '');
  }, [users, activeUsers, currentUser?.id, selectedUserId]);

  useEffect(() => {
    let cancelled = false;
    void fetchOperationalSectors().then(result => {
      if (!cancelled && result.length > 0) setSectors(result);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedSectorIds([]);
      setPrincipalSectorId(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage(null);

    void fetchUserOperationalSectors(selectedUserId)
      .then(assignment => {
        if (cancelled) return;
        setSelectedSectorIds(assignment.sectorIds);
        setPrincipalSectorId(assignment.principalSectorId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedUserId]);

  const suggestedSector = selectedUser
    ? inferOperationalSectorFromRole(selectedUser.tipo_usuario)
    : null;

  const toggleSector = (sectorId: OperationalSectorId) => {
    setMessage(null);
    setSelectedSectorIds(current => {
      if (current.includes(sectorId)) {
        const next = current.filter(id => id !== sectorId);
        if (principalSectorId === sectorId) setPrincipalSectorId(next[0] || null);
        return next;
      }

      const next = [...current, sectorId];
      if (!principalSectorId) setPrincipalSectorId(sectorId);
      return next;
    });
  };

  const applySuggestedSector = () => {
    if (!suggestedSector) return;
    setSelectedSectorIds(current => current.includes(suggestedSector) ? current : [...current, suggestedSector]);
    setPrincipalSectorId(current => current || suggestedSector);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setMessage(null);

    const result = await saveUserOperationalSectors({
      userId: selectedUser.id,
      sectorIds: selectedSectorIds,
      principalSectorId,
    });

    if (result.success) {
      setMessage({
        type: 'success',
        text: `Setores de ${selectedUser.nome} salvos. Esta configuração será usada na próxima etapa para filtrar os Kanbans por perfil e setor.`,
      });
    } else {
      const raw = result.message || 'Falha ao salvar os setores do usuário.';
      const migrationHint = /relation|schema cache|operational_sectors|usuario_operational_sectors/i.test(raw)
        ? ' A migration 20260827223000_user_operational_sectors.sql precisa estar aplicada no Supabase.'
        : '';
      setMessage({ type: 'error', text: `${raw}${migrationHint}` });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-stone-950 text-amber-400 grid place-items-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-stone-950">Setores Operacionais e Visibilidade Kanban</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wide">
                  Etapa 2
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
                Vincule cada colaborador a um ou mais setores. Perfil/RBAC define o que a pessoa pode fazer; setor define em qual operação ela trabalha e, na próxima etapa, quais cards poderá visualizar.
              </p>
            </div>
          </div>

          <div className="min-w-[260px]">
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Colaborador</label>
            <select
              value={selectedUserId}
              onChange={event => setSelectedUserId(event.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {users.length === 0 && <option value="">Nenhum usuário cadastrado</option>}
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nome} — {user.cargo_titulo || user.tipo_usuario}{user.ativo ? '' : ' (inativo)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {selectedUser ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 grid place-items-center text-stone-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm text-stone-900">{selectedUser.nome}</strong>
                    <span className="text-[11px] text-stone-500">
                      Perfil: <b>{selectedUser.tipo_usuario}</b>{selectedUser.cargo_titulo ? ` • ${selectedUser.cargo_titulo}` : ''}
                    </span>
                  </div>
                </div>

                {suggestedSector && !selectedSectorIds.includes(suggestedSector) && (
                  <button
                    type="button"
                    onClick={applySuggestedSector}
                    className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition"
                  >
                    Usar setor sugerido pelo perfil
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando vínculos operacionais…
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                  {sectors.map(sector => {
                    const checked = selectedSectorIds.includes(sector.id);
                    const principal = principalSectorId === sector.id;
                    return (
                      <div
                        key={sector.id}
                        className={`rounded-2xl border p-3.5 transition ${checked ? 'border-amber-300 bg-amber-50/70' : 'border-stone-200 bg-white'}`}
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSector(sector.id)}
                            className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span className="min-w-0">
                            <strong className="block text-xs text-stone-900">{sector.label}</strong>
                            <span className="block text-[10px] text-stone-500 mt-0.5 leading-relaxed">{sector.description}</span>
                          </span>
                        </label>

                        {checked && (
                          <label className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center gap-2 text-[10px] font-bold text-stone-600 cursor-pointer">
                            <input
                              type="radio"
                              name="principal-operational-sector"
                              checked={principal}
                              onChange={() => setPrincipalSectorId(sector.id)}
                              className="text-amber-500 focus:ring-amber-500"
                            />
                            Setor principal
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-start gap-2 text-[11px] text-stone-500 max-w-3xl">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    Esta etapa apenas cadastra os vínculos. <strong>A exibição dos cards ainda não será filtrada</strong> até implantarmos o mecanismo de escopo na etapa seguinte, evitando mudar o Kanban estável antes da base estar validada.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || loading}
                  className="h-10 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40 transition shrink-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-amber-400" />}
                  Salvar setores
                </button>
              </div>

              {message && (
                <div className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-start gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500">Cadastre um usuário para definir setores operacionais.</div>
          )}
        </div>
      </section>

      <UsersModule />
    </div>
  );
};
