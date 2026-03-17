# Itzli

Система управления задачами и проектами. API-бэкенд на Rails 8, фронтенд отдельно.

## Запуск в development

```bash
docker compose up -d
docker compose exec web rails s -b 0.0.0.0        # бэкенд
docker compose exec web sh -c "cd /app/frontend && npm run dev"  # фронтенд
```

---

## Автоматический фикс ошибок через Claude + Sentry

Система автоматически получает новые ошибки из Sentry, запускает Claude для анализа и исправления кода, и создаёт Pull Request в GitHub — без участия разработчика.

### Схема работы

```
Sentry (новая ошибка)
  → POST /webhooks/sentry
  → WebhooksController
  → SentryFixJob (Sidekiq)
  → claude -p (от имени claudebot)
  → claude-subagent-itzli (агент)
  → Sentry MCP (детали ошибки)
  → git worktree (изолированная ветка)
  → git push + gh pr create
  → Pull Request на GitHub
```

Рабочая директория `/app` всё время остаётся на ветке `main`.

---

### Компоненты

#### 1. Webhook endpoint
**Файл:** `app/controllers/webhooks_controller.rb`
**В контейнере:** `/app/app/controllers/webhooks_controller.rb`

Принимает POST-запросы от Sentry. Проверяет HMAC-подпись (если задан `SENTRY_WEBHOOK_SECRET`). Реагирует только на события `action == "created"`. Извлекает `issue.id` и `issue.permalink` и передаёт в очередь.

#### 2. Фоновая задача
**Файл:** `app/jobs/sentry_fix_job.rb`
**В контейнере:** `/app/app/jobs/sentry_fix_job.rb`

Выполняется в Sidekiq. Создаёт временный shell-скрипт `/tmp/claude-fix-{issue_id}.sh` и запускает `claude -p` от имени пользователя `claudebot` с промптом на фикс. После выполнения удаляет скрипт.

Запускает Claude с флагами:
- `--allowedTools Read,Write,Edit,Bash,Glob,Grep,Agent` — разрешённые инструменты
- `--permission-mode bypassPermissions` — автономный режим без подтверждений (запрещён для root, поэтому нужен `claudebot`)

#### 3. Агент
**Файл:** `.claude/agents/claude-subagent-itzli.md`
**В контейнере:** `/app/.claude/agents/claude-subagent-itzli.md`
**На хосте:** `<project_root>/.claude/agents/claude-subagent-itzli.md`

Системный промпт специализированного агента. Получает задачу с Sentry issue ID и выполняет:
1. Запрашивает детали ошибки через Sentry MCP (`get_issue`, `list_issue_events`)
2. Изучает проблемный код в `/app`
3. Создаёт изолированный `git worktree` во временной директории `/tmp/fix-sentry-{id}`
4. Вносит минимальное исправление
5. Коммитит, пушит ветку, создаёт PR через `gh`
6. Удаляет worktree — `/app` остаётся на `main`

#### 4. Sentry MCP
**Файл:** `.mcp.json`
**В контейнере:** `/app/.mcp.json`
**На хосте:** `<project_root>/.mcp.json`

Подключает официальный Sentry MCP сервер (`https://mcp.sentry.dev/mcp`). Позволяет агенту читать детали ошибок, стектрейсы и события прямо из Sentry API. Авторизация через `SENTRY_AUTH_TOKEN`.

Активирован через `.claude/settings.local.json` (`<project_root>/.claude/settings.local.json`).

#### 5. Пользователь `claudebot`
**Файлы:** `Dockerfile`, `docker-entrypoint.sh`
**На хосте:** `<project_root>/Dockerfile`, `<project_root>/docker-entrypoint.sh`
**Home в контейнере:** `/home/claudebot` (volume `claudebot_home`)
**Конфиг Claude в контейнере:** `/home/claudebot/.claude`, `/home/claudebot/.claude.json`

Claude Code запрещает режим `bypassPermissions` для root. Поэтому в контейнере создаётся отдельный пользователь `claudebot`.

`docker-entrypoint.sh` при старте контейнера копирует `~/.claude` и `~/.claude.json` из root (смонтированы с хоста) в `/home/claudebot`, настраивает git. Это даёт `claudebot` те же учётные данные Claude, что и у разработчика на хосте.

Авторизация Claude берётся с хоста:
- **Хост:** `~/.claude/` и `~/.claude.json`
- **Контейнер (root):** `/root/.claude/` и `/root/.claude.json` (volume mount)
- **Контейнер (claudebot):** `/home/claudebot/.claude/` и `/home/claudebot/.claude.json` (копируется при старте)

#### 6. Инфраструктура
**Файл:** `docker-compose.yml`
**На хосте:** `<project_root>/docker-compose.yml`

| Сервис | Роль |
|--------|------|
| `web` | Rails API, принимает webhook |
| `sidekiq` | Воркер очереди, запускает Claude |
| `redis` | Брокер очереди для Sidekiq |
| `db` | PostgreSQL |

Оба сервиса `web` и `sidekiq` монтируют:
- `.:/app` — код проекта (хост `<project_root>/` → контейнер `/app`)
- `${HOME}/.claude:/root/.claude` — авторизация Claude с хоста
- `${HOME}/.claude.json:/root/.claude.json` — конфиг Claude с хоста
- `claudebot_home:/home/claudebot` — постоянный home для claudebot между перезапусками

#### 7. Маршрут
**Файл:** `config/routes.rb`
**В контейнере:** `/app/config/routes.rb`

```ruby
post "webhooks/sentry", to: "webhooks#sentry"
```

#### 8. Конфиг очереди
**Файлы:** `config/initializers/sidekiq.rb`, `config/application.rb`
**В контейнере:** `/app/config/initializers/sidekiq.rb`, `/app/config/application.rb`

Подключение Sidekiq к Redis и указание адаптера Active Job.

---

### Переменные окружения (`.env`)

| Переменная | Описание |
|-----------|----------|
| `GITHUB_TOKEN` | Personal Access Token GitHub (scope: `repo`) |
| `SENTRY_AUTH_TOKEN` | Auth Token Sentry (scopes: `project:read`, `event:read`) |
| `SENTRY_ORG` | Slug организации Sentry |
| `SENTRY_PROJECT` | Числовой ID проекта Sentry |
| `SENTRY_WEBHOOK_SECRET` | Секрет для проверки подписи webhook (опционально) |
| `REDIS_URL` | `redis://redis:6379/0` |

---

### Настройка в Sentry

1. **Settings → Integrations → Webhooks** (или **Service Hooks** в настройках проекта)
2. URL: `https://<your-domain>/webhooks/sentry`
3. Событие: **Issue** → **Created**
4. Сохранить

---

### Адаптация для другого проекта

1. Скопировать файлы:
   - `app/controllers/webhooks_controller.rb`
   - `app/jobs/sentry_fix_job.rb`
   - `.claude/agents/<project-agent>.md`
   - `.mcp.json`
2. Добавить маршрут в `routes.rb`: `post "webhooks/sentry", to: "webhooks#sentry"`
3. В `Dockerfile`: добавить установку `gh` CLI, `@anthropic-ai/claude-code`, создание пользователя `claudebot`
4. В `docker-entrypoint.sh`: добавить копирование `~/.claude` в `/home/claudebot`
5. В `docker-compose.yml`: добавить сервис `sidekiq`, `redis`, volumes для `~/.claude`
6. Обновить системный промпт агента под стек и особенности проекта
7. Добавить переменные окружения и зарегистрировать webhook в Sentry
