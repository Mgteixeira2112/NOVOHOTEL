# Workspace Mobile — Freeze de Encerramento

Esta baseline encerra a certificação Mobile sem adicionar funcionalidade nova.

## Contrato consolidado

- O Mobile usa o mesmo `WidgetDrivenWorkspace` e os mesmos widgets registrados no runtime oficial.
- Em modo automático, a composição é vertical e cada widget resolve largura total.
- Em modo personalizado, permanecem somente os overrides já existentes: `display`, `order`, `height`, `visual`, `header` e `hidden`.
- `summary` e `button` são apenas formas de apresentação do mesmo widget e abrem o renderer já registrado.
- RBAC, `enabled`, `permissions.view` e `hidden` são aplicados antes da composição.
- Recursos exclusivos do Editor Visual Desktop 3.0 — superfície espacial, `x/y` e sidebar — não alteram a estratégia Mobile.

## Fora de escopo

Não adicionar posicionamento livre Mobile, nova sidebar Mobile, novo runtime, novos widgets, novos contratos de dados ou nova persistência.

Qualquer alteração futura nesta baseline deve ser correção de bug comprovado ou trabalho pós-V1.