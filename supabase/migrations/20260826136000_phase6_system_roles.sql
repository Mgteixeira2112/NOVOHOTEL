-- FASE 6 — roles sistêmicos mínimos para PDV/KDS/TABLET.
insert into public.hotel_permissions(key,description) values
('kds.view','Visualizar KDS'),('kds.update','Atualizar KDS'),('pos.view','Visualizar PDV'),('pos.create_order','Criar pedido'),('pos.edit_order','Editar pedido'),('pos.cancel_item','Cancelar item'),('pos.apply_discount','Aplicar desconto'),('pos.open_cash','Abrir caixa'),('pos.close_cash','Fechar caixa'),('pos.refund','Estornar pagamento'),('tablet.menu.view','Visualizar menu do tablet'),('tablet.order.create','Criar pedido pelo tablet'),('tablet.order.view','Visualizar pedidos do tablet'),('tablet.service.request','Solicitar serviço pelo tablet')
on conflict(key) do nothing;

insert into public.hotel_roles(name,slug,description,system_role) values
('Operador PDV','PDV_ONLY','Acesso exclusivo à operação do PDV',true),
('Operador PDV','PDV','Operação de PDV e abertura de caixa',true),
('Cozinha','COZINHA','Operação do KDS',true),
('Tablet de quarto','TABLET','Operação de pedidos do tablet',true),
('Gerente','GERENTE','Gestão operacional do hotel',true)
on conflict(hotel_id,slug) do nothing;

insert into public.hotel_role_permissions(role_id,permission_id)
select r.id,p.id from public.hotel_roles r cross join public.hotel_permissions p
where r.hotel_id is null and r.slug='PDV_ONLY' and p.key in ('pos.view','pos.create_order','pos.edit_order','pos.cancel_item','pos.open_cash')
on conflict do nothing;
insert into public.hotel_role_permissions(role_id,permission_id)
select r.id,p.id from public.hotel_roles r cross join public.hotel_permissions p
where r.hotel_id is null and r.slug='PDV' and p.key in ('pos.view','pos.create_order','pos.edit_order','pos.cancel_item','pos.open_cash')
on conflict do nothing;
insert into public.hotel_role_permissions(role_id,permission_id)
select r.id,p.id from public.hotel_roles r cross join public.hotel_permissions p
where r.hotel_id is null and r.slug='COZINHA' and p.key in ('kds.view','kds.update')
on conflict do nothing;
insert into public.hotel_role_permissions(role_id,permission_id)
select r.id,p.id from public.hotel_roles r cross join public.hotel_permissions p
where r.hotel_id is null and r.slug='TABLET' and p.key in ('tablet.menu.view','tablet.order.create','tablet.order.view','tablet.service.request')
on conflict do nothing;
insert into public.hotel_role_permissions(role_id,permission_id)
select r.id,p.id from public.hotel_roles r cross join public.hotel_permissions p
where r.hotel_id is null and r.slug='GERENTE' and p.key in ('pos.view','pos.create_order','pos.edit_order','pos.cancel_item','pos.apply_discount','pos.open_cash','pos.close_cash','pos.refund','kds.view','kds.update')
on conflict do nothing;
