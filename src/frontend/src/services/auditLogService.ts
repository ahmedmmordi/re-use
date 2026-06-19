import { AuthError } from "./authService";
import type { ApiError } from "./authService";
import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Enum types (must match the C# enum member names exactly — they are bound
//    directly from the query string to the backend enums) ────────────────────

export type LogSeverity = "Info" | "Warning" | "Error" | "Critical";

export type LogStatus = "Success" | "Failure" | "Partial";

export type LogCategory =
  | "Authentication"
  | "UserManagement"
  | "ContentModeration"
  | "ProductManagement"
  | "OrderManagement"
  | "PaymentManagement"
  | "SystemConfiguration"
  | "DataAccess"
  | "Security"
  | "General";

export type LogActionType =
  // Authentication
  | "Login"
  | "Logout"
  | "LoginFailed"
  | "PasswordChanged"
  | "PasswordReset"
  | "TokenRefresh"
  // User Management
  | "UserCreated"
  | "UserUpdated"
  | "UserDeactivated"
  | "UserReactivated"
  | "UserDeleted"
  | "RoleAssigned"
  | "RoleRevoked"
  // Content / Product Moderation
  | "ProductApproved"
  | "ProductRejected"
  | "ProductDeleted"
  | "ProductRestored"
  | "PremiumGranted"
  | "PremiumRemoved"
  | "CommentDeleted"
  | "FeedbackDeleted"
  | "CategoryCreated"
  | "CategoryUpdated"
  | "CategoryDeleted"
  // Reports
  | "ReportCreated"
  | "ReportReviewed"
  // Security
  | "UnauthorizedAccess"
  | "PermissionDenied"
  // Payments
  | "PaymentSuccess"
  | "PaymentFailed"
  // System / Infrastructure
  | "SettingUpdated"
  | "DataExported"
  | "InfrastructureFailure"
  | "UnhandledException"
  | "Other";

export type SystemActivityLogSortBy = "newest" | "oldest" | "severity";

// ── Response types ────────────────────────────────────────────────────────────

export interface SystemActivityLogResponse {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actionType: LogActionType;
  category: LogCategory;
  entityType: string | null;
  entityId: string | null;
  severity: LogSeverity;
  status: LogStatus;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
}

// ── Query / request types ─────────────────────────────────────────────────────

export interface SystemActivityLogQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SystemActivityLogSortBy;
  actorUserId?: string;
  actionType?: LogActionType;
  category?: LogCategory;
  severity?: LogSeverity;
  status?: LogStatus;
  entityType?: string;
  entityId?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
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

function buildQueryString(query: SystemActivityLogQuery): string {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.actorUserId) params.set("ActorUserId", query.actorUserId);
  if (query.actionType) params.set("ActionType", query.actionType);
  if (query.category) params.set("Category", query.category);
  if (query.severity) params.set("Severity", query.severity);
  if (query.status) params.set("Status", query.status);
  if (query.entityType) params.set("EntityType", query.entityType);
  if (query.entityId) params.set("EntityId", query.entityId);
  if (query.createdFrom) params.set("CreatedFrom", query.createdFrom);
  if (query.createdTo) params.set("CreatedTo", query.createdTo);
  if (query.search) params.set("Search", query.search);
  return params.toString();
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/system-activity-logs — paged system activity logs (admin only) */
export async function getSystemActivityLogs(
  query: SystemActivityLogQuery = {}
): Promise<PagedResult<SystemActivityLogResponse>> {
  const qs = buildQueryString(query);
  const res = await fetch(`${BASE_URL}/system-activity-logs${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<SystemActivityLogResponse>>(res);
}

/** GET /api/system-activity-logs/{logId} — single log detail (admin only) */
export async function getSystemActivityLogById(logId: string): Promise<SystemActivityLogResponse> {
  const res = await fetch(`${BASE_URL}/system-activity-logs/${logId}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<SystemActivityLogResponse>(res);
}

// ── Display helpers ───────────────────────────────────────────────────────────

/** "PasswordChanged" -> "Password Changed" */
export function humanizeEnumValue(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

export const SEVERITY_BADGE: Record<LogSeverity, string> = {
  Info: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  Warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  Error: "bg-red-100 text-red-700 hover:bg-red-100",
  Critical: "bg-red-200 text-red-900 hover:bg-red-200",
};

export const STATUS_BADGE: Record<LogStatus, string> = {
  Success: "bg-green-100 text-green-700 hover:bg-green-100",
  Failure: "bg-red-100 text-red-700 hover:bg-red-100",
  Partial: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
};

export const CATEGORY_OPTIONS: LogCategory[] = [
  "Authentication",
  "UserManagement",
  "ContentModeration",
  "ProductManagement",
  "OrderManagement",
  "PaymentManagement",
  "SystemConfiguration",
  "DataAccess",
  "Security",
  "General",
];

export const ACTION_TYPE_GROUPS: { label: string; actions: LogActionType[] }[] = [
  {
    label: "Authentication",
    actions: ["Login", "Logout", "LoginFailed", "PasswordChanged", "PasswordReset", "TokenRefresh"],
  },
  {
    label: "User Management",
    actions: [
      "UserCreated",
      "UserUpdated",
      "UserDeactivated",
      "UserReactivated",
      "UserDeleted",
      "RoleAssigned",
      "RoleRevoked",
    ],
  },
  {
    label: "Content / Product Moderation",
    actions: [
      "ProductApproved",
      "ProductRejected",
      "ProductDeleted",
      "ProductRestored",
      "PremiumGranted",
      "PremiumRemoved",
      "CommentDeleted",
      "FeedbackDeleted",
      "CategoryCreated",
      "CategoryUpdated",
      "CategoryDeleted",
    ],
  },
  { label: "Reports", actions: ["ReportCreated", "ReportReviewed"] },
  { label: "Security", actions: ["UnauthorizedAccess", "PermissionDenied"] },
  { label: "Payments", actions: ["PaymentSuccess", "PaymentFailed"] },
  {
    label: "System / Infrastructure",
    actions: [
      "SettingUpdated",
      "DataExported",
      "InfrastructureFailure",
      "UnhandledException",
      "Other",
    ],
  },
];
