-- =============================================================================
-- 06. FIX — Discord nests `global_name` under `custom_claims`, not at the top
-- level of raw_user_meta_data. Update handle_new_user to look there first so
-- users get "Watashi" instead of ".watashi#0".
-- =============================================================================

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

  insert into public.banlists (owner_id)
    values (new.id)
    on conflict (owner_id) do nothing;

  return new;
end;
$$;