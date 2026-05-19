-- Trigger enforcing the 250-ban free tier cap on every INSERT path
-- (popup, content script, direct API call).
create or replace function public.check_ban_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_is_pro  boolean;
  v_count   int;
  FREE_LIMIT constant int := 250;
begin
  select coalesce(is_pro, false) into v_is_pro
    from profiles where id = (select auth.uid());
  if not coalesce(v_is_pro, false) then
    select count(*) into v_count from bans where banlist_id = NEW.banlist_id;
    if v_count >= FREE_LIMIT then
      raise exception 'Free tier limit reached (250)' using errcode = 'P0007';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger enforce_ban_limit
  before insert on public.bans
  for each row execute function public.check_ban_limit();
