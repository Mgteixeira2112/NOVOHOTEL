# Plano pós-Fase 17 — Correções e estabilização

## P0 — Bloqueadores
- Corrigir falha de deploy/build e repetir validação completa.
- Validar RLS e isolamento multi-hotel.
- Validar autenticação, autorização, IDOR, rate limit e exposição de secrets.
- Validar idempotência e concorrência em reservas, pagamentos, folio, estoque e pedidos.
- Validar backup e restore antes de qualquer Go-Live.

## P1 — Alta prioridade
- Executar testes integrados/E2E dos fluxos reserva → hospedagem → pedido → folio → financeiro.
- Corrigir inconsistências de banco, índices, constraints e dados órfãos.
- Validar métricas do dashboard contra as fontes oficiais.
- Validar realtime, filas, retry e dead letter.
- Validar responsividade, dispositivos, PWA e acessibilidade.

## P2 — Estabilização
- Revisar UX, componentes duplicados e código obsoleto.
- Medir performance e corrigir queries lentas/N+1/bundles excessivos.
- Completar documentação operacional e de deploy.

## Regra
Não iniciar nova fase funcional. Corrigir, testar e homologar o que já existe até que cada item esteja validado com evidência.
