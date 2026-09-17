"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  applyToDrive,
  getDrives,
  getMyApplications,
  type Drive,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

function StudentOpportunities() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [appliedDriveIds, setAppliedDriveIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const refresh = () => {
    getDrives(true).then(setDrives);
    getMyApplications().then((apps) => setAppliedDriveIds(new Set(apps.map((a) => a.drive_id))));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleApply = async (driveId: string) => {
    setError(null);
    setApplyingId(driveId);
    try {
      await applyToDrive(driveId);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't apply.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {drives.map((d) => {
        const applied = appliedDriveIds.has(d.id);
        return (
          <Card key={d.id}>
            <CardHeader
              title={`${d.company_name} — ${d.job_role}`}
              subtitle={`${d.package} · ${d.location}`}
              action={
                <button
                  onClick={() => handleApply(d.id)}
                  disabled={applied || applyingId === d.id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    applied
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  }`}
                >
                  {applied ? "Applied" : applyingId === d.id ? "Applying..." : "Apply"}
                </button>
              }
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Eligibility: CGPA {d.eligibility.min_cgpa}+, Year {d.eligibility.min_year}+, backlogs ≤{d.eligibility.max_backlogs}
              {d.eligibility.branches.length > 0 && `, ${d.eligibility.branches.join("/")}`}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Apply by {new Date(d.application_deadline).toLocaleDateString()}
            </p>
          </Card>
        );
      })}
      {drives.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No open opportunities right now.</p>
        </Card>
      )}
    </div>
  );
}

function PlacementOpportunities() {
  const [drives, setDrives] = useState<Drive[]>([]);

  useEffect(() => {
    getDrives(true).then(setDrives);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {drives.map((d) => (
        <Card key={d.id}>
          <CardHeader title={`${d.company_name} — ${d.job_role}`} subtitle={`${d.package} · ${d.location}`} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Eligibility: CGPA {d.eligibility.min_cgpa}+, Year {d.eligibility.min_year}+, backlogs ≤{d.eligibility.max_backlogs}
            {d.eligibility.branches.length > 0 && `, ${d.eligibility.branches.join("/")}`}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Apply by {new Date(d.application_deadline).toLocaleDateString()} · {d.application_count} applicant(s)
          </p>
        </Card>
      ))}
      {drives.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No open opportunities right now.</p>
        </Card>
      )}
    </div>
  );
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <StudentOpportunities />;
  if (user.role === "placement_officer" || user.role === "admin") return <PlacementOpportunities />;
  return <ComingSoon title="Opportunities" />;
}
