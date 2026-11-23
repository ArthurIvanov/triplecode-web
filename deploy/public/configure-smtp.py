from getpass import getpass
from pathlib import Path
from secrets import token_hex
import os
import re

root = Path(__file__).resolve().parents[2]
settings = root / '.env.production'
secret = root / '.env.smtp-password'

email = input('SMTP-ящик [noreply@triplecode.ru]: ').strip() or 'noreply@triplecode.ru'
if not re.fullmatch(r'[A-Za-z0-9._+-]+@triplecode\.ru', email):
    raise SystemExit('Укажите адрес отправителя на triplecode.ru.')
password = getpass('Пароль SMTP-ящика: ')
if not password or '\n' in password or '\r' in password:
    raise SystemExit('Требуется непустой пароль в одну строку.')

os.umask(0o077)
values = {}
if settings.exists():
    values = dict(line.split('=', 1) for line in settings.read_text().splitlines() if line and not line.startswith('#'))
values['APP_ORIGIN'] = 'https://triplecode.ru'
values.setdefault('AUTH_DB_PASSWORD', token_hex(32))
values.setdefault('AUTH_JWT_SECRET', token_hex(32))
values.setdefault('SUPABASE_PUBLISHABLE_KEY', token_hex(32))
values['TRIPLECODE_SMTP_EMAIL'] = email

for path, text in [(settings, ''.join(f'{key}={value}\n' for key, value in values.items())), (secret, password)]:
    temporary = path.with_suffix(path.suffix + '.tmp')
    with temporary.open('x') as output:
        output.write(text)
    temporary.replace(path)

print('Настройки отправителя сохранены на Mac mini.')
