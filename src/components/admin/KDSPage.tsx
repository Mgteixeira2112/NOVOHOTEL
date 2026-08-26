import React, { useMemo, useState } from 'react';

type Status = 'novo' | 'em_preparo' | 'pronto' | 'entregue';
type Order = { id: string; destino: string; origem: 'Balcão' | 'Quarto'; itens: string[]; criadoEm: string; status: Status };

const INITIAL: Order[] = [
  { id: '#102', destino: 'Quarto 203', origem: 'Quarto', itens: ['2x Hambúrguer', '2x Refrigerante'], criadoEm: 'Agora', status: 'novo' },
  { id: '#098', destino: 'Quarto 105', origem: 'Quarto', itens: ['1x Pizza individual', '1x Refrigerante'], criadoEm: '3 min', status: 'em_preparo' },
  { id: '#095', destino: 'Balcão', origem: 'Balcão', itens: ['2x Sucos'], criadoEm: '5 min', status: 'pronto' },
];

const nextStatus: Record<Status, Status | null> = { novo: 'em_preparo', em_preparo: 'pronto', pronto: 'entregue', entregue: null };
const actionLabel: Record<Status, string> = { novo: 'Preparar', em_preparo: 'Marcar pronto', pronto: 'Entregar', entregue: 'Concluído' };
const columns: { status: Status; title: string }[] = [
  { status: 'novo', title: 'Novos' },
  { status: 'em_preparo', title: 'Em preparo' },
  { status: 'pronto', title: 'Prontos' },
  { status: 'entregue', title: 'Entregues' },
];

export const KDSPage: React.FC = () => {
  const [orders, setOrders] = useState(INITIAL);
  const [som, setSom] = useState(true);
  const active = useMemo(() => orders.filter(o => o.status !== 'entregue').length, [orders]);

  const advance = (id: string) => setOrders(current => current.map(order => {
    if (order.id !== id) return order;
    const status = nextStatus[order.status];
    return status ? { ...order, status } : order;
  }));

  return (
    <div className="min-h-full bg-stone-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Hotel OS</p>
            <h1 className="text-2xl font-bold">KDS • Cozinha</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-stone-800 px-3 py-2 text-sm">{active} pedidos ativos</span>
            <button onClick={() => setSom(v => !v)} className="rounded-xl bg-stone-800 px-3 py-2 text-sm font-semibold">Som: {som ? 'Ligado' : 'Desligado'}</button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map(column => {
            const columnOrders = orders.filter(order => order.status === column.status);
            return <section key={column.status} className="min-h-[70vh] rounded-2xl bg-stone-900 p-3">
              <div className="mb-3 flex items-center justify-between border-b border-stone-800 pb-3">
                <h2 className="font-bold">{column.title}</h2>
                <span className="rounded-full bg-stone-800 px-2 py-1 text-xs">{columnOrders.length}</span>
              </div>
              <div className="space-y-3">
                {columnOrders.map(order => <article key={order.id} className="rounded-2xl bg-white p-4 text-stone-900 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="text-lg font-black">{order.id}</div><div className="font-bold">{order.destino}</div></div>
                    <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold">{order.origem}</span>
                  </div>
                  <ul className="my-4 space-y-2 border-y border-stone-100 py-3 text-sm font-semibold">{order.itens.map(item => <li key={item}>• {item}</li>)}</ul>
                  <div className="mb-3 text-xs text-stone-500">Recebido há {order.criadoEm}</div>
                  {nextStatus[order.status] && <button onClick={() => advance(order.id)} className="w-full rounded-xl bg-stone-900 px-4 py-3 font-bold text-white">{actionLabel[order.status]}</button>}
                </article>)}
                {columnOrders.length === 0 && <div className="rounded-xl border border-dashed border-stone-700 p-6 text-center text-sm text-stone-500">Nenhum pedido nesta etapa.</div>}
              </div>
            </section>;
          })}
        </div>
      </div>
    </div>
  );
};
