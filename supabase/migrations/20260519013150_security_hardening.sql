-- =============================================================================
-- Security hardening — two fixes:
--
-- 1. is_pro column-level protection
--    Revoke blanket UPDATE on profiles from the authenticated role and grant
--    only the columns users are allowed to change themselves. The service-role
--    key used by the Stripe webhook bypasses RLS/column grants entirely, so it
--    can still flip is_pro. The anon / authenticated client cannot.
--
-- 2. import_bans free-tier cap
--    Free users (is_pro = false) are capped at 250 bans total. Rows that
--    would push them past the limit are counted as skipped rather than
--    failing the whole batch, mirroring the per-row duplicate handling.
-- =============================================================================


-- ─── 1. Column-level protection on profiles.is_pro ───────────────────────────

-- Drop the blanket table-level UPDATE grant the Supabase scaffold adds, then
-- re-grant only the columns the client is allowed to write.
revoke update on public.profiles from authenticated;
grant  update (display_name) on public.profiles to authenticated;


-- ─── 2. import_bans — enforce 250-ban cap for free users ─────────────────────

create or replace function public.import_bans(p_rows jsonb)
returns table(imported int, skipped int)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id      uuid    := (select auth.uid());
  v_banlist_id   uuid;
  v_is_pro       boolean := false;
  v_ban_count    int     := 0;   -- live count of owned bans (free tier only)
  v_imported     int     := 0;
  v_skipped      int     := 0;
  v_row          jsonb;
  v_faceit_name  text;
  v_reason       text;
  v_author_name  text;
  v_row_count    int;
  FREE_BAN_LIMIT constant int := 250;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = 'P0001';
  end if;

  select id into v_banlist_id from banlists where owner_id = v_user_id;
  if v_banlist_id is null then
    raise exception 'No banlist owned by user' using errcode = 'P0001';
  end if;

  -- Check Pro status and current ban count once, before the loop.
  select coalesce(is_pro, false) into v_is_pro
    from profiles where id = v_user_id;

  if not v_is_pro then
    select count(*) into v_ban_count
      from bans where banlist_id = v_banlist_id;
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    -- Free-tier cap: once the user is at the limit, every remaining row is
    -- counted as skipped so the caller can show an accurate summary.
    if not v_is_pro and v_ban_count >= FREE_BAN_LIMIT then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_faceit_name := btrim(coalesce(v_row->>'faceit_name', ''));
    v_reason      := btrim(coalesce(v_row->>'reason', ''));
    v_author_name := btrim(coalesce(v_row->>'author_name', ''));

    if v_faceit_name = ''
       or length(v_faceit_name) < 2 or length(v_faceit_name) > 32
       or v_reason = '' or length(v_reason) > 250
       or v_author_name = '' or length(v_author_name) > 32 then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into bans (banlist_id, faceit_name, reason, author_id, author_name)
      values (v_banlist_id, v_faceit_name, v_reason, v_user_id, v_author_name)
      on conflict (banlist_id, lower(faceit_name)) do nothing;

    get diagnostics v_row_count = ROW_COUNT;
    if v_row_count > 0 then
      v_imported  := v_imported  + 1;
      v_ban_count := v_ban_count + 1;   -- keep the in-memory counter in sync
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  return query select v_imported, v_skipped;
end;
$$;

revoke all on function public.import_bans(jsonb) from public;
revoke execute on function public.import_bans(jsonb) from anon;
grant execute on function public.import_bans(jsonb) to authenticated;
