-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- ─── Enable RLS on all tables ─────────────────────────────
alter table public.profiles    enable row level security;
alter table public.sites       enable row level security;
alter table public.tasks       enable row level security;
alter table public.task_history enable row level security;

-- ─── Helper: get current user's role ──────────────────────
-- SECURITY DEFINER so it runs as owner, cached per transaction
create or replace function public.get_user_role()
  returns user_role
  language sql
  stable
  security definer
  set search_path = public, pg_catalog
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- ─── profiles RLS ─────────────────────────────────────────
-- SELECT: own profile always; manager sees all
create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "profiles_select_manager"
  on public.profiles
  for select
  using (public.get_user_role() = 'manager');

-- INSERT/UPDATE/DELETE: forbidden through API
-- (only created by trigger on auth.users, role only via Studio)
create policy "profiles_insert_trigger_only"
  on public.profiles
  for insert
  with check (id = auth.uid());   -- the trigger inserts with the new user's id

-- No UPDATE or DELETE policies → all denied through API

-- ─── sites RLS ────────────────────────────────────────────
-- Manager: full CRUD
create policy "sites_manager_all"
  on public.sites
  for all
  using (public.get_user_role() = 'manager')
  with check (public.get_user_role() = 'manager');

-- Executor: SELECT only sites where they have at least one task
create policy "sites_executor_select"
  on public.sites
  for select
  using (
    public.get_user_role() = 'executor'
    and exists (
      select 1 from public.tasks t
      where t.site_id = sites.id
        and t.assignee_id = auth.uid()
    )
  );

-- ─── tasks RLS ────────────────────────────────────────────
-- Manager: full CRUD
create policy "tasks_manager_all"
  on public.tasks
  for all
  using (public.get_user_role() = 'manager')
  with check (public.get_user_role() = 'manager');

-- Executor: SELECT only own tasks
create policy "tasks_executor_select"
  on public.tasks
  for select
  using (
    public.get_user_role() = 'executor'
    and assignee_id = auth.uid()
  );

-- Executor: UPDATE only own tasks (business logic enforced in trigger)
create policy "tasks_executor_update"
  on public.tasks
  for update
  using (
    public.get_user_role() = 'executor'
    and assignee_id = auth.uid()
  )
  with check (
    public.get_user_role() = 'executor'
    and assignee_id = auth.uid()
  );

-- Executor: no INSERT or DELETE

-- ─── task_history RLS ─────────────────────────────────────
-- Manager: SELECT all history
create policy "task_history_manager_select"
  on public.task_history
  for select
  using (public.get_user_role() = 'manager');

-- Executor: SELECT only history for own tasks
create policy "task_history_executor_select"
  on public.task_history
  for select
  using (
    public.get_user_role() = 'executor'
    and exists (
      select 1 from public.tasks t
      where t.id = task_history.task_id
        and t.assignee_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for task_history → all denied through API
-- Records are written only by the SECURITY DEFINER after-trigger
