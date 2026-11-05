-- ============================================================
-- Security Tests: supabase/tests/security_tests.sql
-- Run with: psql $DATABASE_URL -f supabase/tests/security_tests.sql
-- ============================================================
-- These tests use pgTAP if available, otherwise plain assertions.
-- To run against a live Supabase project:
--   psql "postgresql://postgres:[password]@[host]:5432/postgres" -f security_tests.sql
-- ============================================================

-- Set up pgTAP (install if available)
-- \i /usr/share/postgresql/pgtap.sql

-- ── Test helpers ──────────────────────────────────────────────────────────
create or replace function test.set_auth_uid(p_uid uuid)
  returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text,
    true);
$$;

-- ── Placeholder UUIDs (replace with real ones) ────────────────────────────
-- These match the seed. Replace before running.
do $$
declare
  MANAGER_ID  uuid := '00000000-0000-0000-0000-000000000001';
  EXEC1_ID    uuid := '00000000-0000-0000-0000-000000000002';
  EXEC2_ID    uuid := '00000000-0000-0000-0000-000000000003';

  v_count     int;
  v_raised    boolean;
begin
  raise notice '=== SECURITY TESTS START ===';

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 1: Executor A cannot read tasks of Executor B
  -- ────────────────────────────────────────────────────────────────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', EXEC1_ID::text)::text, true);

  select count(*) into v_count
  from public.tasks
  where assignee_id = EXEC2_ID;  -- should be 0 through RLS

  if v_count > 0 then
    raise exception 'FAIL TEST 1: Executor A can read executor B tasks (count=%)', v_count;
  else
    raise notice 'PASS TEST 1: Executor A cannot read executor B tasks';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 2: Executor cannot change title/description/assignee
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', EXEC1_ID::text)::text, true);

    update public.tasks
    set title = 'Hacked title'
    where assignee_id = EXEC1_ID
    limit 1;

    -- If we got here without error, the trigger should block it
    -- (trigger raises exception for field changes by executor)
  exception when others then
    if sqlerrm like '%FORBIDDEN%' or sqlerrm like '%исполнитель%' then
      v_raised := true;
    end if;
  end;

  if v_raised then
    raise notice 'PASS TEST 2: Executor blocked from changing title';
  else
    raise exception 'FAIL TEST 2: Executor was able to change title (or no task found)';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 3a: Executor cannot do on_review → accepted
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', EXEC2_ID::text)::text, true);

    -- Try to accept a task that is on_review (task3 from seed)
    perform public.change_task_status(
      (select id from public.tasks where status = 'on_review' and assignee_id = EXEC2_ID limit 1),
      'accepted',
      ''
    );
  exception when others then
    if sqlerrm like '%FORBIDDEN%' then
      v_raised := true;
    end if;
  end;

  if v_raised then
    raise notice 'PASS TEST 3a: Executor blocked from on_review→accepted';
  else
    raise exception 'FAIL TEST 3a: Executor was able to do on_review→accepted';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 3b: Manager cannot do new → accepted
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', MANAGER_ID::text)::text, true);

    perform public.change_task_status(
      (select id from public.tasks where status = 'new' limit 1),
      'accepted',
      ''
    );
  exception when others then
    if sqlerrm like '%FORBIDDEN%' or sqlerrm like '%недопустим%' then
      v_raised := true;
    end if;
  end;

  if v_raised then
    raise notice 'PASS TEST 3b: Manager blocked from new→accepted';
  else
    raise exception 'FAIL TEST 3b: Manager was able to do new→accepted';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 4: on_review → rework without comment is rejected
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', MANAGER_ID::text)::text, true);

    perform public.change_task_status(
      (select id from public.tasks where status = 'on_review' limit 1),
      'rework',
      ''   -- empty comment
    );
  exception when others then
    if sqlerrm like '%REQUIRED%' or sqlerrm like '%комментарий%' then
      v_raised := true;
    end if;
  end;

  if v_raised then
    raise notice 'PASS TEST 4: on_review→rework without comment rejected';
  else
    raise exception 'FAIL TEST 4: on_review→rework without comment was allowed';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 5a: Direct INSERT into task_history is rejected
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', MANAGER_ID::text)::text, true);

    insert into public.task_history (task_id, changed_by, to_status)
    values (
      (select id from public.tasks limit 1),
      MANAGER_ID,
      'accepted'
    );
  exception when others then
    -- RLS blocks INSERT (no policy)
    v_raised := true;
  end;

  if v_raised then
    raise notice 'PASS TEST 5a: Direct INSERT into task_history rejected';
  else
    raise exception 'FAIL TEST 5a: Direct INSERT into task_history was allowed';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 5b: Direct DELETE from task_history is rejected
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', MANAGER_ID::text)::text, true);

    delete from public.task_history where task_id in (select id from public.tasks limit 1);
  exception when others then
    v_raised := true;
  end;

  if v_raised then
    raise notice 'PASS TEST 5b: Direct DELETE from task_history rejected';
  else
    raise exception 'FAIL TEST 5b: Direct DELETE from task_history was allowed';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 6a: Executor cannot create a task
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', EXEC1_ID::text)::text, true);

    insert into public.tasks (site_id, title, assignee_id, status, created_by)
    values (
      (select id from public.sites limit 1),
      'Hacked task',
      EXEC2_ID,
      'new',
      EXEC1_ID
    );
  exception when others then
    v_raised := true;
  end;

  if v_raised then
    raise notice 'PASS TEST 6a: Executor blocked from creating task';
  else
    raise exception 'FAIL TEST 6a: Executor was able to create a task';
  end if;

  -- ────────────────────────────────────────────────────────────────────────
  -- TEST 6b: Executor cannot change role in profiles
  -- ────────────────────────────────────────────────────────────────────────
  v_raised := false;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', EXEC1_ID::text)::text, true);

    update public.profiles set role = 'manager' where id = EXEC1_ID;
    -- There is no UPDATE policy for profiles → should fail
  exception when others then
    v_raised := true;
  end;

  if v_raised then
    raise notice 'PASS TEST 6b: Executor blocked from changing role';
  else
    raise exception 'FAIL TEST 6b: Executor was able to change their role';
  end if;

  raise notice '=== ALL SECURITY TESTS PASSED ===';
end;
$$;
