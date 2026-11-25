import { recordUsage, recordPilotStep } from '../../../../../api/usage-events.mjs';
import { desktopEnabled } from '@/lib/desktop';
import { auth, getUser, isInvalid } from '@/lib/session';

function reply(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  if (!desktopEnabled() || !auth.configured) return reply({ error: 'unavailable' }, 404);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({ error: 'unauthorized' }, 401);
  const user = await getUser(authorization.slice(7)).catch(() => null);
  if (!user?.email) return reply({ error: 'unauthorized' }, 401);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: 'invalid_request' }, 400);
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 2048) {
        await reader.cancel();
        return reply({ error: 'invalid_request' }, 400);
      }
      chunks.push(value);
    }
    const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!event || typeof event !== 'object') return reply({ error: 'invalid_request' }, 400);
    recordUsage(user.email, event);
    if (event.pilot) recordPilotStep(user.email, event.pilot);
    return reply({ recorded: true });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ error: 'invalid_request' }, 400);
    if (isInvalid(error)) return reply({ error: 'unauthorized' }, 401);
    return reply({ error: 'unavailable' }, 503);
  } finally {
    reader.releaseLock();
  }
}
