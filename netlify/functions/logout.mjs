import { clearCookie, json } from './_lib/auth.mjs';

export default async function handler() {
  return json({ ok: true }, { headers: { 'set-cookie': clearCookie() } });
}

export const config = { path: '/api/logout' };
