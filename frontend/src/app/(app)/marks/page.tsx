"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import { ApiError, getMarks, getRoster, upsertMark, type Mark, type RosterEntry } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

function FacultyMarks() {
  const { courses, selectedId, setSelectedId, isLoading } = useMyCourses();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const [studentId, setStudentId] = useState("");
  const [assessmentName, setAssessmentName] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getRoster(selectedId).then((r) => {
      setRoster(r);
      setStudentId(r[0]?.id ?? "");
    });
    getMarks(selectedId).then(setMarks);
  }, [selectedId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !studentId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await upsertMark({
        course_id: selectedId,
        student_id: studentId,
        assessment_name: assessmentName,
        score: Number(score),
        max_score: Number(maxScore),
      });
      setAssessmentName("");
      setScore("");
      setMaxScore("");
      setMarks(await getMarks(selectedId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the mark.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && courses.length === 0) return <NoCourses />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Marks" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400 dark:border-zinc-800">
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Assessment</th>
                    <th className="pb-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-50 dark:border-zinc-900">
                      <td className="py-2 text-zinc-700 dark:text-zinc-300">{m.student_name}</td>
                      <td className="py-2 text-zinc-700 dark:text-zinc-300">{m.assessment_name}</td>
                      <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-50">
                        {m.score}/{m.max_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {marks.length === 0 && (
                <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">No marks recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Add / Update Mark" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {roster.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Assessment name (e.g. Midterm)"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <div className="flex gap-3">
              <input
                type="number"
                required
                placeholder="Score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="number"
                required
                placeholder="Max score"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !studentId}
              className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save mark"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function MarksPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyMarks />;
  return <ComingSoon title="Marks" />;
}
