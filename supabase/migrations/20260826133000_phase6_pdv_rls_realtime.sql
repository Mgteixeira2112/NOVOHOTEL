-- FASE 6 — RLS definitivo do PDV/Room Service/KDS.

alter table public.pdv_produtos enable row level security;
alter table public.pdv_pedidos enable row level security;
alter table public.pdv_itens_pedido enable row level security;
alter table public.dispositivos_hotel enable row level security;
alter table public.sessoes_tablet_quarto enable row level security;

drop policy if exists pdv_produtos_hotel_access on public.pdv_produtos;
create policy pdv_produtos_hotel_access on public.pdv_produtos for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

drop policy if exists pdv_pedidos_hotel_access on public.pdv_pedidos;
create policy pdv_pedidos_hotel_access on public.pdv_pedidos for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

drop policy if exists pdv_itens_hotel_access on public.pdv_itens_pedido;
create policy pdv_itens_hotel_access on public.pdv_itens_pedido for all to authenticated
using(exists(select 1 from public.pdv_pedidos o where o.id=pedido_id and public.usuario_pode_hotel(o.hotel_id)))
with check(exists(select 1 from public.pdv_pedidos o join public.pdv_produtos p on p.id=produto_id where o.id=pedido_id and p.hotel_id=o.hotel_id and public.usuario_pode_hotel(o.hotel_id)));

drop policy if exists dispositivos_hotel_access_v6 on public.dispositivos_hotel;
create policy dispositivos_hotel_access_v6 on public.dispositivos_hotel for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

drop policy if exists sessoes_tablet_hotel_access_v6 on public.sessoes_tablet_quarto;
create policy sessoes_tablet_hotel_access_v6 on public.sessoes_tablet_quarto for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

create index if not exists idx_pdv_produtos_hotel_category_v6 on public.pdv_produtos(hotel_id,categoria,status,nome);
create index if not exists idx_pdv_pedidos_room_v6 on public.pdv_pedidos(hotel_id,quarto_id,status,criado_em desc);
create index if not exists idx_pdv_kds_realtime_v6 on public.pdv_kds_items(hotel_id,sector,status,created_at desc);

-- Publicação Realtime; duplicatas são ignoradas.
do $$ begin alter publication supabase_realtime add table public.pdv_produtos; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_itens_pedido; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.pdv_kds_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.dispositivos_hotel; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.sessoes_tablet_quarto; exception when duplicate_object then null; end $$;
