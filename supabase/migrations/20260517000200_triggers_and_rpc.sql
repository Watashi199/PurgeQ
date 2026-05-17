-- =============================================================================
-- 03. TRIGGERS + RPC — automation around signup and invitations.
--   - on_auth_user_created: auto-creates profile + initial banlist on signup
--   - accept_invite(token): atomic RPC for the extension to consume invites
-- =============================================================================

-- ─────────────── handle_new_user trigger ───────────────
-- Fires once per new row in auth.users. Pulls Discord identity out of
-- raw_user_meta_data (populated by Supabase Auth at Discord OAuth) and
-- creates the matching profile row + an empty personal banlist. Idempotent
-- via on conflict, so re-running is safe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_discord_id   text;
  v_display_name text;
begin
  v_discord_id := new.raw_user_meta_data->>'provider_id';
  v_display_name := coalesce(
    new.raw_user_meta_data->>'global_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'full_name',
    'User'
  );

  -- Only auto-provision for users that came via Discord OAuth. If a user
  -- somehow lands here via another path, skip silently rather than 500ing.
  if v_discord_id is null then
    return new;
  end if;

  insert into public.profiles (id, discord_id, display_name)
    values (new.id, v_discord_id, v_display_name)
    on conflict (id) do nothing;

  insert into public.banlists (owner_id)
    values (new.id)
    on conflict (owner_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────── accept_invite RPC ───────────────
-- Single atomic call: validates the token, checks expiry/uses/invitee match,
-- inserts the membership, increments used_count, returns the joined banlist.
-- Callable from the extension as supabase.rpc('accept_invite', { p_token }).
create or replace function public.accept_invite(p_token text)
returns public.banlists
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite     public.banlist_invites;
  v_my_discord text;
  v_banlist    public.banlists;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_invite from banlist_invites where token = p_token;
  if not found then
    raise exception 'Invalid invite token' using errcode = 'P0001';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Invite has expired' using errcode = 'P0002';
  end if;

  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    raise exception 'Invite has been used up' using errcode = 'P0003';
  end if;

  -- Targeted invites: only the matching Discord ID can claim them.
  if v_invite.invitee_discord_id is not null then
    select discord_id into v_my_discord
      from profiles where id = (select auth.uid());
    if v_my_discord is null or v_my_discord != v_invite.invitee_discord_id then
      raise exception 'This invite is not for you' using errcode = 'P0004';
    end if;
  end if;

  -- Owners can't re-accept their own banlist as a member.
  if exists (
    select 1 from banlists
    where id = v_invite.banlist_id and owner_id = (select auth.uid())
  ) then
    raise exception 'You already own this banlist' using errcode = 'P0005';
  end if;

  -- Upsert: if the user is already a member with a different role, accepting
  -- a new invite updates their role. on conflict makes this atomic.
  insert into banlist_members (banlist_id, user_id, role, added_by)
    values (v_invite.banlist_id, (select auth.uid()), v_invite.role, v_invite.created_by)
    on conflict (banlist_id, user_id) do update
      set role = excluded.role,
          added_at = now(),
          added_by = excluded.added_by;

  update banlist_invites
    set used_count = used_count + 1
    where id = v_invite.id;

  select * into v_banlist from banlists where id = v_invite.banlist_id;
  return v_banlist;
end;
$$;

-- Allow only authenticated users to call the RPC; anon must not.
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;
