# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Правила работы

- Отвечай и пиши текстовые файлы (описания, инструкции, документацию) на русском языке. Исключения — английские термины, пути к файлам, технические термины.
- Перед реализацией задачи всегда изучай `CLAUDE.md`, `MEMORY.md`, `ARCHITECTURE.md`.
- После выполнения задачи обновляй `MEMORY.md`.

## Концепция проекта

**Itzli** — система управления задачами и проектами уровня Redmine/Jira. API-бэкенд на Rails, фронтенд пишется отдельно.

## Окружение

Контейнер `web` всегда запущен. Все команды выполняются через `docker compose exec web`:

```bash
docker compose exec web rails db:create db:migrate
docker compose exec web rails db:migrate
docker compose exec web rails db:rollback
docker compose exec web rails generate migration ...
docker compose exec web rails routes
docker compose exec web rails c
```

Переменные окружения — в `.env`. Тесты в проекте отсутствуют.

## Архитектура

- **API-only** (`config.api_only = true`), `ApplicationController < ActionController::API`
- Два окружения: `development` и `production`
- **Active Storage** — файлы, локальный диск в development
- **Solid Queue** — фоновые задачи (без Redis)
- **Solid Cache** — кэширование (без Redis)
- JSON-ответы через `jbuilder`
- Секреты через `.env`, credentials не используются
