import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cookieName, getUser, redirectResponse } from '@/lib/session';
import { revokeAccountSession } from '@/lib/account-sessions';

export async function POST(request) {
  const jar = await cookies();
  const user = await getUser(jar.get(cookieName('access'))?.value).catch(() => null);
  if (!user?.email) {
    return redirect(jar.has(cookieName('refresh')) ? '/auth/session' : '/login');
  }
  const form = await request.formData().catch(() => null);
  const sessionId = form?.get('session_id');
  const revoked = typeof sessionId === 'string' && await revokeAccountSession(user.email, sessionId);
  return redirectResponse('/account/sessions?' + new URLSearchParams(revoked ? { revoked: '1' } : { error: 'revoke' }));
}
