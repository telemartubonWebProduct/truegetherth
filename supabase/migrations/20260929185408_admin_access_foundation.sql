-- M1 Foundation: single invite-only Admin role (docs/renovation/ARCHITECTURE.md §6).
--
-- * public.admin_memberships is the server-controlled source of truth for back-office access.
--   The Data API can only read it (a user's own row, or every row for an active Admin).
--   Memberships change only through trusted SQL (private.grant_admin / private.revoke_admin)
--   or the service role, never from the browser.
-- * public.audit_log is append-only. Active Admins may add entries attributed to themselves;
--   no role can update or delete history.
-- * Functions that bypass RLS live in the `private` schema, which the Data API does not expose.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin memberships
-- ---------------------------------------------------------------------------

create table public.admin_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_active boolean not null default true,
  note text check (char_length(note) <= 500),
  -- Auth user id of the Admin who granted access; null when granted from SQL.
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  constraint admin_memberships_deactivation_matches_state
    check (is_active = (deactivated_at is null))
);

comment on table public.admin_memberships is
  'Back-office access, one row per invited Admin. Changed only by trusted SQL or the service role.';

create trigger admin_memberships_set_updated_at
  before update on public.admin_memberships
  for each row execute function private.set_updated_at();

alter table public.admin_memberships enable row level security;

revoke all on table public.admin_memberships from anon, authenticated, service_role;
grant select on table public.admin_memberships to authenticated;
grant select, insert, update, delete on table public.admin_memberships to service_role;

-- True when the JWT subject holds an active membership. SECURITY DEFINER lets policies consult
-- memberships without widening table access; the owner is not subject to RLS, so no recursion.
create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships m
    where m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

revoke all on function private.is_active_admin() from public, anon;
grant execute on function private.is_active_admin() to authenticated, service_role;

create policy "Members read their own membership; active Admins read all"
  on public.admin_memberships
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_active_admin())
  );

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  -- No foreign key: history must outlive deleted users.
  actor_user_id uuid default auth.uid(),
  action text not null
    check (char_length(action) <= 64 and action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  target_type text check (char_length(target_type) <= 64),
  target_id text check (char_length(target_id) <= 128),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audit_log is
  'Append-only record of back-office and access events. Updates, deletes and truncates are rejected.';

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id, occurred_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

create or replace function private.reject_audit_log_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only: % is not allowed', tg_op
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function private.reject_audit_log_change();

create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function private.reject_audit_log_change();

alter table public.audit_log enable row level security;

revoke all on table public.audit_log from anon, authenticated, service_role;
grant select on table public.audit_log to authenticated;
-- Column-level grant: API callers cannot choose the id, timestamp or actor.
grant insert (action, target_type, target_id, metadata) on table public.audit_log to authenticated;
grant select, insert on table public.audit_log to service_role;

create policy "Active Admins read the audit log"
  on public.audit_log
  for select
  to authenticated
  using ((select private.is_active_admin()));

create policy "Active Admins record their own actions"
  on public.audit_log
  for insert
  to authenticated
  with check (
    (select private.is_active_admin())
    and actor_user_id = (select auth.uid())
  );

-- Every membership change is recorded, whichever trusted path made it.
create or replace function private.audit_admin_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_user_id uuid;
  v_metadata jsonb;
  v_via text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    session_user
  );
begin
  if tg_op = 'DELETE' then
    v_action := 'admin_membership.removed';
    v_user_id := old.user_id;
    v_metadata := jsonb_build_object('via', v_via);
  else
    v_user_id := new.user_id;
    v_metadata := jsonb_strip_nulls(jsonb_build_object(
      'is_active', new.is_active,
      'note', new.note,
      'via', v_via
    ));
    if tg_op = 'INSERT' then
      v_action := 'admin_membership.granted';
    elsif old.is_active and not new.is_active then
      v_action := 'admin_membership.deactivated';
    elsif not old.is_active and new.is_active then
      v_action := 'admin_membership.reactivated';
    else
      v_action := 'admin_membership.updated';
    end if;
  end if;

  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), v_action, 'admin_membership', v_user_id::text, v_metadata);

  return null;
end;
$$;

revoke all on function private.audit_admin_membership_change() from public, anon, authenticated;

create trigger admin_memberships_audit
  after insert or update or delete on public.admin_memberships
  for each row execute function private.audit_admin_membership_change();

-- ---------------------------------------------------------------------------
-- Trusted helpers for the SQL editor (run as the database owner). Not callable by API roles.
--   select private.grant_admin('owner@example.com', 'Initial Admin');
--   select private.revoke_admin('former.admin@example.com', 'Left the team');
-- ---------------------------------------------------------------------------

create or replace function private.grant_admin(p_email text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email));

  if v_user_id is null then
    raise exception 'No Supabase Auth user has email %. Invite the user first.', p_email
      using errcode = 'no_data_found';
  end if;

  insert into public.admin_memberships (user_id, is_active, note, granted_by)
  values (v_user_id, true, p_note, (select auth.uid()))
  on conflict (user_id) do update
    set is_active = true,
        deactivated_at = null,
        note = coalesce(excluded.note, public.admin_memberships.note);

  return v_user_id;
end;
$$;

create or replace function private.revoke_admin(p_email text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  update public.admin_memberships m
  set is_active = false,
      deactivated_at = now(),
      note = coalesce(p_note, m.note)
  from auth.users u
  where u.id = m.user_id
    and lower(u.email) = lower(btrim(p_email))
    and m.is_active
  returning m.user_id into v_user_id;

  if v_user_id is null then
    raise exception 'No active Admin membership for %.', p_email
      using errcode = 'no_data_found';
  end if;

  return v_user_id;
end;
$$;

revoke all on function private.grant_admin(text, text) from public, anon, authenticated, service_role;
revoke all on function private.revoke_admin(text, text) from public, anon, authenticated, service_role;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.reject_audit_log_change() from public, anon, authenticated;
