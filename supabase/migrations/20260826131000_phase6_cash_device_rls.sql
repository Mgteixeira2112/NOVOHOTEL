-- FASE 6 — caixa, dispositivos, tablet seguro, RLS e realtime

insert into public.hotel_permissions(key,description) values
('kds.view','Visualizar KDS'),('kds.update','Atualizar KDS'),('pos.view','Visualizar PDV'),('pos.create_order','Criar pedido'),('pos.edit_order','Editar pedido'),('pos.cancel_item','Cancelar item'),('pos.apply_discount','Aplicar desconto'),('pos.open_cash','Abrir caixa'),('pos.close_cash','Fechar caixa'),('pos.refund','Estornar pagamento'),('tablet.menu.view','Visualizar menu'),('tablet.order.create','Criar pedido no tablet'),('tablet.order.view','Visualizar pedidos'),('tablet.service.request','Solicitar serviço')
on conflict(key) do nothing;

create or replace function public.hotel_os_open_cash(p_cash_register_id uuid,p_opening_amount numeric)
returns uuid language plpgsql security definer set search_path=public as $$
declare r record; s uuid;
begin
 select * into r from public.pdv_cash_registers where id=p_cash_register_id for update;
 if not found or not r.active then raise exception 'Caixa inválido'; end if;
 perform public.hotel_os_require_permission(r.hotel_id,'pos.open_cash');
 if p_opening_amount < 0 then raise exception 'Valor de abertura inválido'; end if;
 insert into public.pdv_cash_sessions(hotel_id,cash_register_id,operator_id,opening_amount,status) values(r.hotel_id,r.id,auth.uid()::text,p_opening_amount,'OPEN') returning id into s;
 insert into public.pdv_cash_movements(hotel_id,cash_session_id,type,amount,payment_method,description,created_by) values(r.hotel_id,s,'OPENING',p_opening_amount,'CASH','Abertura do caixa',auth.uid()::text);
 return s;
end; $$;
revoke all on function public.hotel_os_open_cash(uuid,numeric) from public; grant execute on function public.hotel_os_open_cash(uuid,numeric) to authenticated;

create or replace function public.hotel_os_close_cash(p_cash_session_id uuid,p_actual_cash numeric)
returns uuid language plpgsql security definer set search_path=public as $$
declare s record; expected numeric(12,2); diff numeric(12,2);
begin
 select cs.*,cr.hotel_id into s from public.pdv_cash_sessions cs join public.pdv_cash_registers cr on cr.id=cs.cash_register_id where cs.id=p_cash_session_id for update;
 if not found then raise exception 'Sessão não encontrada'; end if;
 perform public.hotel_os_require_permission(s.hotel_id,'pos.close_cash');
 if s.status <> 'OPEN' then raise exception 'Caixa já fechado'; end if;
 if p_actual_cash < 0 then raise exception 'Valor contado inválido'; end if;
 select round(s.opening_amount+coalesce(sum(case when type in ('SALE','SUPPLY','OPENING','ADJUSTMENT') and payment_method='CASH' then amount else 0 end),0)-coalesce(sum(case when type in ('REFUND','WITHDRAWAL') and payment_method='CASH' then amount else 0 end),0),2) into expected from public.pdv_cash_movements where cash_session_id=s.id;
 diff:=round(p_actual_cash-expected,2);
 update public.pdv_cash_sessions set status='CLOSED',closed_at=now(),expected_cash=expected,actual_cash=p_actual_cash,difference=diff where id=s.id;
 insert into public.pdv_cash_movements(hotel_id,cash_session_id,type,amount,payment_method,description,created_by) values(s.hotel_id,s.id,'CLOSING',p_actual_cash,'CASH','Fechamento; diferença '||diff,auth.uid()::text);
 begin perform public.hotel_os_record_audit(s.hotel_id,'cash_closed','cash_session',s.id::text,jsonb_build_object('expected_cash',expected),jsonb_build_object('actual_cash',p_actual_cash,'difference',diff),'{}'); exception when undefined_function then null; end;
 return s.id;
end; $$;
revoke all on function public.hotel_os_close_cash(uuid,numeric) from public; grant execute on function public.hotel_os_close_cash(uuid,numeric) to authenticated;

