# Локальный запуск TripleCode на Mac mini

Ведущая роль — инженер релизов. Приёмка включает запуск контейнера сайта,
доступ к нему с рабочей машины и регистрацию с одноразовым кодом из Mailpit.
Для следующего этапа, с публичным доменом и внешней доставкой писем,
используйте отдельную конфигурацию.

## Запуск на Mac mini

Нужны запущенный Docker Desktop с Compose, Supabase CLI 3.3+ и копия репозитория.
Выполните из корня репозитория:

```sh
docker network inspect triplecode-local >/dev/null 2>&1 ||
  docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 triplecode-local
supabase --workdir apps/api start --network-id triplecode-local
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Проверьте, что опубликованные порты контейнеров этого Supabase привязаны к
`127.0.0.1`. Если CLI или Docker публикует служебный порт на всех интерфейсах,
остановите этот экземпляр и исправьте привязку до начала регистрации.
Получите publishable key из вывода Supabase. Если CLI показывает только anon
key, подходит этот ключ.

Создайте на Mac mini файл `.env.docker` с правами владельца. Он игнорируется Git.

```dotenv
APP_ORIGIN=http://localhost:3000
WEB_BIND_IP=127.0.0.1
WEB_PORT=3000
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_PUBLISHABLE_KEY=
```

Заполните ключ и запустите контейнер:

```sh
docker compose --env-file .env.docker up --build -d --wait
docker compose --env-file .env.docker ps
```

Если сайт нужен непосредственно по LAN, укажите LAN-IP Mac mini в
`WEB_BIND_IP` и адрес вида `http://<LAN-IP>:3000` в `APP_ORIGIN`.
В этом режиме используйте тестовые адреса и доверенную локальную сеть.
Для доступа через обратный прокси оставьте порт сайта на loopback и укажите
полный HTTPS-адрес в `APP_ORIGIN`.

## Проверка с рабочей машины

При привязке сайта к loopback пробросьте порт сайта и Mailpit по SSH:

```sh
ssh -N -L 3000:127.0.0.1:3000 -L 54324:127.0.0.1:54324 user@mac-mini.local
```

Если сайт опубликован по LAN, нужен только второй проброс.
Откройте сайт по адресу из `APP_ORIGIN`, запросите код для нового тестового
адреса и откройте Mailpit на `http://localhost:54324`. Введите код из письма,
сверьте email в профиле и выйдите. Повторите вход с тем же адресом после
интервала повторной отправки. Mailpit перехватывает письма для теста.

## Домен и внешняя почта

Для `triplecode.tripleform.ru` согласуйте HTTPS и доступность сайта. Для
внутреннего использования подойдёт локальный DNS с записью на LAN-IP Mac mini.
Для публичного сайта нужны публичная точка входа или туннель, сертификат HTTPS,
постоянный self-hosted Supabase и SMTP с настроенным доменом отправителя.
В публичный доступ выводится веб-приложение через HTTPS. Порты Mailpit,
Postgres и административного интерфейса остаются служебными.

## Вариант для изолированной проверки Auth

Если образы полного Supabase CLI недоступны, `compose.auth.yaml` добавляет к
сайту Supabase Auth, Postgres, внутренний шлюз и Mailpit. Используйте этот
вариант с отдельной базой и тестовыми адресами. Studio и другие API в этот
набор не входят. Не запускайте его одновременно с CLI на том же порту Mailpit.

В `.env.docker` для этого варианта укажите
`SUPABASE_URL=http://auth-gateway:8080`. Установите три независимых случайных
значения через `openssl rand -hex 32` для `AUTH_DB_PASSWORD`,
`AUTH_JWT_SECRET` и `SUPABASE_PUBLISHABLE_KEY`. Последний требуется веб-серверу
для настройки клиента. Внутренний шлюз доступен только контейнерам этой
Compose-сети и не публикует порт на Mac mini. После инициализации тома
сохраните тот же пароль БД при перезапусках.

```sh
docker compose --env-file .env.docker -f compose.yaml -f compose.auth.yaml up --build -d --wait
python3 deploy/lan/check-otp.py http://192.168.1.14:3000
```

Если базовый Node.js-образ недоступен, но уже есть `nginx:1.28.0-alpine`,
соберите веб-образ через `docker build -t triplecode-web-web -f deploy/lan/Dockerfile .`
и запустите предыдущую команду Compose с `--no-build --pull never` вместо
`--build`. Мониторинг сквозного теста выполняется на Mac mini, поскольку
Mailpit опубликован на loopback. Проверка создаёт аккаунт на уникальный
синтетический адрес в домене `example.test`.

При ручной замене контейнера Auth перезапустите и внутренний nginx-шлюз,
чтобы он обновил адрес Auth в сети Compose.
