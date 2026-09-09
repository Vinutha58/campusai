"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "./types";

export type MockUser = {
  name: string;
  role: Role;
};

type AuthContextValue = {
  user: MockUser | null;
  isLoading: boolean;
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

// Phase 1 stand-in for real auth: picks a demo identity per role and
// remembers it in localStorage. Swap loginAs()'s body for a real API call
// once college-email OTP login is built — nothing else here should need to change.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back to logged-out
    }
    setIsLoading(false);
  }, []);

  const loginAs = (role: Role) => {
    const nextUser: MockUser = { name: DEMO_NAMES[role], role };
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
