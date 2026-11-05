-- ============================================================
-- Migration 001: Initial Schema
-- Mini-CRM "Объекты и задачи" для строительной компании
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────
create type user_role as enum ('manager', 'executor');
create type task_status as enum ('new', 'in_progress', 'on_review', 'rework', 'accepted');

-- ─── profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'executor',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Профили пользователей. Роль меняется только вручную в Supabase Studio.';

-- ─── sites ────────────────────────────────────────────────
create table if not exists public.sites (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null default '',
  created_at  timestamptz not null default now(),
  created_by  uuid not null references public.profiles(id)
);

comment on table public.sites is 'Строительные объекты.';

-- ─── tasks ────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites(id) on delete cascade,
  title       text not null,
  description text not null default '',
  assignee_id uuid not null references public.profiles(id),
  status      task_status not null default 'new',
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tasks is 'Задачи на объектах. Переходы статусов только через триггер.';

-- ─── task_history ─────────────────────────────────────────
create table if not exists public.task_history (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  changed_by   uuid not null references public.profiles(id),
  changed_at   timestamptz not null default now(),
  from_status  task_status,          -- null for initial creation
  to_status    task_status not null,
  comment      text not null default ''
);

comment on table public.task_history is 'Аудит переходов статусов. Только вставка через security definer триггер.';
