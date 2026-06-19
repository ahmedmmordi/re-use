import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: string;
  data: unknown;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getNotifications(
  pageNumber = 1,
  pageSize = 15
): Promise<PagedResult<NotificationDto>> {
  const params = new URLSearchParams({
    "Pagination.PageNumber": String(pageNumber),
    "Pagination.PageSize": String(pageSize),
  });
  const res = await fetch(`${BASE_URL}/notifications?${params}`, { credentials: "include" });
  return handleResponse(res);
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`, { credentials: "include" });
  return handleResponse<number>(res);
}

export async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed");
}
