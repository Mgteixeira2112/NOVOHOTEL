# Freeze dos widgets auxiliares — roteiro de encerramento

Esta baseline certifica somente os widgets auxiliares já existentes, sem adicionar funcionalidade nova.

## Comportamento certificado

- `DashboardWidget` continua usando `dashboardEngine`, `tenantService` e o catálogo oficial de métricas.
- `FrigobarWidget` continua usando `frigobarCore`, identidade oficial do hotel e apenas hospedagens com check-in realizado.
- `TeamWidget` continua derivando a equipe dos usuários ativos e dos vínculos setoriais existentes.
- `UserAccessWidget` permanece apenas como adaptador de apresentação de `UsersOperationalAccessModule`; RBAC e persistência continuam pertencendo ao módulo existente.
- `AutomationAdminWidget` permanece apenas como adaptador visual de `AutomationModule`.
- `HotelOSCommandCenterWidget` permanece apenas como adaptador visual de `HotelOSCommandCenter`.
- `QuickActionsWidget` continua apenas navegando para widgets já presentes e habilitados no mesmo Workspace.
- Ações rápidas continuam respeitando `enabled`, `permissions.view`, `widget.actions` e a prontidão do catálogo existente.
- Nenhum destes widgets auxiliares passa a possuir engine, service, repository, migration ou fonte de dados paralela.

## Fora de escopo até o encerramento do plano

- novos widgets auxiliares;
- novas ações operacionais;
- novos módulos administrativos;
- nova persistência, schema ou migration;
- novos engines ou services;
- novas fontes financeiras;
- refatoração ampla;
- melhoria visual não necessária para corrigir bloqueador.

Após CI verde e merge, a próxima parte do roteiro fechado é somente certificar o Financeiro existente.
