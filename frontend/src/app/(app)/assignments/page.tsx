"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import {
  ApiError,
  createAssignment,
  downloadFile,
  getAssignments,
  getEnrolledCourses,
  getMySubmission,
  getSubmissions,
  gradeSubmission,
  submitAssignment,
  type Assignment,
  type Course,
  type Submission,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Download } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function FacultyAssignments() {
  const { courses, selectedId, setSelectedId, isLoading } = useMyCourses();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getAssignments(selectedId).then(setAssignments);
  }, [selectedId]);

  useEffect(() => {
    if (!activeAssignment) return;
    getSubmissions(activeAssignment.id).then(setSubmissions);
  }, [activeAssignment]);

  const handleCourseChange = (id: string) => {
    setSelectedId(id);
    setActiveAssignment(null);
  };

  const handleSelectAssignment = (a: Assignment) => {
    setActiveAssignment(a);
    setSubmissions([]);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createAssignment({
        course_id: selectedId,
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignments(await getAssignments(selectedId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string, grade: number, feedback: string) => {
    await gradeSubmission(submissionId, grade, feedback);
    if (activeAssignment) setSubmissions(await getSubmissions(activeAssignment.id));
  };

  if (!isLoading && courses.length === 0) return <NoCourses />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={handleCourseChange} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Assignments" />
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => handleSelectAssignment(a)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      activeAssignment?.id === a.id
                        ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5"
                        : "border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{a.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Due {formatDate(a.due_date)}</p>
                  </button>
                </li>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No assignments yet.</p>
              )}
            </ul>
          </Card>

          {activeAssignment && (
            <Card>
              <CardHeader title={`Submissions — ${activeAssignment.title}`} />
              <ul className="space-y-3">
                {submissions.map((s) => (
                  <SubmissionRow key={s.id} submission={s} onGrade={handleGrade} />
                ))}
                {submissions.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No submissions yet.</p>
                )}
              </ul>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="New Assignment" />
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              required
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create assignment"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
  onGrade,
}: {
  submission: Submission;
  onGrade: (id: string, grade: number, feedback: string) => void;
}) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  return (
    <li className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{submission.student_name}</p>
          <button
            onClick={() => downloadFile(`/api/assignments/submissions/${submission.id}/download`, submission.file_name ?? "submission")}
            className="mt-1 flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Download size={12} /> {submission.file_name}
          </button>
        </div>
        {submission.grade !== null && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {submission.grade}/100
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          onClick={() => onGrade(submission.id, Number(grade), feedback)}
          disabled={grade === ""}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </li>
  );
}

function StudentAssignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    getEnrolledCourses().then((data) => {
      setCourses(data);
      setSelectedId(data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getAssignments(selectedId).then(setAssignments);
  }, [selectedId]);

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;re not enrolled in any courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      <div className="flex flex-col gap-4">
        {assignments.map((a) => (
          <StudentAssignmentCard key={a.id} assignment={a} />
        ))}
        {assignments.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No assignments yet for this course.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StudentAssignmentCard({ assignment }: { assignment: Assignment }) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMySubmission(assignment.id).then(setSubmission);
  }, [assignment.id]);

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitAssignment(assignment.id, file);
      setSubmission(result);
      setFile(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader title={assignment.title} subtitle={`Due ${formatDate(assignment.due_date)}`} />
      {assignment.description && (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{assignment.description}</p>
      )}

      {submission ? (
        <div className="rounded-xl border border-zinc-100 p-3 text-sm dark:border-zinc-800">
          <p className="text-zinc-700 dark:text-zinc-300">
            Submitted: <span className="font-medium">{submission.file_name}</span>
          </p>
          {submission.grade !== null ? (
            <p className="mt-1 text-emerald-600 dark:text-emerald-400">
              Grade: {submission.grade}/100 {submission.feedback && `— ${submission.feedback}`}
            </p>
          ) : (
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">Not graded yet.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-600 dark:text-zinc-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </Card>
  );
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyAssignments />;
  if (user.role === "student") return <StudentAssignments />;
  return <ComingSoon title="Assignments" />;
}
