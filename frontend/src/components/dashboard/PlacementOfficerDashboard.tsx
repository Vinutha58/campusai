"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CalendarRange, ListChecks, Award, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { getDrives, getPlacementAnalytics, type Drive, type PlacementAnalytics } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

export function PlacementOfficerDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PlacementAnalytics | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);

  useEffect(() => {
    getPlacementAnalytics().then(setAnalytics);
    getDrives().then(setDrives);
  }, []);

  const stats = [
    { label: "Companies", value: analytics?.total_companies ?? "—", icon: Building2, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Open Drives", value: analytics?.open_drives ?? "—", icon: CalendarRange, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Total Applications", value: analytics?.total_applications ?? "—", icon: ListChecks, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Selected", value: analytics?.by_status.selected ?? 0, icon: Award, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-indigo-100">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{user?.name ?? "Placement Officer"}</h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100">
          Here&apos;s how placements are tracking across companies and drives.
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Drives"
              action={
                <Link href="/drives" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Manage <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="space-y-2">
              {drives.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {d.company_name} — {d.job_role}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {d.package} · {d.application_count} applicant(s)
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      d.is_open
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {d.is_open ? "Open" : "Closed"}
                  </span>
                </li>
              ))}
              {drives.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No drives yet.</p>}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader title="Applications by Stage" />
          <ul className="space-y-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {analytics?.by_status[key] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
