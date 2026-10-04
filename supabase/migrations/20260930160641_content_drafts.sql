-- M3 Mirror CMS: Admin drafts of the public site's content (docs/renovation/ARCHITECTURE.md §3–§5).
--
-- * One row per content document the Admins have changed (`site`, `page:<id>`, `package:<id>`,
--   `media:<id>`, `benefit:<id>`). Documents without a row are unchanged from the published
--   content. The app validates every body against the content schema before it saves.
-- * Only active Admins can read or write drafts (RLS). Visitors never read this table: the
--   public site renders the published content, so a draft cannot leak onto it.
-- * Every write bumps `revision`. save_content_draft / discard_content_draft take the revision
--   the editor started from and refuse with SQLSTATE PT409 (HTTP 409 through the Data API) when
--   someone else saved in between, so concurrent edits never overwrite each other silently.
-- * Publishing, revisions history and rollback are M4.

create table public.content_drafts (
  document_id text primary key
    check (
      char_length(document_id) <= 96
      and document_id ~ '^(site|(page|package|media|benefit):[a-z0-9]+(-[a-z0-9]+)*)$'
    ),
  -- Version of the content schema the body was written for (src/lib/content/drafts.ts).
  schema_version integer not null check (schema_version between 1 and 1000),
  body jsonb not null
    check (jsonb_typeof(body) = 'object' and pg_column_size(body) <= 262144),
  revision integer not null default 1 check (revision >= 1),
  -- Auth user id of the Admin who saved last; null for trusted maintenance writes.
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.content_drafts is
  'Unpublished edits from the Mirror editor, one row per content document. Active Admins only.';

-- Revision, author and timestamps are set here, whichever path writes the row.
create or replace function private.stamp_content_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.revision := 1;
    new.created_at := now();
  else
    new.document_id := old.document_id;
    new.revision := old.revision + 1;
    new.created_at := old.created_at;
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.stamp_content_draft() from public, anon, authenticated;

create trigger content_drafts_stamp
  before insert or update on public.content_drafts
  for each row execute function private.stamp_content_draft();

alter table public.content_drafts enable row level security;

revoke all on table public.content_drafts from anon, authenticated, service_role;
grant select, delete on table public.content_drafts to authenticated;
-- Column-level grants: API callers cannot set the revision, author or timestamps.
grant insert (document_id, schema_version, body) on table public.content_drafts to authenticated;
grant update (schema_version, body) on table public.content_drafts to authenticated;
grant select, insert, update, delete on table public.content_drafts to service_role;

create policy "Active Admins read drafts"
  on public.content_drafts
  for select
  to authenticated
  using ((select private.is_active_admin()));

create policy "Active Admins create drafts"
  on public.content_drafts
  for insert
  to authenticated
  with check ((select private.is_active_admin()));

create policy "Active Admins change drafts"
  on public.content_drafts
  for update
  to authenticated
  using ((select private.is_active_admin()))
  with check ((select private.is_active_admin()));

create policy "Active Admins discard drafts"
  on public.content_drafts
  for delete
  to authenticated
  using ((select private.is_active_admin()));

-- ---------------------------------------------------------------------------
-- Saving with optimistic concurrency. SECURITY INVOKER: the caller's RLS and grants apply.
-- ---------------------------------------------------------------------------

-- p_expected_revision is the revision the editor last read; 0 means "no draft yet".
create or replace function public.save_content_draft(
  p_document_id text,
  p_expected_revision integer,
  p_schema_version integer,
  p_body jsonb
)
returns table (revision integer, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_revision integer;
  v_updated_at timestamptz;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can save drafts'
      using errcode = 'insufficient_privilege';
  end if;

  if p_expected_revision = 0 then
    insert into public.content_drafts (document_id, schema_version, body)
    values (p_document_id, p_schema_version, p_body)
    on conflict (document_id) do nothing
    returning content_drafts.revision, content_drafts.updated_at into v_revision, v_updated_at;
  else
    update public.content_drafts d
    set schema_version = p_schema_version,
        body = p_body
    where d.document_id = p_document_id
      and d.revision = p_expected_revision
    returning d.revision, d.updated_at into v_revision, v_updated_at;
  end if;

  if v_revision is null then
    raise exception 'Draft % changed since revision %', p_document_id, p_expected_revision
      using errcode = 'PT409', hint = 'Reload the draft, then apply your change again.';
  end if;

  return query select v_revision, v_updated_at;
end;
$$;

-- Throws the draft away, so the document shows the published content again.
create or replace function public.discard_content_draft(p_document_id text, p_expected_revision integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_active_admin()) then
    raise exception 'Only active Admins can discard drafts'
      using errcode = 'insufficient_privilege';
  end if;

  delete from public.content_drafts d
  where d.document_id = p_document_id
    and d.revision = p_expected_revision;

  if not found then
    raise exception 'Draft % changed since revision %', p_document_id, p_expected_revision
      using errcode = 'PT409', hint = 'Reload the draft before discarding it.';
  end if;
end;
$$;

revoke all on function public.save_content_draft(text, integer, integer, jsonb) from public, anon;
revoke all on function public.discard_content_draft(text, integer) from public, anon;
grant execute on function public.save_content_draft(text, integer, integer, jsonb) to authenticated, service_role;
grant execute on function public.discard_content_draft(text, integer) to authenticated, service_role;
