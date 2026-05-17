-- =============================================================================
-- 04. LINT FIXES — addresses Supabase Advisor warnings from migrations 01-03.
--
-- - Pins search_path on set_updated_at (function_search_path_mutable).
-- - Moves the RLS helper functions to a `private` schema that PostgREST
--   does not expose, so they can't be called via /rest/v1/rpc/...
-- - Explicitly revokes EXECUTE from anon on the trigger / definer functions
--   that stay in public.
-- =============================================================================

-- ─────────────── set_updated_at: pin search_path ───────────────
alter function public.set_updated_at()
  set search_path = pg_catalog;


-- ─────────────── Move RLS helpers out of the public API surface ───────────────
-- private schema is not exposed by PostgREST, so functions in it cannot be
-- called as RPC. RLS policies reference functions by OID, so moving them
-- via ALTER FUNCTION ... SET SCHEMA preserves all existing policies.
create schema if not exists private;

-- authenticated needs USAGE on the schema to evaluate policies that call
-- private.* functions. anon is intentionally not granted.
grant usage on schema private to authenticated;

alter function public.user_can_read_banlist(uuid)  set schema private;
alter function public.user_can_write_banlist(uuid) set schema private;

-- Lock down execution to authenticated only.
revoke all on function private.user_can_read_banlist(uuid)  from public;
revoke all on function private.user_can_write_banlist(uuid) from public;
grant execute on function private.user_can_read_banlist(uuid)  to authenticated;
grant execute on function private.user_can_write_banlist(uuid) to authenticated;


-- ─────────────── handle_new_user is a trigger func, not a public API ───────────────
-- Trigger execution goes through the table owner regardless of these grants,
-- so revoking EXECUTE from anon / authenticated doesn't break signup but
-- removes the function from the RPC surface.
revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;


-- ─────────────── accept_invite stays public-RPC, but explicit revokes ───────────────
-- Already granted to authenticated by migration 03; make the anon revoke
-- explicit so the advisor stops flagging it.
revoke execute on function public.accept_invite(text) from anon;