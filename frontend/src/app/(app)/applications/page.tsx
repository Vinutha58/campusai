"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getApplicationsForDrive,
  getDrives,
  getMyApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
  type Drive,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "assessment", label: "Assessment" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  shortlisted: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  assessment: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  interview: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  selected: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function PlacementApplications() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    getDrives().then((data) => {
      setDrives(data);
      setSelectedId(data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getApplicationsForDrive(selectedId).then(setApplications);
  }, [selectedId]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await updateApplicationStatus(id, status);
    if (selectedId) setApplications(await getApplicationsForDrive(selectedId));
  };

  if (drives.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Create a drive first to see applications.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Drive:</span>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {drives.map((d) => (
            <option key={d.id} value={d.id}>
              {d.company_name} — {d.job_role}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader title="Applications" subtitle={`${applications.length} applicant(s)`} />
        <ul className="space-y-2">
          {applications.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{a.student_name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.student_email}</p>
              </div>
              <select
                value={a.status}
                onChange={(e) => handleStatusChange(a.id, e.target.value as ApplicationStatus)}
                className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${STATUS_TONE[a.status]}`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
          {applications.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No applications for this drive yet.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}

function StudentApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(setApplications)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="My Applications" subtitle={isLoading ? "Loading..." : `${applications.length} application(s)`} />
      <ul className="space-y-2">
        {applications.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {a.company_name} — {a.job_role}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Applied {new Date(a.applied_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[a.status]}`}>
              {STATUS_OPTIONS.find((o) => o.value === a.status)?.label}
            </span>
          </li>
        ))}
        {!isLoading && applications.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t applied to any opportunities yet.
          </p>
        )}
      </ul>
    </Card>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "placement_officer" || user.role === "admin") return <PlacementApplications />;
  if (user.role === "student") return <StudentApplications />;
  return <ComingSoon title="Applications" />;
}
