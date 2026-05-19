-- Length constraints on free-text columns.
alter table public.bans
  add constraint bans_faceit_name_len check (length(faceit_name) between 2 and 32),
  add constraint bans_reason_len      check (length(reason) between 1 and 250),
  add constraint bans_author_name_len check (length(author_name) between 1 and 64);

alter table public.profiles
  add constraint profiles_display_name_len check (length(display_name) between 1 and 64);

alter table public.banlists
  add constraint banlists_name_len check (length(name) between 1 and 64);
