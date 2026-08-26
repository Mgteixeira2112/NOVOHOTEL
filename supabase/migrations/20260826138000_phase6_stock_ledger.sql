-- FASE 6 — ledger canônico de estoque sem remover o ledger legado.
create table if not exists public.hotel_os_stock_movements(
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hoteis(id) on delete cascade,
 product_id uuid not null references public.pdv_produtos(id) on delete restrict,
 movement_type text not null check(movement_type in ('SALE','RETURN','ADJUSTMENT','WASTE','TRANSFER')),
 quantity numeric(12,3) not null check(quantity>0),
 reference_id uuid,
 created_by uuid,
 created_at timestamptz not null default now(),
 metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_hotel_os_stock_movements on public.hotel_os_stock_movements(hotel_id,product_id,movement_type,created_at desc);
alter table public.hotel_os_stock_movements enable row level security;
drop policy if exists hotel_os_stock_movements_access on public.hotel_os_stock_movements;
create policy hotel_os_stock_movements_access on public.hotel_os_stock_movements for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

create or replace function public.hotel_os_mirror_stock_movement()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_type text;
begin
 v_type:=case lower(new.tipo) when 'saida' then 'SALE' when 'entrada' then 'RETURN' when 'ajuste' then 'ADJUSTMENT' when 'perda' then 'WASTE' when 'transferencia' then 'TRANSFER' else 'ADJUSTMENT' end;
 insert into public.hotel_os_stock_movements(hotel_id,product_id,movement_type,quantity,reference_id,created_by,metadata)
 values(new.hotel_id,new.produto_id,v_type,abs(new.quantidade),new.referencia_id,new.criado_por,jsonb_build_object('legacy_type',new.tipo,'legacy_id',new.id));
 return new;
end; $$;

drop trigger if exists trg_hotel_os_mirror_stock on public.pdv_estoque_movimentos;
create trigger trg_hotel_os_mirror_stock after insert on public.pdv_estoque_movimentos for each row execute function public.hotel_os_mirror_stock_movement();

create or replace function public.hotel_os_refresh_product_stock_status()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_stock numeric;
begin
 select quantidade into v_stock from public.pdv_estoque where hotel_id=new.hotel_id and produto_id=new.produto_id;
 update public.pdv_produtos set estoque_atual=coalesce(v_stock,0),status=case when ativo=false then 'INACTIVE' when controla_estoque and coalesce(v_stock,0)<=0 then 'OUT_OF_STOCK' else 'ACTIVE' end,updated_at=now(),atualizado_em=now() where id=new.produto_id and hotel_id=new.hotel_id;
 return new;
end; $$;

drop trigger if exists trg_hotel_os_refresh_product_stock on public.pdv_estoque_movimentos;
create trigger trg_hotel_os_refresh_product_stock after insert on public.pdv_estoque_movimentos for each row execute function public.hotel_os_refresh_product_stock_status();
