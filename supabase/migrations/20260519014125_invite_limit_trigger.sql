-- Trigger enforcing max 10 shareable invite links per banlist.
create or replace function public.check_invite_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.invitee_discord_id is null then
    if (select count(*) from banlist_invites
        where banlist_id = NEW.banlist_id and invitee_discord_id is null) >= 10 then
      raise exception 'Invite limit reached (10 active links max)' using errcode = 'P0010';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger enforce_invite_limit
  before insert on public.banlist_invites
  for each row execute function public.check_invite_limit();
