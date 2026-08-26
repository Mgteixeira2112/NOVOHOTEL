# FASE 12 — Auditoria, Governança, Logs, Backup e Segurança Operacional

## Estado
Implementação incremental iniciada após auditoria da branch `plano-mestre-hotel-os`.

## Escopo
- auditoria backend e RLS;
- sessões e dispositivos;
- logs de erro;
- request_id/correlation_id;
- idempotência;
- aprovações;
- health checks;
- política de backup e restore;
- LGPD;
- rate limiting e webhooks.

## Compatibilidade
A auditoria existente `hotel_audit_log` permanece como fonte legada. A FASE 12 deve estendê-la em vez de criar uma segunda trilha de auditoria.

## Segurança
Nenhuma senha, token, secret ou dado completo de cartão deve ser armazenado nos logs.

## Backup
Backup só será considerado operacionalmente confiável após teste documentado de restauração. RPO/RTO devem ser configurados conforme o ambiente.

## Validação pendente
A migration deve ser executada em staging antes de produção. Build, lint e testes devem ser confirmados pelo workflow CI após o commit.
