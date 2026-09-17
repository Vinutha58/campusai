"use client";

import { useAuth } from "@/lib/auth-context";
import { PlacementAnalyticsView } from "@/components/analytics/PlacementAnalyticsView";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function AdminPlacementAnalyticsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <PlacementAnalyticsView />;
  return <ComingSoon title="Placement Analytics" />;
}
