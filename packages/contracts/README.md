# Контракты

Здесь хранятся версионированные схемы внешнего API и манифеста релиза. Изменения API должны оставаться совместимыми с поддерживаемыми версиями desktop-клиента.

## Вход из IDE

Публичный base URL — `https://triplecode.ru`. IDE открывает
`GET /desktop/start` в системном браузере с `code_challenge_method=S256`,
`code_challenge` (SHA-256 от verifier, base64url) и случайным `state`.
Verifier и state — 32 случайных байта в base64url без дополнения. Если браузер
уже авторизован, grant создаётся сразу и callback идёт без email-кода.
Иначе браузер запрашивает и подтверждает email. После подтверждения он
показывает ссылку `triplecode://triplecode.triplecode-mvp/auth/callback?code=…&state=…`.
Callback фиксирован. Ссылка содержит одноразовый grant на две минуты.

JSON POST `/api/desktop/exchange` принимает `{code, verifier, label?}` и
возвращает `{access_token, refresh_token, expires_in, email, session_id}`.
Неподходящий verifier не расходует grant. Удачный обмен расходует его
атомарно и регистрирует сессию устройства. `label` — необязательная короткая
строка для показа в кабинете (имя устройства). POST `/api/desktop/refresh`
принимает `{refresh_token, session_id?}` и возвращает ту же схему сессии;
при переданном `session_id` обновляет время активности и сохранённый
refresh-токен. POST `/api/desktop/logout` принимает `{access_token,
session_id?}`, завершает сессию устройства и возвращает `{signed_out: true}`.
Ответ 401 означает недействительный grant или сессию. Остальные ошибки можно
повторить с учётом срока действия grant и состояния сессии.

Сессии устройств перечислены в `desktop_sessions` той же SQLite-базы:
id, email, зашифрованный refresh-токен, метка, даты создания и активности,
`revoked_at`. Кабинет `/account/sessions` показывает их владельцу email и
позволяет отозвать: запись помечается revoked, а refresh-токен best-effort
завершается через Supabase. Поля `session_id` опциональны — старые клиенты
продолжают работать без регистрации сессии.

## События использования

POST `/api/usage/event` принимает Bearer access_token сессии устройства и
JSON `{feature, provider, model, duration_ms, outcome}`. `feature` —
`agent|plan|ask|rewrite|inline|other`, `outcome` — `ok|error|stopped`.
Сервер проверяет токен через Supabase Auth и пишет событие в
`usage_events` (email, время, функция, провайдер, модель, длительность,
результат). Это trust-based телеметрия для кабинета «Использование»,
не для биллинга. Ответ `{recorded: true}` или 401/400/404/503.

Токены IDE не записываются в браузерную сессию. Существующий веб-вход
продолжает выдавать веб-cookie. Для включения укажите `DESKTOP_GRANT_DB` в
приватном каталоге веб-контейнера. Его SQLite-база временная и предназначена
для одного экземпляра веб-сервера. В ней сохраняются хеш кода и зашифрованный
grant. Перезапуск с потерей базы требует начать незавершённый вход заново.
