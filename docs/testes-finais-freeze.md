# Testes finais — gate de encerramento

Este gate não adiciona módulos, telas, engines, estados, automações ou fontes de dados. Ele executa e consolida as certificações já aprovadas no roteiro fechado.

## Execução obrigatória

1. `bun run lint`
2. `bun run test`
3. `bun run build`
4. `bun run audit:production`

O workflow `Hotel OS validation` executa os quatro comandos em sequência. Uma falha impede build, auditoria, merge e avanço para Homologação.

## Cobertura consolidada

- autenticação Supabase e RBAC;
- persistência e recarga dos Workspaces;
- Mobile, KDS/TV e superfícies Desktop;
- Mapa de Quartos, Recepção, Governança e Manutenção;
- Kanban e widgets auxiliares;
- Financeiro e integridade operacional;
- check-in, checkout, transferências e projeções fixas;
- regressões contra mocks, engines e persistências paralelas.

## Critério de saída

Os dois pipelines da PR devem permanecer verdes no mesmo SHA. A auditoria live deve preservar os inventários certificados e não apresentar órfãos, duplicidades ou documentos persistidos inválidos.
