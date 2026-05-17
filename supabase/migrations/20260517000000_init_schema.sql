-- =============================================================================
-- 01. SCHEMA — tables, types, indexes, generic helpers.
-- No RLS, no business logic yet. Just the shape of the data.
-- =============================================================================

-- Generic helper: keep updated_at fresh on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─────────────── profiles ───────────────
-- Extends auth.users with public Discord identity. Auto-populated by the
-- on_auth_user_created trigger (see migration 03).
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  discord_id   text unique not null,
  display_name text not null,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Discord identity attached to each Supabase auth user.';


-- ─────────────── banlist_role enum ───────────────
create type public.banlist_role as enum ('viewer', 'editor');


-- ─────────────── banlists ───────────────
-- One banlist per user (MVP). The `unique (owner_id)` constraint is what
-- enforces this; dropping it later unlocks multi-list per user with no
-- data migration.
create table public.banlists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null unique references auth.users(id) on delete cascade,
  name       text not null default 'Personal Banlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banlists_updated_at
  before update on public.banlists
  for each row execute function public.set_updated_at();

comment on table public.banlists is
  'One banlist per user. Owned by owner_id; shared via banlist_members.';


-- ─────────────── banlist_members ───────────────
-- Sharing table. The owner is never in here (they are banlists.owner_id).
create table public.banlist_members (
  banlist_id uuid not null references public.banlists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.banlist_role not null,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null,
  primary key (banlist_id, user_id)
);

comment on table public.banlist_members is
  'Users with shared access to a banlist they do not own.';


-- ─────────────── bans ───────────────
create table public.bans (
  id          uuid primary key default gen_random_uuid(),
  banlist_id  uuid not null references public.banlists(id) on delete cascade,
  faceit_name text not null,
  reason      text not null check (length(reason) between 1 and 250),
  author_id   uuid references auth.users(id) on delete set null,
  -- Denormalised so the display name survives even if the author leaves /
  -- deletes their account (author_id becomes NULL via on delete set null).
  author_name text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger bans_updated_at
  before update on public.bans
  for each row execute function public.set_updated_at();

create index bans_banlist_id_idx on public.bans (banlist_id);
-- Case-insensitive uniqueness inside a banlist (FACEIT names are case-
-- insensitive in practice). Postgres requires a unique INDEX rather than a
-- UNIQUE constraint when an expression is involved.
create unique index bans_banlist_faceit_unique
  on public.bans (banlist_id, lower(faceit_name));

comment on table public.bans is
  'A banned FACEIT player within a specific banlist.';


-- ─────────────── banlist_invites ───────────────
-- Two modes in one table:
--   invitee_discord_id NULL  → shareable link, anyone with the token accepts
--   invitee_discord_id set   → direct invite, only that Discord ID can accept
create table public.banlist_invites (
  id                 uuid primary key default gen_random_uuid(),
  banlist_id         uuid not null references public.banlists(id) on delete cascade,
  token              text not null unique,
  invitee_discord_id text,
  role               public.banlist_role not null,
  created_by         uuid not null references auth.users(id) on delete cascade,
  expires_at         timestamptz,
  max_uses           int check (max_uses is null or max_uses > 0),
  used_count         int not null default 0,
  created_at         timestamptz not null default now()
);

create index banlist_invites_invitee_idx on public.banlist_invites (invitee_discord_id)
  where invitee_discord_id is not null;
create index banlist_invites_banlist_idx on public.banlist_invites (banlist_id);

comment on table public.banlist_invites is
  'Invitations to join a banlist. invitee_discord_id NULL = shareable link.';
