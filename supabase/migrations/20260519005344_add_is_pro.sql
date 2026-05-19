-- Add one-time Pro purchase flag to profiles.
-- Set by the stripe-webhook Edge Function after a successful $3 payment.
alter table public.profiles
  add column if not exists is_pro boolean not null default false;
