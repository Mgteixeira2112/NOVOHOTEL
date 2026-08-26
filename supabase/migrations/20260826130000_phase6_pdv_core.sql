-- FASE 6 — PDV + ROOM SERVICE + TABLET + KDS
-- Incremental: preserva as entidades PDV existentes e adiciona o contrato canônico.

create extension if not exists pgcrypto;

alter table public.pdv_produtos add column if not exists descricao text;
alter table public.pdv_produtos add column if not exists imagem_url text;
alter table public.pdv_produtos add column if not exists setor_preparacao text not null default 'COZINHA';
alter table public.pdv_produtos add column if not exists status text not null default 'ACTIVE';
alter table public.pdv_produtos add column if not exists controla_estoque boolean not null default false;
alter table public.pdv_produtos add column if not exists updated_at timestamptz not null default now();
alter table public.pdv_produtos drop constraint if exists pdv_produtos_status_check;
alter table public.pdv_produtos add constraint pdv_produtos_status_check check(status in ('ACTIVE','INACTIVE','OUT_OF_STOCK'));
alter table public.pdv_produtos drop constraint if exists pdv_produtos_setor_check;
alter table public.pdv_produtos add constraint pdv_produtos_setor_check check(setor_preparacao in ('COZINHA','BAR','CAFETERIA','OUTROS'));

alter table public.pdv_pedidos add column if not exists stay_id uuid references public.hotel_os_stays(id) on delete set null;
alter table public.pdv_pedidos add column if not exists folio_id uuid references public.hotel_os_folios(id) on delete set null;
alter table public.pdv_pedidos add column if not exists dispositivo_id uuid references public.dispositivos_hotel(id) on delete set null;
alter table public.pdv_pedidos add column if not exists origem_canonica text;
alter table public.pdv_pedidos add column if not exists prioridade text not null default 'NORMAL';
alter table public.pdv_pedidos add column if not exists cancelado_em timestamptz;
alter table public.pdv_pedidos add column if not exists concluido_em timestamptz;
update public.pdv_pedidos set origem_canonica=case origem when 'pdv' then 'POS' when 'quarto' then 'ROOM_SERVICE' when 'tablet_quarto' then 'TABLET' else 'OTHER' end where origem_canonica is null;
alter table public.pdv_pedidos drop constraint if exists pdv_pedidos_origem_canonica_check;
alter table public.pdv_pedidos add constraint pdv_pedidos_origem_canonica_check check(origem_canonica in ('POS','ROOM_SERVICE','TABLET','QR','OTHER'));
alter table public.pdv_pedidos drop constraint if exists pdv_pedidos_prioridade_check;
alter table public.pdv_pedidos add constraint pdv_pedidos_prioridade_check check(prioridade in ('LOW','NORMAL','HIGH','URGENT'));
create index if not exists idx_pdv_pedidos_hotel_status_v6 on public.pdv_pedidos(hotel_id,status,criado_em desc);
create index if not exists idx_pdv_pedidos_hotel_stay_v6 on public.pdv_pedidos(hotel_id,stay_id,status);
create index if not exists idx_pdv_pedidos_hotel_folio_v6 on public.pdv_pedidos(hotel_id,folio_id);

alter table public.pdv_itens_pedido add column if not exists desconto numeric(12,2) not null default 0 check(desconto>=0);
alter table public.pdv_itens_pedido add column if not exists total numeric(12,2);
alter table public.pdv_itens_pedido add column if not exists status text not null default 'CREATED';
alter table public.pdv_itens_pedido add column if not exists accepted_at timestamptz;
alter table public.pdv_itens_pedido add column if not exists started_at timestamptz;
alter table public.pdv_itens_pedido add column if not exists ready_at timestamptz;
alter table public.pdv_itens_pedido add column if not exists delivered_at timestamptz;
update public.pdv_itens_pedido set total=round(greatest(quantidade*preco_unitario-desconto,0),2) where total is null;
alter table public.pdv_itens_pedido drop constraint if exists pdv_itens_pedido_status_check;
alter table public.pdv_itens_pedido add constraint pdv_itens_pedido_status_check check(status in ('CREATED','CONFIRMED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'));

