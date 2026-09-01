# Editor Visual 3.0 — Runtime espacial Desktop

Este corte ativa coordenadas persistidas apenas no Desktop.

## Regras

- Widgets sem `presentation.desktop.x/y` permanecem no fluxo automático existente.
- Widgets com `presentation.desktop.x/y` são removidos do fluxo automático e renderizados sobre a superfície do Workspace.
- A geometria reutiliza `workspaceSpatialRuntime.ts`.
- O fundo configurado por `presentation.surface` só é aplicado ao runtime quando existe ao menos um widget espacial.
- Mobile e KDS continuam usando o fluxo atual, sem coordenadas livres.
- Header continua acima dos widgets livres pela hierarquia de `z-index` já existente.

## Compatibilidade

A implementação preserva `renderDesktopSurface()` e os guardrails atuais de Masonry, painéis conectados e faixa horizontal de botões. Nenhum engine de negócio, service, repository, migration, RBAC ou fonte de dados é alterado neste corte.
