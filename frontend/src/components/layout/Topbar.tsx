"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/types";
import { NotificationBell } from "@/components/layout/NotificationBell";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  if (!user) return null;

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200/70 bg-white/70 px-4 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <form onSubmit={handleSearchSubmit} className="relative hidden flex-1 max-w-md sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="search"
          placeholder="Search CampusAI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-indigo-500/20"
        />
      </form>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-4">
        <NotificationBell />

        <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
            {initials(user.name)}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
