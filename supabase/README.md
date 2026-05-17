# Supabase setup

Schema + RLS policies + triggers for the PurgeQ SaaS backend.

## Layout

```
supabase/
└── migrations/
    ├── 20260517000000_init_schema.sql       — tables, types, indexes, updated_at trigger
    ├── 20260517000100_rls_policies.sql      — helper functions + RLS policies on every table
    └── 20260517000200_triggers_and_rpc.sql  — signup bootstrap + accept_invite RPC
```

Apply them in lexicographic order (which matches the timestamps). Each file is idempotent on its own table definitions — re-running migration 02 or 03 is safe, but re-running migration 01 will error on `create table` if the tables already exist (drop them first if you really want to reset).

## Applying via Supabase Studio (web UI)

1. Open your project in [supabase.com/dashboard](https://supabase.com/dashboard).
2. Sidebar → **SQL Editor**.
3. For each file in order:
   - Click **New query**
   - Paste the file contents
   - Click **Run** (or `Ctrl+Enter`)
   - Confirm "Success. No rows returned."
4. After all three: sidebar → **Table Editor** should show `profiles`, `banlists`, `banlist_members`, `bans`, `banlist_invites`. Each should have the lock icon (RLS enabled).

## Applying via the Supabase CLI (optional, if you have it installed)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Discord OAuth provider

Migrations don't touch auth providers — do this in the UI once:

1. Sidebar → **Authentication** → **Providers** → **Discord** → toggle **Enable**.
2. Copy the **Callback URL** Supabase shows (looks like `https://<ref>.supabase.co/auth/v1/callback`).
3. Go to [discord.com/developers/applications](https://discord.com/developers/applications), create an application (or reuse the one PurgeQ already had), and under **OAuth2 → Redirects**, paste the callback URL.
4. Copy the Discord **Client ID** and **Client Secret** back into Supabase's Discord provider config, save.
5. Make sure the OAuth scopes requested by Supabase include `identify` (default).

The signup trigger reads `provider_id`, `global_name`, `name`, `preferred_username`, or `full_name` from `auth.users.raw_user_meta_data` — Discord populates these automatically.

## Smoke test

After applying migrations and wiring Discord OAuth:

1. Sidebar → **Authentication** → **Users**: should be empty.
2. From any browser, hit `https://<ref>.supabase.co/auth/v1/authorize?provider=discord&redirect_to=<your-redirect>`, complete Discord OAuth.
3. Back in Supabase: **Authentication → Users** shows the new user.
4. **Table Editor → profiles** has one row with the Discord ID + display name.
5. **Table Editor → banlists** has one row with `owner_id` = that user's id and `name = 'Personal Banlist'`.

If 4 or 5 is empty, the trigger didn't fire — check **Database → Triggers** that `on_auth_user_created` exists on `auth.users`.

## Verifying RLS isolation

Quick gut-check that policies actually block cross-tenant access:

```sql
-- Simulate a query as a specific user (replace <user-uuid>):
set local role authenticated;
set local request.jwt.claim.sub = '<user-uuid>';

-- They should only see their own banlist + ones they're a member of.
select id, name, owner_id from public.banlists;

-- And only bans within those banlists.
select count(*) from public.bans;

reset role;
```

Running this with an unrelated `<user-uuid>` and seeing 0 rows = RLS working.

## Migration philosophy

These migrations are designed to be **append-only**. To change the schema later, write a new file with a higher timestamp prefix — do not edit the existing ones, because they'll already have been applied to production.
