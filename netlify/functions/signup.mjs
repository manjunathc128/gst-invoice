import bcrypt from 'bcryptjs';
import {
  usersStore, normalizeUsername, createSessionToken, sessionCookie, json,
} from './_lib/auth.mjs';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const username = normalizeUsername(body.username);
  const password = String(body.password || '');

  if (username.length < 3) {
    return json({ ok: false, error: 'Username must be at least 3 characters' }, { status: 400 });
  }
  if (password.length < 6) {
    return json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const store = usersStore();
  const existing = await store.get(username, { type: 'json' });
  if (existing) {
    return json({ ok: false, error: 'An account with this username already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await store.setJSON(username, { username, passwordHash, createdAt: Date.now() });

  const token = createSessionToken(username);
  return json({ ok: true, user: username }, { headers: { 'set-cookie': sessionCookie(token) } });
}

export const config = { path: '/api/signup' };
