import type { Course } from "@/lib/api";

export function CourseSelect({
  courses,
  selectedId,
  onChange,
}: {
  courses: Course[];
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.code})
        </option>
      ))}
    </select>
  );
}

export function NoCourses() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No courses yet</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Create a course from the Courses page first.
      </p>
    </div>
  );
}
