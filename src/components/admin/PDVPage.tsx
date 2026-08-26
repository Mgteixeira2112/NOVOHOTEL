import React, { useEffect, useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  abrirCaixa,
  criarPedidoPdv,
  finalizarPedidoPdv,
  listarCaixas,
  listarProdutosPdv,
  listarSessoesCaixa,
} from '../../services/pdvService';
import type { PdvProduct } from '../../services/pdvService';

type CartItem = PdvProduct & { quantidade: number };
type CashSession = { id: string; cash_register_id: string };
type CashRegister = { id: string; name: string; code: string };

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const methods = [
  ['PIX', 'PIX'],
  ['CREDIT_CARD', 'Crédito'],
  ['DEBIT_CARD', 'Débito'],
  ['CASH', 'Dinheiro'],
  ['BANK_TRANSFER', 'Transferência'],
  ['OTHER', 'Outro'],
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
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelConfig?.id) {
      setLoading(false);
      return;
    }

    let active = true;

    void Promise.all([
      listarProdutosPdv(),
      listarCaixas(String(hotelConfig.id)),
      listarSessoesCaixa(String(hotelConfig.id)),
    ])
      .then(([productResult, registerResult, sessionResult]) => {
        if (!active) return;
        setProducts(productResult);
        setRegisters(registerResult as CashRegister[]);
        setSessions(sessionResult as CashSession[]);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar PDV.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hotelConfig?.id]);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.map((product) => product.categoria)))],
    [products],
  );

  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === 'Todos' || product.categoria === category) &&
          product.nome.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, category, search],
  );

  const total = useMemo(
    () => cart.reduce((sum, product) => sum + product.preco * product.quantidade, 0),
    [cart],
  );

  const add = (product: PdvProduct) => {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }
      return [...current, { ...product, quantidade: 1 }];
    });
  };

  const submit = async () => {
    if (!hotelConfig?.id || cart.length === 0 || sending) return;

    const selectedRoom =
      mode === 'quarto'
        ? rooms.find((item) => String(item.numero) === room.trim())
        : undefined;

    if (mode === 'quarto' && !selectedRoom) {
      setError('Informe um quarto válido.');
      return;
    }

    if (mode === 'balcao' && payment === 'CASH' && !sessions[0]) {
      setError('Não existe sessão de caixa aberta para este hotel.');
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const orderId = await criarPedidoPdv({
        hotelId: String(hotelConfig.id),
        origem: mode,
        quartoId: selectedRoom?.id ? String(selectedRoom.id) : null,
        idempotencyKey: crypto.randomUUID(),
        itens: cart.map((item) => ({
          produto_id: item.id,
          quantidade: item.quantidade,
        })),
        chargeToRoom: mode === 'quarto',
      });

      await finalizarPedidoPdv(
        orderId,
        mode === 'quarto' ? null : payment,
        mode === 'quarto' ? null : sessions[0]?.id,
      );

      setCart([]);
      setMessage(`Pedido #${orderId.slice(0, 8)} concluído com sucesso.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a venda.');
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
      if (hotelConfig?.id) {
        const result = await listarSessoesCaixa(String(hotelConfig.id));
        setSessions(result as CashSession[]);
      }
      setMessage('Caixa aberto.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o caixa.');
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));

      if (event.key === 'Escape') {
        setCart([]);
        return;
      }

      if (typing) return;

      if (event.key === 'F2') {
        event.preventDefault();
        document.getElementById('pdv-search')?.focus();
      }

      if (event.key === 'F8' && cart.length > 0) {
        event.preventDefault();
        void submit();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart]);

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
            <button type="button" onClick={() => setMode('balcao')} className={`touch-target rounded-lg px-4 py-2 text-sm font-bold ${mode === 'balcao' ? 'bg-stone-900 text-white' : ''}`}>
              Balcão
            </button>
            <button type="button" onClick={() => setMode('quarto')} className={`touch-target rounded-lg px-4 py-2 text-sm font-bold ${mode === 'quarto' ? 'bg-stone-900 text-white' : ''}`}>
              Quarto
            </button>
          </div>
        </header>

        {mode === 'quarto' && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="text-sm font-bold">Quarto</label>
            <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Número do quarto" className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-3" />
          </div>
        )}

        {(message || error) && (
          <div className={`mb-4 rounded-xl p-3 text-sm font-bold ${error ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl bg-white p-3 shadow-sm md:p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <input id="pdv-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto..." aria-label="Buscar produto" className="flex-1 rounded-xl border border-stone-200 px-4 py-3" />
              <div className="touch-toolbar flex gap-2 overflow-x-auto">
                {categories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={`touch-target rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap ${category === item ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-stone-500">Carregando catálogo...</div>
            ) : (
              <div className="pos-grid grid gap-3">
                {visible.map((product) => (
                  <button key={product.id} type="button" onClick={() => add(product)} disabled={product.status !== 'ACTIVE'} className="touch-target min-h-32 rounded-2xl border border-stone-200 p-4 text-left hover:shadow-md disabled:opacity-40">
                    <div className="text-2xl">🍽️</div>
                    <div className="mt-3 font-bold">{product.nome}</div>
                    <div className="mt-1 font-black text-amber-700">{money(product.preco)}</div>
                    <div className="mt-1 text-xs text-stone-400">{product.status === 'OUT_OF_STOCK' ? 'Sem estoque' : `Estoque ${product.estoque_atual}`}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-black">Carrinho</h2>
              <span className="text-xs font-bold text-stone-400">{cart.length} produtos</span>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-stone-100 py-3">
                  <div className="flex-1">
                    <div className="font-bold">{item.nome}</div>
                    <div className="text-xs text-stone-500">{money(item.preco)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={`Diminuir ${item.nome}`} onClick={() => setCart((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantidade: Math.max(0, entry.quantidade - 1) } : entry).filter((entry) => entry.quantidade > 0))} className="touch-target h-10 w-10 rounded-lg bg-stone-100">−</button>
                    <b>{item.quantidade}</b>
                    <button type="button" aria-label={`Aumentar ${item.nome}`} onClick={() => add(item)} className="touch-target h-10 w-10 rounded-lg bg-stone-100">+</button>
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
                  <select value={payment} onChange={(event) => setPayment(event.target.value)} className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-3">
                    {methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>

                  {payment === 'CASH' && (
                    <div className="mb-3 flex gap-2">
                      <div className="flex-1 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold">{sessions[0] ? 'Caixa aberto' : 'Caixa fechado'}</div>
                      {!sessions[0] && <button type="button" onClick={() => void openCash()} className="touch-target rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white">Abrir</button>}
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCart([])} className="touch-target rounded-xl border border-stone-200 px-4 py-3 font-bold">Limpar</button>
                <button type="button" onClick={() => void submit()} disabled={cart.length === 0 || sending} className="touch-target rounded-xl bg-amber-500 px-4 py-3 font-black disabled:opacity-40">
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
