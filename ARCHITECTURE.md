# ARCHITECTURE.md

## Стек

| Компонент | Технология |
|---|---|
| Язык | Ruby 3.3 |
| Фреймворк | Rails 8.1.2 (API-only) |
| БД | PostgreSQL 16 |
| Файлы | Active Storage (локально / S3 в production) |
| Фоновые задачи | Solid Queue |
| Кэш | Solid Cache |
| JSON | jbuilder |
| Контейнеры | Docker + Docker Compose |

## Запуск

```bash
docker compose up -d
docker compose exec web rails db:create db:migrate
docker compose exec web rails s -b 0.0.0.0
```

## Переменные окружения (`.env`)

| Переменная | Описание |
|---|---|
| `POSTGRES_USER` | Пользователь БД |
| `POSTGRES_PASSWORD` | Пароль БД |
| `POSTGRES_DB` | Имя БД |
| `RAILS_ENV` | Окружение (`development` / `production`) |
| `PORT_EXTERNAL` | Внешний порт приложения |

## Структура директорий

```
app/
  controllers/    # API-контроллеры, наследуются от ApplicationController < ActionController::API
  models/         # ActiveRecord модели
  jobs/           # Фоновые задачи (Solid Queue)
  mailers/        # Почтовые рассыльщики
  views/          # Только jbuilder-шаблоны (.json.jbuilder)
config/
  environments/   # development.rb, production.rb
  initializers/   # content_security_policy, filter_parameter_logging, inflections
  database.yml    # Конфиг БД, все значения из ENV
  storage.yml     # Конфиг Active Storage
  routes.rb       # Маршруты API
```

## Паттерны API

Все контроллеры наследуются от `ApplicationController < ActionController::API`.
Маршруты группируются по версиям: `namespace :api { namespace :v1 { ... } }`.
JSON-ответы формируются через jbuilder-шаблоны в `app/views/`.

## Active Storage

В development файлы хранятся локально в `storage/`.
В production — настроить S3-совместимое хранилище в `config/storage.yml` и `config/environments/production.rb`.

## Фоновые задачи

Solid Queue хранит очереди в PostgreSQL (отдельная БД `*_queue` в production).
Задачи создаются через `MyJob.perform_later(...)`, наследуются от `ApplicationJob < ActiveJob::Base`.
