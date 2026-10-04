-- M5: call-back requests from the public form (docs/renovation/M5-LEADS.md; the owner's answers
-- are in R4-M4-M5-PROPOSAL.md: notifications in the back office only, personal data kept for one
-- year after a request is closed).
--
-- * leads: one row per request. Personal data (name, phone, area, note) stays until one year after
--   the request is closed, then a daily job removes it; province, service, package, dates, status
--   and outcome stay for the reports.
-- * lead_events: each request's history (received, sent again, changes and notes by Admins).
-- * lead_intake_log: hashed visitor addresses of recent requests, for the rate limit; kept a day.
-- * Visitors never touch the tables. The site's server validates the form and sends it through
--   submit_lead(), which only the service role may run: a repeat of the same form (idempotency key)
--   returns the first result, a new request from the same phone for the same service while the
--   first is open is added to that request's history, and one visitor (5 per 10 minutes) and the
--   whole site (300 per hour) are rate limited.
-- * Active Admins read requests and change them only through update_lead() and anonymise_lead(),
--   which record the history (and the audit log for anonymising).

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  -- One per form the visitor filled in; a second send of the same form finds the first request.
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Personal data, removed by anonymising.
  name text check (char_length(name) between 1 and 100),
  phone text check (phone ~ '^0[2-9][0-9]{7,8}$'),
  area text check (char_length(area) between 1 and 120),
  note text check (char_length(note) between 1 and 1000),
  -- ISO 3166-2:TH code of the province (TH-10 Bangkok … TH-96).
  province text not null check (province ~ '^TH-[1-9][0-9]$'),
  service text not null check (service in ('broadband', 'mobile', 'solar', 'other')),
  package_id text check (char_length(package_id) <= 64 and package_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  preferred_time text not null check (preferred_time in ('anytime', 'morning', 'afternoon', 'evening')),
  locale text not null check (locale in ('th', 'en')),
  -- The page the form was sent from, and the campaign tags in its address.
  source_path text check (char_length(source_path) <= 200),
  utm jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object' and pg_column_size(utm) <= 2048),
  -- Version (date) of the privacy policy the visitor accepted.
  consent_version text not null check (consent_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  -- new: received · pending: waiting to be reached · contacted: talked to · closed.
  status text not null default 'new' check (status in ('new', 'pending', 'contacted', 'closed')),
  area_check text not null default 'unchecked' check (area_check in ('unchecked', 'available', 'unavailable')),
  outcome text check (outcome in ('signed_up', 'not_interested', 'no_coverage', 'unreachable', 'duplicate', 'spam', 'other')),
  follow_up_on date,
  -- Last time the visitor sent the same request again while it was open.
  resubmitted_at timestamptz,
  -- Start of the retention period.
  closed_at timestamptz,
  anonymised_at timestamptz,
  constraint leads_closed_has_date check ((status = 'closed') = (closed_at is not null)),
  constraint leads_closed_has_outcome check ((status = 'closed') = (outcome is not null)),
  constraint leads_personal_data check (
    case when anonymised_at is null then name is not null and phone is not null
    else name is null and phone is null and area is null and note is null end
  )
);

comment on table public.leads is
  'Call-back requests from the public form. Personal data is removed one year after closing.';

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_open_phone_idx on public.leads (phone, service) where status <> 'closed';
create index leads_retention_idx on public.leads (closed_at) where anonymised_at is null;

create table public.lead_events (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('received', 'resubmitted', 'update', 'anonymised')),
  -- The form of a request sent again, so a repeat of it adds nothing.
  idempotency_key uuid unique,
  actor_user_id uuid,
  actor_email text,
  -- What changed, such as {"status": {"from": "new", "to": "contacted"}}; no personal data.
  changes jsonb not null default '{}'::jsonb check (jsonb_typeof(changes) = 'object'),
  -- Personal data of a request sent again (name, area, note); removed by anonymising.
  details jsonb check (jsonb_typeof(details) = 'object' and pg_column_size(details) <= 4096),
  -- An Admin's note; removed by anonymising, since it may mention the visitor.
  note text check (char_length(note) between 1 and 2000)
);

comment on table public.lead_events is 'History of each call-back request.';

create index lead_events_lead_idx on public.lead_events (lead_id, occurred_at);

create table public.lead_intake_log (
  id bigint generated always as identity primary key,
  -- HMAC of the visitor's IP address, made by the site's server.
  client_hash text not null check (client_hash ~ '^[0-9a-f]{64}$'),
  at timestamptz not null default now()
);

comment on table public.lead_intake_log is 'Recent requests per hashed visitor address, for the rate limit. Kept one day.';

create index lead_intake_log_client_idx on public.lead_intake_log (client_hash, at desc);

alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_intake_log enable row level security;

