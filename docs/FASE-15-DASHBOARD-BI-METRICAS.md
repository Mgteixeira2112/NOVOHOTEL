# FASE 15 — Dashboard Gerencial, BI, Métricas e Inteligência Operacional

## Implementação incremental

A fase reutiliza o domínio existente de reservas, hospedagens, Folio, PDV, estoque, tarefas, financeiro, multi-tenant e Event Center. O dashboard antigo permanece disponível; o novo painel entra como **BI Gerencial**.

## Camada oficial de métricas

A fonte oficial é o `MetricService`, apoiado pelas funções PostgreSQL:

- `hotel_os_calculate_daily_metrics`
- `hotel_os_refresh_daily_metrics`
- `hotel_os_dashboard_metrics`

As fórmulas não ficam espalhadas pelas telas.

### Ocupação

`occupied_room_nights / available_room_nights`

### ADR

`room_revenue / sold_room_nights`

### RevPAR

`room_revenue / available_room_nights`

ADR e RevPAR consideram somente receita de hospedagem. PDV, room service, frigobar e serviços não são adicionados automaticamente à receita de hospedagem.

## Dados históricos

`hotel_os_daily_metrics` cria um snapshot por hotel/dia para reduzir consultas repetitivas e permitir histórico e tendências.

## Dashboard

O novo `ExecutiveDashboardModule` oferece:

- ocupação;
- ADR;
- RevPAR;
- receita total;
- ticket médio;
- check-ins/check-outs;
- cancelamentos/no-show;
- booking window/lead time;
- receita por setor;
- produtividade de housekeeping;
- MTTR de manutenção;
- comparação entre hotéis autorizados.

Filtros rápidos:

- hoje;
- ontem;
- 7 dias;
- 30 dias;
- mês;
- mês anterior;
- ano.

## Segurança

A consulta oficial valida `hotel_id` no backend através do escopo de tenant existente. O dashboard multi-hotel usa somente hotéis retornados pelo `TenantService`.

A camada visual não é considerada mecanismo de autorização.

## Metas e layout

Preparados no banco:

- `hotel_os_dashboard_goals`;
- `hotel_os_dashboard_layouts`;
- `hotel_os_report_definitions`;
- `hotel_os_metric_definitions`.

## Performance

Foram adicionados índices para datas de reservas, hospedagens, Folio, tarefas e pedidos. O histórico diário evita recalcular todo o histórico em cada abertura do dashboard.

## Limitações desta fase

- Não foi implementado um data warehouse separado.
- Não foi criado motor de previsão/ML.
- Exportação PDF/CSV/XLSX permanece preparada como próxima camada de relatório.
- Alertas gerenciais avançados podem consumir o Event Center da FASE 14 em uma evolução posterior.
- A homologação Supabase real continua obrigatória.
