import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CommentAuthorResponse {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

export interface CommentResponse {
  id: string;
  productId: string;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string | null;
  isEdited: boolean;
  replyCount: number;
  author: CommentAuthorResponse;
}

export interface CommentsQuery {
  pageNumber?: number;
  pageSize?: number;
  sortDirection?: "Asc" | "Desc";
}

export interface CreateCommentRequest {
  body: string;
  parentCommentId?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getProductComments(
  productId: string,
  query: CommentsQuery = {}
): Promise<PagedResult<CommentResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const url = `${BASE_URL}/products/${productId}/comments${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<CommentResponse>>(res);
}

export async function getCommentReplies(
  productId: string,
  commentId: string,
  query: CommentsQuery = {}
): Promise<PagedResult<CommentResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const url = `${BASE_URL}/products/${productId}/comments/${commentId}/replies${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<CommentResponse>>(res);
}

export async function addProductComment(
  productId: string,
  request: CreateCommentRequest
): Promise<CommentResponse> {
  const res = await fetch(`${BASE_URL}/products/${productId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    credentials: "include",
  });
  return handleResponse<CommentResponse>(res);
}
