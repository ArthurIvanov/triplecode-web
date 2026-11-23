export class AuthError extends Error {
  constructor(status) {
    super('Supabase Auth request failed');
    this.status = status;
  }
}

export function createAuth({ url, key }) {
  async function request(path, { data, accessToken } = {}) {
    if (!url || !key) throw new AuthError(503);
    let response;
    try {
      response = await fetch(new URL('/auth/v1/' + path, url), {
        method: data ? 'POST' : 'GET',
        headers: {
          apikey: key,
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: 'Bearer ' + accessToken }),
        },
        body: data && JSON.stringify(data),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new AuthError(503);
    }
    if (!response.ok) throw new AuthError(response.status);
    if (response.status !== 204) return response.json();
  }

  return {
    configured: Boolean(url && key),
    sendCode: email => request('otp', { data: { email, create_user: true } }),
    verifyCode: (email, token) => request('verify', { data: { email, token, type: 'email' } }),
    user: accessToken => request('user', { accessToken }),
    refresh: refreshToken => request('token?grant_type=refresh_token', {
      data: { refresh_token: refreshToken },
    }),
    logout: accessToken => request('logout?scope=local', { data: {}, accessToken }),
  };
}
