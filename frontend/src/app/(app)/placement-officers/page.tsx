"use client";

import { useAuth } from "@/lib/auth-context";
import { AdminUserList } from "@/components/admin/AdminUserList";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function PlacementOfficersPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AdminUserList roleFilter="placement_officer" title="Placement Officers" />;
  return <ComingSoon title="Placement Officers" />;
}
