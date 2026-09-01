-- Remove geometria legada de menu; o renderer decide a posição automaticamente.
update public.workspace_engine_configs
set definition = jsonb_set(
  definition,
  '{presentation,sidebar}',
  jsonb_build_object('enabled', coalesce((definition #>> '{presentation,sidebar,enabled}')::boolean, true)),
  true
),
updated_at = now()
where hotel_id='default_hotel'
  and workspace_id='workspace-custom-financeiro-copia-mtiusd09'
  and definition #> '{presentation,sidebar}' ? 'x';
