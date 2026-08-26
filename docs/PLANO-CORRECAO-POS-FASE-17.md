# Plano de Correção Pós-Fase 17

## Objetivo

Corrigir os bloqueadores encontrados na auditoria final da Fase 17 sem adicionar novas funcionalidades de negócio e sem avançar para uma nova fase.

## Ordem de execução

### P0.1 — Autenticação e MFA
- Migrar login legado para Supabase Auth.
- Mapear usuários existentes para `auth.users`.
- Remover dependência operacional de `Usuario.senha`.
- Validar MFA real no servidor.
- Testar login, logout, sessão, expiração, recuperação e brute-force.

### P0.2 — RLS e Multi-Tenant
- Aplicar todas as migrations em staging.
- Revisar policies históricas permissivas.
- Consolidar funções de autorização.
- Executar testes de isolamento Hotel A → Hotel B.
- Executar testes de IDOR e escalada de privilégio.

### P0.3 — Backend e operações críticas
- Identificar operações críticas ainda executadas diretamente pelo cliente.
- Centralizar autorização e validação no backend/RPC seguro.
- Validar `hotel_id`, `organization_id`, ator, permissões e recursos.
- Aplicar rate limit nas operações sensíveis.

### P0.4 — E2E financeiro e operacional
Validar o fluxo completo:

`RESERVATION → CHECK-IN → ROOM → TABLET → ORDER → KDS → DELIVERY → FOLIO → CHECKOUT → FINANCE → DASHBOARD`

### P1.1 — Concorrência e idempotência
- Reserva concorrente.
- Estoque concorrente.
- Pagamentos concorrentes.
- Caixa concorrente.
- Reenvio/retry.
- Duplo clique.
- Webhook duplicado.

### P1.2 — Event Center
- Validar worker persistente.
- Testar retry.
- Testar DEAD_LETTER.
- Testar reprocessamento.
- Validar isolamento por hotel.

### P1.3 — Realtime
- Testar canais por hotel.
- Confirmar autorização antes da inscrição.
- Validar pedidos, Kanban, quartos, notificações e dashboard.

### P1.4 — Backup e Recovery
- Executar backup real.
- Executar restore em ambiente isolado.
- Medir RPO/RTO.
- Documentar procedimento de recuperação.

### P1.5 — Performance
- Medir API.
- Medir banco.
- Detectar N+1.
- Analisar índices.
- Medir frontend/bundles.
- Executar load test e stress test.

### P1.6 — Compatibilidade e UX
- Validar mobile/tablet/desktop.
- Validar PDV, tablet do quarto, housekeeping e cozinha.
- Testar Safari/iOS, Android, Chrome, Edge e Firefox.
- Executar revisão de acessibilidade.

## Critérios de encerramento

A correção só será considerada concluída quando houver evidência de:

- build verde;
- lint/TypeScript verde;
- migrations aplicadas em staging;
- RLS validado;
- segurança validada;
- E2E aprovado;
- concorrência aprovada;
- backup e restore aprovados;
- performance medida;
- compatibilidade validada;
- documentação atualizada.

## Regra de governança

Não alterar `main` diretamente. Cada correção deve ser executada em branch própria, validada e revisada antes de qualquer merge.

Não avançar para outra fase funcional enquanto os bloqueadores desta auditoria permanecerem.
