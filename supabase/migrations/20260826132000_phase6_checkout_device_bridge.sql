-- FASE 6 — ponte entre Stay/Checkout e dispositivos de quarto.

create or replace function public.hotel_os_create_order(p_hotel_id uuid,p_source text,p_room_id text default null,p_device_id uuid default null,p_priority text default 'NORMAL',p_items jsonb default '[]'::jsonb,p_charge_to_room boolean default false,p_idempotency_key text default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_order uuid; v_stay uuid; v_folio uuid; x jsonb; p record; q numeric; d numeric; v_total numeric(12,2):=0; v_item uuid;
begin
 if p_source not in ('POS','ROOM_SERVICE','TABLET','QR','OTHER') then raise exception 'Origem inválida'; end if;
 perform public.hotel_os_require_permission(p_hotel_id,case when p_source='TABLET' then 'tablet.order.create' else 'pos.create_order' end);
 if p_idempotency_key is not null then select id into v_order from public.pdv_pedidos where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key; if found then return v_order; end if; end if;
 if p_source in ('ROOM_SERVICE','TABLET') or p_charge_to_room then
   if p_room_id is null then raise exception 'Quarto obrigatório'; end if;
   select s.id,f.id into v_stay,v_folio from public.hotel_os_stays s join public.hotel_os_folios f on f.stay_id=s.id and f.status='open' where s.hotel_id=p_hotel_id and s.room_id=p_room_id and s.status='CHECKED_IN' order by s.actual_check_in_at desc limit 1;
   if v_stay is null then raise exception 'Quarto sem hospedagem ativa'; end if;
 end if;
 if p_source='TABLET' then
   if p_device_id is null then raise exception 'Tablet deve informar o dispositivo'; end if;
   if not exists(select 1 from public.dispositivos_hotel d where d.id=p_device_id and d.hotel_id=p_hotel_id and d.quarto_id=p_room_id and d.tipo='tablet_quarto' and d.status='ACTIVE') then raise exception 'Tablet não pertence ao quarto'; end if;
 elsif p_device_id is not null and not exists(select 1 from public.dispositivos_hotel d where d.id=p_device_id and d.hotel_id=p_hotel_id and d.status='ACTIVE') then raise exception 'Dispositivo não autorizado'; end if;
 insert into public.pdv_pedidos(hotel_id,quarto_id,stay_id,folio_id,dispositivo_id,origem,status,total,idempotency_key,criado_por,prioridade,origem_canonica) values(p_hotel_id,p_room_id,v_stay,v_folio,p_device_id,case p_source when 'POS' then 'pdv' when 'TABLET' then 'tablet_quarto' when 'ROOM_SERVICE' then 'quarto' else 'outro' end,'recebido',0,p_idempotency_key,auth.uid(),p_priority,p_source) returning id into v_order;
 for x in select * from jsonb_array_elements(p_items) loop
   q:=coalesce((x->>'quantidade')::numeric,0); d:=coalesce((x->>'desconto')::numeric,0); if q<=0 or d<0 then raise exception 'Item inválido'; end if;
   select * into p from public.pdv_produtos where id=(x->>'produto_id')::uuid and hotel_id=p_hotel_id and ativo=true and status='ACTIVE' for share;
   if not found then raise exception 'Produto indisponível'; end if; if d>p.preco*q then raise exception 'Desconto excede item'; end if;
   insert into public.pdv_itens_pedido(pedido_id,produto_id,quantidade,preco_unitario,desconto,total,observacao,status) values(v_order,p.id,q,p.preco,d,round(p.preco*q-d,2),x->>'observacao','CREATED') returning id into v_item;
   v_total:=v_total+round(p.preco*q-d,2);
   insert into public.pdv_kds_items(hotel_id,order_id,order_item_id,sector,priority) values(p_hotel_id,v_order,v_item,coalesce(p.setor_preparacao,'COZINHA'),p_priority);
 end loop;
 update public.pdv_pedidos set total=v_total,atualizado_em=now() where id=v_order;
 begin perform public.hotel_os_emit_event(p_hotel_id,'order.created','ORDER','Order',v_order,jsonb_build_object('source',p_source,'stay_id',v_stay,'folio_id',v_folio,'device_id',p_device_id),auth.uid()); exception when undefined_function then null; end;
 return v_order;
end; $$;
revoke all on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) from public; grant execute on function public.hotel_os_create_order(uuid,text,text,uuid,text,jsonb,boolean,text) to authenticated;

create or replace function public.hotel_os_after_checkout_reset_tablets()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='CHECKED_OUT' and old.status<>'CHECKED_OUT' then
   update public.sessoes_tablet_quarto set ativa=false,encerrada_em=now(),stay_id=null,last_seen_at=now(),token_version=token_version+1 where hotel_id=new.hotel_id and (stay_id=new.id or quarto_id=new.room_id) and ativa=true;
   update public.dispositivos_hotel set status='RESET_REQUIRED',last_seen_at=now() where hotel_id=new.hotel_id and quarto_id=new.room_id and tipo='tablet_quarto' and status='ACTIVE';
 end if;
 return new;
end; $$;

drop trigger if exists trg_hotel_os_checkout_reset_tablets on public.hotel_os_stays;
create trigger trg_hotel_os_checkout_reset_tablets after update of status on public.hotel_os_stays for each row execute function public.hotel_os_after_checkout_reset_tablets();
