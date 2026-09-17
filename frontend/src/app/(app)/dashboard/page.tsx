"use client";

import { useAuth } from "@/lib/auth-context";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { FacultyDashboard } from "@/components/dashboard/FacultyDashboard";
import { PlacementOfficerDashboard } from "@/components/dashboard/PlacementOfficerDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") {
    return <StudentDashboard />;
  }

  if (user.role === "faculty") {
    return <FacultyDashboard />;
  }

  if (user.role === "placement_officer") {
    return <PlacementOfficerDashboard />;
  }

  return <AdminDashboard />;
}
