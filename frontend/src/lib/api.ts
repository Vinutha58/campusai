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
  if (res.status === 204) {
    return undefined as T;
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

// Admin: courses oversight
export function getAllCourses() {
  return authedJson<Course[]>("/api/courses/all");
}

// Admin: user management
export function getAdminUsers(role?: Role) {
  return authedJson<AuthUser[]>(`/api/admin/users${role ? `?role=${role}` : ""}`);
}

export function updateUserRole(userId: string, role: Role) {
  return authedJson<AuthUser>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateUserActive(userId: string, isActive: boolean) {
  return authedJson<AuthUser>(`/api/admin/users/${userId}/active`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

// Admin: analytics
export type AcademicAnalytics = {
  total_courses: number;
  total_students: number;
  total_faculty: number;
  total_assignments: number;
  total_quizzes: number;
  avg_attendance_percent: number;
};

export function getAcademicAnalytics() {
  return authedJson<AcademicAnalytics>("/api/admin/analytics/academic");
}

export type PlatformStats = {
  students: number;
  faculty: number;
  placement_officers: number;
  admins: number;
  total_courses: number;
  total_companies: number;
  total_drives: number;
  total_applications: number;
};

export function getPlatformAnalytics() {
  return authedJson<PlatformStats>("/api/admin/analytics/platform");
}

// Admin: platform settings
export type PlatformSettings = { college_name: string; college_domain: string };

export function getPlatformSettings() {
  return authedJson<PlatformSettings>("/api/admin/settings");
}

export function updatePlatformSettings(input: PlatformSettings) {
  return authedJson<PlatformSettings>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Admin: AI configuration
export type AIProviderName = "openai" | "gemini" | "claude";

export type AIConfig = {
  provider: AIProviderName | null;
  has_key: boolean;
  key_preview: string | null;
};

export function getAIConfig() {
  return authedJson<AIConfig>("/api/admin/ai-config");
}

export function updateAIConfig(input: { provider: AIProviderName; api_key?: string }) {
  return authedJson<AIConfig>("/api/admin/ai-config", { method: "PUT", body: JSON.stringify(input) });
}

// Campus Network: profiles
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  skills: string[];
  certifications: string[];
  achievements: string[];
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_me: boolean;
};

export type ProfileInput = {
  bio: string;
  skills: string[];
  certifications: string[];
  achievements: string[];
};

export function getMyProfile() {
  return authedJson<Profile>("/api/network/profile/me");
}

export function updateMyProfile(input: ProfileInput) {
  return authedJson<Profile>("/api/network/profile/me", { method: "PUT", body: JSON.stringify(input) });
}

export function getProfile(userId: string) {
  return authedJson<Profile>(`/api/network/profile/${userId}`);
}

export function discoverPeople() {
  return authedJson<Profile[]>("/api/network/people");
}

export function followUser(userId: string) {
  return authedJson<Profile>(`/api/network/follow/${userId}`, { method: "POST" });
}

export function unfollowUser(userId: string) {
  return authedJson<Profile>(`/api/network/follow/${userId}`, { method: "DELETE" });
}

// Campus Network: posts
export type PostCategory = "general" | "achievement" | "certification" | "internship" | "placement" | "academic";

export type Comment = {
  id: string;
  author_id: string;
  author_name: string;
  text: string;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  category: PostCategory;
  like_count: number;
  liked_by_me: boolean;
  comments: Comment[];
  created_at: string;
};

export function getFeed() {
  return authedJson<Post[]>("/api/network/feed");
}

export function createPost(input: { content: string; category: PostCategory }) {
  return authedJson<Post>("/api/network/posts", { method: "POST", body: JSON.stringify(input) });
}

export function deletePost(postId: string) {
  return authedJson<void>(`/api/network/posts/${postId}`, { method: "DELETE" });
}

export function toggleLike(postId: string) {
  return authedJson<Post>(`/api/network/posts/${postId}/like`, { method: "POST" });
}

export function addComment(postId: string, text: string) {
  return authedJson<Post>(`/api/network/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// Messaging
export type Conversation = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_role: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
};

export type UserSearchResult = { id: string; name: string; email: string; role: string };

export function getConversations() {
  return authedJson<Conversation[]>("/api/messages/conversations");
}

export function startConversation(otherUserId: string) {
  return authedJson<Conversation>("/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ other_user_id: otherUserId }),
  });
}

export function getMessages(conversationId: string) {
  return authedJson<Message[]>(`/api/messages/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, text: string) {
  return authedJson<Message>(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function searchUsersToMessage(q: string) {
  return authedJson<UserSearchResult[]>(`/api/messages/search?q=${encodeURIComponent(q)}`);
}

// Notifications
export type NotificationType =
  | "assignment"
  | "material"
  | "quiz"
  | "marks"
  | "attendance"
  | "placement"
  | "application"
  | "network"
  | "message"
  | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function getNotifications() {
  return authedJson<Notification[]>("/api/notifications");
}

export function getUnreadNotificationCount() {
  return authedJson<{ count: number }>("/api/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return authedJson<Notification>(`/api/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return authedJson<{ status: string }>("/api/notifications/read-all", { method: "POST" });
}

// CampusGPT
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ChatExchange = {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
};

export function getChatHistory() {
  return authedJson<ChatMessage[]>("/api/campusgpt/messages");
}

export function sendChatMessage(content: string) {
  return authedJson<ChatExchange>("/api/campusgpt/messages", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function clearChatHistory() {
  return authedJson<void>("/api/campusgpt/messages", { method: "DELETE" });
}

// Search
export type SearchCategory = "people" | "courses" | "companies" | "opportunities" | "posts" | "materials";

export type SearchResult = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  link: string | null;
};

export function globalSearch(q: string) {
  return authedJson<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`);
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

// Career AI chat (same shape as CampusGPT, separate conversation/endpoint)
export function getCareerChatHistory() {
  return authedJson<ChatMessage[]>("/api/career-ai/messages");
}

export function sendCareerChatMessage(content: string) {
  return authedJson<ChatExchange>("/api/career-ai/messages", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function clearCareerChatHistory() {
  return authedJson<void>("/api/career-ai/messages", { method: "DELETE" });
}

// Resume
export type EducationEntry = { institution: string; degree: string; field: string; start_year: string; end_year: string };
export type ExperienceEntry = { title: string; organization: string; start_date: string; end_date: string; description: string };
export type ProjectEntry = { title: string; description: string; tech: string[]; link: string };
export type ResumeLinks = { github: string; linkedin: string; portfolio: string };

export type Resume = {
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  links: ResumeLinks;
  updated_at: string | null;
};

export type ResumeInput = {
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  links: ResumeLinks;
};

export function getMyResume() {
  return authedJson<Resume>("/api/resume/me");
}

export function updateMyResume(data: ResumeInput) {
  return authedJson<Resume>("/api/resume/me", { method: "PUT", body: JSON.stringify(data) });
}

export function reviewMyResume() {
  return authedJson<{ feedback: string }>("/api/resume/review", { method: "POST" });
}

// Career Roadmap
export type Roadmap = {
  target_role: string;
  content: string;
  generated_at: string;
};

export function getMyRoadmap() {
  return authedJson<Roadmap | null>("/api/roadmap/me");
}

export function generateRoadmap(targetRole: string, notes: string) {
  return authedJson<Roadmap>("/api/roadmap/generate", {
    method: "POST",
    body: JSON.stringify({ target_role: targetRole, notes }),
  });
}

// Interview Preparation
export type InterviewQuestion = { question: string; answer: string | null; feedback: string | null };

export type InterviewSession = {
  id: string;
  topic: string;
  questions: InterviewQuestion[];
  created_at: string;
};

export function getInterviewSessions() {
  return authedJson<InterviewSession[]>("/api/interview/sessions");
}

export function generateInterviewSession(topic: string) {
  return authedJson<InterviewSession>("/api/interview/generate", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
}

export function submitInterviewAnswer(sessionId: string, questionIndex: number, answer: string) {
  return authedJson<InterviewSession>(`/api/interview/sessions/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ question_index: questionIndex, answer }),
  });
}

// Placement Readiness
export type ReadinessFactor = { label: string; score: number; detail: string };

export type Readiness = {
  overall_score: number;
  factors: ReadinessFactor[];
  suggestions: string[];
};

export function getMyReadiness() {
  return authedJson<Readiness>("/api/readiness/me");
}
