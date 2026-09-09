"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE } from "@/lib/nav-config";
import type { Role } from "@/lib/types";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = NAV_BY_ROLE[role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200/70 bg-white/70 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/60 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200/70 px-6 dark:border-zinc-800/70">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Bot size={18} />
        </span>
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">CampusAI</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.title}
            </p>
            <div className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
