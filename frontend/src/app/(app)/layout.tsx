"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useIsHydrated } from "@/lib/use-is-hydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isHydrated = useIsHydrated();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400">Loading CampusAI...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-1 bg-zinc-50 dark:bg-zinc-950">
      <Sidebar role={user.role} />
      {mobileNavOpen && <MobileNav role={user.role} onClose={() => setMobileNavOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