create or replace function public.hotel_os_start_room_device_session(p_device_id uuid,p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare d record; s uuid; v uuid;
begin
 select * into d from public.dispositivos_hotel where id=p_device_id for update;
 if not found or d.status<>'ACTIVE' or d.tipo<>'tablet_quarto' then raise exception 'Tablet não autorizado'; end if;
 if d.device_token_hash is null or encode(digest(coalesce(p_token,''),'sha256'),'hex')<>d.device_token_hash then raise exception 'Token inválido'; end if;
 if d.quarto_id is null then raise exception 'Tablet sem quarto'; end if;
 select hs.id into s from public.hotel_os_stays hs where hs.hotel_id=d.hotel_id and hs.room_id=d.quarto_id and hs.status='CHECKED_IN' order by hs.actual_check_in_at desc limit 1;
 if s is null then raise exception 'Quarto sem hospedagem ativa'; end if;
 update public.sessoes_tablet_quarto set ativa=false,encerrada_em=now() where dispositivo_id=d.id and ativa=true;
 insert into public.sessoes_tablet_quarto(dispositivo_id,hotel_id,quarto_id,reserva_id,stay_id,ativa,last_seen_at) values(d.id,d.hotel_id,d.quarto_id,(select reservation_id from public.hotel_os_stays where id=s),s,true,now()) returning id into v;
 update public.dispositivos_hotel set last_seen_at=now(),ultimo_acesso=now() where id=d.id;
 return v;
end; $$;
revoke all on function public.hotel_os_start_room_device_session(uuid,text) from public; grant execute on function public.hotel_os_start_room_device_session(uuid,text) to authenticated;

create or replace function public.hotel_os_reset_room_device_after_checkout(p_stay_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare s record;
begin
 select * into s from public.hotel_os_stays where id=p_stay_id for update; if not found then raise exception 'Stay não encontrada'; end if;
 perform public.hotel_os_require_permission(s.hotel_id,'reservations.checkout');
 update public.sessoes_tablet_quarto set ativa=false,encerrada_em=now(),stay_id=null,last_seen_at=now(),token_version=token_version+1 where hotel_id=s.hotel_id and (stay_id=s.id or quarto_id=s.room_id) and ativa=true;
 update public.dispositivos_hotel set status='RESET_REQUIRED',last_seen_at=now() where hotel_id=s.hotel_id and quarto_id=s.room_id and tipo='tablet_quarto' and status='ACTIVE';
 return true;
end; $$;
revoke all on function public.hotel_os_reset_room_device_after_checkout(uuid) from public; grant execute on function public.hotel_os_reset_room_device_after_checkout(uuid) to authenticated;

-- RLS por hotel para novas estruturas e pedidos/estoque existentes.
alter table public.pdv_kds_items enable row level security;
alter table public.pdv_cash_registers enable row level security;
alter table public.pdv_cash_sessions enable row level security;
alter table public.pdv_cash_movements enable row level security;

drop policy if exists pdv_kds_items_hotel on public.pdv_kds_items;
create policy pdv_kds_items_hotel on public.pdv_kds_items for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists pdv_cash_registers_hotel on public.pdv_cash_registers;
create policy pdv_cash_registers_hotel on public.pdv_cash_registers for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists pdv_cash_sessions_hotel on public.pdv_cash_sessions;
create policy pdv_cash_sessions_hotel on public.pdv_cash_sessions for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists pdv_cash_movements_hotel on public.pdv_cash_movements;
create policy pdv_cash_movements_hotel on public.pdv_cash_movements for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

drop policy if exists pdv_estoque_hotel_access on public.pdv_estoque;
create policy pdv_estoque_hotel_access on public.pdv_estoque for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists pdv_estoque_movimentos_hotel_access on public.pdv_estoque_movimentos;
create policy pdv_estoque_movimentos_hotel_access on public.pdv_estoque_movimentos for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

-- Realtime para todos os consumidores operacionais.
do $$ begin alter publication supabase_realtime add table public.pdv_pedidos; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_itens_pedido; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_kds_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_cash_sessions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_cash_movements; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.dispositivos_hotel; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.sessoes_tablet_quarto; exception when duplicate_object then null; end $$;
