import { createAuth, AuthError } from '../../api/auth.mjs';
import { NextResponse } from 'next/server';

export const auth = createAuth({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_PUBLISHABLE_KEY,
});

export function appOrigin() {
  return new URL(process.env.APP_ORIGIN || `http://localhost:${process.env.PORT || 3000}`).origin;
}

function secure() {
  return appOrigin().startsWith('https:');
}

export function cookieName(suffix) {
  return (secure() ? '__Host-tc-' : 'tc-') + suffix;
}

export function setCookie(response, suffix, value, maxAge) {
  response.cookies.set(cookieName(suffix), value, {
    httpOnly: true, sameSite: 'lax', secure: secure(), path: '/', maxAge,
  });
}

export function saveSession(response, session) {
  setCookie(response, 'access', session.access_token, session.expires_in);
  setCookie(response, 'refresh', session.refresh_token, 7 * 86400);
}

export function clearSession(response) {
  setCookie(response, 'access', '', 0);
  setCookie(response, 'refresh', '', 0);
}

export function challengeName(flow) {
  return typeof flow === 'string' && /^[a-f0-9-]{36}$/.test(flow) ? 'challenge-' + flow : null;
}

export function emailChallenge(jar, flow) {
  const name = challengeName(flow);
  const value = name ? jar.get(cookieName(name))?.value : undefined;
  if (!value) return null;
  if (!value.startsWith('{')) return { email: value };
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setChallenge(response, flow, email, desktop) {
  const value = email && desktop ? JSON.stringify({ email, desktop }) : email;
  setCookie(response, challengeName(flow), value, email ? 1800 : 0);
}

export function isInvalid(error) {
  return error instanceof AuthError && [400, 401, 403, 422].includes(error.status);
}

export async function getUser(accessToken) {
  if (!accessToken) return null;
  try {
    return await auth.user(accessToken);
  } catch (error) {
    if (!isInvalid(error)) throw error;
    return null;
  }
}

export function redirectResponse(path) {
  return NextResponse.redirect(new URL(path, appOrigin()), {
    status: 303,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function loginRedirect({ error, flow, desktop } = {}) {
  const params = new URLSearchParams();
  if (flow) params.set('flow', flow);
  if (desktop) params.set('desktop', desktop);
  if (error) params.set('error', error);
  return redirectResponse('/login' + (params.size ? '?' + params : ''));
}
