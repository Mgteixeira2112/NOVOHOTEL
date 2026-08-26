# FASE 10 — Folio, PDV, Room Service, Tablet e Pagamentos

A fase consolida estruturas existentes das fases 5, 6 e 7 sem criar um segundo PDV, segundo pedido ou segundo Folio.

## Fluxo

`ORDER/POS/MINIBAR/ROOM_SERVICE -> FolioItem -> Folio -> Payment -> Checkout`

## Idempotência

FolioItem usa `folio_id + source + source_id` quando a origem possui identificador. Repetir o mesmo comando retorna o lançamento existente.

## Pagamentos

`hotel_os_payments` complementa, sem remover, `hotel_os_transactions`. Métodos: CASH, CREDIT_CARD, DEBIT_CARD, PIX, BANK_TRANSFER e OTHER. Pagamentos parciais são calculados a partir dos lançamentos ativos.

## Descontos e estornos

Descontos são auditáveis. Void não apaga FolioItem: altera status e registra motivo, data e operador.

## Split

Payers e allocations preparam divisão por hóspede, empresa, agência ou outro pagador sem duplicar o item original.

## Segurança

Operações passam por RPC, validam acesso ao hotel e usam RLS por hotel. Valores são recalculados no banco.
