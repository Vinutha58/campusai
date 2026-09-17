import { getStoredToken } from "./auth-context";
import type { Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  description: string;
  faculty_id: string;
  faculty_name: string;
  student_count: number;
  created_at: string;
};

export type RosterEntry = { id: string; name: string; email: string };

export type AttendanceRecord = {
  id: string;
  course_id: string;
  date: string;
  records: { student_id: string; present: boolean }[];
};

export type Assignment = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  file_name: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
};

export type QuizQuestion = { question: string; options: string[]; correct_index: number };
export type Quiz = { id: string; course_id: string; title: string; questions: QuizQuestion[]; created_at: string };
export type QuizForStudent = {
  id: string;
  course_id: string;
  title: string;
  questions: { question: string; options: string[] }[];
  created_at: string;
};
export type QuizAttemptResult = {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name: string;
  score: number;
  total: number;
  submitted_at: string;
};

export type Material = {
  id: string;
  course_id: string;
  title: string;
  file_name: string;
  uploaded_at: string;
};

export type Mark = {
  id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  assessment_name: string;
  score: number;
  max_score: number;
  updated_at: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.detail ?? "Something went wrong. Please try again.", res.status);
  }
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authedJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isJsonBody = typeof options.body === "string";
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

export function registerUser(input: { name: string; email: string; password: string; role: Role }) {
  return postJson<TokenResponse>("/api/auth/register", input);
}

export function loginUser(input: { email: string; password: string }) {
  return postJson<TokenResponse>("/api/auth/login", input);
}

// Courses
export function getMyCourses() {
  return authedJson<Course[]>("/api/courses/mine");
}

export function getEnrolledCourses() {
  return authedJson<Course[]>("/api/courses/enrolled");
}

export function createCourse(input: { name: string; code: string; description?: string }) {
  return authedJson<Course>("/api/courses", { method: "POST", body: JSON.stringify(input) });
}

export function getRoster(courseId: string) {
  return authedJson<RosterEntry[]>(`/api/courses/${courseId}/roster`);
}

