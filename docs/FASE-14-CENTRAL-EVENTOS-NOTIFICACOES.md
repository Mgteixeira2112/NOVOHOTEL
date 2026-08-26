# FASE 14 — Central de Eventos, Notificações e Realtime

## Escopo implementado

A Fase 14 adiciona uma camada centralizada e incremental para:

- catálogo de eventos;
- event log persistente;
- idempotência por evento;
- retry/dead-letter;
- regras de notificação;
- notificações por destinatário e canal;
- preferências de usuário;
- quiet hours;
- presença de usuários e dispositivos;
- autorização de canais por organização/hotel;
- função backend `emit_event()`.

## Separação de conceitos

`event_log` registra fatos ocorridos no domínio.

`notifications` registra comunicações derivadas dos eventos.

A regra de negócio não deve ser duplicada em componentes React, controllers e listeners. O produtor registra o evento e o processamento posterior aplica regras e gera notificações.

## Fluxo

```text
DOMAIN MODULE
    ↓
emit_event()
    ↓
event_log (PENDING)
    ↓
EVENT PROCESSOR
    ↓
notification_rules
    ↓
notifications
    ↓
REALTIME / IN_APP / PUSH / EMAIL / SMS / WHATSAPP
```

## Segurança

Eventos carregam `organization_id` e `hotel_id` quando aplicáveis.

As policies de leitura usam `user_has_hotel_access()` e `user_has_organization_access()` já estabelecidas na Fase 13.

A emissão server-side deve ser preferida para operações críticas. A função SQL também deriva `organization_id` do hotel quando necessário, reduzindo dependência de contexto enviado pelo cliente.

Não armazenar senhas, tokens, secrets ou dados completos de cartão no payload de eventos/notificações.

## Idempotência

`event_log.id` identifica unicamente o evento. Quando uma operação possui uma chave idempotente externa, `idempotency_key` impede duplicação.

Notificações referenciam `event_id`, permitindo rastreabilidade.

## Retry

Estados:

`PENDING → PROCESSING → PROCESSED`

ou:

`PROCESSING → FAILED → PROCESSING`

Após o limite configurado:

`FAILED → DEAD_LETTER`

O limite inicial no código de domínio é 5 tentativas.

## Canais

- IN_APP
- REALTIME
- PUSH
- EMAIL
- SMS
- WHATSAPP

A infraestrutura é extensível; a migration não acopla o domínio a um provedor específico.

## Presença

`device_presence` prepara presença de usuário, tablet e POS com `ONLINE`, `OFFLINE` e `last_seen_at`.

Não foi implementado offline financeiro. Operações críticas continuam dependentes de confirmação do servidor.

## Limitação desta fase

A Fase 14 cria a infraestrutura central, mas não substitui automaticamente todos os produtores legados nem cria consumidores completos de todos os eventos. A integração dos módulos deve ocorrer incrementalmente para evitar duplicação e regressões.
