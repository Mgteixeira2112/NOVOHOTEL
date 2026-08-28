import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { KanbanV2Card } from '../../services/kanbanV2';
import { GOVERNANCA_DEMAND_TARGETS, GovernancaDemandSector } from './governancaDemandService';

export interface GovernancaDemandDraft {
  sector: GovernancaDemandSector;
  title: string;
  description: string;
  priority: string;
  roomNumber: string;
}

export const GovernancaDemandModal: React.FC<{
  open: boolean;
  sourceCard?: KanbanV2Card | null;
  governanceOnly?: boolean;
  busy?: boolean;
  onClose: () => void;
  onCreate: (draft: GovernancaDemandDraft) => Promise<void>;
}> = ({ open, sourceCard = null, governanceOnly = false, busy = false, onClose, onCreate }) => {
  const [sector, setSector] = useState<GovernancaDemandSector>('governanca');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [roomNumber, setRoomNumber] = useState('');

  useEffect(() => {
    if (!open) return;
    setSector('governanca');
    setTitle(sourceCard ? `Demanda relacionada: ${sourceCard.titulo}` : '');
    setDescription('');
    setPriority(sourceCard?.prioridade || 'normal');
    setRoomNumber(sourceCard?.room_number || '');
  }, [open, sourceCard?.id]);

  if (!open) return null;
  const sectors = (Object.keys(GOVERNANCA_DEMAND_TARGETS) as GovernancaDemandSector[]).filter(item => !governanceOnly || item === 'governanca');

  const submit = async () => {
    if (!title.trim() || busy) return;
    await onCreate({ sector, title, description, priority, roomNumber });
  };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Nova demanda</p><h2 className="mt-1 text-lg font-black text-slate-950">{sourceCard ? 'Criar tarefa a partir deste card' : 'Criar demanda para a Governança'}</h2>{sourceCard && <p className="mt-1 text-xs text-slate-500">Origem: {sourceCard.titulo}{sourceCard.room_number ? ` • Quarto ${sourceCard.room_number}` : ''}</p>}</div><button disabled={busy} onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40"><X className="h-4 w-4" /></button></div>
      <div className="space-y-4 p-5">
        <label className="block text-[10px] font-black uppercase text-slate-500">Setor<select disabled={governanceOnly} value={sector} onChange={event => setSector(event.target.value as GovernancaDemandSector)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold normal-case disabled:bg-slate-100">{sectors.map(item => <option key={item} value={item}>{GOVERNANCA_DEMAND_TARGETS[item].label}</option>)}</select></label>
        <label className="block text-[10px] font-black uppercase text-slate-500">Título<input autoFocus value={title} onChange={event => setTitle(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold normal-case outline-none focus:border-amber-400" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-[10px] font-black uppercase text-slate-500">Prioridade<select value={priority} onChange={event => setPriority(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold normal-case"><option value="normal">Normal</option><option value="atencao">Atenção</option><option value="alta">Alta</option><option value="urgente">Urgente</option><option value="critica">Crítica</option></select></label><label className="block text-[10px] font-black uppercase text-slate-500">Quarto / referência<input value={roomNumber} onChange={event => setRoomNumber(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold normal-case" /></label></div>
        <label className="block text-[10px] font-black uppercase text-slate-500">Descrição<textarea value={description} onChange={event => setDescription(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium normal-case outline-none focus:border-amber-400" /></label>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><button disabled={busy} onClick={onClose} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 disabled:opacity-40">Cancelar</button><button disabled={busy || !title.trim()} onClick={() => void submit()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Criar demanda</button></div>
    </div>
  </div>;
};
