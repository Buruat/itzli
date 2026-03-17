# sentry-webhook — автоматический фикс ошибок через Claude

## Что это

Сервис, который автоматически создаёт Pull Request с исправлением при появлении новой ошибки в Sentry.

**Полный цикл без участия человека:**

```
Новая ошибка в Sentry
    │
    │  POST /webhook/sentry (HMAC-подпись)
    ▼
sentry-webhook (Node.js/Express, порт 4567)
    │  немедленно отвечает 200 OK
    │  запускает claude -p в фоне от пользователя claudebot
    ▼
Claude CLI (bypassPermissions)
    │  делегирует субагенту проекта
    ▼
Claude subagent (.claude/agents/<project-agent>.md)
    │  Sentry MCP  → get_issue, list_issue_events (стектрейс, контекст)
    │  Glob/Grep   → находит проблемный файл
    │  Read        → читает код вокруг ошибки
    │  Edit        → вносит минимальное исправление
    │  Bash        → git checkout -b fix/sentry-{id}
    │  Bash        → git commit, git push
    │  Bash        → gh pr create
    ▼
Pull Request на GitHub со ссылкой на Sentry issue
```

---

## Архитектура

### Файлы сервиса

```
docker/sentry-webhook/
├── Dockerfile        — образ на debian:bookworm-slim, nodejs, gh CLI, claude CLI
├── entrypoint.sh     — настройка git, копирование credentials, запуск сервера
├── server.js         — Express-сервер, обработка webhook
├── package.json      — зависимость: express
└── README.md         — этот файл

.mcp.json             — конфигурация Sentry MCP-сервера (корень проекта)
.claude/agents/       — субагенты Claude (по одному на проект)
```

### docker-compose.yml

```yaml
sentry-webhook:
  build:
    context: .
    dockerfile: docker/sentry-webhook/Dockerfile
  ports:
    - "4567:4567"
  volumes:
    - .:/app                              # репозиторий проекта
    - ${HOME}/.claude:/root/.claude:rw    # Claude OAuth credentials с хоста
    - ${HOME}/.claude.json:/root/.claude.json:rw
    - claudebot_home:/home/claudebot      # сохраняет логин между rebuild
  env_file:
    - .env
  restart: unless-stopped
```

**Почему `claudebot_home` как named volume:** при `docker compose up --build` образ пересобирается, но home-директория пользователя claudebot сохраняется. Это позволяет не делать `claude auth login` после каждого rebuild.

### Переменные окружения (.env)

```
SENTRY_AUTH_TOKEN=       # sentry.io → Settings → Auth Tokens
                         # нужные скоупы: project:read, event:read

SENTRY_WEBHOOK_SECRET=   # секрет из настроек webhook в Sentry
                         # если не задан — проверка подписи пропускается

GITHUB_TOKEN=            # github.com → Settings → Developer Settings
                         # → Personal access tokens → classic
                         # нужный скоуп: repo (полный доступ)
```

### server.js — как работает обработчик

1. Получает POST от Sentry
2. Проверяет HMAC-подпись через `sentry-hook-signature` (если задан `SENTRY_WEBHOOK_SECRET`)
3. Фильтрует: обрабатывает только `action === "created"` (новые issues)
4. Сразу отвечает `{"ok": true}` — Sentry не ждёт результата
5. В `setImmediate` (асинхронно) пишет промпт во временный `.sh` файл
6. Запускает `su -l claudebot -c "bash /tmp/claude-fix-{id}.sh"`

**Почему промпт через временный файл, а не аргумент командной строки:**
Промпт содержит переносы строк и специальные символы. При передаче через `-c "claude -p \"...\""` двойные кавычки из JSON.stringify конфликтуют с кавычками shell-команды. Временный `.sh` файл решает проблему экранирования полностью.

**Почему `claudebot`, а не root:**
Claude CLI запрещает флаг `--permission-mode bypassPermissions` при запуске от root — это защита от случайного запуска деструктивных команд без подтверждения. Пользователь `claudebot` создаётся в Dockerfile.

### entrypoint.sh — что происходит при старте контейнера

1. Настраивает git для root: `safe.directory`, имя, email, HTTPS-rewrite через `GITHUB_TOKEN`
2. Проверяет, залогинен ли claudebot (есть ли `~/.claude.json`). Если нет — копирует credentials с хоста (из `/root/.claude`). Если уже залогинен (volume сохранил) — не трогает
3. Настраивает git для claudebot (те же параметры через `su -l`)
4. Запускает `node /webhook/server.js`

### .mcp.json — Sentry MCP

```json
{
  "mcpServers": {
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${SENTRY_AUTH_TOKEN}"
      }
    }
  }
}
```

Официальный MCP-сервер Sentry даёт Claude доступ к инструментам:
- `get_issue` — полные данные об issue: заголовок, стектрейс, теги
- `list_issue_events` — конкретные события с переменными окружения и локальными переменными в момент ошибки

Это богаче, чем прямые REST-запросы: Claude видит контекст ошибки так же, как разработчик в интерфейсе Sentry.

### .claude/agents/<project>.md — субагент

Субагент — это специализированный Claude с контекстом конкретного проекта. Описывается в `.claude/agents/` в формате Markdown с frontmatter.

```markdown
---
name: claude-subagent-project
description: Что делает субагент (используется для выбора агента)
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

Контекст проекта: стек, структура, соглашения.
Алгоритм работы субагента...
```

