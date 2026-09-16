"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { ApiError, createCourse, getEnrolledCourses, type Course } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

function FacultyCourses() {
  const { courses, isLoading, refresh } = useMyCourses();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createCourse({ name, code, description });
      setName("");
      setCode("");
      setDescription("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="My Courses" subtitle={isLoading ? "Loading..." : `${courses.length} course(s)`} />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.code}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {c.student_count} student(s) enrolled
                </p>
              </li>
            ))}
            {!isLoading && courses.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No courses yet — create your first one.
              </p>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="New Course" />
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Course name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <input
            type="text"
            required
            placeholder="Course code (e.g. CS201)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create course"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEnrolledCourses()
      .then(setCourses)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="My Courses" subtitle={isLoading ? "Loading..." : `${courses.length} course(s)`} />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {courses.map((c) => (
          <li key={c.id} className="rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {c.code} · {c.faculty_name}
            </p>
          </li>
        ))}
        {!isLoading && courses.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;re not enrolled in any courses yet — ask your faculty to add you.
          </p>
        )}
      </ul>
    </Card>
  );
}

export default function CoursesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyCourses />;
  if (user.role === "student") return <StudentCourses />;
  return <ComingSoon title="Courses" />;
}
