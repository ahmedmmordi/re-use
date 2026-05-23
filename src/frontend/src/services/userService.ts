import { AuthError } from "./authService";
import type { ApiError } from "./authService";

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
