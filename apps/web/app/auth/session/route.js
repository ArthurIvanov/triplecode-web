import { auth, clearSession, cookieName, getUser, isInvalid, loginRedirect, redirectResponse, saveSession } from '@/lib/session';

export async function GET(request) {
  const refresh = request.cookies.get(cookieName('refresh'))?.value;
  let session;
  if (refresh) {
    try {
      session = await auth.refresh(refresh);
      if ((await getUser(session.access_token))?.email) {
        const response = redirectResponse('/account');
        saveSession(response, session);
        return response;
      }
    } catch (error) {
      if (!isInvalid(error)) {
        const response = redirectResponse('/account?error=service');
        if (session) saveSession(response, session);
        return response;
      }
    }
  }
  const response = loginRedirect({ error: 'expired' });
  clearSession(response);
  return response;
}
