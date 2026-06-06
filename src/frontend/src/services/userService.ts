import { AuthError } from "./authService";
import type { ApiError } from "./authService";
import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  coverImageUrl: string | null;
  addressLine1: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  followersCount: number;
  followingCount: number;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  addressLine1?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: ApiError = { code: "UNKNOWN", message: "Request failed." };
    try {
      payload = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new AuthError(res.status, payload);
  }
  return res.json() as Promise<T>;
}

async function handleEmptyResponse(res: Response): Promise<void> {
  if (res.ok) return;

  let payload: ApiError = { code: "UNKNOWN", message: "Request failed." };
  try {
    payload = await res.json();
  } catch {
    // ignore parse errors
  }
  throw new AuthError(res.status, payload);
}

export type AdminUserRole = "User" | "Admin";

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  roles: string[];
}

export interface AdminUsersQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  role?: AdminUserRole;
  sortBy?: "FullName" | "CreatedAt" | "Email";
  sortOrder?: "Asc" | "Desc";
}

export interface CreateAdminUserRequest {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRole;
}

export interface UpdateAdminUserRequest {
  fullName?: string;
  role?: AdminUserRole;
}

/** GET /api/User_Management — paged user list (admin only) */
export async function getAdminUsers(
  query: AdminUsersQuery = {}
): Promise<PagedResult<AdminUserResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  if (query.isActive !== undefined) params.set("IsActive", String(query.isActive));
  if (query.role) params.set("Role", query.role);
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.sortOrder) params.set("SortOrder", query.sortOrder);

  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/User_Management${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<AdminUserResponse>>(res);
}

/** POST /api/User_Management — create user (admin only) */
export async function createAdminUser(request: CreateAdminUserRequest): Promise<AdminUserResponse> {
  const formData = new FormData();
  formData.append("UserName", request.userName);
  formData.append("FullName", request.fullName);
  formData.append("Email", request.email);
  formData.append("Password", request.password);
  formData.append("Role", request.role);

  const res = await fetch(`${BASE_URL}/User_Management`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  return handleResponse<AdminUserResponse>(res);
}

/** PATCH /api/User_Management/{userId} — update user (admin only) */
export async function updateAdminUser(
  userId: string,
  request: UpdateAdminUserRequest
): Promise<AdminUserResponse> {
  const formData = new FormData();
  if (request.fullName !== undefined) formData.append("FullName", request.fullName);
  if (request.role !== undefined) formData.append("Role", request.role);

  const res = await fetch(`${BASE_URL}/User_Management/${userId}`, {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });
  return handleResponse<AdminUserResponse>(res);
}

/** DELETE /api/User_Management/{userId} — delete user (admin only) */
export async function deleteAdminUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/User_Management/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** PATCH /api/User_Management/{userId}/block — block user (admin only) */
export async function blockAdminUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/User_Management/${userId}/block`, {
    method: "PATCH",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** PATCH /api/User_Management/{userId}/unlock — unblock user (admin only) */
export async function unlockAdminUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/User_Management/${userId}/unlock`, {
    method: "PATCH",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** GET /api/me — current user profile */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<UserProfileResponse>(res);
}

export async function getPublicProfile(userId: string): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE_URL}/profiles/${userId}`, {
    method: "GET",
  });
  return handleResponse<UserProfileResponse>(res);
}

/** PATCH /api/me — update current user profile (partial) */
export async function updateMyProfile(request: UpdateUserProfileRequest): Promise<void> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** PUT /api/me/profile-image — upload a new avatar */
export async function updateProfileImage(image: File): Promise<void> {
  const formData = new FormData();
  formData.append("Image", image);

  const res = await fetch(`${BASE_URL}/me/profile-image`, {
    method: "PUT",
    body: formData,
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** DELETE /api/me/profile-image — remove current avatar */
export async function deleteProfileImage(): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/profile-image`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** PUT /api/me/cover-image — upload a new cover image */
export async function updateCoverImage(image: File): Promise<void> {
  const formData = new FormData();
  formData.append("Image", image);

  const res = await fetch(`${BASE_URL}/me/cover-image`, {
    method: "PUT",
    body: formData,
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** DELETE /api/me/cover-image — remove current cover image */
export async function deleteCoverImage(): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/cover-image`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}
