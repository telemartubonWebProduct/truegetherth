-- R4: the catalog draft document and the media bucket's policies.
-- Run against the local stack: `npm run db:test` (supabase test db).
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email, aud, role)
values
  ('b1111111-1111-4111-8111-111111111111', 'media.admin@test.local', 'authenticated', 'authenticated'),
  ('b3333333-3333-4333-8333-333333333333', 'media.member@test.local', 'authenticated', 'authenticated');

do $$
begin
  perform private.grant_admin('media.admin@test.local', 'fixture');
end;
$$;

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select ok(exists (select 1 from storage.buckets where id = 'media' and public), 'the media bucket exists and is public');
select is(
  (select allowed_mime_types from storage.buckets where id = 'media'),
  array['image/webp'],
  'the media bucket only takes WebP (the app converts uploads)'
);

-- ---------------------------------------------------------------------------
-- Active Admin
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ select * from public.save_content_draft('catalog', 0, 3, '{"order":["fiber-500-499"]}') $$,
  'an Admin saves the package order as the catalog document'
);
select lives_ok(
  $$ select * from public.save_content_draft('package:brand-new', 0, 3, '{"$deleted":true}') $$,
  'an Admin saves a tombstone like any other draft'
);
select throws_ok(
  $$ select * from public.save_content_draft('catalogue', 0, 3, '{"order":[]}') $$,
  '23514', null,
  'other document ids are still refused'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values ('media', 'uploads/admin.webp', 'b1111111-1111-4111-8111-111111111111') $$,
  'an Admin uploads to the media bucket'
);
select is((select count(*)::integer from storage.objects where bucket_id = 'media' and name = 'uploads/admin.webp'), 1, 'an Admin lists the media bucket');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('other', 'uploads/elsewhere.webp') $$,
  '42501', null,
  'the policies only open the media bucket'
);

-- ---------------------------------------------------------------------------
-- Signed-in user without a membership
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"b3333333-3333-4333-8333-333333333333","role":"authenticated"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'uploads/member.webp') $$,
  '42501', null,
  'a non-Admin cannot upload'
);
select is((select count(*)::integer from storage.objects where bucket_id = 'media'), 0, 'a non-Admin lists nothing');
-- Storage refuses direct deletes for everyone (storage.protect_delete); replacing goes through the update policy.
select is_empty(
  $$ update storage.objects set metadata = '{"probe":true}' where bucket_id = 'media' returning 1 $$,
  'a non-Admin replaces nothing'
);

-- ---------------------------------------------------------------------------
-- Visitor (anon)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'uploads/anon.webp') $$,
  '42501', null,
  'a visitor cannot upload'
);
select is((select count(*)::integer from storage.objects where bucket_id = 'media'), 0, 'a visitor lists nothing through the API');

select * from finish();
rollback;
