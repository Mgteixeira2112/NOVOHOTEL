# HOTEL OS — Plano Mestre de Execução

## Estado
Branch de desenvolvimento: `plano-mestre-hotel-os`

A `main` permanece preservada até homologação.

## Fases

1. Segurança e diagnóstico
2. Autenticação
3. Banco de dados
4. Arquitetura
5. Kanban
6. Realtime
7. Governança/RBAC
8. Integrações operacionais
9. Manutenção
10. Frigobar
11. Financeiro
12. Auditoria
13. Multi-hotel
14. Notificações/eventos
15. Dashboard/BI
16. PDV + tablet + PWA/offline
17. Testes, homologação e produção

## Regras de execução

- Não remover políticas RLS legadas antes da migração de autenticação e autorização.
- Não colocar segredos no frontend.
- Não armazenar senhas em texto puro.
- Toda entidade operacional deverá possuir escopo de hotel quando aplicável.
- Operações críticas de reserva/pagamento/pedido devem ser idempotentes.
- O frontend nunca é a autoridade final de autorização.
- Alterações destrutivas devem ser auditáveis.
- Nenhuma fase é considerada concluída sem teste e validação.

## Critério de Go-Live

O sistema só poderá ser promovido para produção após:

- build sem erros;
- typecheck sem erros;
- testes unitários e de integração aprovados;
- E2E dos fluxos críticos aprovado;
- RLS/RBAC validados;
- backup e restore testados;
- concorrência de reserva validada;
- PDV e tablet validados;
- multi-hotel validado;
- logs/monitoramento/health check disponíveis;
- revisão final de segurança e performance;
- homologação funcional aprovada.

## Fluxos críticos E2E

### Reserva
Busca → disponibilidade → capacidade/camas → reserva → pagamento → confirmação.

### Hospedagem
Reserva → check-in → quarto ocupado → consumo → checkout → conta → financeiro.

### PDV
Produto → pedido → cozinha → pronto → entrega → pagamento/conta.

### Tablet
Tablet → quarto → sessão do hóspede → pedido → PDV → conta → encerramento da sessão.

### Operação
Chamado → Kanban → manutenção → inspeção → liberação do quarto.

### Housekeeping
Checkout → quarto sujo → limpeza → inspeção → disponível.

## Observação

As migrations são aditivas. Antes de aplicar em produção, validar o schema real do Supabase e fazer backup. A aplicação ainda contém código legado de autenticação/configuração que precisa ser migrado antes da retirada das políticas permissivas existentes.
