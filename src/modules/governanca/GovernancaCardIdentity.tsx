import React from 'react';
import { Star } from 'lucide-react';

const sectorStyles: Record<string, { label: string; badge: string; dot: string }> = {
  governanca: { label: 'Governança', badge: 'border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-amber-400' },
  manutencao: { label: 'Manutenção', badge: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
  recepcao: { label: 'Recepção', badge: 'border-violet-200 bg-violet-50 text-violet-800', dot: 'bg-violet-500' },
  cozinha: { label: 'Cozinha', badge: 'border-orange-200 bg-orange-50 text-orange-800', dot: 'bg-orange-500' },
  operacao: { label: 'Operação', badge: 'border-slate-200 bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
};

export const getGovernancaSectorStyle = (sector?: string | null) => sectorStyles[sector || 'governanca'] || {
  label: sector || 'Governança', badge: 'border-slate-200 bg-slate-100 text-slate-700', dot: 'bg-slate-400',
};

export const GovernancaCardIdentity: React.FC<{ sector?: string | null; mine: boolean; unassigned: boolean }> = ({ sector, mine, unassigned }) => {
  const style = getGovernancaSectorStyle(sector);
  return <div className="mb-2 flex items-center justify-between gap-2">
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wide ${style.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />{style.label}</span>
    {mine ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white"><Star className="h-3 w-3 fill-amber-300 text-amber-300" /> Minha tarefa</span> : unassigned ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-black uppercase text-slate-500">Sem responsável</span> : null}
  </div>;
};
