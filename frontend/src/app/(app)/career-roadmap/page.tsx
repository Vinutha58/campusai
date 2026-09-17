"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, generateRoadmap, getMyRoadmap, type Roadmap } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Map, TriangleAlert } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function CareerRoadmapContent() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyRoadmap()
      .then((data) => {
        setRoadmap(data);
        if (data) setTargetRole(data.target_role);
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim() || generating) return;
    setError(null);
    setGenerating(true);
    try {
      const data = await generateRoadmap(targetRole.trim(), notes.trim());
      setRoadmap(data);
      setNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate a roadmap right now.");
    } finally {
      setGenerating(false);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Map size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Career Roadmap</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">An AI-generated plan toward your target role</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleGenerate} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Target role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Data Analyst"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything specific you want the roadmap to consider"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={!targetRole.trim() || generating}
            className="self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            {generating ? "Generating..." : roadmap ? "Regenerate roadmap" : "Generate roadmap"}
          </button>
        </form>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {roadmap && (
        <Card>
          <CardHeader title={`Roadmap: ${roadmap.target_role}`} subtitle={`Generated ${formatDate(roadmap.generated_at)}`} />
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{roadmap.content}</p>
        </Card>
      )}
      {!roadmap && !error && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter a target role above to generate your first roadmap.
        </p>
      )}
    </div>
  );
}

export default function CareerRoadmapPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <CareerRoadmapContent />;
  return <ComingSoon title="Career Roadmap" />;
}
