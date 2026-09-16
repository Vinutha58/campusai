"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import {
  getAttendance,
  getRoster,
  markAttendance,
  type AttendanceRecord,
  type RosterEntry,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function FacultyAttendance() {
  const { courses, selectedId, setSelectedId, isLoading } = useMyCourses();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [date, setDate] = useState(todayIso());
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    getRoster(selectedId).then((r) => {
      setRoster(r);
      setPresent(Object.fromEntries(r.map((s) => [s.id, true])));
    });
    getAttendance(selectedId).then(setHistory);
  }, [selectedId]);

  const loadDate = (record: AttendanceRecord) => {
    setDate(record.date);
    setPresent(Object.fromEntries(record.records.map((r) => [r.student_id, r.present])));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    setSavedMessage(null);
    try {
      await markAttendance({
        course_id: selectedId,
        date,
        records: roster.map((s) => ({ student_id: s.id, present: present[s.id] ?? false })),
      });
      setHistory(await getAttendance(selectedId));
      setSavedMessage("Saved.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && courses.length === 0) return <NoCourses />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={setSelectedId} />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Date:</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Mark Attendance" />
            <ul className="space-y-2">
              {roster.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
                >
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{s.name}</span>
                  <button
                    onClick={() => setPresent((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      present[s.id]
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    }`}
                  >
                    {present[s.id] ? "Present" : "Absent"}
                  </button>
                </li>
              ))}
              {roster.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No students enrolled yet.</p>
              )}
            </ul>
            {roster.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save attendance"}
                </button>
                {savedMessage && <span className="text-sm text-emerald-600 dark:text-emerald-400">{savedMessage}</span>}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title="History" subtitle="Click a date to edit it" />
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => loadDate(h)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {h.date} · {h.records.filter((r) => r.present).length}/{h.records.length} present
                </button>
              </li>
            ))}
            {history.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No attendance marked yet.</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyAttendance />;
  return <ComingSoon title="Attendance" />;
}
