import { listSessions, dropSession, sessionRefreshToken } from '../../api/desktop-sessions.mjs';
import { auth } from './session';

export function accountSessions(email) {
  return process.env.DESKTOP_GRANT_DB ? listSessions(email) : [];
}

export async function revokeAccountSession(email, id) {
  if (!process.env.DESKTOP_GRANT_DB) return false;
  if (!listSessions(email).some(session => session.id === id)) return false;
  const refreshToken = sessionRefreshToken(id);
  dropSession(id);
  if (refreshToken) {
    try {
      const session = await auth.refresh(refreshToken);
      await auth.logout(session.access_token);
    } catch {
      // Local record is revoked; remote cleanup is best-effort.
    }
  }
  return true;
}
