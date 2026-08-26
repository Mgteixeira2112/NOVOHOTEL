import React, { useEffect, useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { criarPedidoPdv, finalizarPedidoPdv, listarCaixas, listarProdutosPdv, listarSessoesCaixa, abrirCaixa, PdvProduct } from '../../services/pdvService';

type CartItem = PdvProduct & { quantidade: number };
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const methods = [
  ['PIX', 'PIX'],
  ['CREDIT_CARD', 'Crédito'],
  ['DEBIT_CARD', 'Débito'],
  ['CASH', 'Dinheiro'],
  ['BANK_TRANSFER', 'Transferência'],
  ['OTHER', 'Outro']
] as const;

export const PDVPage: React.FC = () => {
  const { hotelConfig, rooms } = useHotel();
  const [products, setProducts] = useState<PdvProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'balcao' | 'quarto'>('balcao');
  const [room, setRoom] = useState('');
  const [payment, setPayment] = useState('PIX');
  const [sessions, setSessions] = useState<Array<{ id: string; cash_register_id: string }>>([]);
  const [registers, setRegisters] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelConfig?.id) return;
    let active = true;
    Promise.all([
      listarProdutosPdv(),
      listarCaixas(String(hotelConfig.id)),
      listarSessoesCaixa(String(hotelConfig.id))
    ])
      .then(([p, r, s]) => {
        if (!active) return;
        setProducts(p);
        setRegisters(r as Array<{ id: string; name: string; code: string }>);
        setSessions(s as Array<{ id: string; cash_register_id: string }>);
      })
      .catch(e => {
        if (active) setError(e instanceof Error ? e.message : 'Falha ao carregar PDV.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hotelConfig?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === 'Escape') {
        setCart([]);
        return;
      }
      if (typing) return;
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pdv-search')?.focus();
      }
      if (e.key === 'F8' && cart.length) {
        e.preventDefault();
        void submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart]);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))];
  const visible = useMemo(
    () =>
      products.filter(
        p =>
          (category === 'Todos' || p.categoria === category) &&
          p.nome.toLowerCase().includes(search.toLowerCase())
      ),
    [products, category, search]
  );
  const total = cart.reduce((s, p) => s + p.preco * p.quantidade, 0);

  const add = (p: PdvProduct) =>
    setCart(c => {
      const found = c.find(x => x.id === p.id);
      return found
        ? c.map(x => (x.id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x))
        : [...c, { ...p, quantidade: 1 }];
    });

  const submit = async () => {
    if (!hotelConfig?.id || !cart.length || sending) return;
    const selected = mode === 'quarto' ? rooms.find(r => String(r.numero) === room.trim()) : undefined;
    if (mode === 'quarto' && !selected) {
      setError('Informe um quarto válido.');
      return;
    }
    if (payment === 'CASH' && !sessions[0]) {
      setError('Não existe sessão de caixa aberta para este hotel.');
      return;
    }
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const id = await criarPedidoPdv({
        hotelId: String(hotelConfig.id),
        origem: mode,
        quartoId: selected?.id ? String(selected.id) : null,
        idempotencyKey: crypto.randomUUID(),
        itens: cart.map(x => ({ produto_id: x.id, quantidade: x.quantidade })),
        chargeToRoom: mode === 'quarto'
      });
      await finalizarPedidoPdv(id, mode === 'quarto' ? null : payment, mode === 'quarto' ? null : sessions[0]?.id);
      setCart([]);
      setMessage(`Pedido #${id.slice(0, 8)} concluído com sucesso.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir a venda.');
    } finally {
      setSending(false);
    }
  };

  const openCash = async () => {
    if (!registers[0]) {
      setError('Nenhum caixa cadastrado para este hotel.');
      return;
    }
    try {
      await abrirCaixa(registers[0].id, 0);
      const s = await listarSessoesCaixa(String(hotelConfig?.id));
      setSessions(s as Array<{ id: string; cash_register_id: string }>);
      setMessage('Caixa aberto.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir o caixa.');
    }
  };

  return (
    <div className="min-h-full bg-stone-100 p-3 text-stone-900 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Hotel OS</p>
            <h1 className="text-2xl font-black">PDV + Room Service</h1>
            <p className="mt-1 text-[11px] text-stone-500">F2 pesquisar · F8 finalizar · ESC limpar</p>
          </div>
          <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
            <button
              onClick={() => setMode('balcao')}
              className={`touch-target rounded-lg px-4 py-2 text-sm font-bold ${
                mode === 'balcao' ? 'bg-stone-900 text-white' : ''
              }`}
            >
              Balcão
            </button>
            <button
              onClick={() => setMode('quarto')}
              className={`touch-target rounded-lg px-4 py-2 text-sm font-bold ${
                mode === 'quarto' ? 'bg-stone-900 text-white' : ''
              }`}
            >
              Quarto
            </button>
          </div>
        </header>

        {mode === 'quarto' && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="text-sm font-bold">Quarto</label>
            <input
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="Número do quarto"
              className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-3"
            />
          </div>
        )}

        {(message || error) && (
          <div
            className={`mb-4 rounded-xl p-3 text-sm font-bold ${
              error
                ? 'border border-red-200 bg-red-50 text-red-800'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl bg-white p-3 shadow-sm md:p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <input
                id="pdv-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                aria-label="Buscar produto"
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3"
              />
              <div className="touch-toolbar flex gap-2 overflow-x-auto">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`touch-target rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap ${
                      category === c ? 'bg-stone-900 text-white' : 'bg-stone-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="py-20 text-center text-stone-500">Carregando catálogo...</div>
            ) : (
              <div className="pos-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {visible.map(p => (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    disabled={p.status !== 'ACTIVE'}
                    className="touch-target min-h-32 rounded-2xl border border-stone-200 p-4 text-left hover:shadow-md disabled:opacity-40"
                  >
                    <div className="text-2xl">🍽️</div>
                    <div className="mt-3 font-bold">{p.nome}</div>
                    <div className="mt-1 font-black text-amber-700">{money(p.preco)}</div>
                    <div className="mt-1 text-xs text-stone-400">
                      {p.status === 'OUT_OF_STOCK' ? 'Sem estoque' : 'Estoque ' + p.estoque_atual}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-black">Carrinho</h2>
              <span className="text-xs font-bold text-stone-400">{cart.length} produtos</span>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {cart.map(i => (
                <div key={i.id} className="flex items-center gap-3 border-b border-stone-100 py-3">
                  <div className="flex-1">
                    <div className="font-bold">{i.nome}</div>
                    <div className="text-xs text-stone-500">{money(i.preco)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={`Diminuir ${i.nome}`}
                      onClick={() =>
                        setCart(c =>
                          c
                            .map(x => (x.id === i.id ? { ...x, quantidade: Math.max(0, x.quantidade - 1) } : x))
                            .filter(x => x.quantidade > 0)
                        )
                      }
                      className="touch-target h-10 w-10 rounded-lg bg-stone-100 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold px-1">{i.quantidade}</span>
                    <button
                      aria-label={`Aumentar ${i.nome}`}
                      onClick={() => add(i)}
                      className="touch-target h-10 w-10 rounded-lg bg-stone-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 pt-4">
              <div className="mb-3 flex justify-between">
                <span className="text-stone-500">Total</span>
                <strong className="text-2xl">{money(total)}</strong>
              </div>
              {mode === 'balcao' && (
                <>
                  <label className="mb-2 block text-xs font-bold text-stone-500">Pagamento</label>
                  <select
                    value={payment}
                    onChange={e => setPayment(e.target.value)}
                    className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-3"
                  >
                    {methods.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {payment === 'CASH' && (
                    <div className="mb-3 flex gap-2">
                      <div className="flex-1 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold">
                        {sessions[0] ? 'Caixa aberto' : 'Caixa fechado'}
                      </div>
                      {!sessions[0] && (
                        <button
                          onClick={() => void openCash()}
                          className="touch-target rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          Abrir
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCart([])}
                  className="touch-target rounded-xl border border-stone-200 px-4 py-3 font-bold"
                >
                  Limpar
                </button>
                <button
                  onClick={() => void submit()}
                  disabled={!cart.length || sending}
                  className="touch-target rounded-xl bg-amber-500 px-4 py-3 font-black disabled:opacity-40"
                >
                  {sending ? 'Processando...' : mode === 'quarto' ? 'Lançar no quarto' : 'Finalizar venda'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

