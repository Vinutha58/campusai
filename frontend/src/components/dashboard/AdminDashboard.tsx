"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Building2, ListChecks, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { getPlatformAnalytics, type PlatformStats } from "@/lib/api";

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getPlatformAnalytics().then(setStats);
  }, []);

  const totalUsers = stats
    ? stats.students + stats.faculty + stats.placement_officers + stats.admins
    : "—";

  const statTiles = [
    { label: "Total Users", value: totalUsers, icon: Users, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Courses", value: stats?.total_courses ?? "—", icon: BookOpen, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Companies", value: stats?.total_companies ?? "—", icon: Building2, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Applications", value: stats?.total_applications ?? "—", icon: ListChecks, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-indigo-100">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{user?.name ?? "Admin"}</h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100">
          Platform-wide overview across users, academics, and placements.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statTiles.map((s) => (
          <Card key={s.label} className="p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Users by Role" />
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Students</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{stats?.students ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Faculty</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{stats?.faculty ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Placement Officers</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{stats?.placement_officers ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Administrators</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{stats?.admins ?? 0}</span>
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="Quick Links" />
          <div className="grid grid-cols-2 gap-2">
            <Link href="/users" className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
              Manage users <ArrowRight size={14} />
            </Link>
            <Link href="/courses" className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
              View courses <ArrowRight size={14} />
            </Link>
            <Link href="/placements" className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
              Placements <ArrowRight size={14} />
            </Link>
            <Link href="/ai-configuration" className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
              AI config <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
