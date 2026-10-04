-- RLS and privilege tests for the M1 Admin access model.
-- Run against the local stack: `npm run db:test` (supabase test db).
begin;

create extension if not exists pgtap with schema extensions;

select plan(45);

-- ---------------------------------------------------------------------------
-- Fixtures (as the database owner)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'admin@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'inactive@test.local', 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', 'member@test.local', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-8444-444444444444', 'second.admin@test.local', 'authenticated', 'authenticated');

do $$
begin
  perform private.grant_admin('admin@test.local', 'fixture');
  perform private.grant_admin('second.admin@test.local');
  perform private.grant_admin('inactive@test.local');
  perform private.revoke_admin('inactive@test.local', 'fixture: deactivated');
end;
$$;

-- ---------------------------------------------------------------------------
-- Structure and grants
-- ---------------------------------------------------------------------------
select has_table('public', 'admin_memberships', 'admin_memberships exists');
select has_table('public', 'audit_log', 'audit_log exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.admin_memberships'::regclass),
  'RLS is enabled on admin_memberships'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.audit_log'::regclass),
  'RLS is enabled on audit_log'
);
-- Counts are scoped to the fixtures so earlier local data cannot affect them.
select is(
  (select count(*) from public.audit_log
   where action = 'admin_membership.granted'
     and target_id::uuid in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444')),
  3::bigint,
  'each granted membership is audited'
);
select is(
  (select count(*) from public.audit_log
   where action = 'admin_membership.deactivated'
     and target_id = '22222222-2222-4222-8222-222222222222'),
  1::bigint,
  'deactivation is audited'
);
select ok(
  not has_table_privilege('anon', 'public.admin_memberships', 'SELECT'),
  'anon has no privileges on admin_memberships'
);
select ok(
  not has_table_privilege('anon', 'public.audit_log', 'SELECT'),
  'anon has no privileges on audit_log'
);
select ok(
  not has_function_privilege('authenticated', 'private.grant_admin(text, text)', 'EXECUTE'),
  'authenticated users cannot grant Admin access'
);
select ok(
  not has_function_privilege('service_role', 'private.grant_admin(text, text)', 'EXECUTE'),
  'the service role cannot call the SQL-editor grant helper'
);
select ok(
  not has_function_privilege('anon', 'private.is_active_admin()', 'EXECUTE'),
  'anon cannot call is_active_admin()'
);

-- ---------------------------------------------------------------------------
-- Visitor (anon)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok(
  $$ select * from public.admin_memberships $$,
  '42501', null,
  'anon cannot read memberships'
);
select throws_ok(
  $$ insert into public.audit_log (action) values ('visitor.probe') $$,
  '42501', null,
  'anon cannot write the audit log'
);

-- ---------------------------------------------------------------------------
-- Signed-in user without a membership
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';

select is_empty($$ select * from public.admin_memberships $$, 'non-member sees no memberships');
select is_empty($$ select * from public.audit_log $$, 'non-member sees no audit entries');
select is(private.is_active_admin(), false, 'non-member is not an active Admin');
select throws_ok(
  $$ insert into public.admin_memberships (user_id) values ('33333333-3333-4333-8333-333333333333') $$,
  '42501', null,
  'non-member cannot self-enroll'
);
select throws_ok(
  $$ insert into public.audit_log (action) values ('member.probe') $$,
  '42501', null,
  'non-member cannot write the audit log'
);
select throws_ok(
  $$ update public.admin_memberships set is_active = true $$,
  '42501', null,
  'non-member cannot update memberships'
);
select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', null,
  'non-member cannot delete audit entries'
);

-- ---------------------------------------------------------------------------
-- Deactivated Admin
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select results_eq(
  $$ select user_id, is_active from public.admin_memberships $$,
  $$ values ('22222222-2222-4222-8222-222222222222'::uuid, false) $$,
  'deactivated Admin sees only their own inactive membership'
);
select is(private.is_active_admin(), false, 'deactivated Admin is not an active Admin');
select is_empty($$ select * from public.audit_log $$, 'deactivated Admin cannot read the audit log');
select throws_ok(
  $$ insert into public.audit_log (action) values ('inactive.probe') $$,
  '42501', null,
  'deactivated Admin cannot write the audit log'
);
select throws_ok(
  $$ update public.admin_memberships set is_active = true, deactivated_at = null
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501', null,
  'deactivated Admin cannot reactivate themselves'
);

