import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Download,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  X,
  ExternalLink,
  User as UserIcon,
  Bot,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import { Pagination } from "./ui/Pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  getSystemActivityLogs,
  getSystemActivityLogById,
  humanizeEnumValue,
  SEVERITY_BADGE,
  STATUS_BADGE,
  CATEGORY_OPTIONS,
  ACTION_TYPE_GROUPS,
  type SystemActivityLogResponse,
  type SystemActivityLogSortBy,
  type LogSeverity,
  type LogStatus,
  type LogCategory,
  type LogActionType,
} from "../services/auditLogService";
import { AuthError } from "../services/authService";
import { getMyProfile } from "../services/userService";

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 50; // safety cap (~5,000 rows)

type Banner = { kind: "success"; message: string } | { kind: "error"; message: string } | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  if (err instanceof AuthError && !err.message && err.errors) {
    if (typeof err.errors === "string") return err.errors;
    const first = Object.values(err.errors).flat()[0];
    if (first) return first;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function getEntityUrl(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "Product") return `/product/${entityId}`;
  if (entityType === "User") return `/profile/${entityId}`;
  return null;
}

function SeverityIcon({ severity }: { severity: LogSeverity }) {
  switch (severity) {
    case "Critical":
      return <ShieldAlert className="w-5 h-5" />;
    case "Error":
      return <XCircle className="w-5 h-5" />;
    case "Warning":
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <CheckCircle className="w-5 h-5" />;
  }
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function logsToCsv(logs: SystemActivityLogResponse[]): string {
  const header = [
    "Date",
    "Severity",
    "Status",
    "Category",
    "Action",
    "Description",
    "Actor Name",
    "Actor Email",
    "Entity Type",
    "Entity Id",
    "IP Address",
  ];
  const rows = logs.map((l) =>
    [
      l.createdAt,
      l.severity,
      l.status,
      l.category,
      l.actionType,
      l.description,
      l.actorName ?? "",
      l.actorEmail ?? "",
      l.entityType ?? "",
      l.entityId ?? "",
      l.ipAddress ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LogsAuditPage() {
  const navigate = useNavigate();
  const loadLogsRequestId = useRef(0);

  // List
  const [logs, setLogs] = useState<SystemActivityLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Stats (independent of filters)
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [criticalCount, setCriticalCount] = useState<number | null>(null);
  const [failureCount, setFailureCount] = useState<number | null>(null);
  const [warningCount, setWarningCount] = useState<number | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SystemActivityLogSortBy>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Hide-own-activity
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [excludeOwnActivity, setExcludeOwnActivity] = useState(false);

  const hasActiveFilters =
    searchInput !== "" ||
    categoryFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all" ||
    actionTypeFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    excludeOwnActivity;

  // Banner
  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailLog, setDetailLog] = useState<SystemActivityLogResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // ── Banner helper ──────────────────────────────────────────────────────────

  const showBanner = (b: Banner) => {
    setBanner(b);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 4000);
  };

  useEffect(
    () => () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    },
    []
  );

  // Debounce free-text search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // ── Data loading ───────────────────────────────────────────────────────────

  const currentFilters = () => ({
    search: searchTerm || undefined,
    category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
    severity: severityFilter !== "all" ? (severityFilter as LogSeverity) : undefined,
    status: statusFilter !== "all" ? (statusFilter as LogStatus) : undefined,
    actionType: actionTypeFilter !== "all" ? (actionTypeFilter as LogActionType) : undefined,
    createdFrom: dateFrom ? new Date(`${dateFrom}T00:00:00.000`).toISOString() : undefined,
    createdTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
    sortBy,
  });

  const loadLogs = async () => {
    const requestId = ++loadLogsRequestId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getSystemActivityLogs({
        pageNumber,
        pageSize: PAGE_SIZE,
        ...currentFilters(),
      });
      if (requestId !== loadLogsRequestId.current) return; // ignore stale response
      setLogs(result.data);
      setTotalPages(Math.max(1, result.totalPages));
      setTotalRecords(result.totalRecords);
    } catch (err) {
      if (requestId !== loadLogsRequestId.current) return;
      setLoadError(getErrorMessage(err));
    } finally {
      if (requestId === loadLogsRequestId.current) setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [all, critical, failures, warnings] = await Promise.all([
        getSystemActivityLogs({ pageSize: 1 }),
        getSystemActivityLogs({ pageSize: 1, severity: "Critical" }),
        getSystemActivityLogs({ pageSize: 1, status: "Failure" }),
        getSystemActivityLogs({ pageSize: 1, severity: "Warning" }),
      ]);
      setTotalCount(all.totalRecords);
      setCriticalCount(critical.totalRecords);
      setFailureCount(failures.totalRecords);
      setWarningCount(warnings.totalRecords);
    } catch {
      /* stats are non-critical */
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageNumber,
    searchTerm,
    categoryFilter,
    severityFilter,
    statusFilter,
    actionTypeFilter,
    sortBy,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    loadStats();
    getMyProfile()
      .then((p) => setCurrentUserId(p.id))
      .catch(() => {
        /* ignore — toggle simply stays unavailable */
      });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openDetail = async (log: SystemActivityLogResponse) => {
    setDetailLog(null);
    setIsLoadingDetail(true);
    setShowDetail(true);
    try {
      const detail = await getSystemActivityLogById(log.id);
      setDetailLog(detail);
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
      setShowDetail(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setCategoryFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
    setActionTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setExcludeOwnActivity(false);
    setPageNumber(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const collected: SystemActivityLogResponse[] = [];
      let page = 1;
      while (page <= EXPORT_MAX_PAGES) {
        const result = await getSystemActivityLogs({
          pageNumber: page,
          pageSize: EXPORT_PAGE_SIZE,
          ...currentFilters(),
        });
        const pageRows =
          excludeOwnActivity && currentUserId
            ? result.data.filter((l) => l.actorUserId !== currentUserId)
            : result.data;
        collected.push(...pageRows);
        if (!result.hasNext) break;
        page += 1;
      }
      const csv = logsToCsv(collected);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadCsv(`system-activity-logs-${stamp}.csv`, csv);
      showBanner({
        kind: "success",
        message: `Exported ${collected.length} log entr${collected.length === 1 ? "y" : "ies"}`,
      });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayedLogs =
    excludeOwnActivity && currentUserId
      ? logs.filter((l) => l.actorUserId !== currentUserId)
      : logs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Banner */}
        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              banner.kind === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {banner.kind === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {banner.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Logs & Audit Trail</h1>
              <p className="text-gray-600 text-lg">Monitor and review system activity logs</p>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? "Exporting…" : "Export Logs"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Total Events</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCount ?? "—"}</p>
            <p className="text-sm text-gray-500 mt-2">All recorded activity</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Critical</span>
              <ShieldAlert className="w-5 h-5 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{criticalCount ?? "—"}</p>
            <p className="text-sm text-red-700 mt-2">Needs immediate attention</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Failures</span>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{failureCount ?? "—"}</p>
            <p className="text-sm text-red-600 mt-2">Failed operations</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Warnings</span>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{warningCount ?? "—"}</p>
            <p className="text-sm text-yellow-600 mt-2">Monitor closely</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by description, action, or entity type…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:border-[#3d2e7c] focus:ring-[#3d2e7c]"
              />
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SystemActivityLogSortBy)}>
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="severity">By Severity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {humanizeEnumValue(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(v) => {
                setSeverityFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[170px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Error">Error</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[170px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Failure">Failure</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={actionTypeFilter}
              onValueChange={(v) => {
                setActionTypeFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_TYPE_GROUPS.map((group, idx) => (
                  <SelectGroup key={group.label}>
                    {idx > 0 && <SelectSeparator />}
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.actions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {humanizeEnumValue(a)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPageNumber(1);
                }}
                className="h-11 bg-gray-50 border-gray-200 w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPageNumber(1);
                }}
                className="h-11 bg-gray-50 border-gray-200 w-auto"
              />
            </div>

            <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
              <Checkbox
                checked={excludeOwnActivity}
                onCheckedChange={(checked) => setExcludeOwnActivity(checked === true)}
                disabled={!currentUserId}
              />
              <span className="text-sm text-gray-600 font-medium">Hide my own activity</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading logs…</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{loadError}</p>
            </div>
          ) : displayedLogs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No logs found</p>
              <p className="text-gray-400 text-sm">
                {excludeOwnActivity && logs.length > 0
                  ? "All logs on this page belong to your own activity"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayedLogs.map((log) => {
                const isSystemActor = !log.actorUserId;
                return (
                  <div
                    key={log.id}
                    className="p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    onClick={() => openDetail(log)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl flex-shrink-0 ${SEVERITY_BADGE[log.severity].split(" ").slice(0, 2).join(" ")}`}
                      >
                        <SeverityIcon severity={log.severity} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-bold text-gray-900">
                            {humanizeEnumValue(log.actionType)}
                          </h4>
                          <Badge className={STATUS_BADGE[log.status]}>{log.status}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {humanizeEnumValue(log.category)}
                          </Badge>
                          {log.severity === "Critical" && (
                            <Badge className={SEVERITY_BADGE.Critical}>Critical</Badge>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 break-words">{log.description}</p>

                        <div className="flex items-center gap-6 text-sm flex-wrap">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border border-gray-200">
                              <AvatarFallback className="text-[10px]">
                                {isSystemActor ? (
                                  <Bot className="w-3 h-3" />
                                ) : (
                                  initials(log.actorName ?? "?")
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-700 font-medium">
                              {isSystemActor
                                ? "System"
                                : (log.actorName ?? log.actorEmail ?? "Unknown")}
                            </span>
                          </div>
                          {log.entityType && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <FileText className="w-4 h-4" />
                              {log.entityType}
                              {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(log.createdAt)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(log);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {!isLoading && !loadError && (
          <>
            <p className="text-sm text-gray-500 text-center mt-6">
              Showing {displayedLogs.length} of {totalRecords} log entr
              {totalRecords === 1 ? "y" : "ies"}
            </p>
            <Pagination
              currentPage={pageNumber}
              totalPages={totalPages}
              onPageChange={setPageNumber}
            />
          </>
        )}
      </div>

      {/* ── Detail modal ───────────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-900">Log Details</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Full record of this system activity event.</p>

            {isLoadingDetail ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
              </div>
            ) : detailLog ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={SEVERITY_BADGE[detailLog.severity]}>{detailLog.severity}</Badge>
                  <Badge className={STATUS_BADGE[detailLog.status]}>{detailLog.status}</Badge>
                  <Badge variant="outline">{humanizeEnumValue(detailLog.category)}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1.5">Action</p>
                  <p className="text-base font-semibold text-gray-900">
                    {humanizeEnumValue(detailLog.actionType)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {detailLog.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Actor</p>
                    {detailLog.actorUserId ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-gray-200">
                          <AvatarFallback className="text-xs">
                            {initials(detailLog.actorName ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p
                            onClick={() => {
                              navigate(`/profile/${detailLog.actorUserId}`);
                              setShowDetail(false);
                            }}
                            className="text-sm font-medium text-[#3d2e7c] underline cursor-pointer truncate flex items-center gap-1"
                          >
                            {detailLog.actorName ?? "Unknown"}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </p>
                          <p className="text-xs text-gray-400 truncate">{detailLog.actorEmail}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bot className="w-5 h-5" />
                        <span className="text-sm font-medium">System</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Entity</p>
                    {detailLog.entityType ? (
                      (() => {
                        const url = getEntityUrl(detailLog.entityType, detailLog.entityId);
                        return (
                          <div
                            className={`flex items-center gap-2${url ? " cursor-pointer w-fit" : ""}`}
                            onClick={
                              url
                                ? () => {
                                    navigate(url);
                                    setShowDetail(false);
                                  }
                                : undefined
                            }
                          >
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span
                              className={`text-sm flex items-center gap-1 ${url ? "text-[#3d2e7c] underline" : "text-gray-900"}`}
                            >
                              {detailLog.entityType}
                              {url && <ExternalLink className="w-3 h-3" />}
                            </span>
                            {detailLog.entityId && (
                              <span className="text-xs text-gray-400 font-mono truncate">
                                {detailLog.entityId}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Date</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(detailLog.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">IP Address</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {detailLog.ipAddress ?? "—"}
                    </span>
                  </div>
                </div>

                {detailLog.userAgent && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1.5">User Agent</p>
                    <p className="text-xs text-gray-600 break-words font-mono">
                      {detailLog.userAgent}
                    </p>
                  </div>
                )}

                {detailLog.metadata && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1.5">Metadata</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(detailLog.metadata), null, 2);
                        } catch {
                          return detailLog.metadata;
                        }
                      })()}
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-500">Log ID</span>
                  <span className="text-xs text-gray-500 font-mono">{detailLog.id}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
