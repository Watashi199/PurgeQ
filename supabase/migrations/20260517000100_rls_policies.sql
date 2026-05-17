-- =============================================================================
-- 02. RLS — row-level-security policies + helper functions.
-- This is what enforces per-tenant isolation: Postgres rejects any query
-- that would leak data across banlists. No applicative code path can
-- bypass it.
-- =============================================================================

-- ─────────────── Helper functions ───────────────
-- security definer so they bypass RLS themselves (otherwise the policies on
-- banlists / banlist_members would recurse into these and into themselves).
-- search_path is pinned to avoid search_path-hijack attacks via mutable
-- session settings.

create or replace function public.user_can_read_banlist(_banlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from banlists
    where id = _banlist_id and owner_id = (select auth.uid())
  ) or exists (
    select 1 from banlist_members
    where banlist_id = _banlist_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.user_can_write_banlist(_banlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from banlists
    where id = _banlist_id and owner_id = (select auth.uid())
  ) or exists (
    select 1 from banlist_members
    where banlist_id = _banlist_id
      and user_id = (select auth.uid())
      and role = 'editor'
  );
$$;


-- ─────────────── Enable RLS on every public table ───────────────
alter table public.profiles         enable row level security;
alter table public.banlists         enable row level security;
alter table public.banlist_members  enable row level security;
alter table public.bans             enable row level security;
alter table public.banlist_invites  enable row level security;


-- ─────────────── profiles ───────────────
-- Self-read is always allowed.
create policy "profiles self select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Visible to anyone who shares a banlist with this profile (so the UI can
-- render "Banned by Alice" on shared bans, "Member: Bob" in the share dialog).
create policy "profiles visible to banlist family" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from banlists b
      where b.owner_id = profiles.id
        and user_can_read_banlist(b.id)
    )
    or exists (
      select 1 from banlist_members m
      where m.user_id = profiles.id
        and user_can_read_banlist(m.banlist_id)
    )
  );

-- Self-update (display name).
create policy "profiles self update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- INSERT is done by the on_auth_user_created trigger (security definer),
-- no policy needed. DELETE happens via auth.users cascade.


-- ─────────────── banlists ───────────────
create policy "banlists read accessible" on public.banlists
  for select to authenticated
  using (user_can_read_banlist(id));

create policy "banlists insert own" on public.banlists
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "banlists update own" on public.banlists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "banlists delete own" on public.banlists
  for delete to authenticated
  using (owner_id = (select auth.uid()));


-- ─────────────── banlist_members ───────────────
-- Visible to anyone in the banlist family (owner + all current members).
create policy "members read by banlist family" on public.banlist_members
  for select to authenticated
  using (user_can_read_banlist(banlist_id));

-- Only the banlist owner can add members (via accept_invite RPC or directly).
create policy "members insert by owner" on public.banlist_members
  for insert to authenticated
  with check (
    (select auth.uid()) in (
      select owner_id from banlists where id = banlist_id
    )
  );

-- Members can remove themselves; owner can remove anyone.
create policy "members delete by owner or self" on public.banlist_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (
      select owner_id from banlists where id = banlist_id
    )
  );

-- No UPDATE policy: to change role, owner deletes + re-inserts.


-- ─────────────── bans ───────────────
create policy "bans read accessible" on public.bans
  for select to authenticated
  using (user_can_read_banlist(banlist_id));

create policy "bans insert editable" on public.bans
  for insert to authenticated
  with check (user_can_write_banlist(banlist_id));

create policy "bans update editable" on public.bans
  for update to authenticated
  using (user_can_write_banlist(banlist_id))
  with check (user_can_write_banlist(banlist_id));

create policy "bans delete editable" on public.bans
  for delete to authenticated
  using (user_can_write_banlist(banlist_id));


-- ─────────────── banlist_invites ───────────────
-- Creator can list / manage their own invites.
create policy "invites read by creator" on public.banlist_invites
  for select to authenticated
  using (created_by = (select auth.uid()));

-- Targeted invitee (Discord ID match) can see their pending invite.
create policy "invites read by invitee" on public.banlist_invites
  for select to authenticated
  using (
    invitee_discord_id is not null
    and exists (
      select 1 from profiles
      where id = (select auth.uid())
        and discord_id = banlist_invites.invitee_discord_id
    )
  );

-- Only the owner of the banlist can create invites for it.
create policy "invites insert by owner" on public.banlist_invites
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select auth.uid()) in (
      select owner_id from banlists where id = banlist_id
    )
  );

create policy "invites delete by creator" on public.banlist_invites
  for delete to authenticated
  using (created_by = (select auth.uid()));
