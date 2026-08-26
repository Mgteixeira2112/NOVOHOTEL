# HOTEL OS — Diagnóstico e plano de execução

## Estado

Branch de trabalho: `plano-mestre-hotel-os`
Base: `main`

## Achados críticos

1. O schema atual possui policies RLS permissivas com `USING (true)` / `WITH CHECK (true)`. Isso não é suficiente para isolamento multi-hotel.
2. A tabela `usuarios` ainda possui coluna `senha`; a autenticação deve migrar para Supabase Auth antes da remoção dessa dependência.
3. O modelo atual não possui uma camada consistente de `organizacao_id` e `hotel_id` em todas as entidades de negócio.
4. Quartos possuem `cama` como texto; foi criada estrutura `quarto_camas` para composição estruturada.
5. PDV e tablet do quarto ainda precisam ser implementados e integrados ao domínio de reservas/conta/cozinha.
6. A configuração do Supabase deve ser orientada por ambiente e não depender de credenciais hardcoded.

## O que já existe e deve ser preservado

- React + TypeScript + Vite
- Supabase client
- PMS/reservas
- quartos e hóspedes
- financeiro/pagamentos
- frigobar
- Kanban/RBAC
- mídia/white-label
- automações

## Ordem de execução

### Fase A — Fundação
- multi-hotel/organização
- autenticação Supabase Auth
- RLS por organização/hotel
- remoção gradual de senha local
- ambiente/configuração

### Fase B — Domínio hoteleiro
- disponibilidade transacional
- camas estruturadas
- hospedagem
- housekeeping
- manutenção
- frigobar
- conta do hóspede

### Fase C — PDV
- produtos/categorias
- pedidos
- itens
- caixa
- pagamentos
- descontos/cancelamentos
- integração com cozinha
- integração com conta do quarto
- role `pdv_only`

### Fase D — Tablet do quarto
- dispositivo
- vínculo hotel/quarto
- sessão segura
- catálogo
- pedido
- acompanhamento
- encerramento/limpeza da sessão

### Fase E — Integração
- eventos/realtime
- notificações
- dashboard
- auditoria
- relatórios

### Fase F — UX
- navegação por categorias
- menu enxuto
- responsividade
- tablet/PDV
- acessibilidade

### Fase G — Qualidade e produção
- unit/integration/e2e
- segurança
- carga/performance
- backup/restore
- observabilidade
- staging
- homologação
- produção

## Regra de segurança

As policies permissivas existentes não devem ser removidas até que a autenticação e as policies substitutas estejam implantadas e testadas. Nunca liberar produção com RLS baseado em `true` para dados administrativos.

## Regra de disponibilidade

A disponibilidade final não pode depender somente do frontend. Reserva concorrente deve ser protegida no banco/transação para impedir overbooking.

## Critério de pronto

Cada módulo só é concluído quando possui implementação, autorização, tratamento de erros, integração, teste e documentação compatíveis com o ambiente de produção.
