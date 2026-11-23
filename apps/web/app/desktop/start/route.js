import { randomUUID } from 'node:crypto';
import { desktopSecret, createGrant } from '../../../../api/desktop-grants.mjs';
import { desktopEnabled, setDesktopRequest } from '@/lib/desktop';
import { auth, loginRedirect, getUser } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const challenge = params.get('code_challenge');
  const state = params.get('state');
  if (!desktopEnabled() || !auth.configured || params.get('code_challenge_method') !== 'S256'
    || !desktopSecret.test(challenge) || !desktopSecret.test(state)) {
    return new Response('Не удалось начать вход из TripleCode. Повторите вход в IDE.', {
      status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const jar = await cookies();
  const accessToken = jar.get('access')?.value || jar.get('__Host-tc-access')?.value || jar.get('tc-access')?.value;
  const refreshToken = jar.get('refresh')?.value || jar.get('__Host-tc-refresh')?.value || jar.get('tc-refresh')?.value;
  const existingUser = await getUser(accessToken).catch(() => null);
  if (existingUser?.email && refreshToken) {
    try {
      const refreshResult = await auth.refresh(refreshToken);
      const session = {
        access_token: refreshResult.access_token,
        refresh_token: refreshResult.refresh_token,
        expires_in: refreshResult.expires_in,
        email: refreshResult.user?.email || existingUser.email,
      };
      const code = createGrant(challenge, state, session);
      const callbackUrl = 'triplecode://triplecode.triplecode-mvp/auth/callback?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state);
      return new Response('Redirecting to TripleCode', { status: 303, headers: { Location: callbackUrl, 'Cache-Control': 'no-store' } });
    } catch {
      // fall through to email flow
    }
  }
  const desktop = randomUUID();
  const response = loginRedirect({ desktop });
  response.headers.set('Referrer-Policy', 'no-referrer');
  setDesktopRequest(response, desktop, { challenge, state });
  return response;
}
