"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE } from "@/lib/nav-config";
import type { Role } from "@/lib/types";

export function MobileNav({ role, onClose }: { role: Role; onClose: () => void }) {
  const pathname = usePathname();
  const groups = NAV_BY_ROLE[role];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-zinc-950">
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/70 px-4 dark:border-zinc-800/70">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Bot size={18} />
            </span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">CampusAI</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
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
                      onClick={onClose}
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
      </div>
    </div>
  );
}
