"use client";

import { useRouter } from "next/navigation";
import { Bot, Briefcase, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS, type Role } from "@/lib/types";

const ROLE_OPTIONS: { role: Role; description: string; icon: typeof GraduationCap }[] = [
  { role: "student", description: "Academics, CampusGPT, career prep, placements", icon: GraduationCap },
  { role: "faculty", description: "Courses, attendance, assignments, quizzes", icon: Users },
  { role: "placement_officer", description: "Companies, drives, applications, analytics", icon: Briefcase },
  { role: "admin", description: "Platform-wide management and configuration", icon: ShieldCheck },
];

export default function LoginPage() {
  const { loginAs } = useAuth();
  const router = useRouter();

  const handleSelect = (role: Role) => {
    loginAs(role);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Bot size={20} />
        </span>
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">CampusAI</span>
      </div>

      <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Continue as
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
        College-email OTP sign-in is coming soon. For now, pick a role to preview its dashboard.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLE_OPTIONS.map(({ role, description, icon: Icon }) => (
          <button
            key={role}
            onClick={() => handleSelect(role)}
            className="flex items-start gap-4 rounded-2xl border border-zinc-200/70 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:hover:bg-indigo-500/5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Icon size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {ROLE_LABELS[role]}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
