import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  appOrigin, auth, challengeName, clearSession, cookieName, getUser, isInvalid,
  loginRedirect, redirectResponse, saveSession, setChallenge,
} from '@/lib/session';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxFormLength = 4096;

async function readForm(request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let content = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return new URLSearchParams(content + decoder.decode());
      size += value.byteLength;
      if (size > maxFormLength) {
        await reader.cancel();
        return null;
      }
      content += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function logout(request) {
  let access = request.cookies.get(cookieName('access'))?.value;
  const refresh = request.cookies.get(cookieName('refresh'))?.value;
  try {
    if (!(await getUser(access))) access = refresh ? (await auth.refresh(refresh)).access_token : undefined;
    if (access) await auth.logout(access);
  } catch (error) {
    if (!isInvalid(error)) return redirectResponse('/account?error=logout');
  }
  const response = redirectResponse('/login');
  clearSession(response);
  return response;
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (!['code', 'verify', 'logout'].includes(action)) return new NextResponse(null, { status: 404 });
  if (request.headers.get('origin') !== appOrigin()) {
    return new NextResponse('Откройте форму входа и повторите действие.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  if (!auth.configured) return loginRedirect({ error: 'unavailable' });
  if (action === 'logout') return logout(request);

  const form = await readForm(request);
  if (!form) return loginRedirect({ error: 'email' });

  const flow = form.get('flow');
  const name = challengeName(flow);
  const challenge = name ? request.cookies.get(cookieName(name))?.value : undefined;

  if (action === 'code') {
    if (flow && !challenge) return loginRedirect({ error: 'expired' });
    const email = (challenge ?? form.get('email') ?? '').trim().toLowerCase();
    if (email.length > 254 || !emailPattern.test(email)) return loginRedirect({ error: 'email' });
    const nextFlow = flow || randomUUID();
    try {
      await auth.sendCode(email);
    } catch (error) {
      if (error.status === 429) {
        const response = loginRedirect({ flow: nextFlow, error: 'send-limit' });
        setChallenge(response, nextFlow, email);
        return response;
      }
      return loginRedirect({ flow: flow || undefined, error: isInvalid(error) ? 'send' : 'unavailable' });
    }
    const response = loginRedirect({ flow: nextFlow });
    setChallenge(response, nextFlow, email);
    return response;
  }

  if (!challenge) return loginRedirect({ error: 'expired' });
  const code = form.get('token') ?? '';
  if (!/^[0-9]{6}$/.test(code)) return loginRedirect({ flow, error: 'code' });
  try {
    const session = await auth.verifyCode(challenge, code);
    const response = redirectResponse('/account');
    saveSession(response, session);
    setChallenge(response, flow, '');
    return response;
  } catch (error) {
    return loginRedirect({
      flow,
      error: error.status === 429 ? 'verify-limit' : isInvalid(error) ? 'code' : 'unavailable',
    });
  }
}
