-- M4: publishing, history and rollback (docs/renovation/M4-PUBLISH.md, plan approved in R4-M4-M5-PROPOSAL.md).
--
-- * content_releases: one immutable snapshot of the whole site's content per publish or rollback
--   (pages, settings, packages, pictures, theme), so a rollback brings every value back exactly.
-- * content_publication: one row pointing at the release visitors see.
-- * Visitors read only the published release, through published_content(); Admins read every
--   release. Nobody updates or deletes a release through the API.
-- * publish_content / rollback_content run as the calling Admin (RLS applies) and do everything in
--   one transaction: check that nobody published since the Admin looked (PT409), add the release,
--   move the pointer, drop the drafts that were published (only at the revisions shown), and record
--   the audit log. The app validates the content before it calls them.

create table public.content_releases (
  id bigint generated always as identity primary key,
  -- 1, 2, 3… in publishing order; what Admins see.
  number integer not null unique check (number >= 1),
  schema_version integer not null check (schema_version between 1 and 1000),
  content jsonb not null check (jsonb_typeof(content) = 'object' and pg_column_size(content) <= 8388608),
  kind text not null check (kind in ('publish', 'rollback')),
  -- The release a rollback copied.
  restored_from integer,
  note text check (char_length(note) <= 500),
  created_by uuid default auth.uid(),
  created_by_email text,
  created_at timestamptz not null default now()
);

comment on table public.content_releases is
  'Published snapshots of the site content, one per publish or rollback. Immutable.';

create table public.content_publication (
  singleton boolean primary key default true check (singleton),
  release_number integer not null references public.content_releases (number),
  published_at timestamptz not null default now(),
  published_by uuid default auth.uid()
);

comment on table public.content_publication is
  'The release visitors see: a single row pointing at content_releases.number.';

create or replace function private.reject_release_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'content_releases are immutable: % is not allowed', tg_op
    using errcode = 'insufficient_privilege';
end;
$$;

revoke all on function private.reject_release_change() from public, anon, authenticated;

create trigger content_releases_immutable
  before update on public.content_releases
  for each row execute function private.reject_release_change();

alter table public.content_releases enable row level security;
alter table public.content_publication enable row level security;

revoke all on table public.content_releases from anon, authenticated, service_role;
revoke all on table public.content_publication from anon, authenticated, service_role;
grant select on table public.content_releases to authenticated;
grant insert (number, schema_version, content, kind, restored_from, note, created_by_email) on table public.content_releases to authenticated;
grant select, insert, update on table public.content_publication to authenticated;
-- Maintenance and tests (local stack) may clear history; the API roles above cannot.
grant select, insert, update, delete on table public.content_releases to service_role;
grant select, insert, update, delete on table public.content_publication to service_role;

create policy "Active Admins read releases"
  on public.content_releases for select to authenticated
  using ((select private.is_active_admin()));

create policy "Active Admins add releases"
  on public.content_releases for insert to authenticated
  with check ((select private.is_active_admin()) and created_by = (select auth.uid()));

create policy "Active Admins read the publication"
  on public.content_publication for select to authenticated
  using ((select private.is_active_admin()));

create policy "Active Admins set the publication"
  on public.content_publication for insert to authenticated
  with check ((select private.is_active_admin()));

create policy "Active Admins move the publication"
  on public.content_publication for update to authenticated
  using ((select private.is_active_admin()))
  with check ((select private.is_active_admin()));

-- ---------------------------------------------------------------------------
-- What visitors read: the published release only. SECURITY DEFINER so anon needs no table access.
-- ---------------------------------------------------------------------------

