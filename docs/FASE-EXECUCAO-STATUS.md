# HOTEL OS — Status de Execução

## Concluído nesta linha de desenvolvimento

- Branch isolada para o plano mestre.
- Fundação multi-hotel/organização adicionada.
- Estrutura de camas por quarto adicionada.
- Índices de hotel/reserva/quarto adicionados.
- Modelo consolidado de PDV criado.
- Modelo consolidado de tablet/dispositivo/sessão criado.
- Busca de disponibilidade por período, capacidade, bloqueios, conflitos e tipo de cama criada na migration do domínio de reservas/PDV.
- Fundação de Supabase Auth/RBAC adicionada.
- Adapter de autenticação criado para novos fluxos.
- Critérios de Go-Live documentados.
- Migration duplicada de busca de disponibilidade removida para evitar conflito de assinatura SQL.
- FASE 13: `organizations` consolidada como tenant raiz.
- FASE 13: `hoteis.organization_id` obrigatório e backfill seguro para organização padrão.
- FASE 13: `organization_memberships` adicionada para escopo organizacional.
- FASE 13: roles globais e roles por hotel preparados sem duplicar RBAC.
- FASE 13: funções de acesso a organização/hotel/permissão fortalecidas.
- FASE 13: feature flags por hotel/organização/plano preparadas.
- FASE 13: configurações Organization → Hotel preparadas.
- FASE 13: planos, subscriptions e billing events técnicos preparados para SaaS.
- FASE 13: contexto organizacional derivado adicionado a dispositivos, sessões, auditoria, eventos e tarefas.
- FASE 13: repository/service de tenant e políticas puras de isolamento adicionados.
- FASE 14: catálogo central de eventos criado.
- FASE 14: `event_log` persistente com estados, retry, dead-letter e idempotência criado.
- FASE 14: `notification_rules`, `notifications` e `notification_preferences` criadas.
- FASE 14: presença de usuários/dispositivos preparada com `device_presence`.
- FASE 14: autorização de leitura de eventos/notificações/presença vinculada ao escopo multi-hotel.
- FASE 14: função backend `emit_event()` criada para emissão idempotente.
- FASE 14: tipos TypeScript e políticas de processamento/realtime adicionados.
- FASE 14: NotificationService base adicionado, incluindo regras e quiet hours.
- FASE 14: testes de política de eventos adicionados.

## Em andamento / obrigatório antes do Go-Live

- Migrar a UI de login para o Auth Adapter.
- Mapear usuários existentes para `auth_user_id`.
- RBAC server-side completo.
- RLS definitivo por organização/hotel em todas as entidades.
- Remoção das políticas permissivas legadas após validação.
- Remoção segura da dependência de senha local.
- Integração das telas existentes com os novos modelos.
- Transação/concorrência para confirmação de reservas.
- Fluxo operacional completo do PDV.
- Fluxo do tablet do quarto.
- Cozinha/KDS integrado.
- Estoque e financeiro integrados ao PDV.
- Integração dos produtores legados ao `emit_event()`.
- Worker/processor de eventos para executar retry/dead-letter em produção.
- Adapter de entrega REALTIME/PUSH/EMAIL/SMS/WHATSAPP.
- Presença realtime completa.
- Testes automatizados e E2E.
- Build/typecheck e homologação.
- FASE 13: adoção incremental do `TenantService` na UI administrativa.
- FASE 13: validação da migration no projeto Supabase real e confirmação das contagens.
- FASE 13: políticas finais para operações de escrita administrativas.
- FASE 14: validação da migration no projeto Supabase real.
- FASE 14: integração dos módulos existentes sem duplicar emissão de eventos.

## Regra

Não marcar a fase como concluída somente porque a tabela, função ou tela existe. A fase exige implementação, integração funcional, autorização, tratamento de erros e teste.
