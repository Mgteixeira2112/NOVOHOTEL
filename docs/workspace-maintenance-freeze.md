# Freeze Manutenção — roteiro de encerramento

Esta baseline encerra a etapa de Manutenção sem adicionar funcionalidade nova.

## Comportamento certificado

- O widget `MaintenanceWidget` continua usando o board oficial `kanban-board-manutencao`.
- A execução permanece delegada ao `TaskKanbanWidget` existente, sem criar engine, service ou fonte paralela.
- O Kanban continua usando `kanbanV2`, `kanbanCardGovernance`, realtime oficial e as verificações de acesso existentes.
- Edição, movimentação, atribuição, arquivamento e exclusão continuam condicionadas às permissões já existentes.
- O vínculo com quartos e o estado operacional permanecem no fluxo atual já certificado pelas etapas anteriores.

## Fora de escopo até o encerramento do plano

- novo workflow de Manutenção;
- novas colunas ou estados;
- novo Kanban;
- novos widgets;
- nova persistência, schema ou migration;
- refatoração ampla;
- qualquer melhoria visual não necessária para corrigir bloqueador.

Após esta certificação, a próxima parte do roteiro fechado é somente certificar o Kanban existente.