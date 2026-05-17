-- =============================================================================
-- 05. PERF — covering indexes on foreign keys + consolidate duplicate
-- permissive SELECT policies into single OR'd policies.
-- =============================================================================

-- ─────────────── FK covering indexes ───────────────
-- Without these, deleting an auth.users row forces full scans of every
-- table that references it (cascade / set-null fixup). Trivial to add now
-- while the tables are empty.
create index banlist_invites_created_by_idx on public.banlist_invites (created_by);
create index banlist_members_added_by_idx   on public.banlist_members (added_by);
create index banlist_members_user_id_idx    on public.banlist_members (user_id);
create index bans_author_id_idx             on public.bans (author_id);


-- ─────────────── banlist_invites: 2 SELECT policies → 1 ───────────────
drop policy "invites read by creator" on public.banlist_invites;
drop policy "invites read by invitee" on public.banlist_invites;

create policy "invites read by creator or invitee" on public.banlist_invites
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or (
      invitee_discord_id is not null
      and exists (
        select 1 from public.profiles
        where id = (select auth.uid())
          and discord_id = banlist_invites.invitee_discord_id
      )
    )
  );


-- ─────────────── profiles: 2 SELECT policies → 1 ───────────────
-- Note: function calls are now prefixed with `private.` since migration 04
-- moved the helpers out of public.
drop policy "profiles self select" on public.profiles;
drop policy "profiles visible to banlist family" on public.profiles;

create policy "profiles self or banlist family" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.banlists b
      where b.owner_id = profiles.id
        and private.user_can_read_banlist(b.id)
    )
    or exists (
      select 1 from public.banlist_members m
      where m.user_id = profiles.id
        and private.user_can_read_banlist(m.banlist_id)
    )
  );