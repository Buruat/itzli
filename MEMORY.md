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

- `Project` — поля: `id` (uuid), `name` (string, not null, unique), `description` (text), `deleted_at`, `timestamps`; подключён `acts_as_paranoid` (gem `paranoia`); `has_one_attached :image` (Active Storage); валидации: presence и uniqueness на `name`

## API

- `GET    /api/v1/projects` — список проектов
- `POST   /api/v1/projects` — создать проект (multipart/form-data, поддерживает image)
- `GET    /api/v1/projects/:id` — получить проект (возвращает description, image_url)
- `PATCH  /api/v1/projects/:id` — обновить проект (multipart/form-data)
- `DELETE /api/v1/projects/:id` — удалить проект (soft delete через paranoia)
- `GET    /api/v1/tasks?project_id=:id` — задачи фильтруются по project_id

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
- Порт: 5173 (проксирует `/api` и `/rails` → `http://localhost:3000`)
- `node_modules` устанавливаются через `docker compose exec web npm install --prefix /app/frontend`
- Порт 5173 пробрасывается в `docker-compose.yml`
- Страницы: ProjectsPage, ProjectShowPage (`/projects/:id`), ProjectFormPage, TasksPage, TaskFormPage
- Загрузка файлов через FormData (postFormData/patchFormData в api/client.ts)

## Аутентификация и авторизация

- Gems: `bcrypt`, `pundit`
- Модель `User` — поля: `id` (uuid), `username` (string, not null, unique), `phone` (string, not null, unique), `password_digest` (has_secure_password); `has_one_attached :photo`; `has_many :sessions`
- Модель `Session` — поля: `id` (uuid), `user_id`, `token` (unique, генерируется в `before_create`), `ip_address`, `user_agent`
- Модель `Current < ActiveSupport::CurrentAttributes` — атрибут `session`, делегирует `user`
- Concern `Authentication` — Bearer token из заголовка `Authorization`, `before_action :require_authentication` в ApplicationController
- Pundit: `ApplicationPolicy` (все действия разрешены авторизованным), `ProjectPolicy`, `TaskPolicy` наследуют ApplicationPolicy
- API auth маршруты: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `DELETE /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Контроллеры auth в `app/controllers/api/v1/auth/`
- Все существующие контроллеры (projects, tasks) защищены `require_authentication` + `authorize` через Pundit
- Фронтенд: `AuthContext` + `AuthProvider` (хранит user, token в localStorage), `PrivateRoute`/`PublicRoute` в App.tsx
- Страницы: `LoginPage` (`/login`), `RegisterPage` (`/register`) — вход по phone + password
- Layout содержит username пользователя + кнопку выхода

## Соглашения

- Все primary key — UUID (`pgcrypto`); настроено глобально в `config/application.rb` через generators
