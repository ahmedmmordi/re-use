const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SignUpRequest {
  userName: string;
  fullName: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]> | string;
}

export class AuthError extends Error {
  code: string;
  errors?: Record<string, string[]> | string;
  status: number;

  constructor(status: number, payload: ApiError) {
    super(payload.message);
    this.name = "AuthError";
    this.code = payload.code;
    this.errors = payload.errors;
    this.status = status;
  }
}

export type UserRole = "user" | "admin";

export interface AuthUser {
  email: string;
  role: UserRole;
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/sessions/me`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<AuthUser>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: ApiError = { code: "UNKNOWN", message: "An unexpected error occurred." };
    try {
      payload = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new AuthError(res.status, payload);
  }
  return res.json() as Promise<T>;
}

export async function signUpApi(data: SignUpRequest): Promise<SignUpResponse> {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<SignUpResponse>(res);
}

/** POST /api/Sessions — Login */
export async function loginApi(credentials: LoginRequest): Promise<void> {
  const res = await fetch(`${BASE_URL}/Sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include",
  });
  if (!res.ok) {
    await handleResponse(res); // reuse error logic
  }
}

//
// /** DELETE /api/Sessions — Logout */
export async function logoutApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/Sessions`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  // 204 = success, no body
  if (res.ok) return;

  let payload: ApiError = { code: "UNKNOWN", message: "Logout failed." };
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  throw new AuthError(res.status, payload);
}

//
/** POST /api/Sessions/refresh — Refresh tokens */
export async function refreshApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/Sessions/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (res.ok) return;

  let payload: ApiError = { code: "UNKNOWN", message: "Logout failed." };
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  throw new AuthError(res.status, payload);
}
