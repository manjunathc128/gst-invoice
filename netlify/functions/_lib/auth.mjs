// Shared helpers for the auth functions.
// Users are persisted in a Netlify Blobs store (server-side only).
// Sessions are stateless: a signed token stored in an httpOnly cookie.

import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

const COOKIE_NAME = 'gst_session';
const SESSION_TTL_DAYS = 30;

// Secret used to sign session tokens. Set this in Netlify env vars.
// Falls back to a dev-only value so local testing works.
function getSecret() {
  return process.env.AUTH_SECRET || 'dev-insecure-secret-change-me';
}

export function usersStore() {
  // A named key/value store scoped to this site.
  return getStore({ name: 'users', consistency: 'strong' });
}

// Normalize a username so lookups are case-insensitive.
export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

// ---- Session token: base64url(payload).hmac ----

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function createSessionToken(username) {
  const payload = JSON.stringify({
    sub: username,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    jti: randomUUID(),
  });
  const encoded = b64url(payload);
  const sig = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expected = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Cookie helpers ----

export function sessionCookie(token) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// ---- Response helpers ----

export function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
