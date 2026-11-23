import { desktopSecret, exchangeGrant } from '../../../../../api/desktop-grants.mjs';
import { recordSession, touchSession, dropSession, sessionRefreshToken, sessionIdPattern } from '../../../../../api/desktop-sessions.mjs';
import { desktopEnabled } from '@/lib/desktop';
import { auth, getUser, isInvalid } from '@/lib/session';

function reply(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (!desktopEnabled() || !auth.configured || !['exchange', 'refresh', 'logout'].includes(action)) {
    return reply({ error: 'unavailable' }, 404);
  }
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) {
    return reply({ error: 'invalid_request' }, 400);
  }
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        return reply({ error: 'invalid_request' }, 400);
      }
      chunks.push(value);
    }
    const fields = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!fields || typeof fields !== 'object') return reply({ error: 'invalid_request' }, 400);
    if (action === 'exchange') {
      if (typeof fields.code !== 'string' || typeof fields.verifier !== 'string'
        || !desktopSecret.test(fields.code) || !desktopSecret.test(fields.verifier)) {
        return reply({ error: 'invalid_request' }, 400);
      }
      const session = exchangeGrant(fields.code, fields.verifier);
      if (!session) return reply({ error: 'invalid_grant' }, 401);
      const label = typeof fields.label === 'string' ? fields.label.slice(0, 120) : null;
      const sessionId = recordSession(session.email, session, label);
      return reply({ ...session, session_id: sessionId });
    }
    if (action === 'refresh' && typeof fields.refresh_token === 'string' && fields.refresh_token) {
      const session = await auth.refresh(fields.refresh_token);
      if (sessionIdPattern.test(fields.session_id || '')) touchSession(fields.session_id, session.refresh_token);
      return reply({
        access_token: session.access_token, refresh_token: session.refresh_token,
        expires_in: session.expires_in, email: session.user?.email,
      });
    }
    if (action === 'logout' && typeof fields.access_token === 'string' && fields.access_token) {
      if (!(await getUser(fields.access_token))) return reply({ error: 'invalid_session' }, 401);
      await auth.logout(fields.access_token);
      if (sessionIdPattern.test(fields.session_id || '')) dropSession(fields.session_id);
      return reply({ signed_out: true });
    }
    return reply({ error: 'invalid_request' }, 400);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ error: 'invalid_request' }, 400);
    if (isInvalid(error)) return reply({ error: 'invalid_session' }, 401);
    return reply({ error: 'unavailable' }, 503);
  } finally {
    reader.releaseLock();
  }
}
