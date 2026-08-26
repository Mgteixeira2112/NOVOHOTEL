# FASE 2 — Auth, RBAC, RLS e Multi-hotel

## Implementação incremental

A Fase 2 adiciona uma fronteira de identidade e autorização sem substituir o fluxo legado.

## Entidades

- `hotel_memberships`: vínculo usuário ↔ hotel ↔ role.
- `hotel_roles`: papéis por hotel.
- `hotel_permissions`: catálogo granular de permissões.
- `hotel_role_permissions`: associação role ↔ permission.
- `hotel_devices`: POS, TABLET_ROOM, KDS, TOTEM e MOBILE.
- `hotel_sessions`: sessões por usuário/hotel/dispositivo.
- `hotel_audit_log`: eventos de segurança.

## Funções de segurança

- `user_has_hotel_access(hotel_id)`.
- `user_has_permission(hotel_id, permission)`.
- `hotel_os_audit(...)`.

Essas funções são `security definer` e não dependem da decisão da UI para autorizar o acesso.

## RLS

As tabelas novas possuem RLS habilitado. Membership é visível apenas pelo próprio usuário; dispositivos são isolados pelo hotel; sessões são isoladas pelo usuário; papéis e permissões são condicionados ao vínculo com o hotel.

## Compatibilidade

Nenhuma tabela legada foi apagada. Nenhum novo PDV, Tablet, KDS, Kanban ou Financeiro foi implementado nesta fase.

## Próxima fase

A Fase 3 somente deve começar após validação explícita da Fase 2 e, principalmente, após definir como os `hotel_id` legados serão associados às entidades existentes sem migração destrutiva.
