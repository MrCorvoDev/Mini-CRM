-- ============================================================
-- Migration 005: Allow reading profiles of task participants
-- Version 004 was the former dev seed migration. The seed was moved to
-- supabase/seed.sql, so this new migration uses version 005 to ensure it is
-- applied on existing projects that already recorded version 004.
-- ============================================================
-- Проблема (Баг 3): Исполнитель видит "—" в поле "Автор" и в истории
-- статусов у записей менеджера, так как RLS на profiles разрешает
-- читать только свой профиль (id = auth.uid()) или всё для manager.
--
-- Решение (Вариант B): SECURITY DEFINER функция is_task_participant,
-- которая проверяет, связан ли пользователь с задачами текущего пользователя
-- (как создатель, исполнитель или автор изменения в истории задачи).
--
-- Политика "profiles_select_task_participants" разрешает SELECT профиля
-- только если пользователь является участником задачи, доступной auth.uid().
-- Политики UPDATE/DELETE/INSERT остаются закрытыми.
-- ============================================================

create or replace function public.is_task_participant(p_user_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.tasks t
    where (t.assignee_id = auth.uid() or t.created_by = auth.uid())
      and (t.created_by = p_user_id or t.assignee_id = p_user_id)
    union all
    select 1
    from public.task_history h
    join public.tasks t on t.id = h.task_id
    where (t.assignee_id = auth.uid() or t.created_by = auth.uid())
      and (h.changed_by = p_user_id)
  );
$$;

create policy "profiles_select_task_participants"
  on public.profiles
  for select
  using (public.is_task_participant(id));
