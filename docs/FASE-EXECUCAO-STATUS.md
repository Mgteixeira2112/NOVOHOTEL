# HOTEL OS — Status de Execução

## Concluído nesta linha de desenvolvimento

- Branch isolada para o plano mestre.
- Fundação multi-hotel/organização adicionada.
- Estrutura de camas por quarto adicionada.
- Índices de hotel/reserva/quarto adicionados.
- Modelo consolidado de PDV criado.
- Modelo consolidado de tablet/dispositivo/sessão criado.
- Busca de disponibilidade por período, capacidade, bloqueios, conflitos e tipo de cama criada na migration do domínio de reservas/PDV.
- Fundação de Supabase Auth/RBAC adicionada.
- Adapter de autenticação criado para novos fluxos.
- Critérios de Go-Live documentados.
- Migration duplicada de busca de disponibilidade removida para evitar conflito de assinatura SQL.
- FASE 13: `organizations` consolidada como tenant raiz.
- FASE 13: `hoteis.organization_id` obrigatório e backfill seguro para organização padrão.
- FASE 13: `organization_memberships` adicionada para escopo organizacional.
- FASE 13: roles globais e roles por hotel preparados sem duplicar RBAC.
- FASE 13: funções de acesso a organização/hotel/permissão fortalecidas.
- FASE 13: feature flags por hotel/organização/plano preparadas.
- FASE 13: configurações Organization → Hotel preparadas.
- FASE 13: planos, subscriptions e billing events técnicos preparados para SaaS.
- FASE 13: contexto organizacional derivado adicionado a dispositivos, sessões, auditoria, eventos e tarefas.
- FASE 13: repository/service de tenant e políticas puras de isolamento adicionados.
- FASE 14: catálogo central de eventos criado.
- FASE 14: `event_log` persistente com estados, retry, dead-letter e idempotência criado.
- FASE 14: `notification_rules`, `notifications` e `notification_preferences` criadas.
- FASE 14: presença de usuários/dispositivos preparada com `device_presence`.
- FASE 14: autorização de leitura de eventos/notificações/presença vinculada ao escopo multi-hotel.
- FASE 14: função backend `emit_event()` criada para emissão idempotente.
- FASE 14: tipos TypeScript e políticas de processamento/realtime adicionados.
- FASE 14: NotificationService base adicionado, incluindo regras e quiet hours.
- FASE 14: testes de política de eventos adicionados.
- FASE 15: camada oficial `MetricService` e snapshots diários de BI preparados.
- FASE 15: dashboard executivo e estruturas de metas/layout/relatórios criados.
- FASE 16: PWA, service worker, estado de conexão, fila offline restrita e abstrações de hardware adicionados.
- FASE 17: hardening append-only da auditoria e diagnóstico de integridade adicionados.
- FASE 17: correção de idempotência de transações financeiras para permitir pagamentos parciais sem colisão lógica.
- FASE 17: correção do cálculo de fechamento de caixa para não duplicar o valor de abertura.
- FASE 17: escrita direta de pagamentos e transações financeiras foi restringida a leitura pelo cliente autenticado; operações críticas devem passar por RPC/backend.
- FASE 17: MFA cliente foi colocado em fail-closed para produção e removidos códigos mestre/segredo compartilhado do frontend.
- FASE 17: pipeline de validação passou a usar `bun.lock` com instalação congelada.
- FASE 17: auditoria estática de produção e testes de readiness adicionados.

## Em andamento / obrigatório antes do Go-Live

- Migrar a UI de login para o Auth Adapter/Supabase Auth.
- Mapear usuários existentes para `auth_user_id`.
- RBAC server-side completo em todas as operações administrativas.
- RLS definitivo por organização/hotel em todas as entidades.
- Remoção das políticas permissivas legadas após validação no projeto Supabase real.
- Remoção segura da dependência de senha local.
- Integração das telas existentes com os novos modelos.
- Transação/concorrência para confirmação de reservas deve ser homologada no banco real.
- Fluxo operacional completo do PDV deve ser homologado ponta a ponta.
- Fluxo do tablet do quarto deve ser homologado com device binding real.
- Cozinha/KDS integrado deve ser homologado com Realtime real.
- Estoque e financeiro integrados ao PDV devem ser reconciliados com dados reais de teste.
- Integração dos produtores legados ao `emit_event()`.
- Worker/processor de eventos para executar retry/dead-letter em produção.
- Adapters de entrega REALTIME/PUSH/EMAIL/SMS/WHATSAPP reais.
- Presença realtime completa.
- Testes automatizados E2E contra ambiente Supabase de homologação.
- Testes de segurança, carga e stress.
- Backup e restore reais, com teste periódico.
- Staging/homologação com dados fictícios.
- FASE 13: adoção incremental do `TenantService` na UI administrativa.
- FASE 13: validação das migrations no projeto Supabase real e confirmação das contagens.
- FASE 13: políticas finais para operações de escrita administrativas.
- FASE 14: validação da migration no projeto Supabase real.
- FASE 14: integração dos módulos existentes sem duplicar emissão de eventos.
- FASE 17: execução efetiva do pipeline CI e registro dos resultados de build/test/lint.
- FASE 17: execução de RLS, concorrência, performance, restore e E2E no ambiente real.

## Regra

Não marcar a fase como concluída somente porque a tabela, função ou tela existe. A fase exige implementação, integração funcional, autorização, tratamento de erros e teste.

## FASE 17 — Resultado da auditoria estática

A auditoria estática foi adicionada em `scripts/phase17-production-audit.mjs` e verifica padrões de segredo no cliente, bypass de MFA, configuração do workflow, service worker e existência dos comandos de validação.

A auditoria também reporta, sem ocultar, bloqueadores conhecidos: autenticação legada por senha no `HotelContext` e necessidade de validar as policies RLS finais no banco Supabase real. Esses pontos impedem declarar Go-Live aprovado apenas por inspeção de código.

A migration `20260826170000_phase17_final_hardening.sql` adiciona proteção append-only da auditoria, corrige idempotência financeira, corrige fechamento de caixa e cria relatório de integridade por tenant.

## Critério de Go-Live

O HOTEL OS permanece **NÃO HOMOLOGADO PARA PRODUÇÃO** até que CI, migrations reais, RLS, autenticação, E2E, segurança, carga, backup/restore e homologação sejam executados e aprovados.
