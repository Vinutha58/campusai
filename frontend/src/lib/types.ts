export type Role = "student" | "faculty" | "placement_officer" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  placement_officer: "Placement Officer",
  admin: "Administrator",
};

export const ROLES: Role[] = ["student", "faculty", "placement_officer", "admin"];
