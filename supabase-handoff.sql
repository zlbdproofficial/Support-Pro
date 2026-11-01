-- Postea : passage de relais de la connexion Google (navigateur -> application)
-- À coller dans Supabase : SQL Editor > New query > Run

create table if not exists public.login_handoff (
  nonce text primary key,
  access_token text not null,
  refresh_token text not null,
  created_at timestamptz not null default now()
);

-- La table est fermée : aucun accès direct, seulement par les deux fonctions ci-dessous.
alter table public.login_handoff enable row level security;
revoke all on public.login_handoff from anon, authenticated;

-- Appelée par le site, une fois l'utilisateur connecté avec Google.
create or replace function public.store_handoff(p_nonce text, p_access text, p_refresh text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_nonce is null or length(p_nonce) < 32 then raise exception 'invalid nonce'; end if;
  delete from public.login_handoff where created_at < now() - interval '10 minutes';
  insert into public.login_handoff (nonce, access_token, refresh_token)
  values (p_nonce, p_access, p_refresh)
  on conflict (nonce) do update
    set access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        created_at = now();
end;
$$;

-- Appelée par l'application : récupère la session une seule fois, puis la supprime.
create or replace function public.claim_handoff(p_nonce text)
returns table (out_access text, out_refresh text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_nonce is null or length(p_nonce) < 32 then return; end if;
  return query
    with d as (
      delete from public.login_handoff h
      where h.nonce = p_nonce and h.created_at > now() - interval '10 minutes'
      returning h.access_token as a, h.refresh_token as r
    )
    select a, r from d;
end;
$$;

revoke all on function public.store_handoff(text, text, text) from public, anon;
grant execute on function public.store_handoff(text, text, text) to authenticated;
revoke all on function public.claim_handoff(text) from public;
grant execute on function public.claim_handoff(text) to anon, authenticated;
