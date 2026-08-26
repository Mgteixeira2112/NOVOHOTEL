import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listarKds, atualizarStatusKds } from '../../services/pdvService';

type Status = 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
type KdsRow = {
  id: string;
  order_id: string;
  sector: 'COZINHA' | 'BAR' | 'CAFETERIA' | 'OUTROS';
  status: Status;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sla_minutes: number | null;
  created_at: string;
  ready_at: string | null;
  pedido?: { numero: number; origem_canonica: string; quarto_id: string | null } | null;
  item?: { quantidade: number; produto?: { nome: string } | null } | null;
};

const columns: Array<{ status: Status; title: string; action?: Status }> = [
  { status: 'CREATED', title: 'Novos', action: 'CONFIRMED' },
  { status: 'PREPARING', title: 'Em preparo', action: 'READY' },
  { status: 'READY', title: 'Prontos', action: 'DELIVERED' },
  { status: 'DELIVERED', title: 'Entregues', action: 'COMPLETED' },
];

const elapsed = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  return minutes === 0 ? 'Agora' : `${minutes} min`;
};

export const KDSPage: React.FC = () => {
  const [rows, setRows] = useState<KdsRow[]>([]);
  const [sector, setSector] = useState('COZINHA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows((await listarKds(sector)) as KdsRow[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o KDS.');
    }
  }, [sector]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void load().finally(() => { if (mounted) setLoading(false); });
    const timer = window.setInterval(() => { void load(); }, 15000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [load]);

  const active = useMemo(() => rows.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status)).length, [rows]);

  const advance = async (row: KdsRow, next?: Status) => {
    if (!next) return;
    try {
      setError(null);
      await atualizarStatusKds(row.id, next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o item.');
    }
  };

  return (
    <div className="min-h-full bg-stone-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Hotel OS</p><h1 className="text-2xl font-bold">KDS</h1></div>
          <div className="flex items-center gap-2"><select value={sector} onChange={e => setSector(e.target.value)} className="rounded-xl bg-stone-800 px-3 py-2 text-sm"><option value="COZINHA">Cozinha</option><option value="BAR">Bar</option><option value="CAFETERIA">Cafeteria</option><option value="OUTROS">Outros</option></select><span className="rounded-full bg-stone-800 px-3 py-2 text-sm">{active} itens ativos</span></div>
        </header>
        {error && <div className="mb-4 rounded-xl border border-red-800 bg-red-950 p-3 text-sm text-red-200">{error}</div>}
        {loading ? <div className="py-20 text-center text-stone-400">Carregando cozinha...</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{columns.map(column => {
          const items = rows.filter(r => r.status === column.status);
          return <section key={column.status} className="min-h-[60vh] rounded-2xl bg-stone-900 p-3"><div className="mb-3 flex items-center justify-between border-b border-stone-800 pb-3"><h2 className="font-bold">{column.title}</h2><span className="rounded-full bg-stone-800 px-2 py-1 text-xs">{items.length}</span></div><div className="space-y-3">{items.map(row => {
            const late = row.sla_minutes !== null && Date.now() - new Date(row.created_at).getTime() > row.sla_minutes * 60000 && !['READY','DELIVERED','COMPLETED','CANCELLED'].includes(row.status);
            return <article key={row.id} className="rounded-2xl bg-white p-4 text-stone-900 shadow-lg"><div className="flex items-start justify-between gap-3"><div><div className="text-lg font-black">#{row.pedido?.numero ?? row.order_id.slice(0, 8)}</div><div className="font-bold">{row.pedido?.quarto_id ? `Quarto ${row.pedido.quarto_id}` : 'Balcão'}</div></div><span className={`rounded-lg px-2 py-1 text-xs font-bold ${late ? 'bg-red-100 text-red-700' : 'bg-stone-100'}`}>{late ? 'ATRASADO' : row.priority}</span></div><div className="my-4 border-y border-stone-100 py-3 text-sm font-semibold">{row.item?.quantidade ?? 0}x {row.item?.produto?.nome ?? 'Produto'}</div><div className="mb-3 text-xs text-stone-500">Recebido há {elapsed(row.created_at)}</div>{column.action && <button onClick={() => void advance(row, column.action)} className="w-full rounded-xl bg-stone-900 px-4 py-3 font-bold text-white">{column.action === 'CONFIRMED' ? 'Aceitar' : column.action === 'PREPARING' ? 'Preparar' : column.action === 'READY' ? 'Marcar pronto' : column.action === 'DELIVERED' ? 'Entregar' : 'Concluir'}</button>}</article>;
          })}</div></section>;
        })}</div>}
      </div>
    </div>
  );
};
