"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  Bot,
  CalendarCheck2,
  ClipboardList,
  Compass,
  Target,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

const STATS = [
  { label: "Attendance", value: "87%", icon: CalendarCheck2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { label: "Pending Assignments", value: "3", icon: ClipboardList, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  { label: "Upcoming Quizzes", value: "2", icon: Award, tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { label: "Placement Readiness", value: "72%", icon: Target, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
];

const ASSIGNMENTS = [
  { title: "Data Structures — Assignment 4", course: "CS201", due: "Due tomorrow" },
  { title: "Database Systems — ER Diagram", course: "CS304", due: "Due in 3 days" },
  { title: "Operating Systems — Lab Report", course: "CS308", due: "Due in 5 days" },
];

const MARKS = [
  { subject: "Data Structures", score: "42/50" },
  { subject: "Database Systems", score: "38/40" },
  { subject: "Computer Networks", score: "27/30" },
];

const COURSES = [
  { name: "Data Structures", progress: 68 },
  { name: "Database Systems", progress: 54 },
  { name: "Operating Systems", progress: 41 },
  { name: "Computer Networks", progress: 76 },
];

const NOTIFICATIONS = [
  "New material uploaded in Database Systems",
  "Attendance updated for Computer Networks",
  "Placement drive: TechNova Solutions — applications open",
];

const NETWORK_ACTIVITY = [
  { name: "Priya Menon", action: "earned a certification in Cloud Computing" },
  { name: "Rahul Verma", action: "shared an update about a summer internship" },
];

export function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-indigo-100">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{user?.name ?? "Student"}</h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100">
          Here&apos;s where things stand across your academics, career prep, and placements today.
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Upcoming Assignments" subtitle="Across all enrolled courses" />
              <ul className="space-y-3">
                {ASSIGNMENTS.map((a) => (
                  <li key={a.title} className="text-sm">
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">{a.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {a.course} · {a.due}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Recent Marks" subtitle="Latest assessment scores" />
              <ul className="space-y-3">
                {MARKS.map((m) => (
                  <li key={m.subject} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{m.subject}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{m.score}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="Course Progress" />
            <div className="space-y-4">
              {COURSES.map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{c.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{c.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Placement Opportunities"
              subtitle="Open drives you're eligible for"
              action={
                <Link
                  href="/placements"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">TechNova Solutions</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Software Engineer · On-campus</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Eligible
                </span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">Orbit Systems</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Data Analyst · Remote</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Eligible
                </span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/campusgpt"
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:hover:bg-indigo-500/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Bot size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ask CampusGPT</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Doubts, notes, study plans</p>
              </div>
            </Link>
            <Link
              href="/career-ai"
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:hover:bg-violet-500/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white">
                <Compass size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Explore Career AI</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Roadmap, skill gaps, interviews</p>
              </div>
            </Link>
          </div>

          <Card>
            <CardHeader title="Notifications" />
            <ul className="space-y-3">
              {NOTIFICATIONS.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Bell size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                  {n}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Campus Network"
              action={
                <Link
                  href="/network"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all <ArrowRight size={12} />
                </Link>
              }
            />
            <ul className="space-y-3">
              {NETWORK_ACTIVITY.map((item) => (
                <li key={item.name} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Users size={12} />
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span>{" "}
                    {item.action}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
