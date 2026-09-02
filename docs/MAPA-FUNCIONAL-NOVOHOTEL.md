# MAPA FUNCIONAL — NOVOHOTEL

> Branch de transformação: `refactor/novohotel-saas-simplificado`
> Objetivo: inventariar o sistema existente antes de substituir a navegação baseada em Workspaces por um SaaS de rotas fixas.
> Status: **FASE 1 — inventário funcional consolidado**.

## 1. Regras da transformação

- Preservar regras de negócio, services, repositories, Supabase, realtime e multi-hotel existentes.
- Não criar novos módulos operacionais durante a transformação.
- Não apagar Workspace Factory / Runtime / Editor antes de migrar consumidores e provar ausência de dependências.
- Fazer mudanças pequenas, reversíveis e testáveis.
- Não executar migration destrutiva nesta etapa.
- Distinguir apresentação atual de regra de negócio: uma tela pode ser reorganizada sem reescrever o domínio que ela consome.

## 2. Gate técnico da FASE 1

A transformação parte agora de uma `main` estável:

- correção de GitHub Pages integrada;
- baseline de testes restaurado sem mudanças de runtime;
- `lint` verde;
- **873/873 testes verdes**;
- `build` verde;
- `audit:production` verde;
- branch `refactor/novohotel-saas-simplificado` sincronizada com a `main` sem reescrever os commits próprios da transformação.

Qualquer fase seguinte deve preservar este gate.

## 3. Fluxo autenticado atual confirmado

Arquivo de entrada: `src/App.tsx`.

Fluxo atual para usuário autenticado operacional:

`Usuário -> HotelContext -> setores do usuário -> resolveWorkspaceForUserAndSectors(currentUser?.id, sectorIds, hotelId) -> WorkspaceRuntime`

Caminho de gestão atual:

`admin/gerente -> AdminLayout -> aba/módulo atual`

Dependências diretas relevantes do caminho principal:

- `src/context/HotelContext.tsx`
- `src/services/userSectorService`
- `src/domain/operationalSectors`
- `src/workspace-engine/registry`
- `src/workspace-engine/WorkspaceRuntime.tsx`
- `src/workspace-engine/WidgetDrivenWorkspace.tsx`
- `src/workspace-engine/workspaceConfigStore.ts`
- `src/components/admin/AdminLayout.tsx`

Classificação: **COMPLEXIDADE VISUAL / NAVEGAÇÃO A MIGRAR**. O objetivo é remover a resolução de Workspace do caminho principal somente depois de existirem rotas fixas equivalentes.

## 4. Apresentação administrativa atual

`AdminLayout.tsx` confirma hoje as seguintes telas existentes, que devem ser reutilizadas em vez de recriadas:

- `DashboardModule`
- `ExecutiveDashboardModule`
- `ReservationsModule`
- `CheckInOutModule`
- `RoomsModule`
- `GuestsModule`
- `KanbanWorkspaceModule`
- `PDVPage`
- `KDSPage`
- `FrigobarModule`
- Financeiro via `getWorkspaceDefinition('workspace-financeiro')` + `WidgetDrivenWorkspace`
- `UsersOperationalAccessModule`
- `AutomationModule`
- `SettingsModule`
- `HotelOSCommandCenter`
- `WorkspaceEditorModule`

A navegação atual é agrupada por contexto (`operacao`, `vendas`, `gestao`, `sistema`) e por `AdminTab`. Esta estrutura é **ÚTIL COMO INVENTÁRIO**, mas será substituída pelo menu SaaS fixo do Plano Mestre.

## 5. Camada intermediária atual: HotelContext

As telas administrativas legadas de Reservas, Quartos, Hóspedes e Check-in/out não chamam diretamente os repositories canônicos. Elas consomem ações e estado de `HotelContext`.

`HotelContext.tsx` importa a camada histórica `src/services/supabase.ts`, incluindo funções para:

- configuração do hotel;
- tipos de quarto;
- quartos;
- hóspedes;
- reservas;
- bloqueios;
- automações;
- usuários;
- logs de segurança;
- sincronização e health check;
- realtime do hotel.

A lista de tabelas-base verificada nessa camada histórica é:

