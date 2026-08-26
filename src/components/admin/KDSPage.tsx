import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listarKds, atualizarStatusKds } from '../../services/pdvService';

type Status =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

interface KdsPedido {
  numero: number;
  origem_canonica: string;
  quarto_id: string | null;
}

interface KdsItemDetail {
  quantidade: number;
  produto?: { nome: string } | null;
}

interface KdsRow {
  id: string;
  order_id: string;
  sector: 'COZINHA' | 'BAR' | 'CAFETERIA' | 'OUTROS';
  status: Status;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sla_minutes: number | null;
  created_at: string;
  pedido?: KdsPedido | KdsPedido[] | null;
  item?: KdsItemDetail | KdsItemDetail[] | null;
}

const columns: Array<{ status: Status; title: string; action?: Status }> = [
  { status: 'CREATED', title: 'Novos', action: 'CONFIRMED' },
  { status: 'CONFIRMED', title: 'Aceitos', action: 'PREPARING' },
  { status: 'PREPARING', title: 'Em preparo', action: 'READY' },
  { status: 'READY', title: 'Prontos', action: 'DELIVERED' },
  { status: 'DELIVERED', title: 'Entregues', action: 'COMPLETED' }
];

const elapsed = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  return m === 0 ? 'Agora' : `${m} min`;
};

export const KDSPage: React.FC = () => {
  const [rows, setRows] = useState<KdsRow[]>([]);
  const [sector, setSector] = useState('COZINHA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await listarKds(sector)) as unknown as KdsRow[];
      setRows(data || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no KDS');
    }
  }, [sector]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void load().finally(() => {
      if (mounted) setLoading(false);
    });
    const t = window.setInterval(() => void load(), 15000);
    return () => {
      mounted = false;
      window.clearInterval(t);
    };
  }, [load]);

  const active = useMemo(
    () => rows.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)).length,
    [rows]
  );

  const advance = async (r: KdsRow, next?: Status) => {
    if (!next) return;
    try {
      await atualizarStatusKds(r.id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o item');
    }
  };

  const getPedido = (r: KdsRow): KdsPedido | null => {
    if (Array.isArray(r.pedido)) return r.pedido[0] || null;
    return r.pedido || null;
  };

  const getItem = (r: KdsRow): KdsItemDetail | null => {
    if (Array.isArray(r.item)) return r.item[0] || null;
    return r.item || null;
  };

  return (
    <div className="min-h-full bg-stone-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Hotel OS</p>
            <h1 className="text-2xl font-bold">KDS</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="rounded-xl bg-stone-800 px-3 py-2 text-sm"
            >
              <option>COZINHA</option>
              <option>BAR</option>
              <option>CAFETERIA</option>
              <option>OUTROS</option>
            </select>
            <span className="rounded-full bg-stone-800 px-3 py-2 text-sm">{active} itens ativos</span>
          </div>
        </header>
        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {loading ? (
          <div className="py-20 text-center text-stone-400">Carregando cozinha...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {columns.map((c) => {
              const items = rows.filter((r) => r.status === c.status);
              return (
                <section key={c.status} className="min-h-[60vh] rounded-2xl bg-stone-900 p-3">
                  <div className="mb-3 flex justify-between border-b border-stone-800 pb-3">
                    <h2 className="font-bold">{c.title}</h2>
                    <span>{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((r) => {
                      const ped = getPedido(r);
                      const it = getItem(r);
                      return (
                        <article key={r.id} className="rounded-2xl bg-white p-4 text-stone-900 shadow-lg">
                          <div className="flex justify-between gap-2">
                            <div>
                              <div className="text-lg font-black">#{ped?.numero ?? r.order_id.slice(0, 8)}</div>
                              <div className="font-bold">{ped?.quarto_id ? `Quarto ${ped.quarto_id}` : 'Balcão'}</div>
                            </div>
                            <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold">
                              {r.priority}
                            </span>
                          </div>
                          <div className="my-4 border-y border-stone-100 py-3 text-sm font-semibold">
                            {it?.quantidade ?? 0}x {it?.produto?.nome ?? 'Produto'}
                          </div>
                          <div className="mb-3 text-xs text-stone-500">Recebido há {elapsed(r.created_at)}</div>
                          {c.action && (
                            <button
                              onClick={() => void advance(r, c.action)}
                              className="w-full rounded-xl bg-stone-900 px-4 py-3 font-bold text-white"
                            >
                              {c.action === 'CONFIRMED'
                                ? 'Aceitar'
                                : c.action === 'PREPARING'
                                  ? 'Iniciar preparo'
                                  : c.action === 'READY'
                                    ? 'Marcar pronto'
                                    : c.action === 'DELIVERED'
                                      ? 'Entregar'
                                      : 'Concluir'}
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
