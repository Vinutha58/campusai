"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { loginUser, registerUser } from "./api";
import { decodeJwtPayload, isExpired } from "./jwt";
import type { Role } from "./types";

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
};

type TokenPayload = {
  sub: string;
  name: string;
  role: Role;
  exp: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "campusai.token";

const AuthContext = createContext<AuthContextValue | null>(null);

// The JWT in localStorage is the external store here (see the Phase 1 fix
// that replaced useEffect+setState with useSyncExternalStore for the same
// reason: avoids a hydration race and a setState-in-effect lint error).
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

function writeToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't persist
  }
  notifyListeners();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null;
    const payload = decodeJwtPayload<TokenPayload>(token);
    if (!payload || isExpired(payload.exp)) return null;
    return { id: payload.sub, name: payload.name, role: payload.role };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    writeToken(res.access_token);
  };

  const register = async (input: { name: string; email: string; password: string; role: Role }) => {
    const res = await registerUser(input);
    writeToken(res.access_token);
  };

  const logout = () => {
    writeToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  return getSnapshot();
}
