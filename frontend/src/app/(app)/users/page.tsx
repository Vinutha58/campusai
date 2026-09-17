"use client";

import { useAuth } from "@/lib/auth-context";
import { AdminUserList } from "@/components/admin/AdminUserList";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function UsersPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminUserList title="All Users" />;
  return <ComingSoon title="Users" />;
}
