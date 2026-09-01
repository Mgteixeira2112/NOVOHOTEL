-- Tabela de gate interno: não é acessada pelo cliente diretamente.
-- As funções SECURITY DEFINER controladas continuam lendo o estado do rollout.
alter table public.hotel_os_auth_rollout enable row level security;

revoke all on table public.hotel_os_auth_rollout from anon, authenticated;
