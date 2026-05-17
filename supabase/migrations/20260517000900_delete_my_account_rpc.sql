-- =============================================================================
-- 10. GDPR — delete_my_account() RPC.
--
-- The `authenticated` role can't DELETE from auth.users directly (locked
-- down by Supabase Auth). This security-definer wrapper deletes the row
-- for the calling user only, and the existing ON DELETE CASCADE chain on
-- profiles/banlists/banlist_members/banlist_invites/bans naturally wipes
-- every piece of personal data the user owns.
--
-- Anonymous role explicitly cannot call this — only signed-in users.
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Cascades through:
  --   profiles (FK to auth.users with on delete cascade)
  --   banlists (FK to auth.users)
  --     -> banlist_members (FK to banlists)
  --     -> bans (FK to banlists)
  --     -> banlist_invites (FK to banlists)
  --   banlist_members.user_id (FK to auth.users)
  --   bans.author_id (FK to auth.users, on delete set null — preserves
  --     attribution on shared bans the user authored before leaving)
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke execute on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'GDPR right-to-erasure: deletes the caller''s auth.users row, which '
  'cascades through profiles, banlists, banlist_members, banlist_invites, '
  'and bans authored by the user. The user must call this while signed in.';
