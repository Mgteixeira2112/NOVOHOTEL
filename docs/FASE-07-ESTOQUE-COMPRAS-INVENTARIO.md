# FASE 7 — Estoque, Compras, Fornecedores e Inventário

## Modelo central

`Product → StockItem → StockMovement`.

Os módulos PDV, cozinha, bar, frigobar, lavanderia e compras compartilham o mesmo produto e o mesmo ledger de estoque. A FASE 6 já havia criado um ledger canônico; a FASE 7 adiciona locais, saldo por local, custo médio, fornecedores, compras e inventário físico sem apagar o modelo anterior.

## Estruturas

- `hotel_os_stock_locations`
- `hotel_os_stock_items`
- `hotel_os_stock_movement_v2`
- `hotel_os_suppliers`
- `hotel_os_supplier_products`
- `hotel_os_purchase_orders`
- `hotel_os_purchase_order_items`
- `hotel_os_purchase_receipts`
- `hotel_os_inventories`
- `hotel_os_inventory_items`

Locais: WAREHOUSE, KITCHEN, BAR, MINIBAR, LAUNDRY e OTHER.

Movimentos: PURCHASE, SALE, CONSUMPTION, TRANSFER, ADJUSTMENT, RETURN, WASTE, EXPIRATION e INITIAL_BALANCE.

## Operações

`hotel_os_apply_stock_movement()` bloqueia o saldo lógico da combinação produto/local, impede saldo negativo e recalcula custo médio ponderado em entradas com custo.

`hotel_os_transfer_stock()` registra duas pernas: saída no local de origem e entrada no destino.

## Camada frontend

`inventoryRepository.ts` centraliza consultas e RPCs.

`inventoryService.ts` fornece dashboard agregado e operações de movimento/transferência.

## Compatibilidade

Nenhuma tabela legada foi removida. `pdv_produtos` recebe somente colunas aditivas de unidade e níveis de estoque.

## Validação pendente

A migration precisa ser executada em staging antes de produção. Também devem ser executados lint, testes, build e testes reais de RLS e concorrência contra o Supabase. Não avance automaticamente para a FASE 8.
