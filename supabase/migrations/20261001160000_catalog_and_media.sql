-- R4: the package order as its own draft document, and pictures uploaded from the Mirror editor
-- (docs/renovation/R4-CATALOG-AND-MEDIA.md, decision A in R4-M4-M5-PROPOSAL.md).
--
-- * content_drafts also takes the `catalog` document (the order of the packages). New packages,
--   pictures and benefits are ordinary `package:` / `media:` / `benefit:` drafts, and a removal
--   is a tombstone body ({"$deleted": true}); the app validates both before saving.
-- * Storage bucket `media`: anyone can read a file through its public URL (the site shows them);
--   only active Admins can upload, replace, list or delete. The app converts every upload to
--   WebP under a new random name, so a file a published release points at is never overwritten.

alter table public.content_drafts drop constraint content_drafts_document_id_check;
alter table public.content_drafts add constraint content_drafts_document_id_check
  check (
    char_length(document_id) <= 96
    and document_id ~ '^(site|catalog|(page|package|media|benefit):[a-z0-9]+(-[a-z0-9]+)*)$'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Active Admins list media"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'media' and (select private.is_active_admin()));

create policy "Active Admins upload media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and (select private.is_active_admin()));

create policy "Active Admins replace media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and (select private.is_active_admin()))
  with check (bucket_id = 'media' and (select private.is_active_admin()));

create policy "Active Admins remove media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and (select private.is_active_admin()));
