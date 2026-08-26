# FASE 06 — PDV + Room Service + Tablet + KDS

## Escopo implementado

- PDV usando `pdv_produtos`, `pdv_pedidos` e `pdv_itens_pedido` existentes.
- Preço e total recalculados no banco.
- Idempotência por `hotel_id + idempotency_key`.
- Room Service exige Stay ativa e Folio aberto.
- Tablet exige dispositivo ativo, token válido e quarto previamente associado.
- KDS por item e setor: COZINHA, BAR, CAFETERIA e OUTROS.
- SLA preparado por item.
- Caixa separado em register/session/movements.
- Pagamentos CASH, PIX, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER e OTHER.
- Estoque com ledger canônico `hotel_os_stock_movements`, preservando o ledger legado.
- Folio recebe lançamentos de POS/ROOM_SERVICE/TABLET sem duplicação por referência.
- Cancelamento, desconto e estorno passam por permissões server-side.
- Checkout invalida sessões de tablet e marca o dispositivo para reset.
- Realtime preparado para pedidos, itens, KDS, caixa e dispositivos.
- `PrintService` desacopla impressão do domínio.

## Arquitetura

UI → feature/service → repository → RPC → PostgreSQL/RLS

O frontend não é autoridade para preço, hotel, Stay, Folio, dispositivo ou permissão.

## Compatibilidade

As tabelas e componentes legados permanecem. As migrations são aditivas e promovem o modelo existente em vez de criar um segundo PDV independente.

## Validação

O repositório possui scripts `lint`, `test` e `build` e foi adicionada uma pipeline GitHub Actions para executar os três. Nesta sessão não houve execução de runner disponível nem conexão com uma instância Supabase de staging; portanto a validação remota de build, migrations e RLS deve ser considerada pendente.

## Próxima fase

A FASE 7 não deve ser iniciada automaticamente. Antes dela, recomenda-se validar as migrations em staging, executar os testes de RLS/concurrency com dados reais e revisar a navegação exclusiva do perfil PDV.
