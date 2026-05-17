-- =============================================================================
-- 07. FIX — Custom errcodes like P0002-P0005 in accept_invite() weren't being
-- mapped by PostgREST and surfaced as opaque 500s on the wire. Switch all
-- raises to the standard P0001 (raise_exception) so PostgREST returns 400
-- with the message visible in the response body — exactly what the popup's
-- error handler needs.
-- =============================================================================

create or replace function public.accept_invite(p_token text)
returns public.banlists
language plpgsql
security definer
set search_path = pg_catalog, public
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
    raise exception 'Invite has expired' using errcode = 'P0001';
  end if;

  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    raise exception 'Invite has been used up' using errcode = 'P0001';
  end if;

  if v_invite.invitee_discord_id is not null then
    select discord_id into v_my_discord
      from profiles where id = (select auth.uid());
    if v_my_discord is null or v_my_discord != v_invite.invitee_discord_id then
      raise exception 'This invite is not for you' using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1 from banlists
    where id = v_invite.banlist_id and owner_id = (select auth.uid())
  ) then
    raise exception 'You already own this banlist' using errcode = 'P0001';
  end if;

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
