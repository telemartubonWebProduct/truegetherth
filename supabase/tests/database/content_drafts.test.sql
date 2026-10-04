-- RLS, privilege and concurrency tests for Mirror editor drafts (M3).
-- Run against the local stack: `npm run db:test` (supabase test db).
begin;

create extension if not exists pgtap with schema extensions;

select plan(39);

-- ---------------------------------------------------------------------------
-- Fixtures (as the database owner)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('a1111111-1111-4111-8111-111111111111', 'drafts.admin@test.local', 'authenticated', 'authenticated'),
  ('a2222222-2222-4222-8222-222222222222', 'drafts.second@test.local', 'authenticated', 'authenticated'),
  ('a3333333-3333-4333-8333-333333333333', 'drafts.member@test.local', 'authenticated', 'authenticated'),
  ('a4444444-4444-4444-8444-444444444444', 'drafts.inactive@test.local', 'authenticated', 'authenticated');

do $$
begin
  perform private.grant_admin('drafts.admin@test.local', 'fixture');
  perform private.grant_admin('drafts.second@test.local', 'fixture');
  perform private.grant_admin('drafts.inactive@test.local', 'fixture');
  perform private.revoke_admin('drafts.inactive@test.local', 'fixture: deactivated');
end;
$$;

-- A draft that exists before the tests, written by trusted maintenance.
insert into public.content_drafts (document_id, schema_version, body)
values ('page:solar', 1, '{"id":"solar","fixture":true}');

-- ---------------------------------------------------------------------------
-- Structure and grants
-- ---------------------------------------------------------------------------
select has_table('public', 'content_drafts', 'content_drafts exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.content_drafts'::regclass),
  'RLS is enabled on content_drafts'
);
select ok(not has_table_privilege('anon', 'public.content_drafts', 'SELECT'), 'anon cannot read drafts');
select ok(not has_table_privilege('anon', 'public.content_drafts', 'INSERT'), 'anon cannot write drafts');
select ok(
  not has_function_privilege('anon', 'public.save_content_draft(text, integer, integer, jsonb)', 'EXECUTE'),
  'anon cannot call save_content_draft'
);
select ok(
  not has_function_privilege('anon', 'public.discard_content_draft(text, integer)', 'EXECUTE'),
  'anon cannot call discard_content_draft'
);
select ok(
  not has_column_privilege('authenticated', 'public.content_drafts', 'revision', 'UPDATE'),
  'API callers cannot set the revision'
);
select ok(
  not has_column_privilege('authenticated', 'public.content_drafts', 'updated_by', 'INSERT'),
  'API callers cannot choose the author'
);
select is(
  (select revision from public.content_drafts where document_id = 'page:solar'),
  1,
  'a new draft starts at revision 1'
);

-- ---------------------------------------------------------------------------
-- Visitor (anon)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok($$ select * from public.content_drafts $$, '42501', null, 'anon cannot read drafts');
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 0, 1, '{"probe":true}') $$,
  '42501', null,
  'anon cannot save a draft'
);

-- ---------------------------------------------------------------------------
-- Signed-in user without a membership
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}';

select is_empty($$ select * from public.content_drafts $$, 'non-member sees no drafts');
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 0, 1, '{"probe":true}') $$,
  '42501', null,
  'non-member cannot save a draft'
);
select throws_ok(
  $$ insert into public.content_drafts (document_id, schema_version, body) values ('page:home', 1, '{}') $$,
  '42501', null,
  'non-member cannot insert a draft directly'
);
select throws_ok(
  $$ select public.discard_content_draft('page:solar', 1) $$,
  '42501', null,
  'non-member cannot discard a draft'
);

-- ---------------------------------------------------------------------------
-- Deactivated Admin
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a4444444-4444-4444-8444-444444444444","role":"authenticated"}';