create table if not exists public.pdv_kds_items(
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hoteis(id) on delete cascade,
 order_id uuid not null references public.pdv_pedidos(id) on delete cascade,
 order_item_id uuid not null unique references public.pdv_itens_pedido(id) on delete cascade,
 sector text not null default 'COZINHA' check(sector in ('COZINHA','BAR','CAFETERIA','OUTROS')),
 status text not null default 'CREATED' check(status in ('CREATED','CONFIRMED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED')),
 priority text not null default 'NORMAL' check(priority in ('LOW','NORMAL','HIGH','URGENT')),
 sla_minutes integer check(sla_minutes is null or sla_minutes>0),
 created_at timestamptz not null default now(), accepted_at timestamptz, started_at timestamptz,
 ready_at timestamptz, delivered_at timestamptz, updated_at timestamptz not null default now()
);
create index if not exists idx_pdv_kds_hotel_sector_status on public.pdv_kds_items(hotel_id,sector,status,created_at);

create table if not exists public.pdv_cash_registers(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 name text not null, code text not null, active boolean not null default true, created_at timestamptz not null default now(), unique(hotel_id,code)
);
create table if not exists public.pdv_cash_sessions(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 cash_register_id uuid not null references public.pdv_cash_registers(id) on delete restrict, operator_id text,
 opened_at timestamptz not null default now(), opening_amount numeric(12,2) not null default 0 check(opening_amount>=0),
 closed_at timestamptz, expected_cash numeric(12,2), actual_cash numeric(12,2), difference numeric(12,2),
 status text not null default 'OPEN' check(status in ('OPEN','CLOSED'))
);
create unique index if not exists uq_pdv_cash_one_open on public.pdv_cash_sessions(cash_register_id) where status='OPEN';
create table if not exists public.pdv_cash_movements(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 cash_session_id uuid not null references public.pdv_cash_sessions(id) on delete cascade, order_id uuid references public.pdv_pedidos(id) on delete set null,
 type text not null check(type in ('OPENING','SALE','REFUND','WITHDRAWAL','SUPPLY','ADJUSTMENT','CLOSING')),
 amount numeric(12,2) not null check(amount>=0), payment_method text, description text, created_by text, created_at timestamptz not null default now(),
 check(payment_method is null or payment_method in ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER'))
);

alter table public.dispositivos_hotel add column if not exists status text not null default 'ACTIVE';
alter table public.dispositivos_hotel add column if not exists device_identifier text;
alter table public.dispositivos_hotel add column if not exists device_token_hash text;
alter table public.dispositivos_hotel add column if not exists last_seen_at timestamptz;
alter table public.dispositivos_hotel drop constraint if exists dispositivos_hotel_status_check;
alter table public.dispositivos_hotel add constraint dispositivos_hotel_status_check check(status in ('ACTIVE','INACTIVE','BLOCKED','RESET_REQUIRED'));
alter table public.sessoes_tablet_quarto add column if not exists stay_id uuid references public.hotel_os_stays(id) on delete set null;
alter table public.sessoes_tablet_quarto add column if not exists token_version integer not null default 1;
alter table public.sessoes_tablet_quarto add column if not exists last_seen_at timestamptz;

insert into public.hotel_permissions(key,description) values
('kds.view','Visualizar KDS'),('kds.update','Atualizar KDS'),('pos.view','Visualizar PDV'),('pos.create_order','Criar pedido'),
('pos.edit_order','Editar pedido'),('pos.cancel_item','Cancelar item'),('pos.apply_discount','Aplicar desconto'),('pos.open_cash','Abrir caixa'),('pos.close_cash','Fechar caixa'),('pos.refund','Estornar pagamento'),
('tablet.menu.view','Visualizar menu do tablet'),('tablet.order.create','Criar pedido no tablet'),('tablet.order.view','Visualizar pedido do tablet'),('tablet.service.request','Solicitar serviço')
on conflict(key) do nothing;

create or replace function public.hotel_os_has_permission(p_hotel_id uuid,p_permission text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.hotel_memberships m join public.hotel_roles r on r.hotel_id=p_hotel_id and r.slug=m.role join public.hotel_role_permissions rp on rp.role_id=r.id join public.hotel_permissions p on p.id=rp.permission_id and p.key=p_permission where m.user_id=auth.uid() and m.hotel_id=p_hotel_id and m.active=true)
 or exists(select 1 from public.usuarios u where u.auth_user_id=auth.uid() and u.ativo=true and (u.hotel_id=p_hotel_id or u.papel_rbac='SUPER_ADMIN') and coalesce((u.permissoes_json->>p_permission)::boolean,false));
$$;
create or replace function public.hotel_os_require_permission(p_hotel_id uuid,p_permission text) returns void language plpgsql security definer set search_path=public as $$
begin if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if; if not public.hotel_os_has_permission(p_hotel_id,p_permission) then raise exception 'PERMISSION_DENIED:%',p_permission; end if; end; $$;
revoke all on function public.hotel_os_has_permission(uuid,text) from public;
revoke all on function public.hotel_os_require_permission(uuid,text) from public;
grant execute on function public.hotel_os_has_permission(uuid,text) to authenticated;
grant execute on function public.hotel_os_require_permission(uuid,text) to authenticated;

create or replace function public.hotel_os_create_order(p_hotel_id uuid,p_source text,p_room_id text default null,p_device_id uuid default null,p_priority text default 'NORMAL',p_items jsonb default '[]'::jsonb,p_charge_to_room boolean default false,p_idempotency_key text default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_order uuid; v_stay uuid; v_folio uuid; x jsonb; p record; q numeric; d numeric; v_total numeric(12,2):=0; v_item uuid;
begin
 if p_source not in ('POS','ROOM_SERVICE','TABLET','QR','OTHER') then raise exception 'Origem inválida'; end if;
 perform public.hotel_os_require_permission(p_hotel_id,case when p_source='TABLET' then 'tablet.order.create' else 'pos.create_order' end);
 if p_idempotency_key is not null then select id into v_order from public.pdv_pedidos where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key; if found then return v_order; end if; end if;
 if p_source in ('ROOM_SERVICE','TABLET') or p_charge_to_room then
   select s.id,f.id into v_stay,v_folio from public.hotel_os_stays s join public.hotel_os_folios f on f.stay_id=s.id and f.status='open' where s.hotel_id=p_hotel_id and s.room_id=p_room_id and s.status='CHECKED_IN' order by s.actual_check_in_at desc limit 1;
   if v_stay is null then raise exception 'Quarto sem hospedagem ativa'; end if;
 end if;
 if p_device_id is not null and not exists(select 1 from public.dispositivos_hotel d where d.id=p_device_id and d.hotel_id=p_hotel_id and d.status='ACTIVE') then raise exception 'Dispositivo não autorizado'; end if;
 insert into public.pdv_pedidos(hotel_id,quarto_id,stay_id,folio_id,dispositivo_id,origem,status,total,idempotency_key,criado_por,prioridade,origem_canonica)
 values(p_hotel_id,p_room_id,v_stay,v_folio,p_device_id,case p_source when 'POS' then 'pdv' when 'TABLET' then 'tablet_quarto' when 'ROOM_SERVICE' then 'quarto' else 'outro' end,'recebido',0,p_idempotency_key,auth.uid(),p_priority,p_source) returning id into v_order;
 for x in select * from jsonb_array_elements(p_items) loop
   q:=coalesce((x->>'quantidade')::numeric,0); d:=coalesce((x->>'desconto')::numeric,0); if q<=0 or d<0 then raise exception 'Item inválido'; end if;
   select * into p from public.pdv_produtos where id=(x->>'produto_id')::uuid and hotel_id=p_hotel_id and ativo=true and status='ACTIVE' for share;
   if not found then raise exception 'Produto indisponível'; end if; if d>p.preco*q then raise exception 'Desconto excede item'; end if;
   insert into public.pdv_itens_pedido(pedido_id,produto_id,quantidade,preco_unitario,desconto,total,observacao,status) values(v_order,p.id,q,p.preco,d,round(p.preco*q-d,2),x->>'observacao','CREATED') returning id into v_item;
   v_total:=v_total+round(p.preco*q-d,2);
   insert into public.pdv_kds_items(hotel_id,order_id,order_item_id,sector,priority) values(p_hotel_id,v_order,v_item,coalesce(p.setor_preparacao,'COZINHA'),p_priority);
 end loop;
 update public.pdv_pedidos set total=v_total,atualizado_em=now() where id=v_order;
 begin perform public.hotel_os_emit_event(p_hotel_id,'order.created','ORDER','Order',v_order,jsonb_build_object('source',p_source,'stay_id',v_stay,'folio_id',v_folio),auth.uid()); exception when undefined_function then null; end;
 return v_order;
end; $$;
revoke all on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) from public;
grant execute on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) to authenticated;

