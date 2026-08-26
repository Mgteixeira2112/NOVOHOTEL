-- FASE 6 — operações críticas do PDV.

create or replace function public.hotel_os_create_order(p_hotel_id uuid,p_source text,p_room_id text default null,p_device_id uuid default null,p_priority text default 'NORMAL',p_items jsonb default '[]'::jsonb,p_charge_to_room boolean default false,p_idempotency_key text default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_order uuid; v_stay uuid; v_folio uuid; x jsonb; p record; q numeric; d numeric; v_total numeric(12,2):=0; v_item uuid; has_discount boolean:=false;
begin
 if p_source not in ('POS','ROOM_SERVICE','TABLET','QR','OTHER') then raise exception 'Origem inválida'; end if;
 perform public.hotel_os_require_permission(p_hotel_id,case when p_source='TABLET' then 'tablet.order.create' else 'pos.create_order' end);
 if p_idempotency_key is not null then select id into v_order from public.pdv_pedidos where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key; if found then return v_order; end if; end if;
 if p_source in ('ROOM_SERVICE','TABLET') or p_charge_to_room then
   if p_room_id is null then raise exception 'Quarto obrigatório'; end if;
   select s.id,f.id into v_stay,v_folio from public.hotel_os_stays s join public.hotel_os_folios f on f.stay_id=s.id and f.status='open' where s.hotel_id=p_hotel_id and s.room_id=p_room_id and s.status='CHECKED_IN' order by s.actual_check_in_at desc limit 1;
   if v_stay is null then raise exception 'Quarto sem hospedagem ativa'; end if;
 end if;
 if p_source='TABLET' and not exists(select 1 from public.dispositivos_hotel d where d.id=p_device_id and d.hotel_id=p_hotel_id and d.quarto_id=p_room_id and d.tipo='tablet_quarto' and d.status='ACTIVE') then raise exception 'Tablet não pertence ao quarto'; end if;
 insert into public.pdv_pedidos(hotel_id,quarto_id,stay_id,folio_id,dispositivo_id,origem,status,total,idempotency_key,criado_por,prioridade,origem_canonica) values(p_hotel_id,p_room_id,v_stay,v_folio,p_device_id,case p_source when 'POS' then 'pdv' when 'TABLET' then 'tablet_quarto' when 'ROOM_SERVICE' then 'quarto' else 'outro' end,'recebido',0,p_idempotency_key,auth.uid(),p_priority,p_source) returning id into v_order;
 for x in select * from jsonb_array_elements(p_items) loop
   q:=coalesce((x->>'quantidade')::numeric,0); d:=coalesce((x->>'desconto')::numeric,0); if q<=0 or d<0 then raise exception 'Item inválido'; end if; if d>0 then has_discount:=true; end if;
   select * into p from public.pdv_produtos where id=(x->>'produto_id')::uuid and hotel_id=p_hotel_id and ativo=true and status='ACTIVE' for share; if not found then raise exception 'Produto indisponível'; end if; if d>p.preco*q then raise exception 'Desconto excede item'; end if;
   insert into public.pdv_itens_pedido(pedido_id,produto_id,quantidade,preco_unitario,desconto,total,observacao,status) values(v_order,p.id,q,p.preco,d,round(p.preco*q-d,2),x->>'observacao','CREATED') returning id into v_item;
   v_total:=v_total+round(p.preco*q-d,2);
   insert into public.pdv_kds_items(hotel_id,order_id,order_item_id,sector,priority) values(p_hotel_id,v_order,v_item,coalesce(p.setor_preparacao,'COZINHA'),p_priority);
 end loop;
 if has_discount then perform public.hotel_os_require_permission(p_hotel_id,'pos.apply_discount'); end if;
 update public.pdv_pedidos set total=v_total,atualizado_em=now() where id=v_order; return v_order;
end; $$;
revoke all on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) from public; grant execute on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) to authenticated;

create or replace function public.hotel_os_cancel_order(p_order_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare o record; i record;
begin
 select * into o from public.pdv_pedidos where id=p_order_id for update; if not found then raise exception 'Pedido não encontrado'; end if;
 perform public.hotel_os_require_permission(o.hotel_id,'pos.cancel_item');
 if o.status in ('cancelado','fechado') then return o.id; end if;
 update public.pdv_pedidos set status='cancelado',cancelado_em=now(),atualizado_em=now() where id=o.id;
 update public.pdv_itens_pedido set status='CANCELLED' where pedido_id=o.id and status<>'COMPLETED';
 update public.pdv_kds_items set status='CANCELLED',updated_at=now() where order_id=o.id and status not in ('COMPLETED','CANCELLED');
 begin perform public.hotel_os_record_audit(o.hotel_id,'order_cancelled','order',o.id::text,jsonb_build_object('status',o.status),jsonb_build_object('status','cancelado','reason',p_reason),'{}'); exception when undefined_function then null; end;
 return o.id;
end; $$;
revoke all on function public.hotel_os_cancel_order(uuid,text) from public; grant execute on function public.hotel_os_cancel_order(uuid,text) to authenticated;

create or replace function public.hotel_os_refund_payment(p_payment_id uuid,p_reason text,p_cash_session_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare pay record; v_tx uuid;
begin
 select * into pay from public.pdv_pagamentos where id=p_payment_id for update; if not found then raise exception 'Pagamento não encontrado'; end if;
 perform public.hotel_os_require_permission(pay.hotel_id,'pos.refund');
 if pay.status in ('estornado','refunded','cancelado') then return pay.id; end if;
 update public.pdv_pagamentos set status='estornado' where id=pay.id;
 insert into public.hotel_os_transactions(hotel_id,folio_id,transaction_type,amount,method,payment_method,status,external_reference,created_by)
 values(pay.hotel_id,null,'refund',pay.valor,pay.metodo,pay.metodo,'approved',p_reason,auth.uid()) returning id into v_tx;
 if pay.metodo='CASH' and p_cash_session_id is not null then
   if not exists(select 1 from public.pdv_cash_sessions where id=p_cash_session_id and hotel_id=pay.hotel_id and status='OPEN') then raise exception 'Sessão de caixa inválida'; end if;
   insert into public.pdv_cash_movements(hotel_id,cash_session_id,order_id,type,amount,payment_method,description,created_by) values(pay.hotel_id,p_cash_session_id,pay.pedido_id,'REFUND',pay.valor,'CASH',p_reason,auth.uid()::text);
 end if;
 begin perform public.hotel_os_record_audit(pay.hotel_id,'payment_refunded','payment',pay.id::text,jsonb_build_object('status','aprovado','amount',pay.valor),jsonb_build_object('status','estornado','reason',p_reason),'{}'); exception when undefined_function then null; end;
 return pay.id;
end; $$;
revoke all on function public.hotel_os_refund_payment(uuid,text,uuid) from public; grant execute on function public.hotel_os_refund_payment(uuid,text,uuid) to authenticated;
