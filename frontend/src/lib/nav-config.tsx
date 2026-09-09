import {
  Award,
  Bell,
  Bot,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck2,
  CalendarRange,
  ChartColumn,
  ClipboardList,
  Compass,
  Cpu,
  FileText,
  FolderCog,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  Map,
  MessageSquare,
  Mic,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const studentNav: NavGroup[] = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Academics",
    items: [
      { label: "Smart Classroom", href: "/classroom", icon: GraduationCap },
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Assignments", href: "/assignments", icon: ClipboardList },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
      { label: "Marks", href: "/marks", icon: Award },
      { label: "Quizzes", href: "/quizzes", icon: Sparkles },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "CampusGPT", href: "/campusgpt", icon: Bot },
      { label: "Career AI", href: "/career-ai", icon: Compass },
    ],
  },
  {
    title: "Career",
    items: [
      { label: "Resume", href: "/resume", icon: FileText },
      { label: "Skills", href: "/skills", icon: Sparkles },
      { label: "Certifications", href: "/certifications", icon: Award },
      { label: "Career Roadmap", href: "/career-roadmap", icon: Map },
      { label: "Interview Preparation", href: "/interview-prep", icon: Mic },
      { label: "Placement Readiness", href: "/placement-readiness", icon: Target },
    ],
  },
  {
    title: "Placement",
    items: [
      { label: "Placement Portal", href: "/placements", icon: Briefcase },
      { label: "Applications", href: "/applications", icon: ListChecks },
    ],
  },
  {
    title: "Network",
    items: [
      { label: "Campus Network", href: "/network", icon: Users },
      { label: "Messaging", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Search", href: "/search", icon: Search },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const facultyNav: NavGroup[] = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Academic",
    items: [
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Students", href: "/students", icon: Users },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
      { label: "Assignments", href: "/assignments", icon: ClipboardList },
      { label: "Quizzes", href: "/quizzes", icon: Sparkles },
      { label: "Materials", href: "/materials", icon: FolderCog },
      { label: "Marks", href: "/marks", icon: Award },
    ],
  },
  { title: "AI", items: [{ label: "AI Academic Tools", href: "/ai-tools", icon: Bot }] },
  {
    title: "Communication",
    items: [
      { label: "Messaging", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const placementOfficerNav: NavGroup[] = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Placement",
    items: [
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Placement Drives", href: "/drives", icon: CalendarRange },
      { label: "Opportunities", href: "/opportunities", icon: Layers },
      { label: "Applications", href: "/applications", icon: ListChecks },
      { label: "Students", href: "/students", icon: Users },
      { label: "Analytics", href: "/analytics", icon: ChartColumn },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messaging", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const adminNav: NavGroup[] = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Management",
    items: [
      { label: "Users", href: "/users", icon: UserCog },
      { label: "Students", href: "/students", icon: Users },
      { label: "Faculty", href: "/faculty", icon: GraduationCap },
      { label: "Placement Officers", href: "/placement-officers", icon: ShieldCheck },
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Companies", href: "/companies", icon: Building2 },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Placement", href: "/placements", icon: Briefcase },
      { label: "Campus Network", href: "/network", icon: Users },
      { label: "Content", href: "/content", icon: FolderCog },
      { label: "AI Configuration", href: "/ai-configuration", icon: Cpu },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Academic Analytics", href: "/analytics/academic", icon: ChartColumn },
      { label: "Placement Analytics", href: "/analytics/placement", icon: ChartColumn },
      { label: "Platform Analytics", href: "/analytics/platform", icon: ChartColumn },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
];

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  student: studentNav,
  faculty: facultyNav,
  placement_officer: placementOfficerNav,
  admin: adminNav,
};