select is_empty($$ select * from public.content_drafts $$, 'deactivated Admin sees no drafts');
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 0, 1, '{"probe":true}') $$,
  '42501', null,
  'deactivated Admin cannot save a draft'
);
-- RLS hides the row, so the update matches nothing rather than raising.
select is_empty(
  $$ update public.content_drafts set body = '{"probe":true}' where document_id = 'page:solar' returning document_id $$,
  'deactivated Admin cannot change a draft directly'
);
reset role;
select is(
  (select body from public.content_drafts where document_id = 'page:solar'),
  '{"id":"solar","fixture":true}'::jsonb,
  'the draft is unchanged after the refused writes'
);

-- ---------------------------------------------------------------------------
-- Active Admin
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}';

select isnt_empty($$ select * from public.content_drafts where document_id = 'page:solar' $$, 'active Admin reads drafts');
select results_eq(
  $$ select revision from public.save_content_draft('page:home', 0, 1, '{"id":"home","v":1}') $$,
  $$ values (1) $$,
  'saving a new draft returns revision 1'
);
select is(
  (select updated_by from public.content_drafts where document_id = 'page:home'),
  'a1111111-1111-4111-8111-111111111111'::uuid,
  'the draft is attributed to the Admin who saved it'
);
select results_eq(
  $$ select revision from public.save_content_draft('page:home', 1, 1, '{"id":"home","v":2}') $$,
  $$ values (2) $$,
  'saving from the current revision returns the next revision'
);
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 1, 1, '{"id":"home","stale":true}') $$,
  'PT409', null,
  'saving from a stale revision is refused as a conflict'
);
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 0, 1, '{"id":"home","again":true}') $$,
  'PT409', null,
  'creating a draft that already exists is refused as a conflict'
);
select is(
  (select body ->> 'v' from public.content_drafts where document_id = 'page:home'),
  '2',
  'a refused save leaves the saved body in place'
);
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 2, 1, '["not", "an", "object"]') $$,
  '23514', null,
  'a draft body must be a JSON object'
);
select throws_ok(
  $$ select * from public.save_content_draft('Page:Home', 0, 1, '{}') $$,
  '23514', null,
  'document ids must follow the content document format'
);
select throws_ok(
  $$ select * from public.save_content_draft('page:home', 2, 0, '{}') $$,
  '23514', null,
  'the schema version must be positive'
);
select throws_ok(
  format($$ select * from public.save_content_draft('page:big', 0, 1, %L) $$,
    jsonb_build_object('text', repeat('x', 300000))),
  '23514', null,
  'a draft body is limited to 256 kB'
);

-- Direct writes still keep the revision and author honest.
select lives_ok(
  $$ update public.content_drafts set body = '{"id":"solar","edited":true}' where document_id = 'page:solar' $$,
  'active Admin can update a draft directly'
);
select results_eq(
  $$ select revision, updated_by from public.content_drafts where document_id = 'page:solar' $$,
  $$ values (2, 'a1111111-1111-4111-8111-111111111111'::uuid) $$,
  'a direct update bumps the revision and records the Admin'
);
select throws_ok(
  $$ update public.content_drafts set document_id = 'page:terms' where document_id = 'page:solar' $$,
  '42501', null,
  'the document id of a draft cannot change'
);

-- A second Admin sees the same drafts and conflicts with the first.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}';

select is(
  (select body ->> 'v' from public.content_drafts where document_id = 'page:home'),
  '2',
  'another Admin reads the shared draft'
);
select throws_ok(
  $$ select public.discard_content_draft('page:home', 1) $$,
  'PT409', null,
  'discarding from a stale revision is refused as a conflict'
);
select lives_ok(
  $$ select public.discard_content_draft('page:home', 2) $$,
  'discarding from the current revision works'
);
select is_empty(
  $$ select * from public.content_drafts where document_id = 'page:home' $$,
  'the discarded draft is gone'
);
select results_eq(
  $$ select revision from public.save_content_draft('page:home', 0, 1, '{"id":"home","fresh":true}') $$,
  $$ values (1) $$,
  'a document can get a new draft after a discard'
);

-- Revoking access applies to drafts on the next statement.
reset role;
do $$
begin
  perform private.revoke_admin('drafts.second@test.local', 'fixture: revoked mid-session');
end;
$$;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select * from public.content_drafts $$, 'a revoked Admin immediately loses the drafts');

select * from finish();
rollback;
