# HOTEL OS — FASE 1: Auditoria e Fundação

## Escopo

Esta etapa foi executada de forma incremental na branch `plano-mestre-hotel-os`, sem substituir os módulos funcionais existentes e sem avançar para a implementação dos novos módulos operacionais.

## Auditoria realizada

### Contexts

- `HotelContext.tsx`: contexto crítico e excessivamente grande. Concentra estado global, persistência local, sincronização Supabase, autenticação legada, RBAC, segurança 2FA, reservas, quartos, hóspedes, pagamentos e seletores.
- `FrigobarContext.tsx`: responsabilidade relativamente delimitada; não foi fragmentado nesta etapa.
- `KanbanContext.tsx`: contexto grande e operacional; permanece intacto para evitar regressão.

### Services / acesso a dados

- `src/services/supabase.ts`: concentra cliente, DDL, health checks e operações CRUD. É um ponto crítico para futura separação repository/service.
- `src/services/kanbanService.ts`: acesso/serviços do Kanban já isolado parcialmente.
- `src/services/mediaService.ts`: serviço de mídia já isolado.
- `src/services/pdvService.ts`: serviço de PDV existente; não foi expandido nesta fase.
- `src/services/hotelOSEvents.ts`: serviço criado anteriormente para a fundação de eventos/tarefas do Hotel OS.

### Componentes críticos identificados

- `HotelContext.tsx` (~50 KB): maior risco arquitetural por concentração de responsabilidades.
- `KanbanContext.tsx` (~65 KB): grande superfície de estado e persistência.
- `CalendarReportModal.tsx`, `RoomControlModal.tsx`, `ReservationsModule.tsx`, `RBACMatrixEditor.tsx`, `SettingsModule.tsx` e `DashboardModule.tsx`: componentes extensos que merecem migração incremental posterior.

### Regras de negócio fora da camada de domínio

A disponibilidade de quartos está implementada em `src/utils/availability.ts`, incluindo sobreposição de datas, bloqueios, capacidade e cálculo de diárias. Isso é uma regra de negócio legítima, mas ainda está em `utils` e deve migrar gradualmente para domínio/service.

O `HotelContext` também concentra operações de reserva, check-in/out, quartos e usuários. A migração deve ser feita por operação, sem reescrita do contexto inteiro.

### Dados mockados

`src/data/mockInitialData` é usado pelo estado inicial/local do PMS. Não foi removido nesta fase porque isso poderia alterar o comportamento atual. Esses dados devem ser tratados como fallback/demo e nunca como fonte de verdade de produção.

### Realtime

Existe infraestrutura Supabase e a fundação do Event Bus do Hotel OS. Foi criada uma fronteira de subscription em `src/core/realtime`, sem alterar subscriptions existentes.

### Tipos

`src/types/index.ts` é a fonte atual de tipos compartilhados. Já contém tipos de usuários, RBAC, quartos, hóspedes, reservas, pagamentos e entidades Hotel OS. A duplicação de modelos Hotel OS entre tipos e serviços deve ser consolidada em uma etapa posterior, após validar o schema real.

### Dependências e riscos

- `App.tsx` monta `HotelProvider`, `FrigobarProvider` e `KanbanProvider` globalmente.
- `authAdapter.ts` já aponta para Supabase Auth, mas `HotelContext` ainda contém autenticação legada baseada em usuários locais.
- O schema legado ainda possui `usuarios.senha` e policies permissivas; não foram removidos por segurança de migração.
- `src/services/supabase.ts` contém credenciais/configuração legada e precisa ser simplificado posteriormente para consumir a configuração centralizada.
- A autorização atual também possui lógica no contexto/UI; o novo `permissionService` é uma fronteira pura para migração gradual.

## Fundação criada nesta fase

- `src/core/errors/appError.ts`
- `src/core/logging/logger.ts`
- `src/core/config/runtimeConfig.ts`
- `src/core/config/featureFlags.ts`
- `src/core/permissions/permissionService.ts`
- `src/core/events/eventBus.ts`
- `src/core/realtime/realtimeClient.ts`
- `src/core/realtime/index.ts`
- `src/repositories/reservationsRepository.ts`
- `src/services/reservationService.ts`
- `tests/core-foundation.test.ts`

## Decisões

1. Nenhum componente existente foi substituído.
2. Nenhuma funcionalidade existente foi removida.
3. Nenhum novo PDV, tablet, KDS, Kanban ou Financeiro foi implementado nesta fundação.
4. Nenhuma policy RLS legada foi removida.
5. Nenhuma senha local foi removida.
6. Nenhuma migração ampla de `HotelContext` foi feita.
7. As novas abstrações são opt-in e não alteram o fluxo atual até serem adotadas por uma feature.

## Validação

O projeto não possuía runner de testes configurado no `package.json`; foi utilizado o `tsx` já presente nas dependências de desenvolvimento para executar testes TypeScript com `node:test`.

Validação de build/typecheck deve ser executada contra o checkout da branch após estas alterações. A fase só deve ser considerada homologada quando build, lint/typecheck e testes concluírem sem erro.

## Próxima etapa — FASE 2

Não executar automaticamente nesta entrega. Recomenda-se começar pela migração controlada de autenticação para o `authAdapter`, seguida de autorização baseada em Supabase Auth/RBAC e somente então revisar as policies RLS.