-- ---------------------------------------------------------------------------
-- Active Admin
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select is(private.is_active_admin(), true, 'active Admin is recognised');
select is(
  (select count(*) from public.admin_memberships where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444')),
  3::bigint,
  'active Admin sees other members, not only their own row'
);
select isnt_empty($$ select * from public.audit_log $$, 'active Admin reads the audit log');
select lives_ok(
  $$ insert into public.audit_log (action, target_type, target_id, metadata)
     values ('admin.test_event', 'page', 'home', '{"field":"hero.heading"}') $$,
  'active Admin records an action'
);
select is(
  (select actor_user_id from public.audit_log where action = 'admin.test_event'),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'recorded action is attributed to the signed-in Admin'
);
select throws_ok(
  $$ insert into public.audit_log (action, actor_user_id)
     values ('admin.forged', '44444444-4444-4444-8444-444444444444') $$,
  '42501', null,
  'Admin cannot attribute an action to someone else'
);
select throws_ok(
  $$ update public.audit_log set action = 'admin.rewritten' $$,
  '42501', null,
  'Admin cannot edit audit history'
);
select throws_ok(
  $$ insert into public.admin_memberships (user_id) values ('33333333-3333-4333-8333-333333333333') $$,
  '42501', null,
  'Admin cannot grant memberships through the Data API'
);
select throws_ok(
  $$ update public.admin_memberships set is_active = false, deactivated_at = now()
     where user_id = '44444444-4444-4444-8444-444444444444' $$,
  '42501', null,
  'Admin cannot change memberships through the Data API'
);
select throws_ok(
  $$ delete from public.admin_memberships where user_id = '44444444-4444-4444-8444-444444444444' $$,
  '42501', null,
  'Admin cannot delete memberships through the Data API'
);

-- ---------------------------------------------------------------------------
-- Service role (server-side jobs holding the secret key)
-- ---------------------------------------------------------------------------
reset role;
set local role service_role;
set local request.jwt.claims to '{"role":"service_role"}';

select lives_ok(
  $$ insert into public.admin_memberships (user_id, note)
     values ('33333333-3333-4333-8333-333333333333', 'granted by a service job') $$,
  'service role can grant a membership'
);
select is(
  (select metadata ->> 'via' from public.audit_log
   where action = 'admin_membership.granted'
     and target_id = '33333333-3333-4333-8333-333333333333'),
  'service_role',
  'service-role grants are audited with their origin'
);
select throws_ok(
  $$ update public.audit_log set action = 'service.rewritten' $$,
  '42501', null,
  'service role cannot edit audit history'
);

-- ---------------------------------------------------------------------------
-- Database owner: history stays append-only, helpers validate input
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';

select throws_ok(
  $$ update public.audit_log set action = 'owner.rewritten' $$,
  '42501', 'audit_log is append-only: UPDATE is not allowed',
  'even the owner cannot update audit history'
);
select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', 'audit_log is append-only: DELETE is not allowed',
  'even the owner cannot delete audit history'
);
select throws_ok(
  $$ truncate public.audit_log $$,
  '42501', 'audit_log is append-only: TRUNCATE is not allowed',
  'even the owner cannot truncate audit history'
);
select throws_ok(
  $$ select private.grant_admin('nobody@test.local') $$,
  'P0002', null,
  'granting requires an existing (invited) Auth user'
);

-- ---------------------------------------------------------------------------
-- Revocation takes effect immediately, without waiting for token expiry
-- ---------------------------------------------------------------------------
do $$
begin
  perform private.revoke_admin('admin@test.local', 'test revocation');
end;
$$;

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select is(private.is_active_admin(), false, 'revoked Admin loses access on the next query');
select is_empty($$ select * from public.audit_log $$, 'revoked Admin can no longer read the audit log');
select results_eq(
  $$ select user_id from public.admin_memberships $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'revoked Admin sees only their own membership'
);

reset role;
select * from finish();
rollback;
