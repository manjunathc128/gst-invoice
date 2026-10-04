import { createContext, useContext, useEffect, useState } from 'react';

// Auth is backed by Netlify Functions + Netlify Blobs.
// Credentials never live in the browser; the session is an httpOnly cookie
// set by the server, so login persists across browsers/devices.

const AuthContext = createContext(null);

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response; leave data empty
  }
  return { res, data };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the server who we are (reads the httpOnly session cookie).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const data = await res.json();
        if (active) setUser(data.ok ? data.user : null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signup = async (username, password) => {
    const { res, data } = await postJSON('/api/signup', { username, password });
    if (res.ok && data.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Signup failed' };
  };

  const login = async (username, password) => {
    const { res, data } = await postJSON('/api/login', { username, password });
    if (res.ok && data.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Login failed' };
  };

  const logout = async () => {
    try {
      await postJSON('/api/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
