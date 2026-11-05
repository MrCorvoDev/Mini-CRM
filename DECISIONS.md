# DECISIONS.md — Архитектурные решения и допущения

## 1. Стек и инфраструктура

### 1.1 Supabase Client — только anon key

**Решение:** Используются два клиента с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
- браузерный `createBrowserClient` в `src/shared/api/supabase.ts`;
- серверный `createServerClient` с `cookies()` в `src/shared/server-supabase/index.ts`.

`service_role` ключ **нигде не используется** во фронтенде.

**Обоснование:** ТЗ требует доступ только через anon key, а `@supabase/ssr` — корректную работу сессии в cookies между браузером, middleware и серверными компонентами. Вся безопасность — в RLS и триггерах.

**Почему серверный клиент вынесен в отдельный shared-слайс:** если экспортировать его из `src/shared/api/index.ts`, клиентские компоненты, импортирующие `supabase` из этого barrel-файла, начинают тянуть `next/headers` в клиентский бандл, и `next build` падает. Отдельный публичный слайс `@/shared/server-supabase` сохраняет правило FSD «импорт только через root index.ts» и не ломает границу сервер/клиент.

### 1.2 Redux удалён

**Решение:** `ReduxProvider` и `src/app/store/index.ts` удалены. Глобального клиентского состояния, которое не является серверными данными, в приложении нет.

**Обоснование:** Всё состояние — сессия и серверные данные — покрывается TanStack Query. Redux не использовался ни в одном компоненте, поэтому его удаление уменьшает бандл и убирает лишнюю зависимость.

### 1.3 pnpm-workspace.yaml удалён

**Решение:** Файл `pnpm-workspace.yaml` удалён.

**Обоснование:** Проект не является монорепозиторием, workspace-конфигурация не нужна.

### 1.4 Seed вынесен из миграций

**Решение:** `supabase/migrations/20260001000004_seed_dev.sql` удалён, тестовые данные перенесены в `supabase/seed.sql`. Новая миграция для имён участников получила версию `005`, потому что версия `004` уже могла быть записана в историю миграций существующего проекта.

**Обоснование:** Миграции применяются и в продакшене, а тестовые данные там недопустимы. Seed:
- не создаёт пользователей Auth (это делается вручную) и падает с понятной ошибкой, если их нет;
- создаёт задачи от имени менеджера и меняет статусы только через `change_task_status` под `auth.uid()` нужной роли;
- не делает прямых `INSERT` в `task_history` — история пишется триггерами.

### 1.5 shadcn/ui — не установлен в шаблоне

**Решение:** Написаны собственные UI-компоненты (`Button`, `Badge`, `Input`, `Select`, `Dialog`) поверх уже установленных зависимостей проекта (SCSS Modules, clsx). shadcn/ui не добавляется, т.к. требует Tailwind CSS, которого нет в стеке.

**Обоснование:** В проекте уже настроены SCSS Modules и собственная дизайн-система. Добавление Tailwind сломает конфигурацию. ТЗ разрешает «аналог» — используем нативные компоненты в том же стиле.

### 1.6 TanStack Query для data fetching

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
- `profiles`: `id = auth.uid()` (свой профиль), `get_user_role() = 'manager'` или профиль участника доступной задачи
- `sites`: роль менеджера или наличие задачи с этим site_id
- `tasks`: роль менеджера или `assignee_id = auth.uid()`
- `task_history`: через join с tasks

### 4.3 Баг 3: имена авторов и исполнителей — вариант B

**Решение:** Добавлена миграция `20260001000005_profiles_task_participants.sql`. SECURITY DEFINER-функция `is_task_participant(p_user_id)` возвращает `true`, только если пользователь связан с задачей, видимой `auth.uid()`:
- является её автором или исполнителем;
- либо оставил запись в истории этой задачи.

Политика `profiles_select_task_participants` разрешает SELECT такого профиля. Существующие политики не менялись. UPDATE/DELETE на `profiles` по-прежнему запрещены, INSERT остаётся только для триггера создания пользователя.

**Почему B, а не A:** вариант A через view с `security_invoker` потребовал бы переписать все join-запросы фронтенда на view и всё равно не дал бы роль участника для отображения «имя + роль» в истории. Вариант B точечно расширяет чтение только для связанных пользователей и не открывает профили всех пользователей.

**Что остаётся закрытым:** `profiles` не содержит email; UPDATE/DELETE запрещены RLS; `task_history` по-прежнему доступна только на SELECT; пароли и Auth-данные не покидают `auth.users`.

### 4.4 Bug 4: Next.js-предупреждения

- `data-scroll-behavior="smooth"` добавлен на `<html>`, потому что `scroll-behavior: smooth` задан в глобальных стилях.
- Для `sites`, `sites/[id]`, `tasks/[id]` и защищённого layout задан `export const instant = false`: маршруты используют cookies/params и не могут быть мгновенно предзагружены без блокировки. Это поддерживаемая опция Next 16.4 и не отключает кэширование данных TanStack Query.
- В защищённом layout перед созданием Supabase-клиента добавлен `await connection()`: auth-клиент читает `Date.now()` при загрузке сессии, поэтому layout должен рендериться на запросе, а не при prerender.
- `InvalidStateError: Transition was aborted ... Document hidden` связан с незавершённым View Transition при уходе со страницы. После исправления навигации/сессии (полная навигация и серверная проверка пользователя) причина устраняется; ошибка при переключении вкладки считается безвредной.

### 4.5 Вспомогательная функция get_user_role()

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
- `src/app/` — провайдеры, глобальные стили, шрифты
- `src/pages/` — страницы (login, sites, sites-detail, tasks-detail, my-tasks)
- `src/widgets/` — Navbar
- `src/entities/` — session, site, task (модели + хуки)
- `src/shared/` — api (браузерный Supabase), server-supabase (серверный Supabase), ui (компоненты), config, styles

---

## 7. Что не реализовано / ограничения

- **shadcn/ui**: Не установлен (конфликт с Tailwind). Используются кастомные компоненты в том же API-стиле.
- **Supabase CLI config.toml**: Файл `supabase/config.toml` предоставлен как шаблон. Создать проект и применить миграции должен разработчик вручную.
- **E2E тесты в браузере**: Не реализованы (требуют Playwright/Cypress). Вместо них — SQL-тесты через pgTAP или Node.js скрипт.
- **Реальный Supabase проект**: Не создаётся агентом (требует авторизации в браузере).
