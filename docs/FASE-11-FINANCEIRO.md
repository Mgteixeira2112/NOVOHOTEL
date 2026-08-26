# FASE 11 — Financeiro Administrativo

## Separação
- Folio: consumo e conta da hospedagem.
- Operação: reservas, PDV, pedidos, estoque.
- Financeiro: títulos, receitas, despesas, banco e conciliação.

## Novas estruturas
chart_of_accounts, cost_centers, accounts_receivable, accounts_payable, financial_transactions, bank_accounts, bank_transactions, reconciliations, cash_variances, recurring_expenses e finance_approval_rules.

## Regras
Transações definitivas não são apagadas. Correções devem usar REVERSAL, ADJUSTMENT ou REFUND. Contas suportam pagamento parcial e geração de transação rastreável pela origem.

## Fluxo
Folio/PDV/Reserva -> título ou transaction source -> financial_transaction -> caixa/banco -> reconciliação.

## Próximos passos
Executar migration em staging, validar schema real de permissions e supplier, integrar dashboard administrativo e implementar matching automático de conciliação sobre extratos reais.
