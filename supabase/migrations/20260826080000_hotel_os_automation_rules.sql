-- Hotel OS automation rules.
-- Each operational event automatically creates the next work item.

alter table if exists public.hotel_os_tasks add column if not exists description text;
alter table if exists public.hotel_os_tasks add column if not exists room_id text;
alter table if exists public.hotel_os_tasks add column if not exists reservation_id text;

create or replace function public.hotel_os_route_event()
returns trigger
language plpgsql
security invoker
as $$
begin
  if new.event_type = 'checkout.completed' then
    insert into public.hotel_os_tasks (
      id, hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata
    ) values (
      'task_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8),
      new.hotel_id,
      'Limpeza pós-checkout',
      'Quarto liberado pelo checkout. Executar limpeza e encaminhar para vistoria.',
      'governanca', 'pending', 'high',
      case when new.payload ? 'room_id' then new.payload->>'room_id' else null end,
      case when new.payload ? 'reservation_id' then new.payload->>'reservation_id' else new.aggregate_id end,
      new.id,
      jsonb_build_object('automation', 'checkout_to_housekeeping')
    );
  elsif new.event_type = 'maintenance.created' then
    insert into public.hotel_os_tasks (
      id, hotel_id, title, description, department, status, priority,
      room_id, source_event_id, metadata
    ) values (
      'task_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8),
      new.hotel_id,
      'Atender chamado de manutenção',
      coalesce(new.payload->>'description', 'Novo chamado de manutenção.'),
      'manutencao', 'pending',
      case when coalesce(new.payload->>'priority','normal') in ('critical','critica') then 'critical' else 'high' end,
      case when new.payload ? 'room_id' then new.payload->>'room_id' else null end,
      new.id,
      jsonb_build_object('automation', 'maintenance_dispatch')
    );
  elsif new.event_type = 'kitchen.order_created' then
    insert into public.hotel_os_tasks (
      id, hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata
    ) values (
      'task_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8),
      new.hotel_id,
      'Preparar pedido de cozinha',
      coalesce(new.payload->>'summary', 'Novo pedido recebido pelo KDS.'),
      'cozinha', 'pending', 'normal',
      case when new.payload ? 'room_id' then new.payload->>'room_id' else null end,
      case when new.payload ? 'reservation_id' then new.payload->>'reservation_id' else null end,
      new.id,
      jsonb_build_object('automation', 'kitchen_order_to_kds')
    );
  elsif new.event_type = 'room_service.created' then
    insert into public.hotel_os_tasks (
      id, hotel_id, title, description, department, status, priority,
      room_id, reservation_id, source_event_id, metadata
    ) values (
      'task_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8),
      new.hotel_id,
      'Entregar pedido de Room Service',
      coalesce(new.payload->>'summary', 'Novo pedido de Room Service.'),
      'room_service', 'pending', 'normal',
      case when new.payload ? 'room_id' then new.payload->>'room_id' else null end,
      case when new.payload ? 'reservation_id' then new.payload->>'reservation_id' else null end,
      new.id,
      jsonb_build_object('automation', 'room_service_dispatch')
    );
  elsif new.event_type = 'stock.below_minimum' then
    insert into public.hotel_os_tasks (
      id, hotel_id, title, description, department, status, priority,
      source_event_id, metadata
    ) values (
      'task_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8),
      new.hotel_id,
      'Repor estoque abaixo do mínimo',
      coalesce(new.payload->>'item_name', 'Item abaixo do estoque mínimo.'),
      'compras', 'pending', 'high',
      new.id,
      jsonb_build_object('automation', 'stock_replenishment')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hotel_os_route_event on public.hotel_os_events;
create trigger trg_hotel_os_route_event
after insert on public.hotel_os_events
for each row execute function public.hotel_os_route_event();

insert into public.hotel_os_workflows (id, name, active, trigger_type, trigger_config, action_config)
values
  ('wf_checkout_housekeeping', 'Checkout → Governança', true, 'checkout.completed', '{}', '{"action":"create_task","department":"governanca","priority":"high"}'),
  ('wf_maintenance_dispatch', 'Manutenção → Técnico', true, 'maintenance.created', '{}', '{"action":"create_task","department":"manutencao"}'),
  ('wf_kitchen_kds', 'Pedido → KDS', true, 'kitchen.order_created', '{}', '{"action":"create_task","department":"cozinha"}'),
  ('wf_room_service', 'Room Service → Entrega', true, 'room_service.created', '{}', '{"action":"create_task","department":"room_service"}'),
  ('wf_stock_purchase', 'Estoque mínimo → Compras', true, 'stock.below_minimum', '{}', '{"action":"create_task","department":"compras","priority":"high"}')
on conflict (id) do nothing;
