# MAPA FUNCIONAL — NOVOHOTEL

> Branch de transformação: `refactor/novohotel-saas-simplificado`
> Objetivo: inventariar o sistema atual antes de remover qualquer dependência da camada de Workspaces.
> Status: FASE 1 em andamento.

## 1. Regras desta transformação

- Preservar regras de negócio, services, repositories, Supabase, realtime e multi-hotel já existentes.
- Não criar novos módulos operacionais durante a transformação.
- Não apagar Workspace Factory / Runtime / Editor antes de migrar e provar ausência de dependências.
- Fazer mudanças pequenas, reversíveis e testáveis.
- Nenhuma migration destrutiva nesta etapa.

## 2. Fluxo autenticado atual confirmado

Arquivo de entrada: `src/App.tsx`.

Fluxo observado para usuário autenticado:

`Usuário -> HotelContext -> setores operacionais -> resolveWorkspaceForUserAndSectors() -> WorkspaceRuntime`

Exceção atual:

`admin/gerente -> AdminLayout`

Dependências diretas do caminho principal identificadas em `src/App.tsx`:

- `src/services/userSectorService`
- `src/domain/operationalSectors`
- `src/workspace-engine/registry`
- `src/workspace-engine/WorkspaceRuntime`
- `src/workspace-engine/workspaceConfigStore`
- `src/components/admin/AdminLayout`
- `src/context/HotelContext`

Classificação: **COMPLEXIDADE VISUAL / NAVEGAÇÃO A MIGRAR**, preservando as funções operacionais que ela encaminha.

## 3. Núcleo técnico já identificado

### Autenticação e contexto

- `src/auth`
- `src/context`
- `src/core/auth`

Classificação preliminar: **ESSENCIAL**.

### Permissões / RBAC

- `src/core/permissions/permissionKeys.ts`
- `src/core/permissions/permissionService.ts`

Classificação preliminar: **ESSENCIAL** e candidato a controlador de rotas no novo SaaS.

### Tenant / multi-hotel

- `src/core/tenant/tenantPolicy.ts`
- `src/core/tenant/tenantTypes.ts`
- `src/core/auth/hotelAccess.ts`

Classificação preliminar: **ESSENCIAL**.

### Realtime

- `src/core/realtime/availabilityRealtime.ts`
- `src/core/realtime/hotelRealtimeManager.ts`
- `src/core/realtime/realtimeClient.ts`

Classificação preliminar: **ESSENCIAL**.

### Segurança / auditoria

- `src/core/security/audit.ts`
- `src/core/security/health.ts`
- `src/core/security/redaction.ts`
- `src/core/security/requestContext.ts`
- `src/core/security/safeError.ts`

Classificação preliminar: **ESSENCIAL**.

### Configuração / feature flags

- `src/core/config/featureFlags.ts`
- `src/core/config/runtimeConfig.ts`

Classificação preliminar: **ÚTIL / ESSENCIAL conforme uso SaaS**.

### Eventos e offline

- `src/core/events/*`
- `src/core/offline/localQueue.ts`

Classificação preliminar: **ÚTIL / ESSENCIAL conforme fluxos consumidores**.

## 4. Motores e domínios encontrados na raiz de `src`

- `dashboard-engine`
- `financial-engine`
- `frigobar-core`
- `domain`
- `data`
- `services` (referenciado pelo App)
- `components`
- `hooks`
- `lib`
- `workspace-engine` (referenciado diretamente pelo App)

Nenhum desses motores será reescrito nesta fase. O objetivo é mapear consumidores e rotas equivalentes antes de alterar apresentação ou navegação.

## 5. Site público atual

O `App.tsx` já separa a landing pública da área autenticada e compõe a página com componentes dedicados de landing, incluindo navegação, quartos, comodidades, sobre, localização, depoimentos, FAQ, contato, rodapé e WhatsApp.

Classificação preliminar: **ESSENCIAL / REORGANIZAR**, mantendo conteúdo dinâmico e retirando qualquer dependência futura de editor visual de Workspace.

## 6. Mapa funcional em construção

Formato-alvo da auditoria:

| Função | Tela / Entrada | Componente | Service | Repository / Core | Tabela / Fonte | Classificação | Destino SaaS |
|---|---|---|---|---|---|---|---|
| Login | área autenticada | `AdminLogin` | a mapear | auth/core | Supabase Auth a validar | ESSENCIAL | `/login` |
| Administração atual | usuário admin/gerente | `AdminLayout` | a mapear | permissions/tenant | a mapear | REORGANIZAR | `/app/*` |
| Workspace operacional | usuário autenticado não gestão | `WorkspaceRuntime` | `userSectorService` + config store | workspace-engine | overrides/config a mapear | COMPLEXIDADE VISUAL | substituir por router fixo |
| Permissões | transversal | a mapear | `permissionService` | core/permissions | memberships/roles/permissions a validar | ESSENCIAL | guardas de rota + backend/RLS |
| Multi-hotel | transversal | contexto ativo | a mapear | core/tenant | organizations/hotels/memberships a validar | ESSENCIAL | contexto central do SaaS |
| Realtime | transversal | consumidores a mapear | realtime manager/client | core/realtime | Supabase Realtime | ESSENCIAL | preservar |
| Financeiro | a mapear | a mapear | a mapear | `financial-engine` | a mapear | ESSENCIAL | `/app/financeiro` |
| Frigobar | a mapear | a mapear | a mapear | `frigobar-core` | a mapear | ESSENCIAL | `/app/frigobar` ou A&B |

## 7. Dependências de Workspace já comprovadas

O caminho principal autenticado depende hoje de:

1. setor operacional do usuário;
2. resolução de definição de Workspace;
3. hidratação de overrides de Workspace por hotel;
4. subscription de configuração de Workspace;
5. renderização de `WorkspaceRuntime`.

Portanto, a remoção segura exige primeiro criar rotas fixas equivalentes e só depois retirar essas cinco responsabilidades do caminho principal.

## 8. Próximos passos da FASE 1

- Inventariar `src/workspace-engine` completamente.
- Inventariar `src/components/admin` e identificar todas as telas operacionais existentes.
- Inventariar `src/services`, `src/data` e repositories.
- Inventariar `supabase/migrations` e tabelas referenciadas.
- Mapear Reservas, Quartos, Hóspedes, Check-in/out, Governança, Manutenção, Kanban, PDV, KDS, Estoque, Financeiro, Usuários/RBAC e Site Público.
- Fechar classificação ESSENCIAL / ÚTIL / DUPLICADO / COMPLEXIDADE VISUAL.
- Definir destino de cada função no menu e router fixos sem criar módulo operacional novo.

## 9. Critério para concluir esta fase

A FASE 1 só será marcada como concluída quando:

- todos os módulos principais tiverem classificação;
- as dependências de Workspace estiverem conhecidas;
- nenhuma função operacional importante estiver sem destino definido;
- build, lint e testes estiverem verdes no PR da transformação.
