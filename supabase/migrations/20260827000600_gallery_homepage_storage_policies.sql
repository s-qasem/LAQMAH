-- Storage write policies for gallery and homepage imagery.
--
-- Extends the pattern established by 20260826000500 for `menu/` to two more
-- prefixes in the same existing `website-content` bucket. No bucket is created,
-- and the bucket's public-read policy is left exactly as it is.
--
-- The `menu/` policies are untouched: menu images keep working unchanged.
--
-- Each prefix is a separate policy so a module can only ever write inside its
-- own folder. Cross-module deletion is additionally prevented in application
-- code, where each module's helper refuses paths outside its own prefix.
--
-- Existing objects: only files already under `menu/` exist today, and none of
-- them match these policies, so nothing existing is affected.

drop policy if exists "Admins upload gallery images" on storage.objects;
drop policy if exists "Admins replace gallery images" on storage.objects;
drop policy if exists "Admins delete gallery images" on storage.objects;
drop policy if exists "Admins upload homepage images" on storage.objects;
drop policy if exists "Admins replace homepage images" on storage.objects;
drop policy if exists "Admins delete homepage images" on storage.objects;

-- ---------------------------------------------------------------- gallery ---

create policy "Admins upload gallery images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'gallery'
  and public.is_admin()
);

create policy "Admins replace gallery images"
on storage.objects for update to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'gallery'
  and public.is_admin()
)
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'gallery'
  and public.is_admin()
);

create policy "Admins delete gallery images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'gallery'
  and public.is_admin()
);

-- --------------------------------------------------------------- homepage ---

create policy "Admins upload homepage images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'homepage'
  and public.is_admin()
);

create policy "Admins replace homepage images"
on storage.objects for update to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'homepage'
  and public.is_admin()
)
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'homepage'
  and public.is_admin()
);

create policy "Admins delete homepage images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'homepage'
  and public.is_admin()
);
