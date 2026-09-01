# Freeze Recepção — roteiro de encerramento

Esta baseline encerra a certificação estrutural da Recepção sem adicionar funcionalidade nova.

## Comportamento certificado

- A Recepção continua usando os módulos e widgets já existentes.
- Check-in, check-out e transferência permanecem nos services oficiais de hospedagem da Recepção.
- Check-in direto permanece no `receptionGuestStayService` e no RPC já existente.
- O Mapa de Quartos permanece baseado em projeção canônica, view model centralizado e cards permanentes.
- O Kanban da Recepção permanece no caminho oficial já existente.
- Reservas, hóspedes, chegadas, saídas, calendário, detalhes, alertas e indicadores permanecem apenas nas implementações já existentes; esta etapa não cria variantes paralelas.
- Nenhuma nova fonte de dados, service, repository, schema, migration ou persistência é criada.

## Fora de escopo até o encerramento do plano

- novos widgets de Recepção;
- novo fluxo de reserva;
- novo engine de check-in/check-out;
- novos estados operacionais;
- novo Kanban;
- nova persistência;
- refatoração ampla;
- qualquer melhoria visual não necessária para corrigir um bloqueador.

Após esta certificação, a próxima parte do roteiro fechado é somente certificar Governança existente.
