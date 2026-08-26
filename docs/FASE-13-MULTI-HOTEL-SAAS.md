# FASE 13 — Multi-hotel / Multi-tenant / SaaS

## Estado da implementação

Implementação incremental na branch `plano-mestre-hotel-os`, sobre o estado consolidado das Fases 1–12. A `main` permanece preservada e o trabalho continua no PR #1 em modo draft.

## O que foi consolidado

- `organizations` permanece como entidade Organization canônica criada na Fase 2; não foi criada uma segunda tabela `organization`.
- `hoteis` passa a possuir `organization_id` obrigatório, mantendo os IDs e dados operacionais existentes.
- Dados legados de hotéis sem organização recebem a organização técnica `default-hotel-os` durante a migração.
- `hotel_memberships` permanece como membership operacional usuário → hotel → role e recebe `organization_id` derivado.
- `organization_memberships` adiciona o escopo organizacional para `PLATFORM_ADMIN`, `ORGANIZATION_ADMIN` e `VIEWER`.
- `hotel_roles` e `hotel_permissions` existentes foram reutilizados; roles globais e roles por hotel foram preparados sem duplicar RBAC.
- `user_has_hotel_access()` e `user_has_permission()` foram fortalecidas para considerar membership do hotel e membership da organização.
- `feature_flags` permite override por hotel e default por organização/plano.
- `organization_settings` e `hotel.settings` suportam herança Organization → Hotel.
- `saas_plans`, `saas_subscriptions`, `saas_subscription_items` e `saas_billing_events` preparam o modelo SaaS sem acoplar cobrança comercial ao PMS.
- Contexto organizacional foi adicionado a dispositivos, sessões, auditoria, eventos e tarefas para facilitar governança e relatórios.
- RLS foi habilitado para as novas entidades e o acesso aos hotéis passou a depender de membership autorizada.

## Segurança

A migration não remove as policies legadas permissivas das tabelas antigas. Isso é intencional para não quebrar a aplicação antes da migração definitiva do fluxo legado para Supabase Auth + RLS estrito. As novas entidades usam `authenticated` e funções de escopo.

O sistema ainda não deve ser considerado go-live multi-tenant enquanto as tabelas legadas continuarem aceitando acesso anônimo amplo.

## Compatibilidade

Nenhuma tabela operacional antiga foi apagada. Não foram alterados componentes de PDV, Tablet, KDS, Kanban ou Financeiro nesta fase.

## Arquivos

### Criados

- `supabase/migrations/20260827110000_phase13_multi_tenant_saas.sql`
- `src/core/tenant/tenantTypes.ts`
- `src/core/tenant/tenantPolicy.ts`
- `src/repositories/tenantRepository.ts`
- `src/services/tenantService.ts`
- `tests/tenant-policy.test.ts`
- `docs/FASE-13-MULTI-HOTEL-SAAS.md`

### Modificados

Nenhum componente React ou módulo operacional existente foi substituído nesta etapa.

## Validação

A validação automática está configurada pelo workflow existente `.github/workflows/hotel-os-validation.yml`, que executa `npm ci`, `npm run lint`, `npm test` e `npm run build` para a branch de trabalho. O ambiente desta execução não possui DNS/rede para clonar o repositório e, portanto, não foi possível executar localmente os comandos de build/teste.

## Riscos restantes

1. O modelo legado de autenticação ainda existe no `HotelContext`.
2. As tabelas legadas ainda possuem policies permissivas e precisam de migração controlada para RLS estrito.
3. A UI atual ainda não expõe um seletor de hotel baseado no novo `TenantService`; a fronteira de serviço está pronta para adoção incremental.
4. A cobrança SaaS está somente modelada; não existe gateway comercial nesta fase.
5. A migration depende da existência de `public.hoteis`, já utilizada pelas migrations anteriores.

## Próximo passo

FASE 14 deve começar somente após validação da migration no projeto Supabase, confirmação das contagens e execução bem-sucedida do workflow de CI. Recomenda-se priorizar a adoção do `TenantService` na navegação administrativa e a migração final das policies legadas, sem alterar a `main` até homologação.