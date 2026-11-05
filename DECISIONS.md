# DECISIONS.md — Архитектурные решения и допущения

## 1. Стек и инфраструктура

### 1.1 Supabase Client — только anon key

**Решение:** Единственный Supabase-клиент создаётся в `src/shared/api/supabase.ts` с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `service_role` ключ **нигде не используется** во фронтенде.

**Обоснование:** ТЗ явно требует доступ только через anon key. Вся безопасность — в RLS и триггерах.

### 1.2 shadcn/ui — не установлен в шаблоне

**Решение:** Написаны собственные UI-компоненты (`Button`, `Badge`, `Input`, `Select`, `Dialog`) поверх уже установленных зависимостей проекта (SCSS Modules, clsx). shadcn/ui не добавляется, т.к. требует Tailwind CSS, которого нет в стеке.

**Обоснование:** В проекте уже настроены SCSS Modules и собственная дизайн-система. Добавление Tailwind сломает конфигурацию. ТЗ разрешает «аналог» — используем нативные компоненты в том же стиле.

### 1.3 TanStack Query для data fetching

**Решение:** Используется `@tanstack/react-query` (уже установлен в package.json). Supabase queries оборачиваются в `useQuery`/`useMutation`.

---

## 2. Модель данных

### 2.1 profiles — создаются вручную

**Решение:** Триггер на `auth.users` создаёт запись в `profiles` с пустым `full_name` и ролью `executor` по умолчанию. Администратор вручную меняет `full_name` и `role` через Supabase Studio.

**Обоснование:** ТЗ говорит «создаётся вручную (или триггером)». Триггер удобнее, т.к. гарантирует консистентность FK.

### 2.2 task_history.from_status = NULL для первой записи

**Решение:** При создании задачи `from_status = NULL`, `to_status = 'new'`. NULL означает «создание задачи».

**Обоснование:** ТЗ описывает `(создание) → new`, NULL логически точно отражает это.

### 2.3 Комментарий передаётся через RPC-функцию

**Решение:** Для смены статуса используется RPC `change_task_status(p_task_id, p_to_status, p_comment)`. Это позволяет передать comment в AFTER-триггер через `app.task_comment` (сессионная переменная).

**Обоснование:** PostgreSQL триггеры не принимают параметры напрямую. Сессионная переменная через `set_config` — стандартный PostgreSQL-паттерн.

### 2.4 updated_at обновляется триггером

**Решение:** Триггер `set_updated_at` на `tasks` автоматически обновляет `updated_at` при любом UPDATE.

---

## 3. Переходы статусов

### 3.1 BEFORE-триггер validate_task_status_transition

Проверяет:
1. Допустимость перехода из таблицы `allowed_transitions` (или CASE-выражения в триггере).
2. Роль пользователя (`auth.uid()` → `profiles.role`).
3. Для исполнителя: `auth.uid() = NEW.assignee_id`.
4. Для `on_review → rework`: непустой comment из `current_setting('app.task_comment', true)`.
5. Запрет на изменение полей `title`, `description`, `assignee_id`, `site_id` исполнителем.

### 3.2 AFTER-триггер record_task_history (SECURITY DEFINER)

Записывает в `task_history` запись после каждого изменения статуса. Использует `security definer` с `search_path = public, pg_catalog` чтобы исключить sql-инъекцию через search_path.

---

## 4. RLS

### 4.1 task_history — только SELECT, без INSERT/UPDATE/DELETE через API

**Решение:** Политики разрешают SELECT (менеджер — все, исполнитель — только свои задачи). Нет политик INSERT/UPDATE/DELETE — по умолчанию запрещено.

**Обоснование:** INSERT делает только SECURITY DEFINER триггер, который работает от имени владельца функции (superuser), минуя RLS.

### 4.2 `using (true)` не используется нигде

Все политики имеют конкретные условия:
- `profiles`: `id = auth.uid()` (свой профиль) или `get_user_role() = 'manager'`
- `sites`: роль менеджера или наличие задачи с этим site_id
- `tasks`: роль менеджера или `assignee_id = auth.uid()`
- `task_history`: через join с tasks

### 4.3 Вспомогательная функция get_user_role()

**Решение:** `get_user_role() returns user_role` — SECURITY DEFINER функция, кэшируется в рамках транзакции. Используется в политиках, чтобы не делать subquery к profiles на каждую строку.

---

## 5. Безопасность

### 5.1 Регистрация отключена

**Шаг для руководителя:** В Supabase Dashboard → Authentication → Providers → Email → отключить «Enable Email Signups». Или через `config.toml`: `enable_signup = false` при self-hosted.

### 5.2 .env.local в .gitignore

Файл `.gitignore` уже содержит `.env*`. В репозитории только `.env.example`.

### 5.3 Нет service_role в коде

Проверяется командой: `grep -r "service_role" src/ app/ --include="*.ts" --include="*.tsx"` — должна быть пустой.

---

## 6. FSD-структура

Используется Feature-Sliced Design v2.1:
- `src/app/` — провайдеры, store
- `src/pages/` — страницы (login, sites, sites-detail, tasks-detail, my-tasks)
- `src/entities/` — session, profile, site, task (модели + хуки)
- `src/features/` — auth, sites, tasks (пользовательские сценарии)
- `src/shared/` — api (supabase client), ui (компоненты), lib, config

---

## 7. Что не реализовано / ограничения

- **shadcn/ui**: Не установлен (конфликт с Tailwind). Используются кастомные компоненты в том же API-стиле.
- **Supabase CLI config.toml**: Файл `supabase/config.toml` предоставлен как шаблон. Создать проект и применить миграции должен разработчик вручную.
- **E2E тесты в браузере**: Не реализованы (требуют Playwright/Cypress). Вместо них — SQL-тесты через pgTAP или Node.js скрипт.
- **Реальный Supabase проект**: Не создаётся агентом (требует авторизации в браузере).
