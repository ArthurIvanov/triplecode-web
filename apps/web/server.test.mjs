import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return 'http://127.0.0.1:' + server.address().port;
}

async function startNext(t, env) {
  const reservation = createServer();
  const url = await listen(reservation);
  const port = String(reservation.address().port);
  await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', 'apps/web', '--hostname', '127.0.0.1', '--port', port], {
    env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  const deadline = Date.now() + 15_000;
  while (child.exitCode === null && Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return url;
    } catch {
      // Next.js may still be starting.
    }
    await setTimeout(100);
  }
  throw new Error('Next.js did not start: ' + output);
}

test('Next.js serves email OTP, protected profile, refresh and logout', async t => {
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
        if (data.refresh_token === 'invalid-access') return json({ ...session, access_token: 'invalid' });
        return data.refresh_token === 'refresh' ? json(session) : json({}, 401);
      case '/auth/v1/logout?scope=local':
        return res.writeHead(204).end();
      default:
        return json({}, 404);
    }
  });
  t.after(() => upstream.close());
  const origin = 'https://triplecode.example';
  const url = await startNext(t, {
    APP_ORIGIN: origin,
    SUPABASE_URL: await listen(upstream),
    SUPABASE_PUBLISHABLE_KEY: 'test-key',
  });
  const get = (path, headers) => fetch(url + path, { headers, redirect: 'manual' });
  const post = (path, fields, headers = {}) => fetch(url + path, {
    method: 'POST', redirect: 'manual', body: new URLSearchParams(fields), headers: { Origin: origin, ...headers },
  });
  const location = response => new URL(response.headers.get('location'), origin).href.slice(origin.length);
  const jar = (response, excluded = '') => response.headers.getSetCookie()
    .filter(cookie => !excluded || !cookie.startsWith(excluded))
    .map(cookie => cookie.split(';')[0]).join('; ');

  assert.match(await (await get('/')).text(), /Создать аккаунт/);
  assert.equal(location(await get('/account')), '/login');
  assert.equal((await post('/auth/code', { email }, { Origin: 'https://other.example' })).status, 403);
  assert.equal(location(await post('/auth/code', { email: 'invalid' })), '/login?error=email');
  assert.equal(calls.length, 0);

  const challengeResponse = await post('/auth/code', { email });
  const challengePath = location(challengeResponse);
  const flow = new URL(challengePath, origin).searchParams.get('flow');
  assert.match(flow, /^[a-f0-9-]{36}$/);
  assert.match(await (await get(challengePath, { Cookie: jar(challengeResponse) })).text(), /Введите код/);
  assert.deepEqual(calls[0].data, { email, create_user: true });

  const secondEmail = 'second@example.test';
  const secondChallenge = await post('/auth/code', { email: secondEmail });
  const challenge = { Cookie: [jar(challengeResponse), jar(secondChallenge)].join('; ') };
  assert.match(await (await get(challengePath, challenge)).text(), /developer@example\.test/);
  assert.match(await (await get(location(secondChallenge), challenge)).text(), /second@example\.test/);
  assert.equal(location(await post('/auth/verify', { token: '111111', flow }, challenge)), challengePath + '&error=code');
  assert.equal(location(await post('/auth/code', { flow }, challenge)), challengePath);
  assert.equal(calls.at(-1).data.email, email);

  const verified = await post('/auth/verify', { token: '123456', flow }, challenge);
  assert.equal(location(verified), '/account');
  assert.equal(calls.at(-1).data.email, email);
  const cookies = verified.headers.getSetCookie();
  assert.equal(cookies.length, 3);
  assert.ok(cookies.every(cookie => /HttpOnly/.test(cookie) && /SameSite=lax/i.test(cookie) && /Secure/.test(cookie)));
  const sessionCookie = { Cookie: jar(verified, '__Host-tc-challenge-') };
  const profile = await get('/account', sessionCookie);
  assert.match(profile.headers.get('cache-control'), /no-store/);
  assert.match(await profile.text(), /developer@example\.test/);

  const refreshCookie = { Cookie: '__Host-tc-refresh=refresh' };
  assert.equal(location(await get('/account', refreshCookie)), '/auth/session');
  const refreshed = await get('/auth/session', refreshCookie);
  assert.equal(location(refreshed), '/account');
  assert.equal(refreshed.headers.getSetCookie().length, 2);
  assert.equal((await get('/account', { Cookie: jar(refreshed) })).status, 200);

  const rejectedRefresh = await get('/auth/session', { Cookie: '__Host-tc-refresh=invalid-access' });
  assert.equal(location(rejectedRefresh), '/login?error=expired');
  assert.ok(rejectedRefresh.headers.getSetCookie().every(cookie => cookie.includes('Max-Age=0')));

  const loggedOut = await post('/auth/logout', {}, sessionCookie);
  assert.equal(location(loggedOut), '/login');
  assert.ok(loggedOut.headers.getSetCookie().every(cookie => cookie.includes('Max-Age=0')));
  assert.equal(calls.at(-1).authorization, 'Bearer access');
  assert.equal(location(await get('/account')), '/login');
  const returning = await post('/auth/code', { email });
  const returningFlow = new URL(location(returning), origin).searchParams.get('flow');
  assert.equal(location(await post('/auth/verify', { token: '123456', flow: returningFlow }, { Cookie: jar(returning) })), '/account');
});
