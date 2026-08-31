-- Storage write policies for menu imagery.
--
-- Reuses the existing `website-content` bucket created by
-- 20260811000000_create_homepage_hero.sql. No new bucket is created and the
-- bucket's existing public-read policy ("Website content images are publicly
-- readable") is left exactly as it is, because the public menu needs anonymous
-- read access to the images it renders.
--
-- Today the bucket contains no objects, so nothing existing is affected.
--
-- Writes are restricted to allowlisted admins through public.is_admin(): being
-- signed in is not sufficient. Uploads are further confined to the `menu/`
-- prefix so this phase cannot touch homepage or gallery assets.

drop policy if exists "Admins upload menu images" on storage.objects;
drop policy if exists "Admins replace menu images" on storage.objects;
drop policy if exists "Admins delete menu images" on storage.objects;

create policy "Admins upload menu images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'menu'
  and public.is_admin()
);

create policy "Admins replace menu images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'menu'
  and public.is_admin()
)
with check (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'menu'
  and public.is_admin()
);

create policy "Admins delete menu images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'website-content'
  and (storage.foldername(name))[1] = 'menu'
  and public.is_admin()
);
