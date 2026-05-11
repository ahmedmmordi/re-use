import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CategoryFollowResponse {
  categoryId: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  followedAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getFollowedCategories(): Promise<PagedResult<CategoryFollowResponse>> {
  const res = await fetch(`${BASE_URL}/me/category-follows?Pagination.PageSize=200`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<CategoryFollowResponse>>(res);
}

export async function followCategory(categoryId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/category-follows/${categoryId}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}

export async function unfollowCategory(categoryId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/category-follows/${categoryId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}
