"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getPlatformAnalytics, type PlatformStats } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Users, BookOpen, Building2, ListChecks } from "lucide-react";

function AdminPlatformAnalytics() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getPlatformAnalytics().then(setStats);
  }, []);

  if (!stats) return null;

  const totalUsers = stats.students + stats.faculty + stats.placement_officers + stats.admins;

  const tiles = [
    { label: "Total Users", value: totalUsers, icon: Users, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Courses", value: stats.total_courses, icon: BookOpen, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Companies", value: stats.total_companies, icon: Building2, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Applications", value: stats.total_applications, icon: ListChecks, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  const maxRole = Math.max(1, stats.students, stats.faculty, stats.placement_officers, stats.admins);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${t.tone}`}>
              <t.icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Users by Role" />
        <div className="space-y-3">
          {[
            { label: "Students", value: stats.students },
            { label: "Faculty", value: stats.faculty },
            { label: "Placement Officers", value: stats.placement_officers },
            { label: "Administrators", value: stats.admins },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{r.label}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{r.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(r.value / maxRole) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminPlatformAnalytics />;
  return <ComingSoon title="Platform Analytics" />;
}