create or replace function public.hotel_os_update_kds_item(p_kds_item_id uuid,p_status text) returns uuid language plpgsql security definer set search_path=public as $$
declare k record;
begin
 select * into k from public.pdv_kds_items where id=p_kds_item_id for update; if not found then raise exception 'Item KDS não encontrado'; end if;
 perform public.hotel_os_require_permission(k.hotel_id,'kds.update');
 if p_status not in ('CONFIRMED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED') then raise exception 'Status inválido'; end if;
 update public.pdv_kds_items set status=p_status,accepted_at=case when p_status='CONFIRMED' then coalesce(accepted_at,now()) else accepted_at end,started_at=case when p_status='PREPARING' then coalesce(started_at,now()) else started_at end,ready_at=case when p_status='READY' then coalesce(ready_at,now()) else ready_at end,delivered_at=case when p_status='DELIVERED' then coalesce(delivered_at,now()) else delivered_at end,updated_at=now() where id=k.id;
 update public.pdv_itens_pedido set status=p_status where id=k.order_item_id;
 update public.pdv_pedidos set status=case when p_status='PREPARING' then 'em_preparo' when p_status='READY' then 'pronto' when p_status in ('DELIVERED','COMPLETED') then 'entregue' when p_status='CANCELLED' then 'cancelado' else status end,atualizado_em=now() where id=k.order_id;
 return k.order_id;
