# Freeze do Financeiro — roteiro de encerramento

Esta baseline certifica somente o Financeiro já existente, sem adicionar funcionalidade nova.

## Comportamento certificado

- `FinancialSummaryWidget` continua derivando receita operacional por `useOperationalRevenueUi`.
- `CertifiedFinancialOverviewWidget` continua combinando somente `useOperationalRevenueUi` e `useAdministrativeFinanceUi`.
- `FinancialReceivablesWidget` e `FinancialPayablesWidget` continuam consumindo o Financeiro Administrativo existente.
- Operações sem contrato oficial continuam explicitamente indisponíveis, sem fallback simulado.
- A visão certificada continua recusando DRE completa quando as fontes oficiais não são suficientes.
- Nenhum widget financeiro introduz mock, engine paralelo, tabela, migration ou fonte de dados nova.

## Fora de escopo até o encerramento do plano

- novas métricas financeiras;
- DRE nova;
- gateway, PIX, link de pagamento ou integrações novas;
- novos contratos financeiros;
- novos widgets;
- nova persistência, schema ou migration;
- refatoração ampla;
- melhoria visual não necessária para corrigir bloqueador.

Após CI verde e merge, a próxima parte do roteiro fechado é somente a auditoria de integridade operacional de ponta a ponta.
