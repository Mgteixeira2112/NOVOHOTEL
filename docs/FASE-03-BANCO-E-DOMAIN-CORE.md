# FASE 3 — Banco de Dados e Domain Core

## Auditoria antes da alteração

O projeto já possuía um conjunto relevante de migrations para multi-hotel, quartos/camas, reservas atômicas, PDV/pedidos, conta do quarto, pagamentos, governança, estoque, Kanban e Event Bus. A migration 001 já adicionava `hotel_id` às entidades legadas e `quarto_camas`; a 007/008 já protegiam disponibilidade no servidor; as migrations 013–019 já separavam conta do quarto, pagamentos, checkout, governança e estoque. Portanto, esta fase não cria uma segunda implementação desses conceitos quando uma estrutura existente pode ser consolidada.

## Consolidação

- Organization/Hotel/User/Membership/Role/Permission/Device: permanecem nas estruturas das Fases 1/2.
- Room: `quartos`.
- RoomType: `tipos_quarto`.
- RoomBed: `quarto_camas` + catálogo `hotel_os_bed_types`.
- Guest: `hospedes`.
- Reservation: `reservas`.
- Stay: `hotel_os_stays`.
- StayGuest: `hotel_os_stay_guests`.
- Folio: `hotel_os_folios`.
- FolioItem: `hotel_os_folio_items`.
- Order: `pdv_pedidos`, exposto pelo view `hotel_os_orders`.
- OrderItem: `pdv_itens_pedido`.
- Product: `pdv_produtos`.
- ProductCategory: `hotel_os_product_categories`.
- InventoryMovement: `hotel_os_inventory_movements`, alimentado pelo ledger PDV existente.
- OperationalTask: `hotel_os_tasks`, já criado anteriormente e ampliado com tipo/origem.
- CashRegister: `hotel_os_cash_registers`.
- CashSession: `hotel_os_cash_sessions`.
- Transaction: `hotel_os_transactions`.
- AuditLog: `hotel_audit_log`, ampliado com actor/old/new data.
- DomainEvent: `hotel_os_events`, ampliado com versão e `occurred_at`.

## Reservation / Stay / Folio

A Reservation continua representando intenção/reserva. O Stay somente é criado automaticamente para reservas existentes marcadas pelo sistema como `checkin_realizado` ou `checkout_concluido`. O Folio é derivado da conta de quarto existente quando há Stay correspondente.

## Dados migrados

A migration usa `INSERT ... SELECT` com `ON CONFLICT DO NOTHING` para cópia incremental. Não há DELETE nem DROP de tabelas legadas. Só são migrados registros com `hotel_id` conhecido, evitando inventar tenant para dados ambíguos.

## Disponibilidade

A aplicação já possuía RPC transacional de criação de reserva e função server-side de validação, além de índice por hotel/quarto/período/status. Essa proteção foi preservada; não foi introduzida uma segunda regra de disponibilidade no frontend.

## Correção de compatibilidade

A migration de automação `20260826080000_hotel_os_automation_rules.sql` estava incompatível com o schema físico do Event Bus/Tasks: usava IDs textuais, status/priority em inglês e colunas de workflow inexistentes. Ela foi alinhada ao schema canônico antes de continuar a consolidação.

## Limitação deliberada

Não há backfill automático para registros legados sem `hotel_id`, pois atribuir um hotel por suposição poderia misturar tenants. Esses registros precisam de uma regra de mapeamento administrativo antes de qualquer migração definitiva.

## Validação

Foram criados testes unitários para os contratos de domínio. A execução de build/test/lint remoto depende de um ambiente com checkout e instalação das dependências; o ambiente desta sessão não fornece um workspace local completo nem acesso ao banco Supabase de produção.

## Fase 4

A próxima fase deve tratar a migração progressiva dos consumidores para os repositories/domain services, incluindo Reservation → Stay → Folio e a substituição gradual dos consumidores legados. Não foi implementada nesta fase.
