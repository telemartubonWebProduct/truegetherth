-- M5: call-back requests, their history, the rate limit and retention.
-- Run against the local stack: `npm run db:test` (supabase test db).
begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

insert into auth.users (id, email, aud, role)
values
  ('d1111111-1111-4111-8111-111111111111', 'leads.admin@test.local', 'authenticated', 'authenticated'),
  ('d3333333-3333-4333-8333-333333333333', 'leads.member@test.local', 'authenticated', 'authenticated');

do $$
begin
  perform private.grant_admin('leads.admin@test.local', 'fixture');
end;
$$;

-- A request as the site's server sends it.
create function pg_temp.submit(p_key uuid, p_phone text, p_service text default 'broadband', p_hash text default repeat('a', 64), p_note text default null)
returns table (outcome text, lead_id uuid)
language sql
as $$
  select * from public.submit_lead(
    p_idempotency_key => p_key, p_name => 'สมชาย ใจดี', p_phone => p_phone, p_province => 'TH-34',
    p_service => p_service, p_preferred_time => 'morning', p_locale => 'th', p_consent_version => '2026-10-02',
    p_client_hash => p_hash, p_area => 'เมือง', p_note => p_note, p_source_path => '/service',
    p_utm => '{"utm_source":"facebook"}'
  );
$$;

-- ---------------------------------------------------------------------------
-- Structure and grants
-- ---------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.leads'::regclass), 'RLS is on for requests');
select ok((select relrowsecurity from pg_class where oid = 'public.lead_events'::regclass), 'RLS is on for request history');
select ok((select relrowsecurity from pg_class where oid = 'public.lead_intake_log'::regclass), 'RLS is on for the rate-limit log');
select ok(not has_table_privilege('anon', 'public.leads', 'SELECT'), 'visitors cannot read requests');
select ok(not has_table_privilege('anon', 'public.leads', 'INSERT'), 'visitors cannot add requests directly');
select ok(not has_function_privilege('anon', 'public.submit_lead(uuid, text, text, text, text, text, text, text, text, text, text, text, text, jsonb)', 'EXECUTE'), 'visitors cannot call the intake function');
select ok(not has_function_privilege('authenticated', 'public.submit_lead(uuid, text, text, text, text, text, text, text, text, text, text, text, text, jsonb)', 'EXECUTE'), 'signed-in users cannot call the intake function');
select ok(has_function_privilege('service_role', 'public.submit_lead(uuid, text, text, text, text, text, text, text, text, text, text, text, text, jsonb)', 'EXECUTE'), 'the site''s server can');
select ok(not has_table_privilege('authenticated', 'public.leads', 'UPDATE'), 'Admins change requests only through the functions');
select ok(not has_table_privilege('authenticated', 'public.lead_events', 'INSERT'), 'Admins add history only through the functions');
select is((select count(*)::integer from cron.job where jobname = 'lead-retention'), 1, 'retention runs daily');

-- ---------------------------------------------------------------------------
-- Intake (service role)
-- ---------------------------------------------------------------------------
set local role service_role;

