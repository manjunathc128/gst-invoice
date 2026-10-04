import { readCookie, verifySessionToken, json } from './_lib/auth.mjs';

// Returns the currently authenticated user based on the session cookie.
export default async function handler(req) {
  const token = readCookie(req);
  const payload = verifySessionToken(token);

  if (!payload) {
    return json({ ok: false, user: null }, { status: 401 });
  }
  return json({ ok: true, user: payload.sub });
}

export const config = { path: '/api/me' };
