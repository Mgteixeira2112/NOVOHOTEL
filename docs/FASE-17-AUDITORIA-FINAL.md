# FASE 17 — Auditoria Final, Testes Integrados, Segurança, Performance, Homologação e Produção

## Resultado executivo

**STATUS FINAL: NÃO HOMOLOGADO PARA PRODUÇÃO.**

A auditoria foi realizada sobre a branch `plano-mestre-hotel-os` e sobre os artefatos das Fases 1–16 existentes no repositório. A Fase 17 corrigiu alguns invariantes críticos, mas não foi possível declarar Go-Live porque ainda existem dependências de autenticação legada, validação RLS no Supabase real, testes E2E/concorrência/carga/restore e integração operacional que exigem execução em ambiente real.

## Correções aplicadas na Fase 17

1. Auditoria `hotel_audit_log` recebeu proteção append-only para impedir UPDATE/DELETE por usuários autenticados comuns.
2. `emit_event()` passou a validar o catálogo do evento, derivar o ator de `auth.uid()`, validar organização/hotel e tratar concorrência da idempotência.
3. `hotel_os_financial_transactions` recebeu `idempotency_key`; a unicidade anterior por `source + source_id + type` foi removida para não colidir com pagamentos parciais.
4. Liquidação financeira passou a rejeitar tipos de conta inválidos e preserva o limite do saldo.
5. Fechamento de caixa deixou de somar duas vezes o movimento `OPENING`.
6. Pagamentos e transações financeiras deixaram de ter escrita direta por policy RLS; leitura continua disponível no escopo do hotel.
7. Referências financeiras a plano de contas, centro de custo e quarto passaram a ser validadas por hotel via trigger.
8. Foi criado `hotel_os_phase17_integrity_report()` para diagnóstico não destrutivo de referências sem tenant.
9. O helper de MFA cliente deixou de conter segredo compartilhado e códigos mestre universais; em produção a validação retorna `server_mfa_required`.
10. O workflow CI foi alinhado ao `bun.lock` com `bun install --frozen-lockfile`.
11. Foi criado `npm run audit:production`/`bun run audit:production` para inspeção estática de riscos conhecidos.

## Problemas críticos ainda existentes

### P0 — Autenticação legada
`HotelContext` ainda autentica usuários comparando a senha local armazenada em `Usuario.senha`, inclusive com fallback de senha. A UI `AdminLogin` continua dependente desse fluxo. Isso precisa ser migrado para Supabase Auth com mapeamento de usuários para `auth.users` antes do Go-Live.

### P0 — RLS final precisa ser comprovado no banco real
Existem migrations históricas com policies permissivas e diferentes funções de autorização (`usuario_pode_hotel`, `user_has_hotel_access` e modelos RBAC legados/novos). O código não permite afirmar que o estado final de um projeto Supabase real esteja correto sem aplicar todas as migrations e executar testes de isolamento.

### P0 — Backend/API não está separado de forma suficiente
Grande parte do domínio ainda é executada a partir de `HotelContext` e serviços cliente, com chamadas diretas ao Supabase. A camada server-side definitiva para autorização, operações críticas e rate limiting ainda precisa ser homologada.

### P1 — Operações críticas ainda dependem de RPCs parcialmente heterogêneas
Há coexistência de entidades e contratos legados e novos para PDV, pagamentos, eventos, dispositivos e financeiro. A consolidação deve ser validada com dados de teste antes de produção.

### P1 — Worker do Event Center
A estrutura de retry/dead-letter existe, mas o worker/processor persistente de produção ainda não foi comprovado.

### P1 — Realtime
A infraestrutura existe, porém a segurança e o isolamento de canais precisam de teste real com usuários de hotéis diferentes.

### P1 — Backup/restore
Há estruturas de política e registro de backup, mas não há evidência de restore real executado e validado.

## Testes

### Testes estáticos adicionados

- MFA sem bypass universal;
- ausência de segredo compartilhado no helper cliente;
- service worker sem acesso a storage de dados;
- workflow usando lockfile correto;
- migration de hardening presente.

### Testes existentes identificados

Existem suites TypeScript para foundation, segurança, reservas, stay/folio, PDV/KDS, estoque, tarefas operacionais, tenant, financeiro, BI e compatibilidade.

