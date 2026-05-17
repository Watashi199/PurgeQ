-- =============================================================================
-- 08. UX — Replace the hardcoded "Personal Banlist" default with the owner's
-- Discord display_name. When a banlist is shared, recipients now see
-- "Watashi" instead of a generic label, making provenance obvious.
-- =============================================================================

-- Update the signup trigger to use display_name. Falls back to the old
-- literal if display_name is somehow blank (shouldn't happen — the trigger
-- itself coalesces to 'User' before inserting profiles).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_discord_id   text;
  v_display_name text;
begin
  v_discord_id := new.raw_user_meta_data->>'provider_id';
  v_display_name := coalesce(
    new.raw_user_meta_data->'custom_claims'->>'global_name',
    new.raw_user_meta_data->>'global_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'preferred_username',
    'User'
  );

  if v_discord_id is null then
    return new;
  end if;

  insert into public.profiles (id, discord_id, display_name)
    values (new.id, v_discord_id, v_display_name)
    on conflict (id) do nothing;

  insert into public.banlists (owner_id, name)
    values (new.id, v_display_name)
    on conflict (owner_id) do nothing;

  return new;
end;
$$;

-- Backfill: rename every banlist still using the old default to the owner's
-- current display_name.
update public.banlists b
set name = p.display_name
from public.profiles p
where b.owner_id = p.id
  and b.name = 'Personal Banlist';
