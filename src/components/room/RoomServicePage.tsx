import React, { useEffect, useMemo, useState } from 'react';
import { criarPedidoPdv, listarProdutosPdv } from '../../services/pdvService';
import type { PdvProduct } from '../../services/pdvService';

type CartItem = {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
};

export const RoomServicePage: React.FC<{
  hotelId?: string;
  quartoId?: string;
}> = ({ hotelId, quartoId }) => {
  const [products, setProducts] = useState<PdvProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    void listarProdutosPdv().then((result) => {
      if (mounted) setProducts(result);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0),
    [cart],
  );

  const add = (product: PdvProduct) => {
    setCart((current) => {
      const existing = current.find((item) => item.produto_id === product.id);

      if (existing) {
        return current.map((item) =>
          item.produto_id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          produto_id: product.id,
          nome: product.nome,
          quantidade: 1,
          preco_unitario: product.preco,
        },
      ];
    });
  };

  const send = async () => {
    if (!hotelId || !quartoId || cart.length === 0) {
      setMessage('Quarto ou itens inválidos.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await criarPedidoPdv({
        hotelId,
        origem: 'ROOM_SERVICE',
        quartoId,
        idempotencyKey: crypto.randomUUID(),
        itens: cart.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
        })),
        chargeToRoom: true,
      });

      setCart([]);
      setMessage('Pedido enviado para preparação.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 text-stone-900 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Hotel OS • Tablet</p>
          <h1 className="mt-1 text-3xl font-black">Room Service</h1>
          <p className="mt-1 text-sm text-stone-500">Pedido vinculado ao contexto seguro do quarto.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products
              .filter((product) => product.status === 'ACTIVE')
              .map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={product.status !== 'ACTIVE'}
                  onClick={() => add(product)}
                  className="rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm hover:shadow-md disabled:opacity-40"
                >
                  <div className="text-xs font-bold uppercase text-stone-400">{product.categoria}</div>
                  <div className="mt-2 font-bold">{product.nome}</div>
                  <div className="mt-3 text-lg font-black">
                    R$ {product.preco.toFixed(2).replace('.', ',')}
                  </div>
                </button>
              ))}

            {products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-sm text-stone-500">
                Nenhum produto disponível.
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-lg font-black">Seu pedido</h2>

          <div className="my-4 space-y-3">
            {cart.map((item) => (
              <div key={item.produto_id} className="flex justify-between gap-3 text-sm">
                <span>{item.quantidade}x {item.nome}</span>
                <strong>
                  R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}
                </strong>
              </div>
            ))}

            {cart.length === 0 && <p className="text-sm text-stone-400">Carrinho vazio.</p>}
          </div>

          <div className="border-t border-stone-100 pt-4">
            <div className="flex justify-between font-black">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>

            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || cart.length === 0}
              className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-4 font-bold text-white disabled:opacity-40"
            >
              {loading ? 'Enviando...' : 'Enviar pedido'}
            </button>

            {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
};
