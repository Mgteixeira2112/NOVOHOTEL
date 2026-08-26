-- Hotel OS automation rules.
-- Aligned with the canonical event/task/workflow tables created in
-- 20260826030000_hotel_os_operations.sql.
-- This migration remains additive and does not remove legacy structures.

alter table if exists public.hotel_os_tasks add column if not exists description text;
alter table if exists public.hotel_os_tasks add column if not exists room_id uuid;
alter table if exists public.hotel_os_tasks add column if not exists reservation_id uuid;

create or replace function public.hotel_os_route_event()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.event_type = 'checkout.completed' then
    insert into public.hotel_os_tasks (
      hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata, created_by
    ) values (
      new.hotel_id,
      'Limpeza pós-checkout',
      'Quarto liberado pelo checkout. Executar limpeza e encaminhar para vistoria.',
      'governanca', 'pendente', 'alta',
      case when new.payload ? 'room_id' and (new.payload->>'room_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'room_id')::uuid else null end,
      case when new.payload ? 'reservation_id' and (new.payload->>'reservation_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'reservation_id')::uuid else null end,
      new.id,
      jsonb_build_object('automation', 'checkout_to_housekeeping'),
      new.created_by
    );
  elsif new.event_type = 'maintenance.created' then
    insert into public.hotel_os_tasks (
      hotel_id, title, description, department, status, priority,
      room_id, source_event_id, metadata, created_by
    ) values (
      new.hotel_id,
      'Atender chamado de manutenção',
      coalesce(new.payload->>'description', 'Novo chamado de manutenção.'),
      'manutencao', 'pendente',
      case when coalesce(new.payload->>'priority','normal') in ('critical','critica') then 'critica' else 'alta' end,
      case when new.payload ? 'room_id' and (new.payload->>'room_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'room_id')::uuid else null end,
      new.id,
      jsonb_build_object('automation', 'maintenance_dispatch'),
      new.created_by
    );
  elsif new.event_type = 'kitchen.order_created' then
    insert into public.hotel_os_tasks (
      hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata, created_by
    ) values (
      new.hotel_id,
      'Preparar pedido de cozinha',
      coalesce(new.payload->>'summary', 'Novo pedido recebido pela cozinha.'),
      'cozinha', 'pendente', 'normal',
      case when new.payload ? 'room_id' and (new.payload->>'room_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'room_id')::uuid else null end,
      case when new.payload ? 'reservation_id' and (new.payload->>'reservation_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'reservation_id')::uuid else null end,
      new.id,
      jsonb_build_object('automation', 'kitchen_order_to_kds'),
      new.created_by
    );
  elsif new.event_type = 'room_service.created' then
    insert into public.hotel_os_tasks (
      hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata, created_by
    ) values (
      new.hotel_id,
      'Entregar pedido de Room Service',
      coalesce(new.payload->>'summary', 'Novo pedido de Room Service.'),
      'room_service', 'pendente', 'normal',
      case when new.payload ? 'room_id' and (new.payload->>'room_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'room_id')::uuid else null end,
      case when new.payload ? 'reservation_id' and (new.payload->>'reservation_id') ~ '^[0-9a-fA-F-]{36}$' then (new.payload->>'reservation_id')::uuid else null end,
      new.id,
      jsonb_build_object('automation', 'room_service_dispatch'),
      new.created_by
    );
  elsif new.event_type = 'stock.below_minimum' then
    insert into public.hotel_os_tasks (
      hotel_id, title, description, department, status, priority,
      source_event_id, metadata, created_by
    ) values (
      new.hotel_id,
      'Repor estoque abaixo do mínimo',
      coalesce(new.payload->>'item_name', 'Item abaixo do estoque mínimo.'),
      'compras', 'pendente', 'alta',
      new.id,
      jsonb_build_object('automation', 'stock_replenishment'),
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hotel_os_route_event on public.hotel_os_events;
create trigger trg_hotel_os_route_event
after insert on public.hotel_os_events
for each row execute function public.hotel_os_route_event();

-- The canonical workflow table uses trigger_event/actions/conditions.
insert into public.hotel_os_workflows (name, description, active, trigger_event, actions, conditions)
select v.name, v.description, true, v.trigger_event, v.actions::jsonb, '{}'::jsonb
from (values
  ('Checkout → Governança','Cria tarefa operacional após checkout.','checkout.completed','[{"action":"create_task","department":"governanca","priority":"alta"}]'),
  ('Manutenção → Técnico','Cria tarefa para atendimento de manutenção.','maintenance.created','[{"action":"create_task","department":"manutencao"}]'),
  ('Pedido → Cozinha','Cria tarefa para preparação do pedido.','kitchen.order_created','[{"action":"create_task","department":"cozinha"}]'),
  ('Room Service → Entrega','Cria tarefa para entrega do pedido.','room_service.created','[{"action":"create_task","department":"room_service"}]'),
  ('Estoque mínimo → Compras','Cria tarefa quando o estoque fica abaixo do mínimo.','stock.below_minimum','[{"action":"create_task","department":"compras","priority":"alta"}]')
) as v(name, description, trigger_event, actions)
where not exists (
  select 1 from public.hotel_os_workflows w
  where w.hotel_id is null and w.trigger_event = v.trigger_event and w.name = v.name
);
