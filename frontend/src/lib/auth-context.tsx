"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Role } from "./types";

export type MockUser = {
  name: string;
  role: Role;
};

type AuthContextValue = {
  user: MockUser | null;
  loginAs: (role: Role) => void;
  logout: () => void;
};

const STORAGE_KEY = "campusai.mockUser";

const DEMO_NAMES: Record<Role, string> = {
  student: "Aditi Sharma",
  faculty: "Dr. Rajesh Kumar",
  placement_officer: "Meera Iyer",
  admin: "Admin User",
};

const AuthContext = createContext<AuthContextValue | null>(null);

// localStorage is an external store, so it's read via useSyncExternalStore
// (the React-sanctioned way to do this) rather than useState+useEffect,
// which avoids an extra render pass and a "setState in effect" lint error.
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

function writeUser(user: MockUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — state won't persist, but the app still works
  }
  notifyListeners();
}

// Phase 1 stand-in for real auth: picks a demo identity per role and
// remembers it in localStorage. Swap loginAs()'s body for a real API call
// once college-email OTP login is built — nothing else here should need to change.
export function AuthProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const user = useMemo<MockUser | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MockUser;
    } catch {
      return null;
    }
  }, [raw]);

  const loginAs = (role: Role) => {
    writeUser({ name: DEMO_NAMES[role], role });
  };

  const logout = () => {
    writeUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginAs, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