`hotel_config`, `tipos_quarto`, `quartos`, `hospedes`, `reservas`, `bloqueios`, `automacoes`, `usuarios`, `logs_seguranca`, `media_uploads`.

Classificação: **ESSENCIAL COMO COMPATIBILIDADE DURANTE A MIGRAÇÃO**. Esta camada não deve ser removida antes de os módulos consumidores terem sido migrados para contratos estáveis equivalentes.

## 6. Núcleo SaaS / infraestrutura identificado

### Autenticação

- Supabase Auth já é usado pelo sistema.
- `tenantRepository.getCurrentUserId()` usa `supabase.auth.getUser()`.
- `HotelContext` usa `supabaseAuthBridge` para sessão da equipe.

Classificação: **ESSENCIAL**.

### Tenant / multi-hotel

Arquivos confirmados:

- `src/services/tenantService.ts`
- `src/repositories/tenantRepository.ts`
- `src/core/tenant/tenantPolicy.ts`
- `src/core/tenant/tenantTypes.ts`
- `src/core/auth/hotelAccess.ts`

Fontes confirmadas no repository:

- `hotel_memberships`
- `organization_memberships`
- `organizations`
- `hoteis`
- `feature_flags`

RPCs já existentes e que devem ser preservadas:

- `user_has_hotel_access`
- `user_has_permission`
- `hotel_os_feature_enabled`

Classificação: **ESSENCIAL** e base do contexto Hotel/Tenant do novo shell SaaS.

### Realtime

- `src/core/realtime/availabilityRealtime.ts`
- `src/core/realtime/hotelRealtimeManager.ts`
- `src/core/realtime/realtimeClient.ts`
- `src/services/kanbanRealtimeSubscription.ts`

Classificação: **ESSENCIAL — PRESERVAR**.

### Segurança / auditoria

- `src/core/security/audit.ts`
- `src/core/security/health.ts`
- `src/core/security/redaction.ts`
- `src/core/security/requestContext.ts`
- `src/core/security/safeError.ts`

Classificação: **ESSENCIAL — PRESERVAR**.

### Configuração / feature flags

- `src/core/config/featureFlags.ts`
- `src/core/config/runtimeConfig.ts`
- `feature_flags` no tenant repository.

Classificação: **ESSENCIAL PARA O SAAS**, sem relação com composição visual de telas.

## 7. Services e repositories canônicos confirmados

A árvore atual já contém uma camada operacional mais estruturada que deve ser preferida na evolução do SaaS, sem reescrever regras existentes:

- Reservas: `reservationService.ts` -> `reservationsRepository.ts`
- Hospedagem/estadia: `stayService.ts` -> `stayRepository.ts`
- Financeiro: `financeService.ts` -> `financeRepository.ts`
- Folio/pagamentos: `folioService.ts` -> `folioRepository.ts`
- Estoque: `inventoryService.ts` -> `inventoryRepository.ts`
- PDV/KDS: `pdvService.ts` -> `pdvRepository.ts`
- Tarefas/Kanban: `taskService.ts` -> `taskRepository.ts`
- Tenant/multi-hotel: `tenantService.ts` -> `tenantRepository.ts`
- Governança: `governanceService.ts`
- Relatórios financeiros: `financialReportingService.ts`
- Identidade do hotel: `hotelIdentityService.ts`
- Eventos do Hotel OS: `hotelOSEvents.ts`

Não substituir estes contratos por lógica de tela.

## 8. Fontes operacionais modernas verificadas

### Reservas

`reservationsRepository.ts` usa a tabela `reservations`, sempre com escopo de hotel nas leituras relevantes.

### Tarefas / Kanban / Governança / Manutenção

`taskRepository.ts` usa:

- `hotel_os_tasks`
- `hotel_os_boards`
- `hotel_os_board_columns`
- persistência Kanban oficial delegada para `kanbanV2`

RPCs operacionais confirmadas:

- `hotel_os_transition_task`
- `hotel_os_complete_room_inspection`

O tipo de tarefa já contempla `ROOM_CLEANING`, `ROOM_INSPECTION`, `MAINTENANCE`, `MINIBAR`, `LAUNDRY`, `DELIVERY`, `RESTOCK` e `GENERAL`.

### PDV / KDS / Caixa

`pdvRepository.ts` usa:

