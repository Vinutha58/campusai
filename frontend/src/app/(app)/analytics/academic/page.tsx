"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAcademicAnalytics, type AcademicAnalytics } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { BookOpen, Users, GraduationCap, ClipboardList, Sparkles, CalendarCheck2 } from "lucide-react";

function AdminAcademicAnalytics() {
  const [analytics, setAnalytics] = useState<AcademicAnalytics | null>(null);

  useEffect(() => {
    getAcademicAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) return null;

  const stats = [
    { label: "Courses", value: analytics.total_courses, icon: BookOpen, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Students", value: analytics.total_students, icon: Users, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "Faculty", value: analytics.total_faculty, icon: GraduationCap, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Assignments", value: analytics.total_assignments, icon: ClipboardList, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
    { label: "Quizzes", value: analytics.total_quizzes, icon: Sparkles, tone: "text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400" },
    { label: "Avg Attendance", value: `${analytics.avg_attendance_percent}%`, icon: CalendarCheck2, tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
            <s.icon size={18} />
          </span>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{s.value}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}

export default function AcademicAnalyticsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminAcademicAnalytics />;
  return <ComingSoon title="Academic Analytics" />;
}
