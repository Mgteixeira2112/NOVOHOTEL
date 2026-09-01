# Fábrica de Workspaces 2.0 — Freeze

## Estado

**CERTIFICAÇÃO DE ARQUITETURA / FREEZE**

A Fábrica de Workspaces 2.0 consolida o fluxo de apresentação do Hotel OS em:

`Engine/Service → Widget → Workspace → Fábrica`

O Freeze não congela regras de negócio dos engines. Ele protege a arquitetura de apresentação para que novas capacidades não voltem a criar telas paralelas, fontes duplicadas ou widgets ficticiamente prontos.

## Baseline protegida

- Workspaces oficiais são gerados pela Factory e expostos pelo registry.
- Desktop, Mobile e KDS/TV usam o mesmo Workspace com estratégias de apresentação independentes.
- A biblioteca diferencia templates de instâncias persistidas do hotel.
- Widgets possuem maturidade explícita; itens sem contrato funcional permanecem `planned`.
- Widgets `ready` devem possuir renderer runtime.
- O Financeiro administrativo entra pelo `workspace-financeiro` oficial.
- O Workspace Financeiro usa somente `financial-overview`, `financial-summary`, `financial-receivables`, `financial-payables` e `financial-transactions`.
- PIX, gateways e links de pagamento permanecem fora da composição enquanto não houver contrato oficial certificado.
- O módulo financeiro administrativo legado e seus subcomponentes órfãos permanecem removidos.

## Regra após o Freeze

Mudanças futuras na camada visual devem preservar os contratos acima. A próxima evolução visual — fundos/templates, posicionamento espacial de widgets e menu lateral configurável — deve ser construída sobre esta baseline, sem recriar engines, persistência ou caminhos administrativos paralelos.

## Evidência automática

O arquivo `tests/workspace-factory-2-freeze.test.ts`, junto dos testes existentes de runtime, Factory, responsividade, catálogo, RBAC e widgets financeiros, é o guardrail de regressão da certificação.
