-- ============================================================
-- Migration 004: RPC Functions
-- ============================================================

-- ─── change_task_status ───────────────────────────────────
-- Public API for status changes. Sets session var for comment
-- before the UPDATE so the BEFORE trigger can read it.
create or replace function public.change_task_status(
  p_task_id   uuid,
  p_to_status task_status,
  p_comment   text default ''
)
  returns void
  language plpgsql
  security invoker          -- runs as calling user, so auth.uid() works in triggers
  set search_path = public, pg_catalog
as $$
begin
  -- Store comment in session variable (visible to triggers in same transaction)
  perform set_config('app.task_comment', coalesce(p_comment, ''), true);

  -- Perform the status update — triggers will validate
  update public.tasks
  set status = p_to_status
  where id = p_task_id;

  if not found then
    raise exception 'NOT_FOUND: задача не найдена или доступ запрещён'
      using errcode = 'P0003';
  end if;
end;
$$;

comment on function public.change_task_status is
  'Единственная точка смены статуса задачи. Передаёт комментарий в сессионную переменную перед UPDATE.';
