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

  const store = usersStore();
  const record = await store.get(username, { type: 'json' });

  // Compare against a dummy hash when the user is missing so timing stays similar.
  const hash = record?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
  const valid = await bcrypt.compare(password, hash);

  if (!record || !valid) {
    return json({ ok: false, error: 'Invalid username or password' }, { status: 401 });
  }

  const token = createSessionToken(username);
  return json({ ok: true, user: username }, { headers: { 'set-cookie': sessionCookie(token) } });
}

export const config = { path: '/api/login' };