select is(
  (select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000001', '0812345678')),
  'created', 'a new request is stored'
);
select is(
  (select row(outcome, lead_id)::text from pg_temp.submit('e0000000-0000-4000-8000-000000000001', '0812345678')),
  (select row('duplicate', id)::text from public.leads where idempotency_key = 'e0000000-0000-4000-8000-000000000001'),
  'sending the same form again returns the first request'
);
select is(
  (select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000002', '0812345678', p_note => 'ขอโทรหลังหกโมงเย็น')),
  'duplicate', 'a new form from the same phone for the same open service joins the open request'
);
select is((select count(*)::integer from public.leads where phone = '0812345678'), 1, 'so it adds no request');
select is(
  (select details ->> 'note' from public.lead_events where idempotency_key = 'e0000000-0000-4000-8000-000000000002'),
  'ขอโทรหลังหกโมงเย็น', 'and its note is in the request''s history'
);
select ok((select resubmitted_at is not null from public.leads where phone = '0812345678'), 'the request shows it was sent again');
select is(
  (select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000003', '0812345678', p_service => 'solar')),
  'created', 'the same phone asking about another service is a new request'
);
select throws_ok(
  $$ select * from pg_temp.submit('e0000000-0000-4000-8000-000000000004', '12345') $$,
  '22023', null, 'an invalid phone is refused'
);

-- Rate limit: 5 requests per visitor address in 10 minutes (this address has sent 3 so far).
select is((select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000005', '0812345671')), 'created', 'a fourth request passes');
select is((select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000006', '0812345672')), 'created', 'a fifth request passes');
select is((select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000007', '0812345673')), 'rate_limited', 'a sixth request in ten minutes is refused');
select is((select count(*)::integer from public.leads where phone = '0812345673'), 0, 'and not stored');
select is(
  (select outcome from pg_temp.submit('e0000000-0000-4000-8000-000000000008', '0812345673', p_hash => repeat('b', 64))),
  'created', 'another visitor still gets through'
);

-- ---------------------------------------------------------------------------
-- Signed-in users
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"d3333333-3333-4333-8333-333333333333","role":"authenticated","email":"leads.member@test.local"}';
select is_empty($$ select 1 from public.leads $$, 'a user who is not an Admin reads no requests');
select throws_ok(
  $$ select public.update_lead((select id from public.leads limit 1), now(), 'contacted', 'unchecked') $$,
  '42501', null, 'and cannot change one'
);

reset role;
create temporary table seen on commit drop as
  select id, updated_at from public.leads where phone = '0812345678' and service = 'broadband';
grant select on seen to authenticated;

set local role authenticated;
set local request.jwt.claims to '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","email":"leads.admin@test.local"}';
select is((select count(*)::integer from public.leads), 5, 'an active Admin reads every request');

select throws_ok(
  $$ select public.update_lead((select id from seen), (select updated_at from seen), 'closed', 'available') $$,
  '23514', null, 'closing needs an outcome'
);
select lives_ok(
  $$ select public.update_lead((select id from seen), (select updated_at from seen), 'contacted', 'available', null, '2026-10-09', 'โทรแล้ว ลูกค้าสะดวกช่วงเย็น') $$,
  'an Admin records a call'
);
select throws_ok(
  $$ select public.update_lead((select id from seen), (select updated_at from seen), 'closed', 'available', 'signed_up') $$,
  'PT409', null, 'a change based on an old view of the request is refused'
);
select is(
  (select changes -> 'status' from public.lead_events where lead_id = (select id from seen) and kind = 'update'),
  '{"from": "new", "to": "contacted"}'::jsonb,
  'the history says what changed'
);
select is(
  (select actor_email from public.lead_events where lead_id = (select id from seen) and kind = 'update'),
  'leads.admin@test.local', 'and who changed it'
);

select lives_ok(
  $$ select public.anonymise_lead((select id from public.leads where phone = '0812345671'), 'request') $$,
  'an Admin removes a visitor''s personal data at their request'
);
select is(
  (select row(name, phone, area, note, province)::text from public.leads where idempotency_key = 'e0000000-0000-4000-8000-000000000005'),
  row(null::text, null::text, null::text, null::text, 'TH-34')::text,
  'the request keeps no personal data, only what the reports need'
);
select is(
  (select action from public.audit_log where target_type = 'lead' order by id desc limit 1),
  'lead.anonymise', 'removing personal data is in the audit log'
);

-- ---------------------------------------------------------------------------
-- Retention: one year after closing
-- ---------------------------------------------------------------------------
reset role;
update public.leads
set status = 'closed', outcome = 'signed_up', closed_at = now() - interval '1 year 1 day'
where phone = '0812345678' and service = 'broadband';
update public.leads
set status = 'closed', outcome = 'not_interested', closed_at = now() - interval '11 months'
where phone = '0812345678' and service = 'solar';

select is(private.apply_lead_retention(), 1, 'the daily job anonymises requests closed more than a year ago');
select is(
  (select count(*)::integer from public.lead_events e join public.leads l on l.id = e.lead_id
   where l.idempotency_key = 'e0000000-0000-4000-8000-000000000001' and (e.note is not null or e.details is not null)),
  0, 'its history loses the personal data too'
);
select is(
  (select name from public.leads where idempotency_key = 'e0000000-0000-4000-8000-000000000003'),
  'สมชาย ใจดี', 'a request closed eleven months ago keeps it'
);

select * from finish();
rollback;
