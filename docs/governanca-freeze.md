# Freeze Governança — roteiro de encerramento

Esta baseline encerra a etapa Governança sem adicionar funcionalidade nova.

## Comportamento certificado

- O fluxo existente da Governança continua usando o Kanban oficial do setor.
- As etapas permanecem `A limpar -> Em limpeza -> Inspeção -> Liberado`.
- O read model operacional continua derivando o estado de limpeza a partir do card da Governança e, na ausência dele, dos campos operacionais já existentes do quarto.
- O vínculo com reservas, hóspedes, manutenção aberta e responsável continua sendo resolvido pelos modelos existentes.
- Persistência operacional do quarto continua usando a tabela `quartos` e confirma a etapa do Kanban na tabela `kanban_cards`.
- Nenhum novo estado, engine, fluxo, widget, schema, migration ou fonte de dados é introduzido por esta etapa.

## Fora de escopo até o encerramento do plano

- novo workflow de Governança;
- novas etapas de limpeza ou inspeção;
- novo Kanban;
- novos widgets;
- nova persistência ou fonte paralela;
- refatoração ampla;
- qualquer melhoria visual nova.

Após esta certificação, a próxima parte do roteiro fechado é somente certificar Manutenção existente.
