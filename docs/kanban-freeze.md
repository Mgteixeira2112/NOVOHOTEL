# Freeze Kanban — roteiro de encerramento

Esta baseline encerra a etapa Kanban sem adicionar funcionalidade nova.

## Comportamento certificado

- O runtime oficial continua em `TaskKanbanWidget`.
- Leitura e mutações continuam no `kanbanV2` e no `kanbanCardGovernance` existentes.
- Realtime continua usando `subscribeKanbanRealtime`.
- Visibilidade e ações continuam condicionadas ao contrato existente em `kanbanAccess` e às permissões do widget.
- Arquivamento continua sendo exclusão lógica; exclusão definitiva permanece restrita ao caminho administrativo existente.
- Mudança de setor continua usando os boards/colunas já configurados no `kanbanCardGovernance`.
- Nenhum estado operacional paralelo, novo board, nova coluna, nova automação, schema, migration ou fonte de dados é criado por esta etapa.

## Fora de escopo até o encerramento do plano

- novo Kanban Engine;
- novos tipos de card;
- novos boards ou colunas;
- novas automações;
- novas permissões;
- nova persistência;
- refatoração ampla;
- qualquer melhoria visual não necessária para corrigir um bloqueador.

Após esta certificação, a próxima parte do roteiro fechado é somente certificar os widgets auxiliares existentes.
