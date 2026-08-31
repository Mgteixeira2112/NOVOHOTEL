# Auditoria Financeiro — Fonte de Verdade

Base auditada: `main` em `721268f278e60515389623c642c48c5ad481eb8c`.

## Objetivo

Mapear o estado real do Financeiro antes de qualquer conversão em widgets ou criação de Workspace Financeiro. Esta etapa não altera engines, schemas, migrations, tabelas, RPCs, serviços ou regras de negócio.

## Resultado executivo

O repositório já contém um Financial Engine canônico para Folio/hospedagem e migrations de Financeiro Administrativo, porém a UI administrativa atual ainda mistura dados reais com estado local/mock. Além disso, no projeto Supabase conectado, as estruturas administrativas previstas pela migration de Fase 11 não estão presentes no schema real consultado.

Conclusão: **não é seguro transformar o `FinancialModule` atual em widgets especializados ainda**. Primeiro é necessário corrigir a fonte de dados da camada administrativa, reutilizando os contratos oficiais já existentes e sem criar um segundo motor financeiro.

## 1. Financial Engine já existente

A migration `20260829000500_financial_engine_v1.sql` consolida Folio e pagamentos sobre as tabelas existentes e expõe RPCs canônicas e idempotentes:

- `hotel_os_financial_add_charge`
- `hotel_os_financial_receive_payment`
- `hotel_os_financial_folio_snapshot`
- `hotel_os_financial_folio_snapshot_by_stay`
- `hotel_os_financial_can_checkout`
- `hotel_os_financial_close_folio`

Este é o contrato oficial para conta da hospedagem/Folio. Não deve ser duplicado dentro de componentes ou Workspaces.

## 2. Financeiro Administrativo previsto no repositório

A migration `20260827090000_phase11_administrative_finance.sql` prevê as seguintes estruturas oficiais:

- `hotel_os_chart_of_accounts`
- `hotel_os_cost_centers`
- `hotel_os_accounts_receivable`
- `hotel_os_accounts_payable`
- `hotel_os_financial_transactions`
- `hotel_os_bank_accounts`
- `hotel_os_bank_transactions`
- `hotel_os_reconciliations`
- `hotel_os_cash_variances`
- `hotel_os_recurring_expenses`
- `hotel_os_finance_approval_rules`

Também prevê `hotel_os_settle_financial_account(...)` para liquidação rastreável de contas a pagar/receber.

## 3. Divergência encontrada na UI atual

`src/components/admin/FinancialModule.tsx` ainda importa `INITIAL_EXPENSES`, `INITIAL_RECEIVABLES`, configurações PIX/gateway e links de pagamento de `mockFinancialData`.

O módulo também persiste localmente, por `localStorage`, pelo menos:

- despesas;
- contas a receber;
- chaves PIX;
- configuração PSP;
- gateways;
- links de pagamento.

As ações de criar, quitar e excluir despesas/recebíveis modificam somente estado React/localStorage. O simulador de webhook PIX também cria um recebível apenas local. Portanto estas rotinas **não representam a fonte financeira administrativa oficial**.

## 4. Receita exibida no módulo

A receita principal exibida pelo `FinancialModule` é calculada a partir de `payments` do `HotelContext`.

O `HotelContext` ainda inicializa `payments` por `localStorage` com fallback em `INITIAL_PAYMENTS`, embora possua sincronização com funções Supabase. Isto significa que a tela administrativa ainda não está isolada sobre o Financial Engine/Folio como única fonte.

## 5. Estado real do Supabase consultado

No projeto Supabase conectado `awyxubhwtdgwnssvajnr`, a inspeção read-only encontrou:

- `hotel_os_folios`;
- `hotel_os_folio_items`;
- `hotel_os_transactions`;
- todas as seis RPCs `hotel_os_financial_*` do Financial Engine v1.

Por outro lado, não foram encontradas as tabelas administrativas da Fase 11 listadas acima. A consulta ao histórico `supabase_migrations.schema_migrations` também não retornou as versões `20260827090000`, `20260829000500` ou `20260829021000` como migrations registradas, apesar de parte dos objetos do Financial Engine existir no banco.

Isto indica divergência entre o histórico do repositório e o schema efetivo conectado. Nenhuma migration deve ser aplicada automaticamente como parte desta auditoria.

## 6. Fronteiras que devem permanecer separadas

### Folio / conta da hospedagem

Fonte oficial: Financial Engine existente sobre `hotel_os_folios`, `hotel_os_folio_items` e `hotel_os_transactions`.

Fluxo esperado: `ORDER/POS/MINIBAR/ROOM_SERVICE -> FolioItem -> Folio -> Payment -> Checkout`.

### Financeiro administrativo

Fonte desejada: estruturas oficiais de contas a pagar/receber, transações financeiras, banco e conciliação já desenhadas na Fase 11, depois de validar o schema real.

Não deve usar `mockFinancialData` nem `localStorage` como fonte persistente de produção.

## 7. Ordem correta de correção

1. Não criar Workspace Financeiro ainda.
2. Não criar novos engines ou novas tabelas.
3. Confirmar quais estruturas administrativas oficiais existem realmente no ambiente Supabase de produção/staging.
4. Reconciliar migration histórica x schema real antes de qualquer DDL.
5. Criar/ajustar uma camada de serviço frontend que leia e escreva exclusivamente nos contratos financeiros oficiais já aprovados.
6. Migrar `FinancialModule` para essa camada, removendo mock/localStorage das rotinas financeiras reais.
7. Somente depois dividir o Financeiro em widgets especializados de apresentação.
8. Só então criar o template/Workspace Financeiro na família de gestão da Fábrica.

## 8. Critério de saída desta fase

A Fase de correção de fontes estará concluída quando:

- nenhuma ação financeira de produção depender de `mockFinancialData` ou `localStorage`;
- Folio continuar usando exclusivamente o Financial Engine existente;
- contas a pagar/receber e conciliação usarem as estruturas administrativas oficiais efetivamente existentes no Supabase;
- nenhuma tabela, engine ou persistência paralela tiver sido criada;
- testes garantirem a ausência de fallback financeiro local nas rotinas de produção.
