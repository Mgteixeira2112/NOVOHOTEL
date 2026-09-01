# Integridade operacional — roteiro de encerramento

Esta etapa não adiciona fluxo, status, widget ou engine. Ela valida a coerência entre o estado oficial do quarto, Recepção, Governança, Manutenção e as projeções Kanban já existentes.

## Contratos certificados

- Check-in, checkout e transferência continuam executados pelos RPCs oficiais de Recepção.
- Check-in direto continua atômico pelo RPC existente.
- `quartos` permanece a fonte canônica do estado operacional do quarto.
- Governança continua seguindo o fluxo existente `A limpar → Em limpeza → Inspeção → Liberado`.
- Manutenção continua afetando o estado operacional e a disponibilidade pelo lifecycle já existente.
- Mapa de Quartos e Kanbans permanecem projeções do estado oficial, não fontes concorrentes.

## Correção de integridade encontrada na auditoria live

A auditoria somente leitura do banco encontrou 8 quartos e 21 cards marcados como `fixed_room_projection`. Cinco quartos possuíam duas projeções de Manutenção: a projeção legada `auto-man-room-*` e a projeção canônica `room-man-*`.

A correção desta etapa apenas:

1. executa o sincronizador canônico já existente para todos os quartos;
2. remove a projeção legada de bootstrap somente quando a canônica equivalente existir;
3. cria um índice único parcial em `(room_id, board_id)` para impedir nova duplicação de projeções fixas.

Nenhum card operacional comum, tarefa manual, workflow ou estado de negócio é removido.

## Critério de saída

Após a migration ser aplicada e revalidada no banco real, cada quarto deve possuir exatamente uma projeção fixa de Governança e uma de Manutenção, sem órfãos e sem duplicidade por `(room_id, board_id)`. A etapa só pode ser congelada após CI verde e auditoria live novamente verde.
