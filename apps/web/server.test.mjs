import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createAuth } from '../api/auth.mjs';
import { createWebServer } from './server.mjs';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return 'http://127.0.0.1:' + server.address().port;
}

test('email OTP, protected profile, refresh and logout through HTTP endpoints', async t => {
  const email = 'developer@example.test';
  const calls = [];
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    calls.push({ path: req.url, data, authorization: req.headers.authorization });
    const json = (value, status = 200) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
    const session = { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { email } };

    switch (req.url) {
      case '/auth/v1/otp':
        return json({});
      case '/auth/v1/verify':
        return data.token === '123456' ? json(session) : json({}, 403);
      case '/auth/v1/user':
        return req.headers.authorization === 'Bearer access' ? json({ email }) : json({}, 401);
      case '/auth/v1/token?grant_type=refresh_token':
        return data.refresh_token === 'refresh' ? json(session) : json({}, 401);
      case '/auth/v1/logout?scope=local':
        return res.writeHead(204).end();
      default:
        return json({}, 404);
    }
  });
  t.after(() => upstream.close());
  const auth = createAuth({ url: await listen(upstream), key: 'test-key' });
  const origin = 'https://triplecode.example';
  const web = createWebServer({ origin, auth });
  t.after(() => web.close());
  const url = await listen(web);
  const get = (path, headers) => fetch(url + path, { headers, redirect: 'manual' });
  const post = (path, fields, headers = {}) => fetch(url + path, {
    method: 'POST', redirect: 'manual', body: new URLSearchParams(fields), headers: { Origin: origin, ...headers },
  });

  assert.match(await (await get('/')).text(), /Создать аккаунт/);
  assert.equal((await get('/styles.css')).status, 200);
  assert.equal((await get('/account')).headers.get('location'), '/login');
  assert.equal((await post('/auth/code', { email }, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post('/auth/code', { email: 'invalid' })).status, 400);
  assert.equal(calls.length, 0);

  assert.match(await (await post('/auth/code', { email })).text(), /Введите код/);
  assert.deepEqual(calls[0].data, { email, create_user: true });
  assert.equal((await post('/auth/verify', { email, token: '111111' })).status, 400);
  assert.match(await (await post('/auth/code', { email })).text(), /Введите код/);

  const verified = await post('/auth/verify', { email, token: '123456' });
  assert.equal(verified.headers.get('location'), '/account');
  const cookies = verified.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every(cookie => /HttpOnly; SameSite=Lax;.*Secure/.test(cookie)));
  const sessionCookie = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  const profile = await get('/account', { Cookie: sessionCookie });
  assert.equal(profile.headers.get('cache-control'), 'no-store');
  assert.match(await profile.text(), /developer@example\.test/);

  const refreshed = await get('/account', { Cookie: '__Host-tc-refresh=refresh' });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.headers.getSetCookie().length, 2);
  const loggedOut = await post('/auth/logout', {}, { Cookie: sessionCookie });
  assert.equal(loggedOut.headers.get('location'), '/login');
  assert.ok(loggedOut.headers.getSetCookie().every(cookie => cookie.includes('Max-Age=0')));
  assert.equal(calls.at(-1).authorization, 'Bearer access');
  assert.equal((await get('/account')).headers.get('location'), '/login');
  assert.equal((await post('/auth/code', { email })).status, 200);
  assert.equal((await post('/auth/verify', { email, token: '123456' })).headers.get('location'), '/account');
});
