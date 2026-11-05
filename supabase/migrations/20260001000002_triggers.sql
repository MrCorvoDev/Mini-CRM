-- ============================================================
-- Migration 003: Triggers
-- ============================================================

-- ─── 1. Auto-create profile on signup ─────────────────────
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'executor'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. Auto-update updated_at on tasks ───────────────────
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─── 3. BEFORE trigger: validate status transition ────────
create or replace function public.validate_task_status_transition()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_catalog
as $$
declare
  v_role         user_role;
  v_uid          uuid;
  v_comment      text;
  v_from_status  task_status;
  v_to_status    task_status;
begin
  v_uid  := auth.uid();
  v_role := public.get_user_role();

  -- ── INSERT (task creation): only manager, only status = new ──────────────
  if TG_OP = 'INSERT' then
    if v_role <> 'manager' then
      raise exception 'FORBIDDEN: только менеджер может создавать задачи'
        using errcode = 'P0001';
    end if;

    if NEW.status <> 'new' then
      raise exception 'FORBIDDEN: новая задача должна иметь статус new'
        using errcode = 'P0001';
    end if;

    -- Verify assignee is an executor
    if not exists (
      select 1 from public.profiles
      where id = NEW.assignee_id and role = 'executor'
    ) then
      raise exception 'FORBIDDEN: исполнитель должен иметь роль executor'
        using errcode = 'P0001';
    end if;

    -- Set created_by to current user
    NEW.created_by := v_uid;
    return NEW;
  end if;

  -- ── UPDATE ────────────────────────────────────────────────────────────────
  v_from_status := OLD.status;
  v_to_status   := NEW.status;

  -- Executor: may ONLY change status (block other field changes)
  if v_role = 'executor' then
    if NEW.title       <> OLD.title       or
       NEW.description <> OLD.description or
       NEW.assignee_id <> OLD.assignee_id or
       NEW.site_id     <> OLD.site_id     or
       NEW.created_by  <> OLD.created_by  then
      raise exception 'FORBIDDEN: исполнитель может менять только статус'
        using errcode = 'P0001';
    end if;
  end if;

  -- If status is not changing, skip transition checks
  if v_from_status = v_to_status then
    return NEW;
  end if;

  -- Retrieve comment from session variable (set by change_task_status RPC)
  v_comment := current_setting('app.task_comment', true);

  -- ── Validate allowed transitions ─────────────────────────────────────────
  -- (creation) → new : handled above in INSERT branch
  -- new → in_progress : only assignee (executor)
  -- in_progress → on_review : only assignee (executor)
  -- on_review → accepted : only manager
  -- on_review → rework : only manager, comment required
  -- rework → in_progress : only assignee (executor)

  case
    when v_from_status = 'new' and v_to_status = 'in_progress' then
      if v_role <> 'executor' or v_uid <> OLD.assignee_id then
        raise exception 'FORBIDDEN: только назначенный исполнитель переводит new→in_progress'
          using errcode = 'P0001';
      end if;

    when v_from_status = 'in_progress' and v_to_status = 'on_review' then
      if v_role <> 'executor' or v_uid <> OLD.assignee_id then
        raise exception 'FORBIDDEN: только назначенный исполнитель переводит in_progress→on_review'
          using errcode = 'P0001';
      end if;

    when v_from_status = 'on_review' and v_to_status = 'accepted' then
      if v_role <> 'manager' then
        raise exception 'FORBIDDEN: только менеджер переводит on_review→accepted'
          using errcode = 'P0001';
      end if;

    when v_from_status = 'on_review' and v_to_status = 'rework' then
      if v_role <> 'manager' then
        raise exception 'FORBIDDEN: только менеджер переводит on_review→rework'
          using errcode = 'P0001';
      end if;
      if v_comment is null or trim(v_comment) = '' then
        raise exception 'REQUIRED: комментарий обязателен при on_review→rework'
          using errcode = 'P0002';
      end if;

    when v_from_status = 'rework' and v_to_status = 'in_progress' then
      if v_role <> 'executor' or v_uid <> OLD.assignee_id then
        raise exception 'FORBIDDEN: только назначенный исполнитель переводит rework→in_progress'
          using errcode = 'P0001';
      end if;

    else
      raise exception 'FORBIDDEN: переход % → % недопустим',
        v_from_status::text, v_to_status::text
        using errcode = 'P0001';
  end case;

  return NEW;
end;
$$;

create or replace trigger tasks_validate_status_transition
  before insert or update on public.tasks
  for each row execute function public.validate_task_status_transition();

-- ─── 4. AFTER trigger: record history (SECURITY DEFINER) ──
create or replace function public.record_task_history()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_catalog
as $$
declare
  v_comment text;
begin
  -- Record history on:
  -- INSERT (task creation): from_status = NULL, to_status = 'new'
  -- UPDATE with status change
  if TG_OP = 'INSERT' then
    insert into public.task_history
      (task_id, changed_by, from_status, to_status, comment)
    values
      (NEW.id, auth.uid(), null, NEW.status, '');
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and NEW.status <> OLD.status then
    v_comment := coalesce(nullif(trim(current_setting('app.task_comment', true)), ''), '');

    insert into public.task_history
      (task_id, changed_by, from_status, to_status, comment)
    values
      (NEW.id, auth.uid(), OLD.status, NEW.status, v_comment);

    -- Reset session variable after use
    perform set_config('app.task_comment', '', true);
  end if;

  return NEW;
end;
$$;

create or replace trigger tasks_record_history
  after insert or update on public.tasks
  for each row execute function public.record_task_history();
