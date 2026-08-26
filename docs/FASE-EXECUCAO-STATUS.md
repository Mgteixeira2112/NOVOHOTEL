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
- Realtime e notificações.
- Testes automatizados e E2E.
- Build/typecheck e homologação.
- FASE 13: adoção incremental do `TenantService` na UI administrativa.
- FASE 13: validação da migration no projeto Supabase real e confirmação das contagens.
- FASE 13: políticas finais para operações de escrita administrativas.

## Regra

Não marcar a fase como concluída somente porque a tabela, função ou tela existe. A fase exige implementação, integração funcional, autorização, tratamento de erros e teste.
