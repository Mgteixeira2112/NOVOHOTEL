import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { atualizarStatusKds } from '../../services/pdvService';

type Status = 'novo' | 'em_preparo' | 'pronto' | 'entregue';
type Order = { id: string; pedidoId: string; destino: string; origem: 'Balcão' | 'Quarto' | 'Tablet'; itens: string[]; criadoEm: string; status: Status };
type KdsRow = { pedido_id: string; status: Status; recebido_em: string; pedido: { id: string; numero: number; origem: 'balcao' | 'quarto' | 'tablet'; quarto_id: string | null; pdv_pedido_itens: Array<{ quantidade: number; produto: { nome: string } | null }> | null } | null };

const columns: { status: Status; title: string }[] = [
  { status: 'novo', title: 'Novos' },
  { status: 'em_preparo', title: 'Em preparo' },
  { status: 'pronto', title: 'Prontos' },
  { status: 'entregue', title: 'Entregues' },
];
const nextStatus: Record<Status, Status | null> = { novo: 'em_preparo', em_preparo: 'pronto', pronto: 'entregue', entregue: null };
const actionLabel: Record<Status, string> = { novo: 'Preparar', em_preparo: 'Marcar pronto', pronto: 'Entregar', entregue: 'Concluído' };
const originLabel = (origin: KdsRow['pedido']['origem']): Order['origem'] => origin === 'balcao' ? 'Balcão' : origin === 'quarto' ? 'Quarto' : 'Tablet';
const elapsed = (iso: string) => { const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)); return minutes === 0 ? 'Agora' : `${minutes} min`; };

export const KDSPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [som, setSom] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('kds_fila')
      .select('pedido_id,status,recebido_em,pedido:pdv_pedidos(id,numero,origem,quarto_id,pdv_pedido_itens(quantidade,produto:pdv_produtos(nome)))')
      .order('recebido_em', { ascending: true });
    if (queryError) { setError(`Não foi possível carregar a cozinha: ${queryError.message}`); return; }
    const mapped = ((data ?? []) as unknown as KdsRow[]).flatMap(row => row.pedido ? [{
      id: `#${row.pedido.numero}`,
      pedidoId: row.pedido.id,
      destino: row.pedido.origem === 'balcao' ? 'Balcão' : row.pedido.quarto_id ? `Quarto ${row.pedido.quarto_id}` : 'Quarto não informado',
      origem: originLabel(row.pedido.origem),
      itens: (row.pedido.pdv_pedido_itens ?? []).map(item => `${item.quantidade}x ${item.produto?.nome ?? 'Produto'}`),
      criadoEm: elapsed(row.recebido_em),
      status: row.status,
    }] : []);
    setOrders(mapped);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadOrders().finally(() => { if (mounted) setLoading(false); });
    const channel = supabase.channel('kds-pedidos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kds_fila' }, () => { void loadOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdv_pedidos' }, () => { void loadOrders(); })
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, [loadOrders]);

  const active = useMemo(() => orders.filter(o => o.status !== 'entregue').length, [orders]);

  const advance = async (order: Order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    try {
      setError(null);
      await atualizarStatusKds(order.pedidoId, next);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o pedido.');
    }
  };

  return <div className="min-h-full bg-stone-950 p-4 text-white md:p-6"><div className="mx-auto max-w-[1600px]">
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Hotel OS</p><h1 className="text-2xl font-bold">KDS • Cozinha</h1></div><div className="flex items-center gap-3"><span className="rounded-full bg-stone-800 px-3 py-2 text-sm">{active} pedidos ativos</span><button onClick={() => setSom(v => !v)} className="rounded-xl bg-stone-800 px-3 py-2 text-sm font-semibold">Som: {som ? 'Ligado' : 'Desligado'}</button></div></header>
    {error && <div className="mb-4 rounded-xl border border-red-800 bg-red-950 p-3 text-sm text-red-200">{error}</div>}
    {loading ? <div className="py-20 text-center text-stone-400">Carregando pedidos...</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{columns.map(column => { const columnOrders = orders.filter(order => order.status === column.status); return <section key={column.status} className="min-h-[70vh] rounded-2xl bg-stone-900 p-3"><div className="mb-3 flex items-center justify-between border-b border-stone-800 pb-3"><h2 className="font-bold">{column.title}</h2><span className="rounded-full bg-stone-800 px-2 py-1 text-xs">{columnOrders.length}</span></div><div className="space-y-3">{columnOrders.map(order => <article key={order.id} className="rounded-2xl bg-white p-4 text-stone-900 shadow-lg"><div className="flex items-start justify-between gap-3"><div><div className="text-lg font-black">{order.id}</div><div className="font-bold">{order.destino}</div></div><span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold">{order.origem}</span></div><ul className="my-4 space-y-2 border-y border-stone-100 py-3 text-sm font-semibold">{order.itens.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul><div className="mb-3 text-xs text-stone-500">Recebido há {order.criadoEm}</div>{nextStatus[order.status] && <button onClick={() => void advance(order)} className="w-full rounded-xl bg-stone-900 px-4 py-3 font-bold text-white">{actionLabel[order.status]}</button>}</article>)}{columnOrders.length === 0 && <div className="rounded-xl border border-dashed border-stone-700 p-6 text-center text-sm text-stone-500">Nenhum pedido nesta etapa.</div>}</div></section>; })}</div>}
  </div></div>;
};