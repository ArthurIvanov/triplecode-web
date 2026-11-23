import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { AuthError, createAuth } from '../api/auth.mjs';
import { homePage, loginPage, profilePage, statusPage } from './pages.mjs';

const stylesheet = new URL('./public/styles.css', import.meta.url);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isInvalid = error => error instanceof AuthError && [400, 401, 403, 422].includes(error.status);

async function readForm(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') return null;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) return null;
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

export function createWebServer({ origin, auth }) {
  const secure = new URL(origin).protocol === 'https:';
  const prefix = secure ? '__Host-tc-' : 'tc-';
  const access = prefix + 'access';
  const refresh = prefix + 'refresh';
  const cookie = (name, value, maxAge) =>
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

  function saveSession(res, session) {
    res.setHeader('Set-Cookie', [
      cookie(access, session.access_token, session.expires_in),
      cookie(refresh, session.refresh_token, 7 * 86400),
    ]);
  }

  function clearSession(res) {
    res.setHeader('Set-Cookie', [cookie(access, '', 0), cookie(refresh, '', 0)]);
  }

  async function activeSession(req, res) {
    const cookies = new Map((req.headers.cookie ?? '').split(';').map(pair => {
      const [name, value] = pair.trim().split('=');
      return [name, value];
    }));
    const accessToken = cookies.get(access);
    if (accessToken) {
      try {
        return { user: await auth.user(accessToken), accessToken };
      } catch (error) {
        if (!isInvalid(error)) throw error;
      }
    }
    const refreshToken = cookies.get(refresh);
    if (refreshToken) {
      try {
        const session = await auth.refresh(refreshToken);
        saveSession(res, session);
        return { user: session.user, accessToken: session.access_token };
      } catch (error) {
        if (!isInvalid(error)) throw error;
      }
    }
    if (accessToken || refreshToken) clearSession(res);
    return null;
  }

  return createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');
    const html = (body, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
    };
    const redirect = location => res.writeHead(303, { Location: location }).end();
    const unavailable = () => html(statusPage('Сервис временно недоступен', 'Попробуйте ещё раз через несколько минут.', '/login', 'Вернуться ко входу'), 503);

    try {
      const path = new URL(req.url, origin).pathname;
      if (req.method === 'GET') {
        if (path === '/styles.css') {
          const styles = await readFile(stylesheet);
          res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
          return res.end(styles);
        }
        if (path === '/') return html(homePage());
        if (path === '/login') return html(loginPage({ configured: auth.configured }));
        if (path === '/account') {
          const session = await activeSession(req, res);
          return session?.user?.email ? html(profilePage(session.user.email)) : redirect('/login');
        }
      }

      if (req.method === 'POST' && ['/auth/code', '/auth/verify', '/auth/logout'].includes(path)) {
        if (req.headers.origin !== origin) {
          return html(statusPage('Запрос отклонён', 'Откройте форму входа и повторите действие.', '/login', 'К форме входа'), 403);
        }
        if (!auth.configured) return unavailable();
        if (path === '/auth/logout') {
          const session = await activeSession(req, res);
          if (session) {
            try {
              await auth.logout(session.accessToken);
            } catch (error) {
              if (!isInvalid(error)) throw error;
            }
          }
          clearSession(res);
          return redirect('/login');
        }

        const form = await readForm(req);
        const email = form?.get('email')?.trim().toLowerCase() ?? '';
        if (!emailPattern.test(email) || email.length > 254) {
          return html(loginPage({ error: 'Введите корректный email.' }), 400);
        }

        if (path === '/auth/code') {
          try {
            await auth.sendCode(email);
          } catch (error) {
            if (error.status === 429) {
              return html(loginPage({ email, step: 'code', error: 'Подождите минуту перед повторной отправкой.' }), 429);
            }
            if (isInvalid(error)) {
              return html(loginPage({ email, error: 'Не удалось отправить код. Проверьте email и попробуйте снова.' }), 400);
            }
            throw error;
          }
          return html(loginPage({ email, step: 'code' }));
        }

        const token = form.get('token') ?? '';
        const invalidCode = () => html(loginPage({ email, step: 'code', error: 'Код неверный или истёк. Проверьте письмо или запросите новый код.' }), 400);
        if (!/^[0-9]{6}$/.test(token)) return invalidCode();
        try {
          saveSession(res, await auth.verifyCode(email, token));
        } catch (error) {
          if (isInvalid(error)) return invalidCode();
          if (error.status === 429) {
            return html(loginPage({ email, step: 'code', error: 'Слишком много попыток. Попробуйте позже.' }), 429);
          }
          throw error;
        }
        return redirect('/account');
      }

      return html(statusPage('Страница не найдена', 'Проверьте адрес или вернитесь на главную.'), 404);
    } catch {
      return unavailable();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const origin = new URL(process.env.APP_ORIGIN || `http://localhost:${port}`).origin;
  const host = process.env.HOST || '127.0.0.1';
  const auth = createAuth({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY });
  createWebServer({ origin, auth }).listen(port, host, () => console.log(`Local: ${origin}`));
}