revoke all on table public.leads from anon, authenticated, service_role;
revoke all on table public.lead_events from anon, authenticated, service_role;
revoke all on table public.lead_intake_log from anon, authenticated, service_role;
grant select on table public.leads to authenticated;
grant select on table public.lead_events to authenticated;
-- Maintenance and tests (local stack); the site's server only calls submit_lead().
grant select, insert, update, delete on table public.leads to service_role;
grant select, insert, update, delete on table public.lead_events to service_role;
grant select, insert, delete on table public.lead_intake_log to service_role;

create policy "Active Admins read requests"
  on public.leads for select to authenticated
  using ((select private.is_active_admin()));

create policy "Active Admins read request history"
  on public.lead_events for select to authenticated
  using ((select private.is_active_admin()));

-- ---------------------------------------------------------------------------
-- Receiving a request (the site's server, with the secret key)
-- ---------------------------------------------------------------------------

create or replace function public.submit_lead(
  p_idempotency_key uuid,
  p_name text,
  p_phone text,
  p_province text,
  p_service text,
  p_preferred_time text,
  p_locale text,
  p_consent_version text,
  p_client_hash text,
  p_area text default null,
  p_package_id text default null,
  p_note text default null,
  p_source_path text default null,
  p_utm jsonb default '{}'::jsonb
)
returns table (outcome text, lead_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  -- The server validated the form; this keeps a request sent again (stored only in the history)
  -- to the same rules as a new one.
  if p_idempotency_key is null or p_phone is null or p_phone !~ '^0[2-9][0-9]{7,8}$'
    or p_province is null or p_province !~ '^TH-[1-9][0-9]$'
    or p_service is null or p_service not in ('broadband', 'mobile', 'solar', 'other')
    or p_preferred_time is null or p_preferred_time not in ('anytime', 'morning', 'afternoon', 'evening')
    or char_length(trim(p_name)) not between 1 and 100 or char_length(p_area) > 120 or char_length(p_note) > 1000
    or p_client_hash is null then
    raise exception 'Invalid request' using errcode = '22023';
  end if;

  -- One request per phone at a time, so two sends of the same form cannot both create one.
  perform pg_advisory_xact_lock(hashtext('lead:' || p_phone));

  select l.id into v_id from public.leads l where l.idempotency_key = p_idempotency_key;
  if v_id is null then
    select e.lead_id into v_id from public.lead_events e where e.idempotency_key = p_idempotency_key;
  end if;
  if v_id is not null then
    return query select 'duplicate'::text, v_id;
    return;
  end if;

  insert into public.lead_intake_log (client_hash) values (p_client_hash);
  if (select count(*) from public.lead_intake_log g where g.client_hash = p_client_hash and g.at > now() - interval '10 minutes') > 5
    or (select count(*) from public.leads l where l.created_at > now() - interval '1 hour') >= 300 then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  select l.id into v_id
  from public.leads l
  where l.phone = p_phone and l.service = p_service and l.status <> 'closed'
  order by l.created_at desc
  limit 1;
  if v_id is not null then
    update public.leads set resubmitted_at = now(), updated_at = clock_timestamp() where id = v_id;
    insert into public.lead_events (lead_id, kind, idempotency_key, changes, details)
    values (
      v_id, 'resubmitted', p_idempotency_key,
      jsonb_strip_nulls(jsonb_build_object('province', p_province, 'preferred_time', p_preferred_time, 'package_id', p_package_id, 'source_path', p_source_path)),
      jsonb_strip_nulls(jsonb_build_object('name', p_name, 'area', nullif(trim(p_area), ''), 'note', nullif(trim(p_note), '')))
    );
    return query select 'duplicate'::text, v_id;
    return;
  end if;

  insert into public.leads (
    idempotency_key, name, phone, province, area, service, package_id, preferred_time, note,
    locale, source_path, utm, consent_version
  )
  values (
    p_idempotency_key, trim(p_name), p_phone, p_province, nullif(trim(p_area), ''), p_service, p_package_id,
    p_preferred_time, nullif(trim(p_note), ''), p_locale, p_source_path, coalesce(p_utm, '{}'::jsonb), p_consent_version
  )
  returning id into v_id;
  insert into public.lead_events (lead_id, kind) values (v_id, 'received');
  return query select 'created'::text, v_id;
end;
$$;

revoke all on function public.submit_lead(uuid, text, text, text, text, text, text, text, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_lead(uuid, text, text, text, text, text, text, text, text, text, text, text, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- Working on a request (active Admins)
-- ---------------------------------------------------------------------------

-- Changes the status, area check, outcome and follow-up date, and adds a note, in one history entry.
-- p_seen_updated_at is the request's updated_at the Admin saw; a change since then is refused (PT409).
create or replace function public.update_lead(
  p_lead uuid,
  p_seen_updated_at timestamptz,
  p_status text,
  p_area_check text,
  p_outcome text default null,
  p_follow_up_on date default null,
  p_note text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
  v_outcome text := case when p_status = 'closed' then p_outcome end;
  v_note text := nullif(trim(p_note), '');
  v_changes jsonb := '{}'::jsonb;
  v_updated timestamptz;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can change requests' using errcode = 'insufficient_privilege';
  end if;

  select * into v_lead from public.leads l where l.id = p_lead for update;
  if not found then
    raise exception 'No request %', p_lead using errcode = 'P0002';
  end if;
  if v_lead.anonymised_at is not null then
    raise exception 'Request % no longer holds personal data and cannot change', p_lead using errcode = 'PT410';
  end if;
  if v_lead.updated_at <> p_seen_updated_at then
    raise exception 'Request % changed since it was shown', p_lead using errcode = 'PT409';
  end if;
  if p_status = 'closed' and v_outcome is null then
    raise exception 'A closed request needs an outcome' using errcode = '23514';
  end if;

  if v_lead.status is distinct from p_status then
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('from', v_lead.status, 'to', p_status));
  end if;
  if v_lead.area_check is distinct from p_area_check then
    v_changes := v_changes || jsonb_build_object('area_check', jsonb_build_object('from', v_lead.area_check, 'to', p_area_check));
  end if;
  if v_lead.outcome is distinct from v_outcome then
    v_changes := v_changes || jsonb_build_object('outcome', jsonb_build_object('from', v_lead.outcome, 'to', v_outcome));
  end if;
  if v_lead.follow_up_on is distinct from p_follow_up_on then
    v_changes := v_changes || jsonb_build_object('follow_up_on', jsonb_build_object('from', v_lead.follow_up_on, 'to', p_follow_up_on));
  end if;
  if v_changes = '{}'::jsonb and v_note is null then
    return v_lead.updated_at;
  end if;

  update public.leads l
  set status = p_status,
      area_check = p_area_check,
      outcome = v_outcome,
      follow_up_on = p_follow_up_on,
      closed_at = case when p_status = 'closed' then coalesce(v_lead.closed_at, now()) end,
      updated_at = clock_timestamp()
  where l.id = p_lead
  returning l.updated_at into v_updated;

  insert into public.lead_events (lead_id, kind, actor_user_id, actor_email, changes, note)
  values (p_lead, 'update', auth.uid(), auth.jwt() ->> 'email', v_changes, v_note);
  return v_updated;
end;
$$;

-- Removes a request's personal data and that of its history; the rest stays for the reports.
create or replace function private.anonymise_lead_row(p_lead uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.leads l
  set name = null, phone = null, area = null, note = null, anonymised_at = now(), updated_at = clock_timestamp()
  where l.id = p_lead and l.anonymised_at is null;
  update public.lead_events e set details = null, note = null where e.lead_id = p_lead;
end;
$$;

revoke all on function private.anonymise_lead_row(uuid) from public, anon, authenticated, service_role;

-- At the visitor's request (their right under the privacy policy) or for spam.
create or replace function public.anonymise_lead(p_lead uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can remove personal data' using errcode = 'insufficient_privilege';
  end if;
  if p_reason is null or p_reason not in ('request', 'spam') then
    raise exception 'Unknown reason %', p_reason using errcode = '22023';
  end if;
  perform 1 from public.leads l where l.id = p_lead and l.anonymised_at is null for update;
  if not found then
    raise exception 'No request % with personal data', p_lead using errcode = 'P0002';
  end if;

  perform private.anonymise_lead_row(p_lead);
  insert into public.lead_events (lead_id, kind, actor_user_id, actor_email, changes)
  values (p_lead, 'anonymised', auth.uid(), auth.jwt() ->> 'email', jsonb_build_object('reason', p_reason));
  insert into public.audit_log (action, target_type, target_id, metadata)
  values ('lead.anonymise', 'lead', p_lead::text, jsonb_build_object('reason', p_reason));
end;
$$;

revoke all on function public.update_lead(uuid, timestamptz, text, text, text, date, text) from public, anon;
revoke all on function public.anonymise_lead(uuid, text) from public, anon;
grant execute on function public.update_lead(uuid, timestamptz, text, text, text, date, text) to authenticated, service_role;
grant execute on function public.anonymise_lead(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Retention: one year after closing (the owner's choice, 2026-10-01), daily
-- ---------------------------------------------------------------------------

create or replace function private.apply_lead_retention()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select l.id from public.leads l
    where l.anonymised_at is null and l.closed_at < now() - interval '1 year'
    for update skip locked
  loop
    perform private.anonymise_lead_row(v_id);
    insert into public.lead_events (lead_id, kind, changes) values (v_id, 'anonymised', '{"reason": "retention"}'::jsonb);
    v_count := v_count + 1;
  end loop;

  delete from public.lead_intake_log g where g.at < now() - interval '1 day';

  if v_count > 0 then
    insert into public.audit_log (action, target_type, metadata)
    values ('lead.retention', 'lead', jsonb_build_object('anonymised', v_count));
  end if;
  return v_count;
end;
$$;

revoke all on function private.apply_lead_retention() from public, anon, authenticated, service_role;

create extension if not exists pg_cron with schema pg_catalog;

-- 02:30 in Bangkok (19:30 UTC).
select cron.schedule('lead-retention', '30 19 * * *', 'select private.apply_lead_retention()');