Основной `claude -p` вызывает субагент через инструмент `Agent`. Субагент получает доступ к MCP-серверам из `.mcp.json` и инструментам из `tools`.

---

## Воспроизведение на другом проекте

### Шаг 1. Скопировать файлы сервиса

```bash
cp -r docker/sentry-webhook /path/to/new-project/docker/sentry-webhook
cp .mcp.json /path/to/new-project/.mcp.json
```

### Шаг 2. Добавить сервис в docker-compose.yml

```yaml
services:
  sentry-webhook:
    build:
      context: .
      dockerfile: docker/sentry-webhook/Dockerfile
    ports:
      - "4567:4567"
    volumes:
      - .:/app
      - ${HOME}/.claude:/root/.claude:rw
      - ${HOME}/.claude.json:/root/.claude.json:rw
      - claudebot_home:/home/claudebot
    env_file:
      - .env
    restart: unless-stopped

volumes:
  claudebot_home:
```

### Шаг 3. Добавить переменные в .env

```
SENTRY_AUTH_TOKEN=sntryu_...
SENTRY_WEBHOOK_SECRET=           # опционально
GITHUB_TOKEN=ghp_...             # classic PAT, scope: repo
```

Где взять токены:
- `SENTRY_AUTH_TOKEN`: sentry.io → Settings → Auth Tokens → Create New Token (скоупы: `project:read`, `event:read`)
- `GITHUB_TOKEN`: github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate (скоуп: `repo`)

### Шаг 4. Создать субагент проекта

Создать файл `.claude/agents/<project-name>.md`:

```markdown
---
name: claude-subagent-<project-name>
description: Исправляет ошибки <стек> проекта <название>.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

Ты исправляешь ошибки в проекте <название>.

Стек: <язык, фреймворк, БД>.
Репозиторий смонтирован в /app.

Когда получаешь задачу с Sentry issue ID:
1. Используй Sentry MCP чтобы получить детали ошибки (get_issue, list_issue_events)
2. Изучи проблемный код через Read/Glob/Grep
3. git checkout -b fix/sentry-{id}
4. Внеси минимальное точечное исправление
5. git add -A && git commit -m "fix: {title} (Sentry #{id})"
6. git push origin fix/sentry-{id}
7. gh pr create --title "fix: {title}" --body "Fixes Sentry issue: {url}"
```

**Чем подробнее описан контекст проекта — тем точнее исправления.** Укажи: соглашения по именованию, структуру директорий, особенности архитектуры, что нельзя трогать.

### Шаг 5. Обновить имя субагента в server.js

В `docker/sentry-webhook/server.js` заменить имя субагента в промпте:

```javascript
const prompt = `Use the claude-subagent-<project-name> agent to fix Sentry issue.
Issue ID: ${issueId}
Issue URL: ${issueUrl}
Check that branch fix/sentry-${issueId} does not already exist before starting.`;
```

### Шаг 6. Собрать и запустить

```bash
docker compose build sentry-webhook
docker compose up -d sentry-webhook
```

### Шаг 7. Авторизовать Claude внутри контейнера

```bash
docker compose exec -it --user claudebot sentry-webhook claude auth login
```

Откроется ссылка — перейди в браузере, авторизуйся, вставь полученный код в терминал.

Проверка:
```bash
docker compose exec --user claudebot sentry-webhook claude -p "say hi"
```

**Важно:** авторизация сохраняется в named volume `claudebot_home` и переживает `docker compose up --build`. Повторять логин после rebuild не нужно.

### Шаг 8. Настроить публичный URL

Для разработки — ngrok:
```bash
brew install ngrok
ngrok config add-authtoken <токен с ngrok.com>
ngrok http 4567
```

Для production — настроить reverse proxy (nginx/caddy) с доменом.

### Шаг 9. Настроить webhook в Sentry

Sentry → Settings → Integrations → Webhooks → Add webhook:
- **URL**: `https://<ngrok-или-домен>/webhook/sentry`
- **Events**: `issue`
- Сохранить

### Шаг 10. Проверить

```bash
# Локальный тест (без Sentry)
curl -X POST http://localhost:4567/webhook/sentry \
  -H "Content-Type: application/json" \
  -d '{"action":"created","data":{"issue":{"id":"TEST-1","permalink":"https://sentry.io/issues/TEST-1"}}}'

# Логи
docker compose logs -f sentry-webhook
```

При успехе в логах появится вывод Claude, на GitHub — новый PR.

---

## Известные нюансы

**macOS Keychain**: Claude хранит OAuth-токен в системном Keychain macOS, а не в `~/.claude.json`. Поэтому монтирование `~/.claude.json` с хоста не даёт авторизацию в Linux-контейнере — нужен ручной `claude auth login` внутри (один раз).

**bypassPermissions и root**: флаг `--permission-mode bypassPermissions` намеренно заблокирован в Claude CLI для root-пользователя. Если убрать `su -l claudebot` и запускать от root — Claude будет запрашивать подтверждение на каждое действие интерактивно, что в фоновом режиме невозможно.

**Одновременные ошибки**: если Sentry пришлёт несколько webhook подряд, запустится несколько процессов Claude параллельно. При работе с одним репозиторием возможны конфликты веток. Для production стоит добавить очередь задач.

**GITHUB_TOKEN должен быть classic PAT**: fine-grained PAT по умолчанию не имеет прав на push. Нужен classic PAT со скоупом `repo`.
