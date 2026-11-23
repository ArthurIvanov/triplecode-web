import { desktopSecret } from '../../api/desktop-grants.mjs';
import { cookieName, setCookie } from './session';

const idPattern = /^[a-f0-9-]{36}$/;

export function desktopEnabled() {
  return Boolean(process.env.DESKTOP_GRANT_DB);
}

function parsed(jar, key, id) {
  if (typeof id !== 'string' || !idPattern.test(id)) return null;
  try {
    return JSON.parse(jar.get(cookieName(key + id))?.value || 'null');
  } catch {
    return null;
  }
}

export function desktopRequest(jar, id) {
  const request = parsed(jar, 'desktop-', id);
  return request && desktopSecret.test(request.challenge) && desktopSecret.test(request.state) ? request : null;
}

export function desktopTicket(jar, id) {
  const ticket = parsed(jar, 'desktop-ticket-', id);
  return ticket && desktopSecret.test(ticket.code) && desktopSecret.test(ticket.state) ? ticket : null;
}

export function setDesktopRequest(response, id, request) {
  setCookie(response, 'desktop-' + id, request ? JSON.stringify(request) : '', request ? 600 : 0);
}

export function setDesktopTicket(response, id, ticket) {
  setCookie(response, 'desktop-ticket-' + id, JSON.stringify(ticket), 120);
}
