-- Postea : tables pour l'intégration Telegram (fonction Edge "telegram")
-- À coller dans Supabase : SQL Editor > New query > Run
-- Peut être relancé sans risque (aucune donnée supprimée).

-- 1) Robot de chaque utilisateur. Le jeton du robot est secret :
--    la table est fermée aux clients, seule la fonction Edge (service role) y accède.
create table if not exists public.telegram_bots (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  bot_token      text not null,
  bot_username   text,
  webhook_secret text not null,
  created_at     timestamptz not null default now()
);

alter table public.telegram_bots enable row level security;
revoke all on public.telegram_bots from anon, authenticated;
-- Aucune policy : personne côté application ne peut lire ni écrire cette table.

-- 2) Messages reçus et envoyés.
create table if not exists public.telegram_messages (
  id            bigint generated always as identity primary key,
  user_id       uuid   not null references auth.users(id) on delete cascade,
  chat_id       bigint not null,
  chat_title    text,
  sender        text,
  text          text,
  direction     text   not null check (direction in ('in', 'out')),
  tg_message_id bigint not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now(),
  -- requis par l'upsert (onConflict) de la fonction Edge
  constraint telegram_messages_unique unique (user_id, chat_id, tg_message_id, direction)
);

create index if not exists telegram_messages_chat_idx
  on public.telegram_messages (user_id, chat_id, created_at desc);

alter table public.telegram_messages enable row level security;
revoke all on public.telegram_messages from anon, authenticated;

-- L'utilisateur lit ses propres messages et peut seulement les marquer comme lus.
grant select on public.telegram_messages to authenticated;
grant update (is_read) on public.telegram_messages to authenticated;

drop policy if exists "telegram_messages_select_own" on public.telegram_messages;
create policy "telegram_messages_select_own" on public.telegram_messages
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "telegram_messages_update_own" on public.telegram_messages;
create policy "telegram_messages_update_own" on public.telegram_messages
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3) Statut de connexion sans exposer le jeton.
create or replace function public.telegram_status()
returns table (bot_username text)
language sql
security definer
set search_path = public
as $$
  select b.bot_username from public.telegram_bots b where b.user_id = auth.uid();
$$;

revoke all on function public.telegram_status() from public, anon;
grant execute on function public.telegram_status() to authenticated;

-- 4) Temps réel : les nouveaux messages arrivent sans recharger.
do $$
begin
  alter publication supabase_realtime add table public.telegram_messages;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
