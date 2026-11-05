-- ============================================================
-- supabase/seed.sql — ТОЛЬКО ДЛЯ DEV
-- ============================================================
-- Предусловия:
--   1. Пользователи созданы в Supabase Auth вручную:
--      manager@example.com, executor1@example.com, executor2@example.com
--   2. Миграции 0000–0003 применены.
--
-- Скрипт удаляет существующие задачи и объекты (ТОЛЬКО dev!),
-- затем создаёт тестовые данные через change_task_status.
-- История пишется триггерами, прямых insert в task_history нет.
-- ============================================================

do $$
declare
  v_manager uuid := 'c5311212-4fc5-4920-b62b-67f5b2155cff';
  v_exec1   uuid := 'c42d4d33-49c4-4f60-be7f-5b5257b99c62';
  v_exec2   uuid := '9c44f91b-9337-4381-9eab-126211746839';

  v_site_north  uuid;
  v_site_center uuid;
  v_site_store  uuid;
  v_task        uuid;
begin
  -- ── 0. Профили (выполняется от postgres, RLS не мешает) ───────────────
  update public.profiles set full_name = 'Иван Менеджеров', role = 'manager'
    where id = v_manager;
  update public.profiles set full_name = 'Пётр Исполнитель', role = 'executor'
    where id = v_exec1;
  update public.profiles set full_name = 'Мария Строитель', role = 'executor'
    where id = v_exec2;

  -- ── 1. Очистка (dev only) ──────────────────────────────────────────────
  delete from public.tasks;
  delete from public.sites;

  -- ── 2. Объекты: создаёт менеджер ───────────────────────────────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.sites (name, address, created_by)
    values ('ЖК «Северный»', 'ул. Северная, 15', v_manager)
    returning id into v_site_north;
  insert into public.sites (name, address, created_by)
    values ('БЦ «Центральный»', 'пр. Ленина, 42', v_manager)
    returning id into v_site_center;
  insert into public.sites (name, address, created_by)
    values ('Склад №3', 'ул. Промышленная, 7', v_manager)
    returning id into v_site_store;

  -- ── 3. Задача: «Залить фундамент секции А» → new ───────────────────────
  insert into public.tasks (site_id, title, description, assignee_id, status)
    values (v_site_north, 'Залить фундамент секции А',
            'Подготовить опалубку и залить бетон марки М300.',
            v_exec1, 'new');

  -- ── 4. Задача: «Монтаж кровли» → in_progress ───────────────────────────
  insert into public.tasks (site_id, title, description, assignee_id, status)
    values (v_site_north, 'Монтаж кровли',
            'Установить стропильную систему и покрыть профнастилом.',
            v_exec1, 'new')
    returning id into v_task;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');

  -- ── 5. Задача: «Прокладка электрики этаж 2» → on_review ───────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  insert into public.tasks (site_id, title, description, assignee_id, status)
    values (v_site_center, 'Прокладка электрики этаж 2',
            'Проложить кабель ВВГнг 3×2.5 по трассам согласно плану.',
            v_exec2, 'new')
    returning id into v_task;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');

  -- ── 6. Задача: «Штукатурка стен холла» → rework ───────────────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  insert into public.tasks (site_id, title, description, assignee_id, status)
    values (v_site_center, 'Штукатурка стен холла',
            'Выровнять стены под маяки, штукатурка цементно-песчаная.',
            v_exec2, 'new')
    returning id into v_task;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework',
    'Не соответствует ровность, переделать секции 3–7.');

  -- ── 7. Задача: «Установка стеллажей» → accepted ───────────────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  insert into public.tasks (site_id, title, description, assignee_id, status)
    values (v_site_store, 'Установка стеллажей',
            'Смонтировать металлические стеллажи согласно проекту.',
            v_exec1, 'new')
    returning id into v_task;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'accepted', '');

  -- ── 8. Задача: «Залить фундамент» остаётся в new (см. п. 3) ──────────

  raise notice 'Seed готов: 3 объекта, 5 задач.';
end;
$$;

-- Проверка (запускается отдельно)
select s.name as site, t.title, t.status,
       (select count(*) from public.task_history h where h.task_id = t.id) as history_rows
from public.tasks t
join public.sites s on s.id = t.site_id
order by s.name, t.title;
