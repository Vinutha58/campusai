"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import {
  addStudentToCourse,
  getRoster,
  getStudentsDirectory,
  removeStudentFromCourse,
  ApiError,
  type AuthUser,
  type RosterEntry,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { UserMinus } from "lucide-react";

function FacultyStudents() {
  const { courses, selectedId, setSelectedId, selectedCourse, isLoading, refresh } = useMyCourses();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getRoster(selectedId).then(setRoster);
  }, [selectedId]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await addStudentToCourse(selectedId, email);
      setEmail("");
      const [newRoster] = await Promise.all([getRoster(selectedId), refresh()]);
      setRoster(newRoster);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!selectedId) return;
    await removeStudentFromCourse(selectedId, studentId);
    setRoster(await getRoster(selectedId));
    refresh();
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
            <CardHeader
              title="Enrolled Students"
              subtitle={selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : ""}
            />
            <ul className="space-y-2">
              {roster.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{s.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    aria-label={`Remove ${s.name}`}
                  >
                    <UserMinus size={16} />
                  </button>
                </li>
              ))}
              {roster.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No students enrolled yet.</p>
              )}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader title="Add Student" subtitle="By their registered email" />
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="student@campusai.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Adding..." : "Add to course"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function PlacementStudents() {
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStudentsDirectory()
      .then(setStudents)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Students" subtitle={isLoading ? "Loading..." : `${students.length} student(s)`} />
      <ul className="space-y-2">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{s.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.email}</p>
            </div>
          </li>
        ))}
        {!isLoading && students.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No students registered yet.</p>
        )}
      </ul>
    </Card>
  );
}

export default function StudentsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyStudents />;
  if (user.role === "placement_officer") return <PlacementStudents />;
  return <ComingSoon title="Students" />;
}
