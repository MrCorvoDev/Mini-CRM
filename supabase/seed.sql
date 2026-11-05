-- ============================================================
-- supabase/seed.sql — ТОЛЬКО ДЛЯ DEV И ТЕСТОВОГО ОКРУЖЕНИЯ
-- ============================================================
-- Предусловия:
--   1. Пользователи созданы в Supabase Auth:
--      manager@example.com, executor1@example.com, executor2@example.com
--   2. Миграции применены.
--
-- Скрипт очищает dev-данные и наполняет базу через штатные механизмы:
--   - Объекты и задачи создаются под auth.uid() менеджера.
--   - Статусы меняются только через change_task_status под auth.uid()
--     соответствующей роли (исполнитель или менеджер).
--   - В task_history НЕТ прямых INSERT — история формируется
--     исключительно триггерами validate_task_status_transition и record_task_history.
-- ============================================================

do $$
declare
  v_manager uuid;
  v_exec1   uuid;
  v_exec2   uuid;

  v_site_north  uuid;
  v_site_center uuid;
  v_site_store  uuid;
  v_task        uuid;
begin
  -- ── 0. Определение UUID пользователей ───────────────────────
  -- Seed не создаёт пользователей Auth: они должны существовать заранее.
  select id into v_manager from auth.users where email = 'manager@example.com' limit 1;
  select id into v_exec1   from auth.users where email = 'executor1@example.com' limit 1;
  select id into v_exec2   from auth.users where email = 'executor2@example.com' limit 1;

  if v_manager is null or v_exec1 is null or v_exec2 is null then
    raise exception 'SEED: создайте пользователей manager@example.com, executor1@example.com и executor2@example.com в Supabase Auth перед запуском seed.sql';
  end if;

  -- ── 1. Профили (обновляем имена и роли) ──────────────────────
  insert into public.profiles (id, full_name, role)
    values (v_manager, 'Иван Менеджеров', 'manager')
    on conflict (id) do update set full_name = 'Иван Менеджеров', role = 'manager';

  insert into public.profiles (id, full_name, role)
    values (v_exec1, 'Пётр Исполнитель', 'executor')
    on conflict (id) do update set full_name = 'Пётр Исполнитель', role = 'executor';

  insert into public.profiles (id, full_name, role)
    values (v_exec2, 'Мария Строитель', 'executor')
    on conflict (id) do update set full_name = 'Мария Строитель', role = 'executor';

  -- ── 2. Очистка существующих задач и объектов (ТОЛЬКО dev!) ───
  delete from public.task_history;
  delete from public.tasks;
  delete from public.sites;

  -- ── 3. Создание объектов (под auth.uid() менеджера) ───────────
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

  -- ── 4. Задача 1: «Залить фундамент секции А» → статус new ───
  -- Создаётся менеджером в статусе new, триггер автоматически создаст запись в task_history
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.tasks (site_id, title, description, assignee_id, status, created_by)
    values (v_site_north, 'Залить фундамент секции А',
            'Подготовить опалубку и залить бетон марки М300.',
            v_exec1, 'new', v_manager);

  -- ── 5. Задача 2: «Монтаж кровли» → статус in_progress ────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.tasks (site_id, title, description, assignee_id, status, created_by)
    values (v_site_north, 'Монтаж кровли',
            'Установить стропильную систему и покрыть профнастилом.',
            v_exec1, 'new', v_manager)
    returning id into v_task;

  -- Исполнитель переводит в in_progress через RPC
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');

  -- ── 6. Задача 3: «Прокладка электрики этаж 2» → статус on_review ──
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.tasks (site_id, title, description, assignee_id, status, created_by)
    values (v_site_center, 'Прокладка электрики этаж 2',
            'Проложить кабель ВВГнг 3×2.5 по трассам согласно плану.',
            v_exec2, 'new', v_manager)
    returning id into v_task;

  -- Исполнитель переводит new → in_progress → on_review
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');

  -- ── 7. Задача 4: «Штукатурка стен холла» → статус rework ─────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.tasks (site_id, title, description, assignee_id, status, created_by)
    values (v_site_center, 'Штукатурка стен холла',
            'Выровнять стены под маяки, штукатурка цементно-песчаная.',
            v_exec2, 'new', v_manager)
    returning id into v_task;

  -- Исполнитель: new → in_progress → on_review
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec2, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');

  -- Менеджер: on_review → rework (комментарий обязателен)
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'rework',
    'Не соответствует ровность, переделать секции 3–7.');

  -- ── 8. Задача 5: «Установка стеллажей» → статус accepted ─────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);

  insert into public.tasks (site_id, title, description, assignee_id, status, created_by)
    values (v_site_store, 'Установка стеллажей',
            'Смонтировать металлические стеллажи согласно проекту.',
            v_exec1, 'new', v_manager)
    returning id into v_task;

  -- Исполнитель: new → in_progress → on_review
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_exec1, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'in_progress', '');
  perform public.change_task_status(v_task, 'on_review', '');

  -- Менеджер: on_review → accepted
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_manager, 'role', 'authenticated')::text, true);
  perform public.change_task_status(v_task, 'accepted', '');

  raise notice 'Seed успешно применён: 3 объекта, 5 задач в разных статусах.';
end;
$$;
