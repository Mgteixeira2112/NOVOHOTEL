# FASE 8 — Housekeeping, Manutenção e Kanban Operacional

A fase centraliza a operação em `hotel_os_tasks`.

## Fluxo de housekeeping

`CHECKOUT -> DIRTY -> ROOM_CLEANING -> CLEANING -> ROOM_INSPECTION -> CLEAN`

A limpeza concluída cria automaticamente uma tarefa de inspeção. Reprovação exige motivo e cria retrabalho.

## TASK

Tipos: ROOM_CLEANING, ROOM_INSPECTION, MAINTENANCE, MINIBAR, LAUNDRY, DELIVERY, RESTOCK e GENERAL.

Estados: PENDING, IN_PROGRESS, WAITING, COMPLETED, CANCELLED e REOPENED.

Transições são validadas pela função `hotel_os_transition_task`.

## Manutenção

Cada solicitação de manutenção possui uma TASK e pode estar vinculada a quarto ou ativo. A estrutura preserva categorias, prioridade e responsável.

## Kanban

Boards e colunas são configuráveis por hotel. O frontend deve enviar comandos ao serviço, nunca persistir status diretamente.

## Segurança

TASK, room status, assets, maintenance, templates e boards possuem RLS por hotel. Tabelas-filhas usam policies relacionais.
