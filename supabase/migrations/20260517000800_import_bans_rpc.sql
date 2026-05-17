-- =============================================================================
-- 09. IMPORT — RPC for batch-inserting bans from the popup's Import tab.
-- One round-trip, dedup handled server-side via ON CONFLICT DO NOTHING on
-- the (banlist_id, lower(faceit_name)) unique index. RLS still applies
-- because we run as security invoker.
-- =============================================================================

create or replace function public.import_bans(p_rows jsonb)
returns table(imported int, skipped int)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id      uuid := (select auth.uid());
  v_banlist_id   uuid;
  v_imported     int := 0;
  v_skipped      int := 0;
  v_row          jsonb;
  v_faceit_name  text;
  v_reason       text;
  v_author_name  text;
  v_row_count    int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array' using errcode = 'P0001';
  end if;

  -- We only import into the caller's own banlist (the one created by the
  -- signup trigger). If the user is a member of someone else's banlist
  -- they cannot bulk-import into it — they'd have to add bans one by one
  -- through the regular UI, which keeps the security model simple.
  select id into v_banlist_id from banlists where owner_id = v_user_id;
  if v_banlist_id is null then
    raise exception 'No banlist owned by user' using errcode = 'P0001';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_faceit_name := btrim(coalesce(v_row->>'faceit_name', ''));
    v_reason      := btrim(coalesce(v_row->>'reason', ''));
    v_author_name := btrim(coalesce(v_row->>'author_name', ''));

    -- Skip rows that violate constraints rather than failing the whole batch.
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
      v_imported := v_imported + 1;
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

comment on function public.import_bans(jsonb) is
  'Batch-insert bans into the caller''s own banlist. Skips rows that fail '
  'validation or duplicate an existing entry (case-insensitive on faceit_name). '
  'Returns the imported / skipped counts. Runs as security invoker so RLS '
  'still enforces ownership of the target banlist.';
