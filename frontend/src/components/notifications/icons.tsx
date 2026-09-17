import {
  Award,
  Bell,
  Briefcase,
  CalendarCheck2,
  ClipboardList,
  FolderCog,
  ListChecks,
  MessageSquare,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/lib/api";

export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  assignment: ClipboardList,
  material: FolderCog,
  quiz: Sparkles,
  marks: Award,
  attendance: CalendarCheck2,
  placement: Briefcase,
  application: ListChecks,
  network: Users,
  message: MessageSquare,
  system: Bell,
};