create or replace function public.published_content()
returns table (number integer, schema_version integer, content jsonb, published_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.number, r.schema_version, r.content, p.published_at
  from public.content_publication p
  join public.content_releases r on r.number = p.release_number;
$$;

revoke all on function public.published_content() from public;
grant execute on function public.published_content() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Publishing and rolling back. SECURITY INVOKER: the caller's RLS and grants apply.
-- ---------------------------------------------------------------------------

-- The number visitors see now, locked until the transaction ends; 0 when nothing was published.
create or replace function private.lock_publication()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_number integer;
begin
  perform pg_advisory_xact_lock(hashtext('content_publication'));
  select p.release_number into v_number from public.content_publication p;
  return coalesce(v_number, 0);
end;
$$;

revoke all on function private.lock_publication() from public, anon;
grant execute on function private.lock_publication() to authenticated, service_role;

create or replace function private.point_publication(p_number integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.content_publication (singleton, release_number, published_at, published_by)
  values (true, p_number, now(), auth.uid())
  on conflict (singleton) do update
    set release_number = excluded.release_number, published_at = excluded.published_at, published_by = excluded.published_by;
end;
$$;

revoke all on function private.point_publication(integer) from public, anon;
grant execute on function private.point_publication(integer) to authenticated, service_role;

-- p_documents: [{"document_id": "...", "revision": n}], the drafts the Admin saw in the diff.
create or replace function public.publish_content(
  p_content jsonb,
  p_schema_version integer,
  p_based_on integer,
  p_documents jsonb,
  p_note text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current integer;
  v_number integer;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can publish' using errcode = 'insufficient_privilege';
  end if;

  v_current := private.lock_publication();
  if v_current <> p_based_on then
    raise exception 'Release % was published since release %', v_current, p_based_on
      using errcode = 'PT409', hint = 'Review the changes again, then publish.';
  end if;

  select coalesce(max(r.number), 0) + 1 into v_number from public.content_releases r;
  insert into public.content_releases (number, schema_version, content, kind, note, created_by_email)
  values (v_number, p_schema_version, p_content, 'publish', nullif(trim(p_note), ''), auth.jwt() ->> 'email');
  perform private.point_publication(v_number);

  -- Drafts changed after the Admin looked stay, to be published next time.
  delete from public.content_drafts d
  using jsonb_to_recordset(coalesce(p_documents, '[]'::jsonb)) as shown(document_id text, revision integer)
  where d.document_id = shown.document_id and d.revision = shown.revision;

  insert into public.audit_log (action, target_type, target_id, metadata)
  values (
    'content.publish', 'content_release', v_number::text,
    jsonb_build_object('documents', coalesce(p_documents, '[]'::jsonb), 'based_on', p_based_on)
  );
  return v_number;
end;
$$;

create or replace function public.rollback_content(p_release integer, p_based_on integer, p_note text default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current integer;
  v_number integer;
  v_source public.content_releases%rowtype;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can roll back' using errcode = 'insufficient_privilege';
  end if;

  v_current := private.lock_publication();
  if v_current <> p_based_on then
    raise exception 'Release % was published since release %', v_current, p_based_on
      using errcode = 'PT409', hint = 'Look at the history again, then roll back.';
  end if;

  select * into v_source from public.content_releases r where r.number = p_release;
  if not found then
    raise exception 'No release %', p_release using errcode = 'P0002';
  end if;

  select coalesce(max(r.number), 0) + 1 into v_number from public.content_releases r;
  insert into public.content_releases (number, schema_version, content, kind, restored_from, note, created_by_email)
  values (v_number, v_source.schema_version, v_source.content, 'rollback', p_release, nullif(trim(p_note), ''), auth.jwt() ->> 'email');
  perform private.point_publication(v_number);

  insert into public.audit_log (action, target_type, target_id, metadata)
  values ('content.rollback', 'content_release', v_number::text, jsonb_build_object('restored_from', p_release, 'based_on', p_based_on));
  return v_number;
end;
$$;

revoke all on function public.publish_content(jsonb, integer, integer, jsonb, text) from public, anon;
revoke all on function public.rollback_content(integer, integer, text) from public, anon;
grant execute on function public.publish_content(jsonb, integer, integer, jsonb, text) to authenticated, service_role;
grant execute on function public.rollback_content(integer, integer, text) to authenticated, service_role;
