import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FeedbackUserResponse {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

export interface FeedbackResponse {
  id: string;
  productId: string;
  productTitle: string;
  stars: number;
  comment: string;
  createdAt: string;
  rater: FeedbackUserResponse;
  ratee: FeedbackUserResponse;
}

export interface CreateFeedbackRequest {
  rateeUserId: string;
  stars: number;
  comment: string;
}

export interface UserFeedbackSummaryResponse {
  average: number;
  count: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

/** POST /api/products/{productId}/feedback — Leave feedback for a transaction */
export async function createFeedback(
  productId: string,
  request: CreateFeedbackRequest
): Promise<FeedbackResponse> {
  const res = await fetch(`${BASE_URL}/products/${productId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<FeedbackResponse>(res);
}

/** GET /api/products/{productId}/feedback — Get feedback left for a product */
export async function getProductFeedback(productId: string): Promise<FeedbackResponse[]> {
  const res = await fetch(`${BASE_URL}/products/${productId}/feedback`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<FeedbackResponse[]>(res);
}

/** GET /api/users/{userId}/feedback — Get feedback received by a user (paginated) */
export async function getUserFeedback(
  userId: string,
  pageNumber = 1,
  pageSize = 10
): Promise<PagedResult<FeedbackResponse>> {
  const params = new URLSearchParams();
  params.set("Pagination.PageNumber", String(pageNumber));
  params.set("Pagination.PageSize", String(pageSize));
  const res = await fetch(`${BASE_URL}/users/${userId}/feedback?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<FeedbackResponse>>(res);
}

/** GET /api/users/{userId}/feedback/summary — Get summary aggregates for user reviews */
export async function getUserFeedbackSummary(userId: string): Promise<UserFeedbackSummaryResponse> {
  const res = await fetch(`${BASE_URL}/users/${userId}/feedback/summary`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<UserFeedbackSummaryResponse>(res);
}
