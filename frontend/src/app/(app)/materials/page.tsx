"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import {
  ApiError,
  downloadFile,
  getEnrolledCourses,
  getMaterials,
  uploadMaterial,
  type Course,
  type Material,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Download, FolderCog } from "lucide-react";

function FacultyMaterials() {
  const { courses, selectedId, setSelectedId, isLoading } = useMyCourses();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getMaterials(selectedId).then(setMaterials);
  }, [selectedId]);

  const handleUpload = async () => {
    if (!selectedId || !file) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await uploadMaterial(selectedId, title || file.name, file);
      setTitle("");
      setFile(null);
      setMaterials(await getMaterials(selectedId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload the file.");
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
            <CardHeader title="Materials" />
            <ul className="space-y-2">
              {materials.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <FolderCog size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.file_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(`/api/materials/${m.id}/download`, m.file_name)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-900"
                    aria-label={`Download ${m.title}`}
                  >
                    <Download size={16} />
                  </button>
                </li>
              ))}
              {materials.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No materials uploaded yet.</p>
              )}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader title="Upload Material" />
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              onClick={handleUpload}
              disabled={!file || isSubmitting}
              className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StudentMaterials() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEnrolledCourses()
      .then((data) => {
        setCourses(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getMaterials(selectedId).then(setMaterials);
  }, [selectedId]);

  if (!isLoading && courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No courses yet</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
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

      <Card>
        <CardHeader title="Materials" />
        <ul className="space-y-2">
          {materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <FolderCog size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.file_name}</p>
                </div>
              </div>
              <button
                onClick={() => downloadFile(`/api/materials/${m.id}/download`, m.file_name)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-900"
                aria-label={`Download ${m.title}`}
              >
                <Download size={16} />
              </button>
            </li>
          ))}
          {materials.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No materials uploaded yet.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}

export default function MaterialsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyMaterials />;
  if (user.role === "student") return <StudentMaterials />;
  return <ComingSoon title="Materials" />;
}