### Não comprovados nesta execução

- execução completa do test runner;
- build Vite;
- TypeScript/lint em ambiente instalado;
- migrations aplicadas no Supabase real;
- RLS com usuários/tenants reais;
- concorrência real de reserva/estoque/caixa/pagamento;
- E2E completo;
- load/stress test;
- restore de backup;
- compatibilidade real em Safari/iOS/Android/PDV/telas de cozinha.

O motivo é que o ambiente de execução desta auditoria não possui acesso de rede para instalar dependências/clonear o repositório localmente. O workflow CI foi corrigido para executar essas validações no GitHub, mas não houve run de CI recuperável para o commit desta auditoria durante a execução.

## Arquivos criados

- `supabase/migrations/20260826170000_phase17_final_hardening.sql`
- `scripts/phase17-production-audit.mjs`
- `tests/phase17-production-readiness.test.ts`
- `docs/FASE-17-AUDITORIA-FINAL.md`

## Arquivos modificados

- `.github/workflows/hotel-os-validation.yml`
- `package.json`
- `src/utils/securityHelper.ts`
- `docs/FASE-EXECUCAO-STATUS.md`

## Migrations

`20260826170000_phase17_final_hardening.sql`.

## Tabelas/estruturas afetadas

- `hotel_audit_log`
- `event_log`
- `hotel_os_financial_transactions`
- `hotel_os_payments`
- `hotel_os_reconciliations`
- `hotel_os_idempotency_keys`
- `pdv_cash_sessions`
- `pdv_cash_movements`
- `hotel_os_chart_of_accounts`
- `hotel_os_cost_centers`
- `quartos`
- `hotel_os_devices`

## Status por módulo

| Módulo | Status |
|---|---|
| Landing/PMS legado | Implementado, mas não homologado |
| Autenticação | **Bloqueado para Go-Live** — legado ainda presente |
| RBAC | Parcial / precisa validação server-side |
| RLS/Multi-hotel | Estrutura presente, validação real pendente |
| Reservas | Estrutura e RPCs presentes, concorrência real pendente |
| Hospedagem/Stay | Estrutura presente, E2E pendente |
| Folio | Estrutura e RPCs presentes, reconciliação E2E pendente |
| PDV | Estrutura/UI/RPCs presentes, homologação E2E pendente |
| Room Service/Tablet | Estrutura presente, device binding real pendente |
| KDS/Kanban | Estrutura presente, Realtime/E2E pendentes |
| Estoque | Estrutura presente, concorrência/integridade real pendentes |
| Housekeeping | Estrutura presente, fluxo E2E pendente |
| Manutenção | Estrutura presente, fluxo E2E pendente |
| Financeiro | Estrutura presente, reconciliação e permissões reais pendentes |
| Event Center | Estrutura presente, worker de produção pendente |
| Notificações | Base presente, adapters reais pendentes |
| BI/Dashboard | Implementado/preparado, validação contra dados reais pendente |
| PWA | Base implementada, compatibilidade real pendente |
| Offline | Somente fundação restrita; não homologado como sincronização completa |
| Auditoria | Hardening aplicado; cobertura real de todas operações pendente |
| Backup/Restore | Preparado, restore real pendente |
| Observabilidade | Parcial, operação em produção pendente |

## Critério de Go-Live

Não aprovado enquanto qualquer P0 permanecer.

Antes do Go-Live devem ser comprovados, no mínimo:

1. Supabase Auth e MFA reais;
2. remoção/isolamento definitivo da senha local;
3. RLS final aplicado e testado;
4. testes de IDOR e escalada de privilégio;
5. E2E completo reserva → checkout → financeiro → dashboard;
6. concorrência e idempotência;
7. Realtime isolado por tenant;
8. backup + restore comprovados;
9. load/stress;
10. staging/homologação com dados fictícios;
11. CI verde com build, lint e testes;
12. monitoramento e alertas ativos.

## Recomendação final

**Não avançar para outra fase.** O plano mestre terminou em FASE 17. O próximo trabalho deve ser tratado como estabilização/homologação e fechamento dos bloqueadores de produção, não como uma nova fase funcional.