- `pdv_produtos`
- `pdv_cash_registers`
- `pdv_cash_sessions`
- `pdv_kds_items`
- relações com `pdv_pedidos` e `pdv_itens_pedido`

RPCs confirmadas:

- `hotel_os_create_order`
- `hotel_os_finalize_order`
- `hotel_os_update_kds_item`
- `hotel_os_open_cash`
- `hotel_os_close_cash`

### Estoque

`inventoryRepository.ts` usa:

- `hotel_os_stock_locations`
- `hotel_os_stock_items`
- `hotel_os_stock_alerts`
- `hotel_os_suppliers`
- `hotel_os_inventories`
- relação de produto com `pdv_produtos`

RPCs confirmadas:

- `hotel_os_apply_stock_movement`
- `hotel_os_transfer_stock`

### Financeiro

`financeRepository.ts` usa:

- `hotel_os_accounts_receivable`
- `hotel_os_accounts_payable`
- `hotel_os_financial_transactions`

RPC confirmada:

- `hotel_os_settle_financial_account`

`folioRepository.ts` preserva as operações de folio/pagamento via RPCs e lê `hotel_os_payments`.

RPCs confirmadas:

- `hotel_os_add_folio_item`
- `hotel_os_create_payment`
- `hotel_os_void_folio_item`

## 9. Mapa funcional consolidado

Legenda de classificação:

- **ESSENCIAL**: regra/fluxo operacional ou infraestrutura que permanece.
- **ÚTIL**: componente que pode permanecer, ser agrupado ou virar subfunção.
- **DUPLICADO/LEGADO**: caminhos paralelos que exigem convergência antes de remoção.
- **COMPLEXIDADE VISUAL**: camada de composição/apresentação que será retirada do fluxo principal.

