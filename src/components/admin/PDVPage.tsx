import React, { useMemo, useState } from 'react';

type Product = { id: string; nome: string; categoria: string; preco: number };
type CartItem = Product & { quantidade: number };

const PRODUCTS: Product[] = [
  { id: 'hamburguer', nome: 'Hambúrguer', categoria: 'Lanches', preco: 20 },
  { id: 'batata', nome: 'Batata frita', categoria: 'Lanches', preco: 16 },
  { id: 'pizza', nome: 'Pizza individual', categoria: 'Pizzas', preco: 32 },
  { id: 'refrigerante', nome: 'Refrigerante', categoria: 'Bebidas', preco: 7 },
  { id: 'agua', nome: 'Água', categoria: 'Bebidas', preco: 5 },
  { id: 'sobremesa', nome: 'Sobremesa', categoria: 'Sobremesas', preco: 12 },
];

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const PDVPage: React.FC = () => {
  const [categoria, setCategoria] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modo, setModo] = useState<'balcao' | 'quarto'>('balcao');
  const [quarto, setQuarto] = useState('');

  const categorias = ['Todos', ...Array.from(new Set(PRODUCTS.map(p => p.categoria)))];
  const produtos = useMemo(() => PRODUCTS.filter(p =>
    (categoria === 'Todos' || p.categoria === categoria) &&
    p.nome.toLowerCase().includes(busca.toLowerCase())
  ), [categoria, busca]);
  const total = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  const add = (product: Product) => setCart(current => {
    const found = current.find(item => item.id === product.id);
    return found
      ? current.map(item => item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item)
      : [...current, { ...product, quantidade: 1 }];
  });

  const changeQty = (id: string, delta: number) => setCart(current => current
    .map(item => item.id === id ? { ...item, quantidade: item.quantidade + delta } : item)
    .filter(item => item.quantidade > 0));

  return (
    <div className="min-h-full bg-stone-100 text-stone-900 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Hotel OS</p>
            <h1 className="text-2xl font-bold">PDV</h1>
          </div>
          <div className="flex rounded-xl bg-white p-1 shadow-sm">
            <button onClick={() => setModo('balcao')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${modo === 'balcao' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>Balcão</button>
            <button onClick={() => setModo('quarto')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${modo === 'quarto' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>Room Service</button>
          </div>
        </header>

        {modo === 'quarto' && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="text-sm font-semibold">Quarto</label>
            <input value={quarto} onChange={e => setQuarto(e.target.value)} placeholder="Ex.: 203" className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." className="flex-1 rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-stone-400" />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categorias.map(cat => <button key={cat} onClick={() => setCategoria(cat)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${categoria === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{cat}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {produtos.map(product => <button key={product.id} onClick={() => add(product)} className="min-h-32 rounded-2xl border border-stone-200 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[.98]">
                <div className="mb-5 text-3xl">🍽️</div>
                <div className="font-semibold">{product.nome}</div>
                <div className="mt-1 text-sm font-bold text-amber-700">{money(product.preco)}</div>
              </button>)}
            </div>
          </section>

          <aside className="flex flex-col rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-120px)]">
            <div className="border-b border-stone-100 pb-4">
              <div className="flex items-center justify-between"><h2 className="font-bold">Pedido atual</h2><span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold">Caixa 01</span></div>
              {modo === 'quarto' && <p className="mt-1 text-xs text-stone-500">Quarto {quarto || 'não informado'}</p>}
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {cart.length === 0 ? <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-stone-400">Nenhum item no pedido.</div> : cart.map(item => <div key={item.id} className="flex items-center gap-3 border-b border-stone-100 py-3">
                <div className="flex-1"><div className="font-semibold">{item.nome}</div><div className="text-sm text-stone-500">{money(item.preco)} cada</div></div>
                <div className="flex items-center gap-2"><button onClick={() => changeQty(item.id, -1)} className="h-8 w-8 rounded-lg bg-stone-100 font-bold">−</button><span className="w-5 text-center text-sm font-bold">{item.quantidade}</span><button onClick={() => changeQty(item.id, 1)} className="h-8 w-8 rounded-lg bg-stone-100 font-bold">+</button></div>
              </div>)}
            </div>
            <div className="border-t border-stone-100 pt-4">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-stone-500">Total</span><strong className="text-2xl">{money(total)}</strong></div>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => setCart([])} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold">Limpar</button><button disabled={cart.length === 0 || (modo === 'quarto' && !quarto)} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-40">Enviar pedido</button></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
