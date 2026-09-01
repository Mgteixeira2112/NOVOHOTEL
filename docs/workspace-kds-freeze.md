# Freeze KDS/TV — roteiro de encerramento

Esta baseline encerra a etapa KDS/TV sem adicionar funcionalidade nova.

## Comportamento certificado

- KDS/TV continua no `WidgetDrivenWorkspace` oficial.
- Orientação, densidade, distância de visualização, fullscreen e realtime permanecem exatamente nos contratos já existentes.
- Ocultação de controles administrativos e de edição continua condicionada à configuração existente.
- Widgets incompatíveis continuam filtrados no modo automático pelo catálogo oficial.
- RBAC, `enabled`, `permissions.view` e resolução de apresentação permanecem no caminho oficial existente.
- Nenhuma fonte de dados, service, repository, schema, migration ou persistência paralela é criada por esta etapa.

## Fora de escopo até o encerramento do plano

- novo modo KDS/TV;
- editor espacial KDS/TV;
- novos widgets;
- novas fontes de dados;
- novo contrato de apresentação;
- nova persistência;
- qualquer melhoria visual não necessária para corrigir um bloqueador.

Após esta certificação, a próxima parte do roteiro fechado é somente finalizar/certificar o Mapa de Quartos existente.