| Função | Tela atual / entrada | Camada atual | Service / Repository confirmado | Fonte confirmada | Classificação | Destino SaaS |
|---|---|---|---|---|---|---|
| Login | acesso administrativo/autenticado | Supabase Auth + bridge | auth/tenant | Supabase Auth | ESSENCIAL | `/login` |
| Início operacional | `DashboardModule` | `HotelContext` | dados agregados existentes | fontes atuais do contexto | ÚTIL | `/app` |
| BI gerencial | `ExecutiveDashboardModule` | serviços/estado existentes | reporting existente | agregações atuais | ÚTIL | `/app/gestao` |
| Reservas | `ReservationsModule` | `HotelContext` hoje | `reservationService` -> `reservationsRepository` como contrato canônico | `reservations`; legado `reservas` ainda consumido pelo contexto | ESSENCIAL + LEGADO A CONVERGIR | `/app/reservas` |
| Check-in / checkout | `CheckInOutModule` | `HotelContext` hoje | `stayService`/`stayRepository` + reservas/folio como contratos canônicos | dados de estadia/reserva + folio existentes | ESSENCIAL | `/app/recepcao` |
| Quartos e tarifas | `RoomsModule` | `HotelContext` hoje | contratos de quarto/availability existentes | legado `quartos`, `tipos_quarto`; fontes Hotel OS conforme domínio | ESSENCIAL | `/app/quartos` |
| Hóspedes / CRM | `GuestsModule` | `HotelContext` hoje | camada histórica Supabase + contratos de hóspede existentes | `hospedes` no caminho atual | ESSENCIAL | `/app/hospedes` |
| Governança | Workspace operacional + Kanban/tarefas | task/governance services | `governanceService`, `taskService` -> `taskRepository` | `hotel_os_tasks`, boards/columns | ESSENCIAL | `/app/operacao` e `/app/kanban` |
| Manutenção | Workspace operacional + tarefas | task services | `taskService` -> `taskRepository` | `hotel_os_tasks` (`MAINTENANCE`) | ESSENCIAL | `/app/operacao` e `/app/kanban` |
| Kanban | `KanbanWorkspaceModule` | Kanban v2 + task layer | `taskService`, `taskRepository`, `kanbanV2` | `hotel_os_tasks`, boards/columns + Kanban v2 | ESSENCIAL | `/app/kanban` |
| PDV | `PDVPage` | pdv service/repository | `pdvService` -> `pdvRepository` | `pdv_produtos`, caixas e pedidos/RPCs | ESSENCIAL | `/app/pdv` |
| KDS | `KDSPage` | pdv/kds contracts | `pdvRepository` + serviço KDS existente | `pdv_kds_items` + pedidos/itens | ESSENCIAL | `/app/kds` |
| Frigobar | `FrigobarModule` | frigobar/estoque existentes | contratos de frigobar + inventory | estoque/produtos existentes | ESSENCIAL | `/app/operacao` ou A&B/Estoque no menu |
| Estoque | hoje distribuído em consumo/frigobar/engines | inventory layer | `inventoryService` -> `inventoryRepository` | stock locations/items/alerts/suppliers/inventories | ESSENCIAL | `/app/estoque` |
| Financeiro | Workspace Financeiro no `AdminLayout` | `WidgetDrivenWorkspace` hoje | `financeService` -> `financeRepository` | contas a receber/pagar/transações | ESSENCIAL + COMPLEXIDADE VISUAL | `/app/financeiro` |
| Folio / pagamentos | componentes financeiros/conta hóspede | folio layer | `folioService` -> `folioRepository` | `hotel_os_payments` + RPCs de folio | ESSENCIAL | `/app/financeiro` e recepção conforme fluxo |
| Equipe / acessos | `UsersOperationalAccessModule` | RBAC atual | permission/tenant/auth | memberships + permissões existentes | ESSENCIAL | `/app/configuracoes` / Equipe |
| Configurações | `SettingsModule` | HotelContext/config services | identidade/configuração existentes | `hotel_config` + settings existentes | ESSENCIAL / REORGANIZAR | `/app/configuracoes` |
| Automações | `AutomationModule` | automações atuais | contratos existentes | `automacoes` no caminho legado | ÚTIL | `/app/configuracoes` / Integrações |
| Central Hotel OS | `HotelOSCommandCenter` | agregador administrativo | múltiplos serviços existentes | múltiplas fontes | ÚTIL / REORGANIZAR | `/app/gestao` ou Platform Admin quando aplicável |
| Site público | landing já separada em `App.tsx` | `HotelContext`/conteúdo atual | identidade/quartos/reservas existentes | hotel/quartos/config atuais | ESSENCIAL / REORGANIZAR | `/`, `/quartos`, `/servicos`, `/localizacao`, `/contato`, `/reservar` |
| Workspace Factory | `WorkspaceEditorModule` | workspace-engine | config store/registry | `workspace_engine_configs` e overrides existentes | COMPLEXIDADE VISUAL | remover da UI após migração |
| Workspace Runtime | `WorkspaceRuntime` / `WidgetDrivenWorkspace` | workspace-engine | registry/config store | definição/overrides | COMPLEXIDADE VISUAL | retirar do caminho autenticado após cobertura de rotas |
| Multi-hotel | transversal | tenant layer | `tenantService` -> `tenantRepository` | memberships, organizations, `hoteis`, flags | ESSENCIAL | contexto central do shell SaaS |
| Feature flags | transversal | core/config + tenant | tenant/config services | `feature_flags` | ESSENCIAL | shell/guards/admin plataforma |
| Realtime | transversal | core/realtime | realtime manager/client | Supabase Realtime | ESSENCIAL | preservar em todos os módulos consumidores |

## 10. Duplicidades e pontos de convergência

### 10.1 Reservas, quartos e hóspedes possuem duas gerações de acesso a dados

Existe uma camada histórica concentrada em `HotelContext -> services/supabase.ts` e existem services/repositories mais modernos por domínio.

Decisão da transformação:

- não remover a camada histórica de imediato;
- não criar uma terceira camada;
- migrar consumidores gradualmente para contratos canônicos durante as fases de consolidação;
- só remover funções antigas depois de busca de referências, testes e auditoria de banco.

Classificação: **DUPLICADO/LEGADO A CONVERGIR**, sem exclusão nesta fase.

### 10.2 Financeiro está acoplado à apresentação de Workspace

`AdminLayout` ainda chama `getWorkspaceDefinition('workspace-financeiro')` e renderiza `WidgetDrivenWorkspace`.

Decisão: preservar `financeService`, `financeRepository`, `folioService` e `folioRepository`, substituindo apenas o ponto de entrada visual por rota/tela fixa na FASE 8.

### 10.3 Operação de setores ainda depende de Workspace

