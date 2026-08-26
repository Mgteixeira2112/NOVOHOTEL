-- Compatibilidade incremental do catálogo com o estoque existente.
alter table public.pdv_produtos add column if not exists estoque_atual numeric(12,3) not null default 0 check(estoque_atual>=0);
alter table public.pdv_produtos add column if not exists estoque_minimo numeric(12,3) not null default 0 check(estoque_minimo>=0);

-- Sincroniza somente a projeção de quantidade; o ledger de estoque continua sendo a fonte operacional.
do $$ begin
  update public.pdv_produtos p
  set estoque_atual=coalesce((select e.quantidade from public.pdv_estoque e where e.hotel_id=p.hotel_id and e.produto_id=p.id),0);
exception when undefined_table then null;
end $$;

create index if not exists idx_pdv_produtos_stock_v6 on public.pdv_produtos(hotel_id,estoque_atual);
