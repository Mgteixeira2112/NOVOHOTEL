# Freeze dos widgets auxiliares — roteiro de encerramento

Esta baseline certifica somente os widgets auxiliares de apresentação já existentes, sem adicionar funcionalidade nova.

## Comportamento certificado

- `AutomationAdminWidget` permanece apenas como adaptador visual de `AutomationModule`.
- `HotelOSCommandCenterWidget` permanece apenas como adaptador visual de `HotelOSCommandCenter`.
- `QuickActionsWidget` continua apenas navegando para widgets já presentes e habilitados no mesmo Workspace.
- Ações rápidas continuam respeitando `enabled`, `permissions.view`, `widget.actions` e a prontidão do catálogo existente.
- A abertura de ações rápidas continua reutilizando o widget alvo existente por popup ou foco/scroll; nenhum runtime paralelo é criado.
- Nenhum destes widgets auxiliares passa a possuir persistência, service, repository, migration ou fonte de dados próprios.

## Fora de escopo até o encerramento do plano

- novos widgets auxiliares;
- novas ações operacionais;
- novos módulos administrativos;
- nova persistência, schema ou migration;
- novos engines ou services;
- novas fontes financeiras;
- refatoração ampla;
- melhoria visual não necessária para corrigir bloqueador.

Após esta certificação, a próxima etapa deve se limitar à limpeza/certificação final da Fábrica de Workspaces e seus guardrails, sem reabrir engines congeladas.
