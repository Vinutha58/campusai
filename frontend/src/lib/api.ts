import type { Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type AuthUser = {
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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.detail ?? "Something went wrong. Please try again.", res.status);
  }

  return res.json();
}

export function registerUser(input: { name: string; email: string; password: string; role: Role }) {
  return postJson<TokenResponse>("/api/auth/register", input);
}

export function loginUser(input: { email: string; password: string }) {
  return postJson<TokenResponse>("/api/auth/login", input);
}
