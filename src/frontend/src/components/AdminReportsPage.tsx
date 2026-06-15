import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag,
  AlertCircle,
  CheckCircle,
  Loader2,
  MoreVertical,
  Eye,
  ClipboardCheck,
  Package,
  MessageSquare,
  User,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { Pagination } from "./ui/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Textarea } from "./ui/textarea";
import {
  getAdminReports,
  getAdminReportById,
  reviewReport,
  type AdminReportListResponse,
  type ReportDetailsResponse,
  type ReportStatus,
  type ReportTargetType,
  type ReviewStatus,
} from "../services/reportService";
import { AuthError } from "../services/authService";

const PAGE_SIZE = 10;

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

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const REASON_LABELS: Record<string, string> = {
  Spam: "Spam",
  Harassment: "Harassment",
  HateSpeech: "Hate Speech",
  FakeOrMisleading: "Fake or Misleading",
  InappropriateContent: "Inappropriate Content",
  Violence: "Violence",
  ScamOrFraud: "Scam or Fraud",
  Other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  UnderReview: "Under Review",
  Resolved: "Resolved",
  Dismissed: "Dismissed",
};

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  UnderReview: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  Resolved: "bg-green-100 text-green-700 hover:bg-green-100",
  Dismissed: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

function TargetIcon({ type }: { type: ReportTargetType }) {
  if (type === "Product") return <Package className="w-4 h-4" />;
  if (type === "Comment") return <MessageSquare className="w-4 h-4" />;
  return <User className="w-4 h-4" />;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function getTargetUrl(type: ReportTargetType, id?: string): string | null {
  if (!id) return null;
  if (type === "Product") return `/product/${id}`;
  if (type === "User") return `/profile/${id}`;
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
  const navigate = useNavigate();

  // List
  const [reports, setReports] = useState<AdminReportListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [resolvedCount, setResolvedCount] = useState<number | null>(null);
  const [dismissedCount, setDismissedCount] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");

  // Banner
  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailReport, setDetailReport] = useState<ReportDetailsResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Review modal
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<AdminReportListResponse | null>(null);
  const [reviewForm, setReviewForm] = useState<{ status: ReviewStatus; reviewNotes: string }>({
    status: "Resolved",
    reviewNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadReports = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getAdminReports({
        pageNumber,
        pageSize: PAGE_SIZE,
        status: statusFilter !== "all" ? (statusFilter as ReportStatus) : undefined,
        targetType: targetTypeFilter !== "all" ? (targetTypeFilter as ReportTargetType) : undefined,
        sortDirection: "Desc",
      });
      setReports(result.data);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [all, pending, resolved, dismissed] = await Promise.all([
        getAdminReports({ pageSize: 1 }),
        getAdminReports({ pageSize: 1, status: "Pending" }),
        getAdminReports({ pageSize: 1, status: "Resolved" }),
        getAdminReports({ pageSize: 1, status: "Dismissed" }),
      ]);
      setTotalCount(all.totalRecords);
      setPendingCount(pending.totalRecords);
      setResolvedCount(resolved.totalRecords);
      setDismissedCount(dismissed.totalRecords);
    } catch {
      /* stats are non-critical */
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, statusFilter, targetTypeFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openDetail = async (report: AdminReportListResponse) => {
    setDetailReport(null);
    setIsLoadingDetail(true);
    setShowDetail(true);
    try {
      const detail = await getAdminReportById(report.id);
      setDetailReport(detail);
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
      setShowDetail(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openReview = (report: AdminReportListResponse) => {
    setReviewTarget(report);
    setReviewForm({
      status: report.status === "UnderReview" ? "UnderReview" : "Resolved",
      reviewNotes: "",
    });
    setShowReview(true);
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setIsSubmitting(true);
    try {
      await reviewReport(reviewTarget.id, {
        status: reviewForm.status,
        reviewNotes: reviewForm.reviewNotes || undefined,
      });
      showBanner({ kind: "success", message: "Report reviewed successfully" });
      setShowReview(false);
      await Promise.all([loadReports(), loadStats()]);
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
      setShowReview(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600 text-lg">Review and moderate user-submitted reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Total</span>
              <Flag className="w-5 h-5 text-[#3d2e7c]" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCount ?? "—"}</p>
          </Card>
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Pending</span>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingCount ?? "—"}</p>
          </Card>
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Resolved</span>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{resolvedCount ?? "—"}</p>
          </Card>
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Dismissed</span>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{dismissedCount ?? "—"}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="UnderReview">Under Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={targetTypeFilter}
              onValueChange={(v) => {
                setTargetTypeFilter(v);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Filter by target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Comment">Comment</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || targetTypeFilter !== "all") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setTargetTypeFilter("all");
                  setPageNumber(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading reports…</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{loadError}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No reports found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Target
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Reason
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Reporter
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Reviewed By
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-8 py-5 text-right text-base font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      {/* Target */}
                      <td className="px-8 py-6">
                        {(() => {
                          const url = getTargetUrl(report.targetType, report.targetId);
                          return (
                            <div
                              className={`flex items-center gap-2 text-gray-500${url ? " cursor-pointer w-fit" : ""}`}
                              onClick={url ? () => navigate(url) : undefined}
                            >
                              <TargetIcon type={report.targetType} />
                              <div>
                                <p
                                  className={`text-sm font-medium flex items-center gap-1 ${url ? "text-[#3d2e7c] underline" : "text-gray-800"}`}
                                >
                                  {report.targetType}
                                  {url && <ExternalLink className="w-3 h-3" />}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Reason */}
                      <td className="px-8 py-6">
                        <span className="text-sm text-gray-700">
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-6">
                        <Badge
                          className={`${STATUS_BADGE[report.status] ?? "bg-gray-100 text-gray-600"} text-sm px-3 py-1.5`}
                        >
                          {STATUS_LABELS[report.status] ?? report.status}
                        </Badge>
                      </td>

                      {/* Reporter */}
                      <td className="px-8 py-6">
                        <div
                          onClick={() => navigate(`/profile/${report.reporter.id}`)}
                          className="flex items-center gap-3 cursor-pointer group w-fit"
                        >
                          <Avatar className="w-9 h-9 border border-gray-200">
                            <AvatarImage
                              src={report.reporter.profileImageUrl ?? undefined}
                              alt={report.reporter.fullName}
                            />
                            <AvatarFallback className="text-xs">
                              {initials(report.reporter.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#3d2e7c] group-hover:underline transition-colors">
                              {report.reporter.fullName}
                            </p>
                            <p className="text-xs text-gray-400">{report.reporter.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Reviewed By */}
                      <td className="px-8 py-6">
                        {report.reviewedBy ? (
                          <p className="text-sm text-gray-700">{report.reviewedBy.fullName}</p>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-8 py-6">
                        <span className="text-gray-600 text-sm">
                          {formatDate(report.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openDetail(report)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openReview(report)}>
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!isLoading && !loadError && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-500 text-sm">Loading…</p>
              </div>
            ) : detailReport ? (
              <div className="space-y-3">
                <Row label="Status">
                  <Badge className={`${STATUS_BADGE[detailReport.status]} text-sm px-3 py-1`}>
                    {STATUS_LABELS[detailReport.status]}
                  </Badge>
                </Row>
                <Row label="Target">
                  {(() => {
                    const url = getTargetUrl(detailReport.targetType, detailReport.targetId);
                    return (
                      <div
                        className={`flex items-center gap-2 text-sm${url ? " cursor-pointer" : ""}`}
                        onClick={
                          url
                            ? () => {
                                navigate(url);
                                setShowDetail(false);
                              }
                            : undefined
                        }
                      >
                        <TargetIcon type={detailReport.targetType} />
                        <span
                          className={`flex items-center gap-1 ${url ? "text-[#3d2e7c] underline" : "text-gray-900"}`}
                        >
                          {detailReport.targetType}
                          {url && <ExternalLink className="w-3 h-3" />}
                        </span>
                      </div>
                    );
                  })()}
                </Row>
                <Row label="Reason">
                  <span className="text-sm text-gray-900">
                    {REASON_LABELS[detailReport.reason] ?? detailReport.reason}
                  </span>
                </Row>
                {detailReport.targetType === "Comment" && detailReport.targetCommentBody && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1.5">Comment</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {detailReport.targetCommentBody}
                    </p>
                  </div>
                )}
                {detailReport.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1.5">Notes</p>
                    <p className="text-sm text-gray-700">{detailReport.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Reporter</p>
                    <div
                      onClick={() => {
                        navigate(`/profile/${detailReport.reporter.id}`);
                        setShowDetail(false);
                      }}
                      className="flex items-center gap-3 cursor-pointer group w-fit"
                    >
                      <Avatar className="w-9 h-9 border border-gray-200">
                        <AvatarImage
                          src={detailReport.reporter.profileImageUrl ?? undefined}
                          alt={detailReport.reporter.fullName}
                        />
                        <AvatarFallback className="text-xs">
                          {initials(detailReport.reporter.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-[#3d2e7c] group-hover:underline transition-colors">
                          {detailReport.reporter.fullName}
                        </p>
                        <p className="text-xs text-gray-400">{detailReport.reporter.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Reported</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(detailReport.createdAt)}
                    </span>
                  </div>
                </div>
                {detailReport.reviewedBy && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Row label="Reviewed By">{detailReport.reviewedBy.fullName}</Row>
                      {detailReport.reviewedAt && (
                        <Row label="Reviewed At">{formatDate(detailReport.reviewedAt)}</Row>
                      )}
                    </div>
                    {detailReport.reviewNotes && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 mb-1.5">Review Notes</p>
                        <p className="text-sm text-gray-700">{detailReport.reviewNotes}</p>
                      </div>
                    )}
                  </>
                )}
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

      {/* ── Review modal ──────────────────────────────────────────────────── */}
      {showReview && reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setShowReview(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Review Report</h2>
            <p className="text-sm text-gray-500 mb-5">
              Update the status of this {reviewTarget.targetType.toLowerCase()} report.
            </p>

            {/* Summary strip */}
            <div className="mb-5 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              <div className="text-gray-500 flex-shrink-0">
                <TargetIcon type={reviewTarget.targetType} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">
                  {reviewTarget.targetType} · {REASON_LABELS[reviewTarget.reason]}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Reported by {reviewTarget.reporter.fullName}
                </p>
              </div>
              <Badge
                className={`${STATUS_BADGE[reviewTarget.status]} text-xs ml-auto flex-shrink-0`}
              >
                {STATUS_LABELS[reviewTarget.status]}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">New Status</label>
                <Select
                  value={reviewForm.status}
                  onValueChange={(v) => setReviewForm({ ...reviewForm, status: v as ReviewStatus })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UnderReview">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Review Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  placeholder="Add any notes about your decision…"
                  className="resize-none h-24"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReview(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny layout helper used only inside the detail modal
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{children}</span>
    </div>
  );
}
