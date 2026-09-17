"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getPlacementAnalytics, type PlacementAnalytics } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Building2, CalendarRange, ListChecks, Award } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

function PlacementAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlacementAnalytics | null>(null);

  useEffect(() => {
    getPlacementAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) return null;

  const stats = [
    { label: "Companies", value: analytics.total_companies, icon: Building2, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Drives", value: analytics.total_drives, icon: CalendarRange, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Applications", value: analytics.total_applications, icon: ListChecks, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Selected", value: analytics.by_status.selected ?? 0, icon: Award, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  const maxStatusCount = Math.max(1, ...Object.values(analytics.by_status));
  const maxCompanyCount = Math.max(1, ...analytics.by_company.map((c) => c.applications));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
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
          <CardHeader title="Applications by Stage" />
          <div className="space-y-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = analytics.by_status[key] ?? 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Applications by Company" />
          <div className="space-y-3">
            {analytics.by_company.map((c) => (
              <div key={c.company_name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">{c.company_name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{c.applications}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${(c.applications / maxCompanyCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {analytics.by_company.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No applications yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "placement_officer") return <PlacementAnalyticsPage />;
  return <ComingSoon title="Analytics" />;
}
