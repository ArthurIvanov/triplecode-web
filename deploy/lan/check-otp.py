import argparse
import html
import http.cookiejar
import json
import re
import time
import urllib.parse
import urllib.request
import uuid

parser = argparse.ArgumentParser(description='Check TripleCode signup against the LAN Mailpit instance')
parser.add_argument('origin', help='Website origin, as configured in APP_ORIGIN')
parser.add_argument('--mailpit', default='http://127.0.0.1:54324')
args = parser.parse_args()
origin = args.origin.rstrip('/')
mailpit = args.mailpit.rstrip('/')
email = 'triplecode-lan-' + uuid.uuid4().hex[:10] + '@example.test'
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def request(path, data=None):
    form = urllib.parse.urlencode(data).encode() if data is not None else None
    headers = {'Origin': origin} if data is not None else {}
    with client.open(urllib.request.Request(origin + path, data=form, headers=headers), timeout=15) as response:
        return urllib.parse.urlparse(response.geturl()), response.read().decode()

def mail(path):
    with urllib.request.urlopen(mailpit + path, timeout=5) as response:
        return json.load(response)

path, page = request('/account')
assert path.path == '/login', 'Guest access did not redirect'
path, page = request('/auth/code', {'email': email})
flow = urllib.parse.parse_qs(path.query).get('flow', [None])[0]
assert flow and 'Проверьте почту' in page, 'Code request did not reach confirmation form: ' + path.path + '?' + path.query
for attempt in range(20):
    messages = mail('/api/v1/messages').get('messages', [])
    message = next((m for m in messages if any((r.get('Address') or '').lower() == email for r in m.get('To', []))), None)
    if message:
        break
    time.sleep(1)
else:
    raise RuntimeError('Mailpit did not receive the registration message')
body = mail('/api/v1/message/' + message['ID'])
contents = html.unescape(body.get('Text', '') + ' ' + body.get('HTML', ''))
match = re.search(r'(?<!\d)(\d{6})(?!\d)', contents)
assert match, 'Registration email does not contain a six-digit code'
token = match.group(1)
wrong = '000000' if token != '000000' else '111111'
path, page = request('/auth/verify', {'flow': flow, 'token': wrong})
assert 'Код неверный или истёк' in page, 'Wrong code not rejected'
path, page = request('/auth/verify', {'flow': flow, 'token': token})
assert path.path == '/account' and email in page and 'Подтверждённый email' in page, 'Verified account did not render: ' + path.path
path, page = request('/auth/logout', {})
assert path.path == '/login'
path, page = request('/account')
assert path.path == '/login', 'Profile still accessible after logout'
print('PASS: request → real Mailpit email → incorrect code rejected → confirmed profile → logout → guest blocked')
