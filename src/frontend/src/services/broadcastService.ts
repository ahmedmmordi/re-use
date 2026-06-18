import { AuthError } from "./authService";
import type { ApiError } from "./authService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type BroadcastStatus = "Draft" | "Scheduled" | "Processing" | "Sent" | "Failed";
export type BroadcastAudience = "All" | "Users" | "Admins";

export interface BroadcastResponse {
  id: string;
  title: string;
  body: string;
  targetAudience: BroadcastAudience;
  status: BroadcastStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
}

export interface BroadcastSummaryStats {
  totalSent: number;
  totalScheduled: number;
  totalRecipients: number;
  totalDelivered: number;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface GetBroadcastsParams {
  pageNumber?: number;
  pageSize?: number;
  status?: BroadcastStatus;
}

export interface BroadcastRequest {
  title: string;
  body: string;
  targetAudience: BroadcastAudience;
  scheduledAt: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: ApiError = { code: "UNKNOWN", message: "Request failed." };
    try {
      payload = await res.json();
    } catch {
      /* ignore */
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
    /* ignore */
  }
  throw new AuthError(res.status, payload);
}

function buildFormData(req: BroadcastRequest): FormData {
  const fd = new FormData();
  fd.append("Title", req.title);
  fd.append("Body", req.body);
  fd.append("TargetAudience", req.targetAudience);
  if (req.scheduledAt) fd.append("ScheduledAt", req.scheduledAt);
  return fd;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** GET /api/admin/broadcasts */
export async function getBroadcasts(
  params: GetBroadcastsParams = {}
): Promise<PagedResult<BroadcastResponse>> {
  const qs = new URLSearchParams();
  if (params.pageNumber !== undefined) qs.set("Pagination.PageNumber", String(params.pageNumber));
  if (params.pageSize !== undefined) qs.set("Pagination.PageSize", String(params.pageSize));
  if (params.status) qs.set("Status", params.status);

  const res = await fetch(`${BASE_URL}/admin/broadcasts${qs.toString() ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<BroadcastResponse>>(res);
}

/** GET /api/admin/broadcasts/stats */
export async function getBroadcastStats(): Promise<BroadcastSummaryStats> {
  const res = await fetch(`${BASE_URL}/admin/broadcasts/stats`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<BroadcastSummaryStats>(res);
}

/** POST /api/admin/broadcasts/draft */
export async function createDraft(req: BroadcastRequest): Promise<BroadcastResponse> {
  const res = await fetch(`${BASE_URL}/admin/broadcasts/draft`, {
    method: "POST",
    credentials: "include",
    body: buildFormData(req),
  });
  return handleResponse<BroadcastResponse>(res);
}

/** PUT /api/admin/broadcasts/:id/draft */
export async function updateDraft(id: string, req: BroadcastRequest): Promise<BroadcastResponse> {
  const res = await fetch(`${BASE_URL}/admin/broadcasts/${encodeURIComponent(id)}/draft`, {
    method: "PUT",
    credentials: "include",
    body: buildFormData(req),
  });
  return handleResponse<BroadcastResponse>(res);
}

/** POST /api/admin/broadcasts/send (FormData) */
export async function sendBroadcast(req: BroadcastRequest): Promise<BroadcastResponse> {
  const res = await fetch(`${BASE_URL}/admin/broadcasts/send`, {
    method: "POST",
    credentials: "include",
    body: buildFormData(req),
  });
  return handleResponse<BroadcastResponse>(res);
}

/** POST /api/admin/broadcasts/schedule (JSON) */
export async function scheduleBroadcast(req: BroadcastRequest): Promise<BroadcastResponse> {
  if (!req.scheduledAt) {
    throw new Error("scheduledAt is required for scheduling a broadcast");
  }
  const res = await fetch(`${BASE_URL}/admin/broadcasts/schedule`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: req.title,
      body: req.body,
      targetAudience: req.targetAudience,
      scheduledAt: req.scheduledAt,
    }),
  });
  return handleResponse<BroadcastResponse>(res);
}

/** DELETE /api/admin/broadcasts/:id */
export async function deleteBroadcast(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/broadcasts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}
