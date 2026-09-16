"use client";

import Link from "next/link";
import { BookOpen, Bot, ChartColumn, ClipboardList, Users, ArrowRight, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

const STATS = [
  { label: "Courses Taught", value: "4", icon: BookOpen, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { label: "Total Students", value: "186", icon: Users, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { label: "Pending Grading", value: "42", icon: ClipboardList, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  { label: "Avg Quiz Score", value: "76%", icon: ChartColumn, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
];

const COURSES = [
  { name: "Data Structures", code: "CS201", students: 52 },
  { name: "Database Systems", code: "CS304", students: 48 },
  { name: "Operating Systems", code: "CS308", students: 44 },
  { name: "Computer Networks", code: "CS310", students: 42 },
];

const GRADING_QUEUE = [
  { title: "Data Structures — Assignment 4", course: "CS201", pending: 18 },
  { title: "Database Systems — ER Diagram", course: "CS304", pending: 9 },
  { title: "Operating Systems — Lab Report", course: "CS308", pending: 15 },
];

const ATTENDANCE_SUMMARY = [
  { course: "Data Structures", attendance: 88 },
  { course: "Database Systems", attendance: 79 },
  { course: "Operating Systems", attendance: 91 },
  { course: "Computer Networks", attendance: 84 },
];

const NEEDS_ATTENTION = [
  { name: "Rohit Sharma", course: "Data Structures", reason: "Attendance below 60%" },
  { name: "Sneha Patil", course: "Operating Systems", reason: "Missed 2 assignments" },
];

const RECENT_ACTIVITY = [
  "You uploaded new material to Database Systems",
  "Attendance marked for Computer Networks — Sep 15",
  "12 students submitted Data Structures — Assignment 4",
];

export function FacultyDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-indigo-100">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{user?.name ?? "Faculty"}</h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100">
          Here&apos;s an overview of your courses, students, and what needs your attention today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}>
              <stat.icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="My Courses"
              subtitle="This semester"
              action={
                <Link
                  href="/courses"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Manage <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COURSES.map((c) => (
                <li
                  key={c.code}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.code}</p>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {c.students} students
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Assignments Needing Review"
              subtitle="Ungraded submissions"
              action={
                <Link
                  href="/assignments"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="space-y-3">
              {GRADING_QUEUE.map((a) => (
                <li key={a.title} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">{a.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.course}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {a.pending} pending
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Attendance Summary" subtitle="Course-wise, this month" />
            <div className="space-y-4">
              {ATTENDANCE_SUMMARY.map((c) => (
                <div key={c.course}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{c.course}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{c.attendance}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${c.attendance}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Link
            href="/ai-tools"
            className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:hover:bg-indigo-500/5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Bot size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI Academic Tools</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes, summaries, quiz generation</p>
            </div>
          </Link>

          <Card>
            <CardHeader title="Students Needing Attention" />
            <ul className="space-y-3">
              {NEEDS_ATTENTION.map((s) => (
                <li key={s.name} className="flex items-start gap-2 text-sm">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.name}</span> ·{" "}
                    {s.course}
                    <br />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recent Activity" />
            <ul className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
