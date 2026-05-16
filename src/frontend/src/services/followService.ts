import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FollowUserResponse {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  bio: string | null;
  followersCount: number;
}

export interface FollowResultResponse {
  followingId: string;
  fullName: string;
  isNowFollowing: boolean;
}

export interface FollowsQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

function buildQuery(query: FollowsQuery): string {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getFollowers(
  query: FollowsQuery = {}
): Promise<PagedResult<FollowUserResponse>> {
  const res = await fetch(`${BASE_URL}/me/followers${buildQuery(query)}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<FollowUserResponse>>(res);
}

export async function getFollowing(
  query: FollowsQuery = {}
): Promise<PagedResult<FollowUserResponse>> {
  const res = await fetch(`${BASE_URL}/me/following${buildQuery(query)}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<FollowUserResponse>>(res);
}

export async function followUser(userId: string): Promise<FollowResultResponse> {
  const res = await fetch(`${BASE_URL}/me/following/${userId}`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<FollowResultResponse>(res);
}

export async function unfollowUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/following/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}

export async function removeFollower(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/followers/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}