end; $$;
revoke all on function public.hotel_os_update_kds_item(uuid,text) from public; grant execute on function public.hotel_os_update_kds_item(uuid,text) to authenticated;

create or replace function public.hotel_os_finalize_order(p_order_id uuid,p_payment_method text default null,p_cash_session_id uuid default null) returns uuid language plpgsql security definer set search_path=public as $$
declare o record; i record; t numeric(12,2); stock numeric(12,3);
begin
 select * into o from public.pdv_pedidos where id=p_order_id for update; if not found then raise exception 'Pedido não encontrado'; end if;
 perform public.hotel_os_require_permission(o.hotel_id,'pos.create_order');
 if o.status in ('cancelado','fechado') then raise exception 'Pedido não pode ser finalizado'; end if;
 select round(coalesce(sum(total) filter(where status<>'CANCELLED'),0),2) into t from public.pdv_itens_pedido where pedido_id=o.id;
 if o.folio_id is not null then
   if not exists(select 1 from public.hotel_os_folio_items where folio_id=o.folio_id and reference_id=o.id) then perform public.hotel_os_add_folio_item(o.folio_id,o.origem_canonica,'Pedido #'||o.numero,1,t,o.id); end if;
 else
   if p_payment_method is null or p_payment_method not in ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER') then raise exception 'Pagamento obrigatório'; end if;
   insert into public.pdv_pagamentos(pedido_id,hotel_id,valor,metodo,status,criado_em) values(o.id,o.hotel_id,t,p_payment_method,'aprovado',now());
   if p_payment_method='CASH' then
     if p_cash_session_id is null or not exists(select 1 from public.pdv_cash_sessions where id=p_cash_session_id and hotel_id=o.hotel_id and status='OPEN') then raise exception 'Sessão de caixa inválida'; end if;
     insert into public.pdv_cash_movements(hotel_id,cash_session_id,order_id,type,amount,payment_method,description,created_by) values(o.hotel_id,p_cash_session_id,o.id,'SALE',t,'CASH','Venda PDV',auth.uid()::text);
   end if;
 end if;
 for i in select pi.*,p.controla_estoque from public.pdv_itens_pedido pi join public.pdv_produtos p on p.id=pi.produto_id where pi.pedido_id=o.id and pi.status<>'CANCELLED' loop
   if i.controla_estoque then
     insert into public.pdv_estoque(hotel_id,produto_id,quantidade) values(o.hotel_id,i.produto_id,0) on conflict(hotel_id,produto_id) do nothing;
     select quantidade into stock from public.pdv_estoque where hotel_id=o.hotel_id and produto_id=i.produto_id for update;
     if stock<i.quantidade then raise exception 'Estoque insuficiente'; end if;
     if not exists(select 1 from public.pdv_estoque_movimentos where hotel_id=o.hotel_id and produto_id=i.produto_id and referencia_id=o.id and tipo='saida') then
       update public.pdv_estoque set quantidade=quantidade-i.quantidade,atualizado_em=now() where hotel_id=o.hotel_id and produto_id=i.produto_id;
       insert into public.pdv_estoque_movimentos(hotel_id,produto_id,tipo,quantidade,referencia_id,observacao,criado_por) values(o.hotel_id,i.produto_id,'saida',i.quantidade,o.id,'Venda Hotel OS',auth.uid());
     end if;
   end if;
   update public.pdv_itens_pedido set status='COMPLETED',delivered_at=coalesce(delivered_at,now()) where id=i.id;
   update public.pdv_kds_items set status='COMPLETED',delivered_at=coalesce(delivered_at,now()),updated_at=now() where order_item_id=i.id;
 end loop;
 update public.pdv_pedidos set total=t,status='entregue',concluido_em=now(),atualizado_em=now() where id=o.id;
 return o.id;
end; $$;
revoke all on function public.hotel_os_finalize_order(uuid,text,uuid) from public; grant execute on function public.hotel_os_finalize_order(uuid,text,uuid) to authenticated;
