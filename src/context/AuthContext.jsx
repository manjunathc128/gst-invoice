import { createContext, useContext, useState } from 'react';

const USERS_KEY = 'gst_users';
const SESSION_KEY = 'gst_user';

// NOTE: This is a frontend-only demo store. Credentials live in localStorage
// and are NOT secure. Do not use real passwords here.

// Lightweight, non-cryptographic hash so we don't store raw plaintext.
// This is obfuscation only, not real security.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);

  const signup = (username, password) => {
    const uname = username.trim().toLowerCase();
    const users = readUsers();
    if (users.some((u) => u.username === uname)) {
      return { ok: false, error: 'An account with this username already exists' };
    }
    users.push({ username: uname, passwordHash: hash(password) });
    writeUsers(users);
    // Auto sign-in after signup.
    sessionStorage.setItem(SESSION_KEY, uname);
    setUser(uname);
    return { ok: true };
  };

  const login = (username, password) => {
    const uname = username.trim().toLowerCase();
    const users = readUsers();
    const found = users.find((u) => u.username === uname);
    if (!found || found.passwordHash !== hash(password)) {
      return { ok: false, error: 'Invalid username or password' };
    }
    sessionStorage.setItem(SESSION_KEY, uname);
    setUser(uname);
    return { ok: true };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
