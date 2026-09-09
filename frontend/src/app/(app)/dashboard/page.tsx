"use client";

import { useAuth } from "@/lib/auth-context";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { ROLE_LABELS } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") {
    return <StudentDashboard />;
  }

  return <ComingSoon title={`${ROLE_LABELS[user.role]} Dashboard`} />;
}
