import { AuthError } from "./authService";
import type { ApiError } from "./authService";
import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Enum types ────────────────────────────────────────────────────────────────

export type ReportStatus = "Pending" | "UnderReview" | "Resolved" | "Dismissed";
export type ReportTargetType = "Product" | "Comment" | "User";
export type ReportReason =
  | "Spam"
  | "Harassment"
  | "HateSpeech"
  | "FakeOrMisleading"
  | "InappropriateContent"
  | "Violence"
  | "ScamOrFraud"
  | "Other";

// ── Response types ────────────────────────────────────────────────────────────

export interface ReportUserResponse {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl: string | null;
}

export interface AdminReportListResponse {
  id: string;
  targetType: ReportTargetType;
  targetId?: string;
  reason: ReportReason;
  status: ReportStatus;
  createdAt?: string;
  reporter: ReportUserResponse;
  reviewedBy: ReportUserResponse | null;
}

export interface ReportDetailsResponse {
  id: string;
  targetType: ReportTargetType;
  targetId?: string;
  reason: ReportReason;
  notes?: string | null;
  targetCommentBody?: string | null;
  status: ReportStatus;
  createdAt?: string;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  reporter: ReportUserResponse;
  reviewedBy: ReportUserResponse | null;
}

// ── Request types ─────────────────────────────────────────────────────────────

export interface AdminReportsQuery {
  pageNumber?: number;
  pageSize?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reporterUserId?: string;
  createdFrom?: string;
  createdTo?: string;
  sortDirection?: "Asc" | "Desc";
}

export type ReviewStatus = Exclude<ReportStatus, "Pending">;

export interface ReviewReportRequest {
  status: ReviewStatus;
  reviewNotes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/admin/reports */
export async function getAdminReports(
  query: AdminReportsQuery = {}
): Promise<PagedResult<AdminReportListResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.status) params.set("Status", query.status);
  if (query.targetType) params.set("TargetType", query.targetType);
  if (query.reporterUserId) params.set("ReporterUserId", query.reporterUserId);
  if (query.createdFrom) params.set("CreatedFrom", query.createdFrom);
  if (query.createdTo) params.set("CreatedTo", query.createdTo);
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/admin/reports${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<AdminReportListResponse>>(res);
}

/** GET /api/admin/reports/{id} */
export async function getAdminReportById(id: string): Promise<ReportDetailsResponse> {
  const res = await fetch(`${BASE_URL}/admin/reports/${id}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ReportDetailsResponse>(res);
}

/** PATCH /api/admin/reports/{id}/review */
export async function reviewReport(
  id: string,
  request: ReviewReportRequest
): Promise<ReportDetailsResponse> {
  const formData = new FormData();
  formData.append("Status", request.status);
  if (request.reviewNotes) formData.append("ReviewNotes", request.reviewNotes);

  const res = await fetch(`${BASE_URL}/admin/reports/${id}/review`, {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });
  return handleResponse<ReportDetailsResponse>(res);
}
