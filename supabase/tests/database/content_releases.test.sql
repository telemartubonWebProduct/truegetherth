-- M4: releases, the publication pointer, publishing and rolling back.
-- Run against the local stack: `npm run db:test` (supabase test db).
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email, aud, role)
values
  ('c1111111-1111-4111-8111-111111111111', 'publish.admin@test.local', 'authenticated', 'authenticated'),
  ('c3333333-3333-4333-8333-333333333333', 'publish.member@test.local', 'authenticated', 'authenticated');

do $$
begin
  perform private.grant_admin('publish.admin@test.local', 'fixture');
end;
$$;

-- Drafts the Admin is about to publish (revision 1) and one changed after they looked (revision 2).
insert into public.content_drafts (document_id, schema_version, body) values ('page:home', 3, '{"draft":"home"}');
insert into public.content_drafts (document_id, schema_version, body) values ('page:contact', 3, '{"draft":"contact"}');
update public.content_drafts set body = '{"draft":"contact, edited again"}' where document_id = 'page:contact';

-- ---------------------------------------------------------------------------
-- Structure and grants
-- ---------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.content_releases'::regclass), 'RLS is on for releases');
select ok((select relrowsecurity from pg_class where oid = 'public.content_publication'::regclass), 'RLS is on for the publication');
select ok(not has_table_privilege('anon', 'public.content_releases', 'SELECT'), 'visitors cannot read releases directly');
select ok(has_function_privilege('anon', 'public.published_content()', 'EXECUTE'), 'visitors can read the published content');
select ok(not has_function_privilege('anon', 'public.publish_content(jsonb, integer, integer, jsonb, text)', 'EXECUTE'), 'visitors cannot publish');
select ok(not has_table_privilege('authenticated', 'public.content_releases', 'UPDATE'), 'nobody updates a release through the API');

-- ---------------------------------------------------------------------------
-- Visitor before anything is published
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select is_empty($$ select * from public.published_content() $$, 'nothing is published yet');

-- ---------------------------------------------------------------------------
-- Active Admin
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","email":"publish.admin@test.local"}';

select is(
  public.publish_content('{"v":1}', 3, 0, '[{"document_id":"page:home","revision":1},{"document_id":"page:contact","revision":1}]', 'first'),
  1,
  'the first publish is release 1'
);
select is_empty($$ select 1 from public.content_drafts where document_id = 'page:home' $$, 'the published draft is gone');
select is(
  (select body from public.content_drafts where document_id = 'page:contact'),
  '{"draft":"contact, edited again"}'::jsonb,
  'a draft changed after the Admin looked stays'
);
select throws_ok(
  $$ select public.publish_content('{"v":"stale"}', 3, 0, '[]') $$,
  'PT409', null,
  'publishing from an old release is refused'
);
select is(public.publish_content('{"v":2}', 3, 1, '[]', 'second'), 2, 'the next publish is release 2');
select is(public.rollback_content(1, 2, 'back to the first'), 3, 'a rollback adds release 3');
select is(
  (select row(kind, restored_from, content)::text from public.content_releases where number = 3),
  row('rollback', 1, '{"v":1}'::jsonb)::text,
  'the rollback copies release 1 exactly'
);
select is((select created_by_email from public.content_releases where number = 1), 'publish.admin@test.local', 'a release names who published it');
select is(
  (select array_agg(action order by id) from public.audit_log where target_type = 'content_release' and occurred_at >= now()),
  array['content.publish', 'content.publish', 'content.rollback'],
  'every publish and rollback is in the audit log'
);
select throws_ok($$ select public.rollback_content(99, 3) $$, 'P0002', null, 'rolling back to a release that does not exist is refused');

-- ---------------------------------------------------------------------------
-- Visitor after publishing
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select is((select row(number, content)::text from public.published_content()), row(3, '{"v":1}'::jsonb)::text, 'visitors get release 3');
select throws_ok($$ select * from public.content_releases $$, '42501', null, 'visitors still cannot read the history');

-- ---------------------------------------------------------------------------
-- Signed-in user without a membership
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}';
select throws_ok($$ select public.publish_content('{"v":"member"}', 3, 3, '[]') $$, '42501', null, 'a non-Admin cannot publish');
select throws_ok($$ select public.rollback_content(1, 3) $$, '42501', null, 'a non-Admin cannot roll back');
select is_empty($$ select * from public.content_releases $$, 'a non-Admin reads no history');

select * from finish();
rollback;
