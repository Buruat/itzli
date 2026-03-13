# MEMORY.md

Список изменений, внесённых в проект.

## Инициализация проекта

- Создан Rails 8.1.2 API-only проект (`config.api_only = true`)
- Настроен Docker: `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`
- Удалены: линтеры (rubocop, brakeman, bundler-audit), Kamal, Hotwire, Propshaft, тесты
- Удалены окружения: `test`
- Настроен `database.yml` — credentials из `.env`
- Созданы: `CLAUDE.md`, `MEMORY.md`, `ARCHITECTURE.md`

## Модели

- `Project` — поля: `id` (uuid), `name` (string, not null, unique), `deleted_at`, `timestamps`; подключён `acts_as_paranoid` (gem `paranoia`); валидации: presence и uniqueness на `name`

## API

- `GET    /api/v1/projects` — список проектов
- `POST   /api/v1/projects` — создать проект
- `GET    /api/v1/projects/:id` — получить проект
- `PATCH  /api/v1/projects/:id` — обновить проект
- `DELETE /api/v1/projects/:id` — удалить проект (soft delete через paranoia)

## Модель Task

- Поля: `id` (uuid), `name`, `description`, `task_type` (enum: bug/task), `project_id` (uuid, optional), `time_spent`, `estimated_time`, `deadline_date`, `deleted_at`, `timestamps`
- `belongs_to :project, optional: true`; soft delete через `acts_as_paranoid`
- Валидации: presence и uniqueness на `name`, presence на `task_type`

## API ответы

- Коллекция: `{ projects: [...] }` / `{ tasks: [...] }`
- Ресурс: `{ project: {...} }` / `{ task: {...} }`
- Create/Update: `{ errors: { field: ["msg"] } }` — всегда возвращает 201 (create) или 200 (update), пустой errors = успех
- Delete: HTTP 200, пустое тело

## Фронтенд

- Стек: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + react-router-dom 6
- Расположение: `frontend/` внутри репо
- Запуск: `docker compose exec web sh -c "cd /app/frontend && npm run dev"`
- Порт: 5173 (проксирует `/api` → `http://localhost:3000`)
- `node_modules` устанавливаются через `docker compose exec web npm install --prefix /app/frontend`
- Порт 5173 пробрасывается в `docker-compose.yml`

## Соглашения

- Все primary key — UUID (`pgcrypto`); настроено глобально в `config/application.rb` через generators
