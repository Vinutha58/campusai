"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getCompanies, getDrives, type Company, type Drive } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { ArrowRight } from "lucide-react";

function AdminPlacementOverview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);

  useEffect(() => {
    getCompanies().then(setCompanies);
    getDrives().then(setDrives);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Placement Drives"
              subtitle={`${drives.length} drive(s) across ${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
              action={
                <Link href="/drives" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Manage <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="space-y-2">
              {drives.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {d.company_name} — {d.job_role}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {d.package} · {d.application_count} applicant(s)
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${d.is_open ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                    {d.is_open ? "Open" : "Closed"}
                  </span>
                </li>
              ))}
              {drives.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No drives yet.</p>}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Companies"
            action={
              <Link href="/companies" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Manage <ArrowRight size={12} />
              </Link>
            }
          />
          <ul className="space-y-2">
            {companies.map((c) => (
              <li key={c.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                {c.name}
              </li>
            ))}
            {companies.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No companies yet.</p>}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/applications" className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Applications <ArrowRight size={14} />
        </Link>
        <Link href="/analytics/placement" className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Placement Analytics <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function PlacementsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminPlacementOverview />;
  return <ComingSoon title="Placement" />;
}
