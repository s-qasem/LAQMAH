-- Admin authorization for the LQMAH dashboard.
--
-- Authentication (does this request have a valid session?) is handled by
-- Supabase Auth. This migration adds authorization (is that session allowed to
-- manage content?) as an explicit allowlist keyed on auth.users.id.
--
-- Reuse for every future admin-managed table:
--
--   create policy "Admins read all <rows>"
--   on public.<table> for select to authenticated using (public.is_admin());
--
--   create policy "Admins insert <rows>"
--   on public.<table> for insert to authenticated with check (public.is_admin());
--
--   ... likewise for update and delete.
--
-- Nothing here touches homepage_hero or any existing object.

create table if not exists public.admin_users (
  -- The authorization key. Immutable, unlike email.
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Human label only. NEVER used for authorization.
  note text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Allowlist of users permitted to manage site content. Managed from the SQL editor only.';
comment on column public.admin_users.note is
  'Human-readable label (for example an email). Not an authorization key.';

alter table public.admin_users enable row level security;

-- Seed the existing LQMAH admin account.
insert into public.admin_users (user_id, note)
values ('7d5b7b60-b3ea-41d4-bfab-ad412587a4ee', 'lqmah.admin@gmail.com')
on conflict (user_id) do nothing;

-- Authorization predicate used by every content policy.
--
-- SECURITY DEFINER: runs as the function owner, which is exempt from RLS on
-- public.admin_users. That is what makes the allowlist readable from inside a
-- policy without the policy re-triggering itself, so there is no recursion.
-- The table is deliberately NOT set to FORCE ROW LEVEL SECURITY, which would
-- subject the owner to its own policies and reintroduce that risk.
--
-- search_path is pinned to empty so every reference must be schema-qualified;
-- a rogue schema earlier on the path cannot shadow admin_users or auth.uid().
--
-- STABLE lets the planner evaluate it once per statement instead of per row.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is
  'True when the current session belongs to an allowlisted admin. Safe to call from RLS policies.';

-- The allowlist itself is never readable by anonymous visitors.
revoke all on table public.admin_users from anon, authenticated;

-- Admins may read the allowlist; nobody may write it through the API.
-- Membership changes happen in the SQL editor, which runs as the table owner.
grant select on table public.admin_users to authenticated;

drop policy if exists "Admins can read the admin allowlist" on public.admin_users;

create policy "Admins can read the admin allowlist"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- Only signed-in sessions may evaluate the predicate. Anonymous requests never
-- reach a policy that calls it, so anon does not need (or get) EXECUTE.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
