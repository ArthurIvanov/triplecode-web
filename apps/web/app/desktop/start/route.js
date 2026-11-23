import { randomUUID } from 'node:crypto';
import { desktopSecret } from '../../../../api/desktop-grants.mjs';
import { desktopEnabled, setDesktopRequest } from '@/lib/desktop';
import { auth, loginRedirect } from '@/lib/session';

export function GET(request) {
  const params = request.nextUrl.searchParams;
  const challenge = params.get('code_challenge');
  const state = params.get('state');
  if (!desktopEnabled() || !auth.configured || params.get('code_challenge_method') !== 'S256'
    || !desktopSecret.test(challenge) || !desktopSecret.test(state)) {
    return new Response('Не удалось начать вход из TripleCode. Повторите вход в IDE.', {
      status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const desktop = randomUUID();
  const response = loginRedirect({ desktop });
  response.headers.set('Referrer-Policy', 'no-referrer');
  setDesktopRequest(response, desktop, { challenge, state });
  return response;
}
