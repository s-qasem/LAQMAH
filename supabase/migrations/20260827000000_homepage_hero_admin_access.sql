-- Admin write access for the existing homepage_hero row.
--
-- 20260811000000 created the table with SELECT only: the public may read the
-- published hero, and nothing may write it through the API. That is why the
-- admin Homepage screen cannot save today.
--
-- This migration is purely additive. It creates no table, changes no column,
-- touches no existing row, and leaves the public read policy exactly as it is.
--
-- Writes are gated by public.is_admin() from 20260826000000, so being signed in
-- is not sufficient — the account must be on the admin allowlist.

-- Admins additionally need to read an UNPUBLISHED hero to edit it; the existing
-- public policy only exposes rows where is_published = true.
drop policy if exists "Admins read the homepage hero" on public.homepage_hero;

create policy "Admins read the homepage hero"
on public.homepage_hero
for select
to authenticated
using (public.is_admin());

-- The hero is a singleton seeded by 20260811000000. Admins edit it; they do not
-- create or delete it, so no INSERT or DELETE privilege is granted.
grant update on table public.homepage_hero to authenticated;

drop policy if exists "Admins update the homepage hero" on public.homepage_hero;

create policy "Admins update the homepage hero"
on public.homepage_hero
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