export function addStudentToCourse(courseId: string, email: string) {
  return authedJson<Course>(`/api/courses/${courseId}/students`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function removeStudentFromCourse(courseId: string, studentId: string) {
  return authedJson<Course>(`/api/courses/${courseId}/students/${studentId}`, { method: "DELETE" });
}

// Attendance
export function markAttendance(input: {
  course_id: string;
  date: string;
  records: { student_id: string; present: boolean }[];
}) {
  return authedJson<AttendanceRecord>("/api/attendance/mark", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAttendance(courseId: string) {
  return authedJson<AttendanceRecord[]>(`/api/attendance/course/${courseId}`);
}

// Assignments
export function createAssignment(input: {
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
}) {
  return authedJson<Assignment>("/api/assignments", { method: "POST", body: JSON.stringify(input) });
}

export function getAssignments(courseId: string) {
  return authedJson<Assignment[]>(`/api/assignments/course/${courseId}`);
}

export function submitAssignment(assignmentId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return authedJson<Submission>(`/api/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: form,
  });
}

export function getSubmissions(assignmentId: string) {
  return authedJson<Submission[]>(`/api/assignments/${assignmentId}/submissions`);
}

export function getMySubmission(assignmentId: string) {
  return authedJson<Submission | null>(`/api/assignments/${assignmentId}/my-submission`);
}

export function gradeSubmission(submissionId: string, grade: number, feedback: string) {
  return authedJson<Submission>(`/api/assignments/submissions/${submissionId}/grade`, {
    method: "POST",
    body: JSON.stringify({ grade, feedback }),
  });
}

// Quizzes
export function createQuiz(input: { course_id: string; title: string; questions: QuizQuestion[] }) {
  return authedJson<Quiz>("/api/quizzes", { method: "POST", body: JSON.stringify(input) });
}

export function getQuizzes(courseId: string) {
  return authedJson<Quiz[] | QuizForStudent[]>(`/api/quizzes/course/${courseId}`);
}

export function getQuiz(quizId: string) {
  return authedJson<QuizForStudent>(`/api/quizzes/${quizId}`);
}

export function attemptQuiz(quizId: string, answers: number[]) {
  return authedJson<QuizAttemptResult>(`/api/quizzes/${quizId}/attempt`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function getQuizResults(quizId: string) {
  return authedJson<QuizAttemptResult[]>(`/api/quizzes/${quizId}/results`);
}

export function getMyAttempt(quizId: string) {
  return authedJson<QuizAttemptResult | null>(`/api/quizzes/${quizId}/my-attempt`);
}

// Materials
export function uploadMaterial(courseId: string, title: string, file: File) {
  const form = new FormData();
  form.append("course_id", courseId);
  form.append("title", title);
  form.append("file", file);
  return authedJson<Material>("/api/materials", { method: "POST", body: form });
}

export function getMaterials(courseId: string) {
  return authedJson<Material[]>(`/api/materials/course/${courseId}`);
}

// Marks
export function upsertMark(input: {
  course_id: string;
  student_id: string;
  assessment_name: string;
  score: number;
  max_score: number;
}) {
  return authedJson<Mark>("/api/marks", { method: "POST", body: JSON.stringify(input) });
}

export function getMarks(courseId: string) {
  return authedJson<Mark[]>(`/api/marks/course/${courseId}`);
}

// Companies
export type Company = {
  id: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  location: string;
  created_at: string;
};

export function getCompanies() {
  return authedJson<Company[]>("/api/companies");
}

export function createCompany(input: Omit<Company, "id" | "created_at">) {
  return authedJson<Company>("/api/companies", { method: "POST", body: JSON.stringify(input) });
}

export function updateCompany(id: string, input: Omit<Company, "id" | "created_at">) {
  return authedJson<Company>(`/api/companies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteCompany(id: string) {
  return authedJson<void>(`/api/companies/${id}`, { method: "DELETE" });
}

// Drives
export type Eligibility = {
  min_cgpa: number;
  branches: string[];
  min_year: number;
  max_backlogs: number;
};

export type Drive = {
  id: string;
  company_id: string;
  company_name: string;
  job_role: string;
  package: string;
  location: string;
  eligibility: Eligibility;
  application_deadline: string;
  drive_date: string | null;
  is_open: boolean;
  application_count: number;
  created_at: string;
};

export type DriveInput = {
  company_id: string;
  job_role: string;
  package: string;
  location: string;
  eligibility: Eligibility;
  application_deadline: string;
  drive_date: string | null;
};

export function getDrives(openOnly = false) {
  return authedJson<Drive[]>(`/api/drives${openOnly ? "?open_only=true" : ""}`);
}

export function createDrive(input: DriveInput) {
  return authedJson<Drive>("/api/drives", { method: "POST", body: JSON.stringify(input) });
}

export function updateDrive(id: string, input: DriveInput) {
  return authedJson<Drive>(`/api/drives/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function applyToDrive(id: string) {
  return authedJson<{ status: string }>(`/api/drives/${id}/apply`, { method: "POST" });
}

// Applications
export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "assessment"
  | "interview"
  | "selected"
  | "rejected";

export type Application = {
  id: string;
  drive_id: string;
  company_name: string;
  job_role: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
};

export function getMyApplications() {
  return authedJson<Application[]>("/api/applications/mine");
}

export function getApplicationsForDrive(driveId: string) {
  return authedJson<Application[]>(`/api/applications/drive/${driveId}`);
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return authedJson<Application>(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Students directory (Placement Officer / Admin)
export function getStudentsDirectory() {
  return authedJson<AuthUser[]>("/api/students");
}

// Placement analytics
export type PlacementAnalytics = {
  total_companies: number;
  total_drives: number;
  open_drives: number;
  total_applications: number;
  by_status: Record<string, number>;
  by_company: { company_name: string; applications: number }[];
};

export function getPlacementAnalytics() {
  return authedJson<PlacementAnalytics>("/api/analytics/placement");
}

// Authenticated file download (can't use a plain <a href> since it needs the Bearer header)
export async function downloadFile(path: string, filename: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new ApiError("Couldn't download the file.", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
