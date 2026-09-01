# Freeze Mapa de Quartos — roteiro de encerramento

Esta baseline encerra a etapa do Mapa de Quartos sem adicionar funcionalidade nova.

## Comportamento certificado

- O widget oficial continua sendo `ReceptionRoomMapWidget` dentro do runtime oficial de Workspaces.
- A projeção visual continua usando somente os cards canônicos da Recepção por meio de `selectCanonicalReceptionRoomCards`.
- A composição das linhas continua centralizada em `buildCanonicalReceptionRoomRows`.
- Check-in, check-out e transferência continuam delegados aos services oficiais da Recepção.
- Check-in direto continua delegado ao service oficial de hospedagem do hóspede.
- Ocupação continua proibida por movimentação manual de coluna; para ocupar o quarto deve ser usado o fluxo de Check-in.
- O estado de liberação pela Governança continua vindo da origem operacional já existente, sem fonte paralela.
- As ações continuam condicionadas ao contrato oficial do widget por `roomMapActionEnabled`.
- O contrato `roomMapPresentation` v2 continua preservando estratégias próprias para Desktop, Mobile e KDS/TV.
- Nenhuma nova fonte de dados, service, repository, schema, migration ou persistência paralela é criada por esta etapa.

## Fora de escopo até o encerramento do plano

- novo engine de quartos;
- nova projeção paralela;
- novo fluxo de check-in/check-out/transferência;
- nova persistência;
- novos widgets;
- refatoração ampla do módulo de Recepção;
- qualquer melhoria visual não necessária para corrigir um bloqueador.

Após esta certificação, o Mapa de Quartos fica congelado como referência funcional para as próximas etapas de homologação e rollout.