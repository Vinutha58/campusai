"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyReadiness, type Readiness } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Lightbulb, Target } from "lucide-react";

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function PlacementReadinessContent() {
  const [data, setData] = useState<Readiness | null>(null);

  useEffect(() => {
    getMyReadiness().then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Target size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Placement Readiness</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A transparent snapshot built from your real activity - not a hidden score
          </p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{Math.round(data.overall_score)}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Overall readiness</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Weighted across academics, attendance, skills, certifications, resume, and placement engagement.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Breakdown" />
        <div className="flex flex-col gap-4">
          {data.factors.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{f.label}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{Math.round(f.score)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-full rounded-full ${scoreTone(f.score)}`} style={{ width: `${f.score}%` }} />
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{f.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {data.suggestions.length > 0 && (
        <Card>
          <CardHeader title="Suggestions" />
          <ul className="flex flex-col gap-2">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function PlacementReadinessPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <PlacementReadinessContent />;
  return <ComingSoon title="Placement Readiness" />;
}