Usuários operacionais são encaminhados por setor para uma definição de Workspace. Governança, manutenção, cozinha e operação já possuem funções e dados que não devem depender de composição visual para existir.

Decisão: a nova navegação concederá acesso por permissão/rota; setor continua como dimensão operacional/filtro, não como construtor de tela.

## 11. Dependências do Workspace Engine a desmontar em ordem segura

### Caminho principal

1. `userSectorService` resolve setores do usuário;
2. `App.tsx` chama `resolveWorkspaceForUserAndSectors(currentUser?.id, sectorIds, hotelId)`;
3. registry resolve a definição;
4. config store hidrata e publica overrides por hotel;
5. `WorkspaceRuntime` decide o renderer;
6. `WidgetDrivenWorkspace` resolve widgets, apresentação, sidebar e estratégias por viewport.

### Editor / configuração

- `WorkspaceEditorModule`
- `WorkspaceGeneralPresentationControls`
- `WorkspaceWidgetPresentationControls`
- `WorkspaceDesktopLayoutEditor`
- `WorkspacePreviewPanel`
- `workspaceConfigStore`
- registry e templates oficiais

### Estado atual já simplificado

- posicionamento absoluto Desktop já foi aposentado no runtime principal;
- configuração comum do widget já foi reduzida;
- presets e contratos antigos ainda existem para compatibilidade de persistência;
- Financeiro ainda depende diretamente do Workspace Engine;
- Recepção possui um renderer aprovado específico dentro de `WorkspaceRuntime`.

Classificação geral: **COMPLEXIDADE VISUAL**. Nada será apagado antes de as rotas fixas absorverem todos os consumidores.

## 12. Menu SaaS de destino

O destino funcional consolidado é:

- **Início** — visão operacional essencial
- **Recepção** — check-in, check-out e operações de estadia
- **Hospedagem** — Reservas, Quartos, Hóspedes
- **Operação** — Governança, Manutenção, tarefas e serviços internos
- **Alimentos & Bebidas** — PDV, KDS, Room Service/consumo quando existente
- **Estoque** — estoque, reposição, fornecedores/inventário
- **Financeiro** — financeiro, folio, pagamentos e caixa conforme permissão
- **Gestão** — BI, KPIs, central administrativa útil
- **Configurações** — Hotel, Identidade, Site, Hospedagem, Equipe, Integrações

Rotas estáveis mínimas definidas pelo Plano Mestre e confirmadas como destino desta auditoria:

- `/app`
- `/app/recepcao`
- `/app/reservas`
- `/app/quartos`
- `/app/hospedes`
- `/app/kanban`
- `/app/pdv`
- `/app/kds`
- `/app/financeiro`
- `/app/configuracoes`

Rotas adicionais como `/app/estoque`, `/app/operacao` e `/app/gestao` podem apenas agrupar telas já existentes; não autorizam criação de novos motores operacionais.

## 13. Site público

O `App.tsx` já separa a landing pública da área autenticada. O destino não é uma Fábrica de Site: é uma composição fixa com dados dinâmicos do hotel.

Preservar:

- identidade do hotel;
- quartos/fotos/tarifas;
- serviços/amenidades;
- localização e contato;
- reserva online e disponibilidade;
- branding/configurações existentes que tenham valor hoteleiro.

Remover futuramente apenas escolhas de composição de tela que obriguem o hotel a reconstruir o produto.

## 14. Critério de conclusão da FASE 1

Inventário funcional: **CONCLUÍDO NO CÓDIGO/DOCUMENTO**.

Critérios atendidos documentalmente:

- módulos principais classificados;
- telas administrativas reais identificadas;
- camada histórica `HotelContext/services/supabase` distinguida dos repositories canônicos;
- dependências de Workspace conhecidas;
- funções operacionais importantes possuem destino SaaS;
- fontes de dados críticas de tenant, tarefas, PDV/KDS, estoque e financeiro foram verificadas no código;
- nenhuma migration destrutiva foi criada.

Gate restante para encerrar formalmente a FASE 1:

- abrir/atualizar PR da transformação;
- confirmar novamente `lint`, testes, `build` e `audit:production` verdes com este documento na branch.

Somente depois desse gate a implementação avança para a FASE 2 — arquitetura dos três ambientes e contexto central de tenant/hotel.
